import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Get notifications permitted by RLS for this student
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("id, title, body, type, document_id, audience, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get list of read notification IDs for this student
    const { data: reads } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("student_id", user.id);

    const readIds = new Set((reads || []).map((r) => r.notification_id));

    const list = (notifications || []).map((n) => ({
      ...n,
      is_read: readIds.has(n.id),
    }));

    const unreadCount = list.filter((n) => !n.is_read).length;

    return NextResponse.json({
      notifications: list,
      unreadCount,
    });
  } catch (err: any) {
    console.error("GET /api/notifications error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
