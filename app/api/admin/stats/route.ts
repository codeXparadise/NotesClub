import { NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Teacher access required" }, { status: 403 });
    }

    // Counts
    const { count: studentCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    const { count: documentCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true });

    const { count: totalViews } = await supabase
      .from("view_logs")
      .select("*", { count: "exact", head: true });

    const { count: activeGrants } = await supabase
      .from("access_grants")
      .select("*", { count: "exact", head: true });

    // Recent activity feed from view_logs
    const { data: recentViews } = await supabase
      .from("view_logs")
      .select("id, page, created_at, profiles(full_name, roll_number), documents(title)")
      .order("created_at", { ascending: false })
      .limit(8);

    return NextResponse.json({
      stats: {
        totalStudents: studentCount || 0,
        totalDocuments: documentCount || 0,
        totalViews: totalViews || 0,
        activeGrants: activeGrants || 0,
      },
      recentActivity: recentViews || [],
    });
  } catch (err: any) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
