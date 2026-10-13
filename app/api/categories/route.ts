import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheGet, cacheSet, cacheDel } from "@/lib/redis";

export async function GET() {
  try {
    const cacheKey = "notes_club:categories:all";
    const cached = await cacheGet<{ categories: any[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const admin = createAdminClient();
    const { data: categories, error } = await admin
      .from("categories")
      .select("id, name, drive_folder_id, sort_order")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = { categories: categories || [] };
    await cacheSet(cacheKey, result, 600);

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: any) {
    console.error("GET /api/categories error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { id, name, driveFolderId, sortOrder, action } = body;

    if (action === "delete" && id) {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await cacheDel("notes_club:categories:all");
      return NextResponse.json({ success: true, deleted: true });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from("categories")
      .upsert(
        {
          ...(id ? { id } : {}),
          name,
          drive_folder_id: driveFolderId || `folder_${Date.now()}`,
          sort_order: sortOrder || 0,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await cacheDel("notes_club:categories:all");
    return NextResponse.json({ success: true, category });
  } catch (err: any) {
    console.error("POST /api/categories error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
