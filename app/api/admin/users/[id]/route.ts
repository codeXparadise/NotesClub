import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redisSMembers, redisDel, getUserActivities, getUserSearches } from "@/lib/redis";

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

    // 1. Fetch student base profile & Auth metadata
    const [profileRes, authUserRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("*, courses(id, name, code)")
        .eq("id", id)
        .single(),
      supabaseAdmin.auth.admin.getUserById(id),
    ]);

    let rawStudent = profileRes.data;
    const authUser = authUserRes.data?.user;

    if (!rawStudent && !authUser) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!rawStudent && authUser) {
      const meta = authUser.user_metadata || {};
      rawStudent = {
        id: authUser.id,
        full_name: meta.full_name || authUser.email?.split("@")[0] || "Student",
        roll_number: meta.roll_number || null,
        course_id: meta.course_id || null,
        email: authUser.email,
        role: "student",
        is_blocked: false,
        created_at: authUser.created_at,
        updated_at: authUser.updated_at,
      };
      // Auto-heal into profiles table
      supabaseAdmin.from("profiles").upsert(rawStudent, { onConflict: "id" }).then(() => {});
    }

    const meta = authUserRes.data?.user?.user_metadata || {};

    const student = {
      ...rawStudent,
      full_name: meta.full_name || rawStudent.full_name || "Student",
      roll_number: meta.roll_number || rawStudent.roll_number || "—",
      division: meta.division || rawStudent.division || "—",
      college_name: meta.college_name || rawStudent.college_name || "KES Shroff College",
      stream: meta.stream || rawStudent.stream || rawStudent.courses?.name || "General",
      education_level: meta.education_level || rawStudent.education_level || "College",
      year_or_class: meta.year_or_class || rawStudent.year_or_class || "FY",
      course_name: meta.course_name || rawStudent.course_name || rawStudent.courses?.name || "Standard Notes",
    };

    // 2. Fetch Reading History
    const { data: rawReadingHistory } = await supabaseAdmin
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

    const readingHistory = rawReadingHistory || [];

    // 3. Fetch Wishlist / Favorites from Redis
    const favIds = await redisSMembers(`notes_club:fav_set:${id}`);
    let wishlist: any[] = [];
    if (favIds && favIds.length > 0) {
      const { data: favDocs } = await supabaseAdmin
        .from("documents")
        .select("id, title, cover_url, page_count, drive_file_id, category_id, categories(name)")
        .in("id", favIds);

      if (favDocs && favDocs.length > 0) {
        wishlist = favDocs.map((doc: any) => ({
          created_at: doc.created_at || new Date().toISOString(),
          documents: doc,
        }));
      }
    }

    // 4. Fetch Search History from Redis
    const searches = await getUserSearches(id, 50);

    // 5. Fetch Activity Logs from Redis + synthesize full activity stream
    const redisActivities = await getUserActivities(id, 50);

    const combinedActivities: any[] = [...redisActivities];

    // Add reading sessions into timeline
    for (const rh of readingHistory) {
      const docTitle = (rh as any).documents?.title || "Study Material";
      combinedActivities.push({
        id: `rh_${rh.updated_at}_${(rh as any).documents?.id || ""}`,
        activity_type: "reading_session",
        description: `Read "${docTitle}" (Page ${rh.last_page} of ${rh.total_pages || (rh as any).documents?.page_count || "?"} - ${rh.percent || 0}%)`,
        details: { percent: rh.percent, last_page: rh.last_page },
        created_at: rh.updated_at,
      });
    }

    // Add wishlist items into timeline
    for (const w of wishlist) {
      const docTitle = w.documents?.title || "Study Note";
      combinedActivities.push({
        id: `fav_${w.documents?.id || ""}`,
        activity_type: "wishlist_add",
        description: `Saved "${docTitle}" to Wishlist`,
        details: { documentId: w.documents?.id },
        created_at: w.created_at,
      });
    }

    // Add account creation event
    if (rawStudent.created_at) {
      combinedActivities.push({
        id: `reg_${id}`,
        activity_type: "account_created",
        description: `Student account created (${student.roll_number || "Roll Number Registered"})`,
        details: { rollNumber: student.roll_number, stream: student.stream },
        created_at: rawStudent.created_at,
      });
    }

    // Sort and deduplicate activities
    const seenMap = new Set<string>();
    const activities = combinedActivities
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((act) => {
        const key = `${act.activity_type}_${act.description}_${(act.created_at || "").slice(0, 16)}`;
        if (seenMap.has(key)) return false;
        seenMap.add(key);
        return true;
      })
      .slice(0, 50);

    return NextResponse.json({
      student,
      readingHistory,
      wishlist,
      searches,
      activities,
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
      // 1. Delete associated reading progress and requests
      await Promise.allSettled([
        supabaseAdmin.from("reading_progress").delete().eq("student_id", id),
        supabaseAdmin.from("access_requests").delete().eq("student_id", id),
        supabaseAdmin.from("access_grants").delete().eq("student_id", id),
        // Clean up Redis keys
        redisDel(`notes_club:fav_set:${id}`),
        redisDel(`notes_club:activities:${id}`),
        redisDel(`notes_club:searches:${id}`),
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
