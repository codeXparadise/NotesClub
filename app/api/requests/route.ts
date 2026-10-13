import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/requests: Admin gets all requests
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'all' | 'pending' | 'approved' | 'rejected'

    const supabaseAdmin = createAdminClient();
    let q = supabaseAdmin
      .from("access_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      q = q.eq("status", status);
    }

    const { data: requests, error } = await q;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ requests: requests || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/requests: Student or blocked user submits unblock/access request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, rollNumber, collegeName, reason, type = "unblock" } = body;

    if (!email || !fullName) {
      return NextResponse.json(
        { error: "Email and Name are required to submit an access request." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Find student ID if profile exists
    const cleanEmail = email.trim().toLowerCase();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, roll_number, college_name")
      .eq("email", cleanEmail)
      .maybeSingle();

    const { data: newRequest, error } = await supabaseAdmin
      .from("access_requests")
      .insert({
        student_id: profile?.id || null,
        email: cleanEmail,
        full_name: fullName.trim(),
        roll_number: rollNumber || profile?.roll_number || null,
        college_name: collegeName || profile?.college_name || null,
        type,
        reason: reason?.trim() || "Student requested access restoration.",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Your request has been submitted to the instructor.",
      request: newRequest,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
