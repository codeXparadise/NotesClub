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

    // 1. Basic counts
    const [
      { count: studentCount },
      { count: blockedCount },
      { count: documentCount },
      { count: totalViews },
      { count: activeGrants },
      { count: pendingRequestsCount },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_blocked", true),
      supabase.from("documents").select("*", { count: "exact", head: true }),
      supabase.from("view_logs").select("*", { count: "exact", head: true }),
      supabase.from("access_grants").select("*", { count: "exact", head: true }),
      supabase.from("access_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    // 2. Fetch profiles for stream & education level breakdown
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student");

    const streamCounts: Record<string, number> = {
      Science: 0,
      Commerce: 0,
      Arts: 0,
      Engineering: 0,
      Medical: 0,
      General: 0,
    };

    const levelCounts: Record<string, number> = {
      School: 0,
      "Junior College": 0,
      Undergraduate: 0,
      Postgraduate: 0,
      Other: 0,
    };

    (allProfiles || []).forEach((p) => {
      const s = (p.stream || "").toLowerCase();
      if (s.includes("sci") || s.includes("pcm") || s.includes("pcb")) streamCounts.Science++;
      else if (s.includes("commer")) streamCounts.Commerce++;
      else if (s.includes("art") || s.includes("human")) streamCounts.Arts++;
      else if (s.includes("eng") || s.includes("tech") || s.includes("bca")) streamCounts.Engineering++;
      else if (s.includes("med") || s.includes("pharm")) streamCounts.Medical++;
      else streamCounts.General++;

      const l = (p.education_level || "").toLowerCase();
      if (l.includes("school")) levelCounts.School++;
      else if (l.includes("junior")) levelCounts["Junior College"]++;
      else if (l.includes("ug") || l.includes("under")) levelCounts.Undergraduate++;
      else if (l.includes("pg") || l.includes("post")) levelCounts.Postgraduate++;
      else levelCounts.Other++;
    });

    // 3. Daily reading session trend over last 7 days
    const { data: readingLogs } = await supabase
      .from("reading_progress")
      .select("updated_at")
      .order("updated_at", { ascending: false })
      .limit(200);

    const trendDays: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      trendDays[key] = 0;
    }

    (readingLogs || []).forEach((log) => {
      const logDate = new Date(log.updated_at);
      const key = logDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      if (key in trendDays) {
        trendDays[key]++;
      }
    });

    const readingTrend = Object.entries(trendDays).map(([date, count]) => ({
      date,
      count,
    }));

    // 4. Top read documents
    const { data: topDocs } = await supabase
      .from("documents")
      .select("id, title, page_count")
      .limit(6);

    // 5. Recent activity feed
    const { data: recentViews } = await supabase
      .from("view_logs")
      .select("id, page, created_at, profiles(full_name, roll_number), documents(title)")
      .order("created_at", { ascending: false })
      .limit(8);

    return NextResponse.json({
      stats: {
        totalStudents: studentCount || 0,
        blockedStudents: blockedCount || 0,
        totalDocuments: documentCount || 0,
        totalViews: totalViews || 0,
        activeGrants: activeGrants || 0,
        pendingRequests: pendingRequestsCount || 0,
      },
      streamDistribution: Object.entries(streamCounts).map(([name, value]) => ({ name, value })),
      levelDistribution: Object.entries(levelCounts).map(([name, value]) => ({ name, value })),
      readingTrend,
      topDocuments: topDocs || [],
      recentActivity: recentViews || [],
    });
  } catch (err: any) {
    console.error("GET /api/admin/stats error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
