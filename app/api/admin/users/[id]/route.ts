import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      return NextResponse.json(
        { error: "Forbidden: Teacher access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body; // 'block' | 'unblock' | 'delete'

    if (action === "block") {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: true })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, is_blocked: true });
    }

    if (action === "unblock") {
      const { error } = await supabase
        .from("profiles")
        .update({ is_blocked: false })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, is_blocked: false });
    }

    if (action === "delete") {
      // Delete user profile (cascades or cleans up grants)
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("POST /api/admin/users/:id error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
