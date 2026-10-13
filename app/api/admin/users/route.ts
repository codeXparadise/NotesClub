import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const stream = searchParams.get("stream");
    const educationLevel = searchParams.get("educationLevel");
    const college = searchParams.get("college");
    const status = searchParams.get("status"); // 'all' | 'active' | 'blocked'
    const query = searchParams.get("q")?.trim().toLowerCase();

    // Use admin client with select("*") so missing schema columns never crash
    const supabaseAdmin = createAdminClient();
    const { data: rawStudents, error } = await supabaseAdmin
      .from("profiles")
      .select("*, courses(id, name, code)")
      .eq("role", "student")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin users fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let students = (rawStudents || []).map((s: any) => ({
      ...s,
      college_name: s.college_name || "General / Unassigned",
      stream: s.stream || s.courses?.name || "General",
      education_level: s.education_level || "College",
      year_or_class: s.year_or_class || "Year 1",
      course_name: s.course_name || s.courses?.name || "Standard Notes",
    }));

    // In-memory multi-attribute filtering (100% resilient)
    if (courseId && courseId !== "all") {
      students = students.filter((s) => s.course_id === courseId);
    }

    if (stream && stream !== "all") {
      students = students.filter((s) =>
        (s.stream || "").toLowerCase().includes(stream.toLowerCase())
      );
    }

    if (educationLevel && educationLevel !== "all") {
      students = students.filter((s) =>
        (s.education_level || "").toLowerCase().includes(educationLevel.toLowerCase())
      );
    }

    if (college && college !== "all") {
      students = students.filter((s) =>
        (s.college_name || "").toLowerCase().includes(college.toLowerCase())
      );
    }

    if (status === "active") {
      students = students.filter((s) => !s.is_blocked);
    } else if (status === "blocked") {
      students = students.filter((s) => s.is_blocked);
    }

    if (query) {
      students = students.filter((s) => {
        return (
          (s.full_name || "").toLowerCase().includes(query) ||
          (s.roll_number || "").toLowerCase().includes(query) ||
          (s.email || "").toLowerCase().includes(query) ||
          (s.college_name || "").toLowerCase().includes(query) ||
          (s.stream || "").toLowerCase().includes(query) ||
          (s.year_or_class || "").toLowerCase().includes(query)
        );
      });
    }

    const studentIds = students.map((s) => s.id);
    let readingMap: Record<string, number> = {};
    let favoriteMap: Record<string, number> = {};

    if (studentIds.length > 0) {
      const [progRes, favRes] = await Promise.all([
        supabaseAdmin
          .from("reading_progress")
          .select("student_id")
          .in("student_id", studentIds),
        supabaseAdmin
          .from("favorites")
          .select("student_id")
          .in("student_id", studentIds),
      ]);

      (progRes.data || []).forEach((p: any) => {
        readingMap[p.student_id] = (readingMap[p.student_id] || 0) + 1;
      });
      (favRes.data || []).forEach((f: any) => {
        favoriteMap[f.student_id] = (favoriteMap[f.student_id] || 0) + 1;
      });
    }

    const enrichedStudents = students.map((s) => ({
      ...s,
      reads_count: readingMap[s.id] || 0,
      favorites_count: favoriteMap[s.id] || 0,
    }));

    return NextResponse.json({ students: enrichedStudents });
  } catch (err: any) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
