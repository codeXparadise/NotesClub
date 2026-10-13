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

    const supabaseAdmin = createAdminClient();

    // 1. Fetch system announcements
    const { data: announcements } = await supabaseAdmin
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);

    // 2. Fetch recent user events (reading starts, signups, favorites, requests)
    const [recentUsers, recentViews, recentFavorites, recentRequests] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, roll_number, college_name, created_at")
        .eq("role", "student")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("view_logs")
        .select("id, page, created_at, profiles(full_name, email), documents(title)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("favorites")
        .select("id, created_at, profiles(full_name, email), documents(title)")
        .order("created_at", { ascending: false })
        .limit(10),
      supabaseAdmin
        .from("access_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    // Aggregate into unified event stream
    const events: any[] = [];

    (recentUsers.data || []).forEach((u) => {
      events.push({
        id: `user-${u.id}`,
        type: "user_joined",
        title: "New Student Registered",
        description: `${u.full_name} (${u.roll_number || u.email}) joined${u.college_name ? ` from ${u.college_name}` : ""}.`,
        timestamp: u.created_at,
        badge: "Registration",
      });
    });

    (recentViews.data || []).forEach((v: any) => {
      events.push({
        id: `view-${v.id}`,
        type: "reading_session",
        title: "Study Session Active",
        description: `${v.profiles?.full_name || "Student"} opened "${v.documents?.title || "Note"}" (Page ${v.page || 1}).`,
        timestamp: v.created_at,
        badge: "Reading",
      });
    });

    (recentFavorites.data || []).forEach((f: any) => {
      events.push({
        id: `fav-${f.id}`,
        type: "favorite_added",
        title: "Added to Wishlist",
        description: `${f.profiles?.full_name || "Student"} bookmarked "${f.documents?.title || "Note"}".`,
        timestamp: f.created_at,
        badge: "Wishlist",
      });
    });

    (recentRequests.data || []).forEach((r: any) => {
      events.push({
        id: `req-${r.id}`,
        type: "access_request",
        title: "Access Request Submitted",
        description: `${r.full_name} requested ${r.type}: "${r.reason || "No details"}" (${r.status}).`,
        timestamp: r.created_at,
        badge: "Request",
      });
    });

    // Sort by timestamp desc
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      announcements: announcements || [],
      events: events.slice(0, 35),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Admin broadcasts a notification
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
      return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
    }

    const reqBody = await request.json();
    const title = (reqBody.title || "").trim();
    const body = (reqBody.body || reqBody.message || "").trim();
    const audience = reqBody.audience || "all";
    const audienceCourseId = reqBody.audienceCourseId || null;

    if (!title || !body) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();
    const { data: notif, error } = await supabaseAdmin
      .from("notifications")
      .insert({
        title: title.trim(),
        body: body.trim(),
        type: "manual",
        audience,
        audience_course_id: audienceCourseId,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification: notif });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
