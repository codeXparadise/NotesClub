import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "notes_club:courses:all";
    const cached = await cacheGet<{ courses: any[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const admin = createAdminClient();
    const { data: courses, error } = await admin
      .from("courses")
      .select("id, name, code")
      .order("name", { ascending: true });

    if (error || !courses || courses.length === 0) {
      // Return default course matching student enrollment
      const fallback = {
        courses: [
          { id: "b22ae884-83a8-4aef-a710-cddb1af60854", name: "FYBSCAI", code: "FYBSCAI-2026" },
        ],
      };
      await cacheSet(cacheKey, fallback, 600);
      return NextResponse.json(fallback, { headers: { "X-Cache": "MISS" } });
    }

    const result = { courses: courses || [] };
    await cacheSet(cacheKey, result, 600);

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: any) {
    return NextResponse.json({
      courses: [
        { id: "b22ae884-83a8-4aef-a710-cddb1af60854", name: "FYBSCAI", code: "FYBSCAI-2026" },
      ],
    });
  }
}
