import { NextRequest, NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redisSAdd, redisSRem, redisSMembers, logUserActivity } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redisKey = `notes_club:fav_set:${profile.id}`;
    let favIds = await redisSMembers(redisKey);

    // Also attempt to check database if Redis was empty
    const supabase = createAdminClient();
    try {
      const { data: dbFavs } = await supabase
        .from("favorites")
        .select("document_id")
        .eq("student_id", profile.id);

      if (dbFavs && dbFavs.length > 0) {
        for (const row of dbFavs) {
          if (!favIds.includes(row.document_id)) {
            favIds.push(row.document_id);
            await redisSAdd(redisKey, row.document_id);
          }
        }
      }
    } catch {
      // Graceful fallback to Redis if table not yet migrated
    }

    if (!favIds || favIds.length === 0) {
      return NextResponse.json({ favorites: [], favoriteIds: [] });
    }

    // Fetch full document details for these favorites
    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("id, drive_file_id, title, page_count, size_bytes, category_id, is_published, categories(id, name)")
      .in("id", favIds)
      .eq("is_published", true);

    if (docsError) {
      return NextResponse.json({ favorites: [], favoriteIds: favIds });
    }

    return NextResponse.json({
      favorites: docs || [],
      favoriteIds: favIds,
    });
  } catch (err: any) {
    console.error("[API favorites GET]", err);
    return NextResponse.json({ error: err.message || "Failed to load favorites" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const redisKey = `notes_club:fav_set:${profile.id}`;
    await redisSAdd(redisKey, documentId);

    // Best-effort database persistence
    const supabase = createAdminClient();
    try {
      await supabase.from("favorites").upsert(
        {
          student_id: profile.id,
          document_id: documentId,
        },
        { onConflict: "student_id,document_id" }
      );
    } catch {
      // Ignored if table not created yet
    }

    // Record activity log in Redis
    try {
      const { data: docData } = await supabase
        .from("documents")
        .select("title")
        .eq("id", documentId)
        .maybeSingle();
      const docTitle = docData?.title || "Study Note";
      await logUserActivity(profile.id, {
        activity_type: "wishlist_add",
        description: `Added "${docTitle}" to Wishlist`,
        details: { documentId, title: docTitle },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      isFavorited: true,
      documentId,
    });
  } catch (err: any) {
    console.error("[API favorites POST]", err);
    return NextResponse.json({ error: err.message || "Failed to add favorite" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    let documentId = url.searchParams.get("documentId");

    if (!documentId) {
      try {
        const body = await req.json();
        documentId = body?.documentId;
      } catch {
        // body might be empty
      }
    }

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    const redisKey = `notes_club:fav_set:${profile.id}`;
    await redisSRem(redisKey, documentId);

    // Best-effort database deletion
    const supabase = createAdminClient();
    try {
      await supabase
        .from("favorites")
        .delete()
        .eq("student_id", profile.id)
        .eq("document_id", documentId);
    } catch {
      // Ignored
    }

    // Record activity log in Redis
    try {
      const { data: docData } = await supabase
        .from("documents")
        .select("title")
        .eq("id", documentId)
        .maybeSingle();
      const docTitle = docData?.title || "Study Note";
      await logUserActivity(profile.id, {
        activity_type: "wishlist_remove",
        description: `Removed "${docTitle}" from Wishlist`,
        details: { documentId, title: docTitle },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      isFavorited: false,
      documentId,
    });
  } catch (err: any) {
    console.error("[API favorites DELETE]", err);
    return NextResponse.json({ error: err.message || "Failed to remove favorite" }, { status: 500 });
  }
}
