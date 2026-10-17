import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redisSCard } from "@/lib/redis";

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

    // 1. Fetch raw student profiles and Auth metadata in parallel
    const [profilesRes, authUsersRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*, courses(id, name, code)")
        .eq("role", "student")
        .order("created_at", { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (profilesRes.error) {
      console.error("Admin users fetch error:", profilesRes.error);
      return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
    }

    // Build metadata dictionary by user id and self-heal any un-synced auth students
    const metaMap = new Map<string, any>();
    const profileIds = new Set((profilesRes.data || []).map((p: any) => p.id));
    const allStudentRows: any[] = [...(profilesRes.data || [])];

    if (authUsersRes.data?.users) {
      for (const u of authUsersRes.data.users) {
        const meta = u.user_metadata || {};
        metaMap.set(u.id, meta);

        const role = meta.role || (u.email === "admin@notesclub.com" ? "teacher" : "student");
        if (role === "student" && !profileIds.has(u.id)) {
          const fallbackRow = {
            id: u.id,
            full_name: meta.full_name || u.email?.split("@")[0] || "Student",
            roll_number: meta.roll_number || null,
            course_id: meta.course_id || null,
            email: u.email,
            role: "student",
            is_blocked: false,
            created_at: u.created_at || new Date().toISOString(),
            updated_at: u.updated_at || new Date().toISOString(),
          };
          allStudentRows.push(fallbackRow);
          profileIds.add(u.id);

          // Auto-heal into profiles table
          supabaseAdmin
            .from("profiles")
            .upsert(fallbackRow, { onConflict: "id" })
            .then(() => {});
        }
      }
    }

    let students = allStudentRows.map((s: any) => {
      const meta = metaMap.get(s.id) || {};
      return {
        ...s,
        full_name: meta.full_name || s.full_name || "Student",
        roll_number: meta.roll_number || s.roll_number || "—",
        division: meta.division || s.division || "-",
        college_name: meta.college_name || s.college_name || "KES Shroff College",
        stream: meta.stream || s.stream || s.courses?.name || "General",
        education_level: meta.education_level || s.education_level || "College",
        year_or_class: meta.year_or_class || s.year_or_class || "FY",
        course_name: meta.course_name || s.course_name || s.courses?.name || "Standard Notes",
      };
    });

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
      // 1. Fetch reading progress counts from database
      const progRes = await supabaseAdmin
        .from("reading_progress")
        .select("student_id")
        .in("student_id", studentIds);

      (progRes.data || []).forEach((p: any) => {
        readingMap[p.student_id] = (readingMap[p.student_id] || 0) + 1;
      });

      // 2. Fetch wishlist count from Redis
      await Promise.all(
        students.map(async (st) => {
          try {
            const count = await redisSCard(`notes_club:fav_set:${st.id}`);
            favoriteMap[st.id] = count;
          } catch {
            favoriteMap[st.id] = 0;
          }
        })
      );
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
