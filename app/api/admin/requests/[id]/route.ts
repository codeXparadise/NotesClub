import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "teacher") {
      return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
    }

    const { action, notes } = await request.json(); // 'approve' | 'reject'
    const supabaseAdmin = createAdminClient();

    // Fetch the request
    const { data: reqItem, error: fetchErr } = await supabaseAdmin
      .from("access_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !reqItem) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // If approved and it's an unblock request, unblock the student profile!
    if (action === "approve") {
      if (reqItem.student_id) {
        await supabaseAdmin
          .from("profiles")
          .update({ is_blocked: false })
          .eq("id", reqItem.student_id);
      } else if (reqItem.email) {
        await supabaseAdmin
          .from("profiles")
          .update({ is_blocked: false })
          .eq("email", reqItem.email);
      }
    }

    // Update request status
    const { data: updatedReq, error: updateErr } = await supabaseAdmin
      .from("access_requests")
      .update({
        status: newStatus,
        admin_notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      request: updatedReq,
      action,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
