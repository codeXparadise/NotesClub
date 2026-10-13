import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id, course_id, is_blocked")
      .eq("id", user.id)
      .single();

    if (profile?.is_blocked) {
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    // Reliably fetch all broadcast and system announcements
    let notifQuery = admin
      .from("notifications")
      .select("id, title, body, type, document_id, audience, audience_course_id, audience_student_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: notifications, error } = await notifQuery;

    if (error) {
      console.error("Notifications fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by audience for this student
    const relevantNotifs = (notifications || []).filter((n: any) => {
      if (!n.audience || n.audience === "all") return true;
      if (n.audience === "course" && profile?.course_id && n.audience_course_id === profile.course_id) return true;
      if (n.audience === "student" && n.audience_student_id === user.id) return true;
      return false;
    });

    // Get list of read notification IDs for this student
    const { data: reads } = await admin
      .from("notification_reads")
      .select("notification_id")
      .eq("student_id", user.id);

    const readIds = new Set((reads || []).map((r: any) => r.notification_id));

    const list = relevantNotifs.map((n: any) => ({
      ...n,
      is_read: readIds.has(n.id),
    }));

    const unreadCount = list.filter((n: any) => !n.is_read).length;

    return NextResponse.json({
      notifications: list,
      unreadCount,
    });
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
