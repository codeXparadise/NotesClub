import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      // Find all visible notifications for user
      const { data: notifications } = await supabase
        .from("notifications")
        .select("id");

      if (notifications && notifications.length > 0) {
        const rows = notifications.map((n) => ({
          notification_id: n.id,
          student_id: user.id,
          read_at: new Date().toISOString(),
        }));

        await supabase
          .from("notification_reads")
          .upsert(rows, { onConflict: "notification_id,student_id" });
      }

      return NextResponse.json({ success: true, all: true });
    }

    if (!notificationId) {
      return NextResponse.json(
        { error: "Missing notificationId" },
        { status: 400 }
      );
    }

    await supabase.from("notification_reads").upsert(
      {
        notification_id: notificationId,
        student_id: user.id,
        read_at: new Date().toISOString(),
      },
      { onConflict: "notification_id,student_id" }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/notifications/read error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
