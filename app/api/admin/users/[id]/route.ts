import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET /api/admin/users/[id]: Complete user profile dossier
export async function GET(
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

    const supabaseAdmin = createAdminClient();

    // 1. Fetch student profile
    const { data: rawStudent, error: studentError } = await supabaseAdmin
      .from("profiles")
      .select("*, courses(id, name, code)")
      .eq("id", id)
      .single();

    if (studentError || !rawStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = {
      ...rawStudent,
      college_name: rawStudent.college_name || "General / Unassigned",
      stream: rawStudent.stream || rawStudent.courses?.name || "General",
      education_level: rawStudent.education_level || "College",
      year_or_class: rawStudent.year_or_class || "Year 1",
      course_name: rawStudent.course_name || rawStudent.courses?.name || "Standard Notes",
    };

    // 2. Fetch Reading History
    const { data: readingHistory } = await supabaseAdmin
      .from("reading_progress")
      .select(`
        last_page,
        total_pages,
        percent,
        updated_at,
        documents(id, title, cover_url, page_count)
      `)
      .eq("student_id", id)
      .order("updated_at", { ascending: false });

    // 3. Fetch Wishlist / Favorites
    const { data: wishlist } = await supabaseAdmin
      .from("favorites")
      .select(`
        created_at,
        documents(id, title, cover_url, page_count)
      `)
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    // 4. Fetch Search History
    const { data: searches } = await supabaseAdmin
      .from("user_searches")
      .select("id, query, created_at")
      .eq("student_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    // 5. Fetch Activity Logs (Profile updates, password changes, etc.)
    const { data: activities } = await supabaseAdmin
      .from("user_activities")
      .select("id, activity_type, description, details, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      student,
      readingHistory: readingHistory || [],
      wishlist: wishlist || [],
      searches: searches || [],
      activities: activities || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/admin/users/[id]: block / unblock / delete user
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
    const supabaseAdmin = createAdminClient();

    if (action === "block") {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_blocked: true })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, is_blocked: true });
    }

    if (action === "unblock") {
      const { error } = await supabaseAdmin
        .from("profiles")
        .update({ is_blocked: false })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, is_blocked: false });
    }

    if (action === "delete") {
      // 1. Delete associated reading progress, favorites, and searches
      await Promise.allSettled([
        supabaseAdmin.from("reading_progress").delete().eq("student_id", id),
        supabaseAdmin.from("favorites").delete().eq("student_id", id),
        supabaseAdmin.from("user_searches").delete().eq("student_id", id),
        supabaseAdmin.from("access_requests").delete().eq("student_id", id),
        supabaseAdmin.from("access_grants").delete().eq("student_id", id),
      ]);

      // 2. Delete profile
      const { error: profileDeleteErr } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", id);

      // 3. Delete Supabase Auth user
      await supabaseAdmin.auth.admin.deleteUser(id);

      if (profileDeleteErr) {
        return NextResponse.json({ error: profileDeleteErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, deleted: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
