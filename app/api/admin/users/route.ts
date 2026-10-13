import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const courseId = searchParams.get("courseId");
    const query = searchParams.get("q")?.trim();

    let q = supabase
      .from("profiles")
      .select("id, full_name, roll_number, email, role, is_blocked, created_at, courses(id, name, code)")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (courseId && courseId !== "all") {
      q = q.eq("course_id", courseId);
    }

    if (query) {
      q = q.or(`full_name.ilike.%${query}%,roll_number.ilike.%${query}%,email.ilike.%${query}%`);
    }

    const { data: students, error } = await q;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get reading stats for these students
    const studentIds = (students || []).map((s) => s.id);
    let readingMap: Record<string, number> = {};

    if (studentIds.length > 0) {
      const { data: progList } = await supabase
        .from("reading_progress")
        .select("student_id")
        .in("student_id", studentIds);

      (progList || []).forEach((p) => {
        readingMap[p.student_id] = (readingMap[p.student_id] || 0) + 1;
      });
    }

    const enriched = (students || []).map((s) => ({
      ...s,
      booksReadCount: readingMap[s.id] || 0,
    }));

    return NextResponse.json({ students: enriched });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
