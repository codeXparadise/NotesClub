import { NextRequest, NextResponse } from "next/server";
import { getDriveClient } from "@/lib/drive";
import { createAdminClient } from "@/lib/supabase/admin";
import { cacheInvalidatePrefix, cacheDel } from "@/lib/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow sufficient time for folder crawling

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "note";
}

function getMimeType(fileName: string, driveMime?: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".docx") || lower.endsWith(".doc"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls") || lower.endsWith(".csv"))
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (lower.endsWith(".md")) return "text/markdown";
  return driveMime || "application/pdf";
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const syncSecret = process.env.DRIVE_SYNC_SECRET;

    // If DRIVE_SYNC_SECRET is configured, enforce bearer token
    if (syncSecret && authHeader !== `Bearer ${syncSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const drive = getDriveClient();
    if (!drive) {
      return NextResponse.json({ error: "Google Drive service account not configured" }, { status: 500 });
    }

    const masterFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!masterFolderId) {
      return NextResponse.json({ error: "GOOGLE_DRIVE_FOLDER_ID not set" }, { status: 500 });
    }

    const supabase = createAdminClient();

    let syncedCategories = 0;
    let addedDocuments = 0;
    let removedDocuments = 0;
    let createdNotifications = 0;
    const driveFileIds = new Set<string>();
    const usedSlugs = new Set<string>();

    // Helper: list items inside a folder
    async function listFolderItems(folderId: string) {
      const res = await drive!.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "files(id, name, mimeType, size)",
        pageSize: 100,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      return res.data.files || [];
    }

    // Crawl top folders (Categories)
    const topItems = await listFolderItems(masterFolderId);
    const topFolders = topItems.filter(
      (f) => f.mimeType === "application/vnd.google-apps.folder"
    );

    for (let i = 0; i < topFolders.length; i++) {
      const catFolder = topFolders[i];
      if (
        catFolder.name?.toLowerCase().includes("projects") ||
        catFolder.name?.toLowerCase().includes("html")
      ) {
        continue;
      }

      const cleanCatName = catFolder.name
        ?.replace(/^\d+[\.\-_ ]+/, "")
        .replace(/_/g, " ")
        .trim() || catFolder.name || "General";

      const catSlug = slugify(cleanCatName);

      const { data: category } = await supabase
        .from("categories")
        .upsert(
          {
            name: cleanCatName,
            slug: catSlug,
            drive_folder_id: catFolder.id,
            sort_order: i * 10,
          },
          { onConflict: "drive_folder_id" }
        )
        .select()
        .single();

      if (!category) continue;
      syncedCategories++;

      // Recursive scan of files within category (supports sub-folders)
      async function scanFiles(folderId: string) {
        const items = await listFolderItems(folderId);
        for (const item of items) {
          if (item.mimeType === "application/vnd.google-apps.folder") {
            await scanFiles(item.id!);
          } else {
            driveFileIds.add(item.id!);

            let baseSlug = slugify(item.name || "note");
            let finalSlug = baseSlug;
            let counter = 2;
            while (usedSlugs.has(finalSlug)) {
              finalSlug = `${baseSlug}-${counter}`;
              counter++;
            }
            usedSlugs.add(finalSlug);

            const docTitle = (item.name || "Untitled")
              .replace(/\.[^/.]+$/, "")
              .replace(/_/g, " ")
              .trim();

            const { data: existingDoc } = await supabase
              .from("documents")
              .select("id, is_published")
              .eq("drive_file_id", item.id)
              .maybeSingle();

            const { data: upsertedDoc } = await supabase
              .from("documents")
              .upsert(
                {
                  drive_file_id: item.id,
                  title: docTitle,
                  slug: finalSlug,
                  category_id: category.id,
                  mime_type: getMimeType(item.name || "", item.mimeType || undefined),
                  size_bytes: parseInt(item.size || "0", 10),
                  is_published: true,
                },
                { onConflict: "drive_file_id" }
              )
              .select()
              .single();

            if (upsertedDoc && (!existingDoc || !existingDoc.is_published)) {
              addedDocuments++;
              // Create Push/In-app Notification
              await supabase.from("notifications").insert({
                title: `New Note: ${docTitle}`,
                body: `New study material added to ${category.name}. Tap to read.`,
                type: "auto",
                audience: "all",
                document_id: upsertedDoc.id,
              });
              createdNotifications++;
            }
          }
        }
      }

      await scanFiles(catFolder.id!);
    }

    // Check for deleted or trashed notes
    const { data: activeDocs } = await supabase
      .from("documents")
      .select("id, drive_file_id, title, category_id, categories(name)")
      .eq("is_published", true);

    if (activeDocs) {
      for (const doc of activeDocs) {
        if (!driveFileIds.has(doc.drive_file_id)) {
          await supabase
            .from("documents")
            .update({ is_published: false })
            .eq("id", doc.id);
          removedDocuments++;

          const catName = (doc.categories as any)?.name || "Library";
          await supabase.from("notifications").insert({
            title: `Note Removed: ${doc.title}`,
            body: `Note "${doc.title}" was removed or archived from ${catName}.`,
            type: "auto",
            audience: "all",
          });
          createdNotifications++;
        }
      }
    }

    // Robust Cache Flush: Invalidate all document and category caches in Redis
    await cacheInvalidatePrefix("notes_club:");
    await cacheDel("notes_club:all_categories");
    await cacheDel("notes_club:all_documents");

    return NextResponse.json({
      success: true,
      syncedCategories,
      addedDocuments,
      removedDocuments,
      createdNotifications,
      totalDriveFiles: driveFileIds.size,
    });
  } catch (err: any) {
    console.error("[API sync-drive]", err);
    return NextResponse.json({ error: err.message || "Failed to sync drive" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Allow GET for easy cron job pinging
  return POST(req);
}
