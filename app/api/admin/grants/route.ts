import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
      return NextResponse.json(
        { error: "Forbidden: Teacher access required" },
        { status: 403 }
      );
    }

    const { data: grants, error } = await supabase
      .from("access_grants")
      .select(
        "id, document_id, course_id, student_id, expires_at, created_at, documents(id, title), courses(id, name, code), profiles:student_id(id, full_name, roll_number)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ grants: grants || [] });
  } catch (err: any) {
    console.error("GET /api/admin/grants error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Forbidden: Teacher access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, documentId, courseId, studentId, grantId, expiresAt } = body;

    if (action === "revoke") {
      if (grantId) {
        await supabase.from("access_grants").delete().eq("id", grantId);
      } else {
        let delQuery = supabase.from("access_grants").delete();
        if (documentId) delQuery = delQuery.eq("document_id", documentId);
        if (courseId) delQuery = delQuery.eq("course_id", courseId);
        if (studentId) delQuery = delQuery.eq("student_id", studentId);
        await delQuery;
      }
      return NextResponse.json({ success: true, revoked: true });
    }

    // Grant access
    const { data: grant, error } = await supabase
      .from("access_grants")
      .insert({
        document_id: documentId || null,
        course_id: courseId || null,
        student_id: studentId || null,
        granted_by: user.id,
        expires_at: expiresAt || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, grant });
  } catch (err: any) {
    console.error("POST /api/admin/grants error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
