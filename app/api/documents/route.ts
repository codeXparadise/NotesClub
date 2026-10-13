import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheGet, cacheSet } from "@/lib/redis";

export async function GET(request: NextRequest) {
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
      .select("id, role, course_id, is_blocked")
      .eq("id", user.id)
      .single();

    if (profile?.is_blocked) {
      return NextResponse.json({ error: "Account blocked" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const categoryId = searchParams.get("category")?.trim() || "";

    // 1. Check Redis cache first (ultra-fast sub-10ms response)
    const cacheKey = `notes_club:docs:${profile?.role || "student"}:${categoryId || "all"}:${q || "none"}`;
    const cached = await cacheGet<{ documents: any[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    // 2. Cache MISS: query database
    // Entire Drive Search: When student searches, search across ALL categories and documents from drive
    let query = admin
      .from("documents")
      .select(
        "id, title, description, category_id, course_id, mime_type, size_bytes, page_count, cover_url, is_published, is_featured, updated_at, categories(id, name)"
      )
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", categoryId);
    }

    if (q) {
      // Search entirely from each category and book title/description
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error("Documents fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = { documents: documents || [] };

    // 3. Store in Redis cache with 5 minute expiration
    await cacheSet(cacheKey, result, 300);

    // If search query, fire-and-forget log
    if (q) {
      admin
        .from("search_logs")
        .insert({
          student_id: user.id,
          query: q,
          results_count: documents?.length || 0,
        })
        .then(() => {});
    }

    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: any) {
    console.error("GET /api/documents error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
