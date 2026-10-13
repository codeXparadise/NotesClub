import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { listDriveFolderFiles, listDriveSubfolders } from "@/lib/drive";
import { cacheInvalidatePrefix } from "@/lib/redis";

function formatCategoryName(folderName: string, parentFolderName: string = ""): string {
  let clean = folderName.replace(/^\d+[\.\-_ ]+/, "").trim();
  if (["pyp", "pyq", "previous paper", "previous papers", "notes"].includes(clean.toLowerCase())) {
    if (parentFolderName && !parentFolderName.toLowerCase().includes("sem")) {
      const parentClean = parentFolderName.replace(/^\d+[\.\-_ ]+/, "").trim();
      return `${parentClean} - ${clean.toUpperCase()}`;
    }
  }
  return clean || folderName;
}

function formatDocTitle(fileName: string): string {
  let name = fileName.replace(/\.[^/.]+$/, "");
  name = name.replace(/_/g, " ");
  return name.trim();
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const syncSecret = process.env.DRIVE_SYNC_SECRET;

    let isAuthorized = false;
    const token = authHeader?.replace(/^Bearer\s+/i, "") || request.headers.get("x-sync-secret");

    if (syncSecret && token === syncSecret) {
      isAuthorized = true;
    } else {
      const { createClient } = await import("@/lib/supabase/server");
      const serverSupabase = await createClient();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();

      if (user) {
        const adminCheck = createAdminClient();
        const { data: profile } = await adminCheck
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "teacher") {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized: Valid sync secret or teacher login required" },
        { status: 401 }
      );
    }

    const masterFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
    if (!masterFolderId) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_DRIVE_FOLDER_ID is empty. Please set your Google Drive folder ID in .env.local and share the folder with notes-club-drive@integral-nimbus-490721-p3.iam.gserviceaccount.com",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find course FYBSCAI or default course
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("code", "FYBSCAI")
      .maybeSingle();

    const courseId = course?.id || null;

    let syncedCategories = 0;
    let syncedDocuments = 0;
    let newNotifications = 0;
    const categoriesCache = new Map<string, string>();

    // Recursive traversal through all folders & subfolders
    async function traverse(
      folderId: string,
      currentFolderName: string = "General",
      parentFolderName: string = ""
    ) {
      // Skip raw website source code folders
      if (
        currentFolderName.toLowerCase().includes("html-css-javascript-projects") ||
        currentFolderName.toLowerCase().includes("all projects")
      ) {
        return;
      }

      const files = await listDriveFolderFiles(folderId);
      const subfolders = await listDriveSubfolders(folderId);

      const pdfFiles = files.filter(
        (f) => f.mimeType === "application/pdf" || f.name?.toLowerCase().endsWith(".pdf")
      );

      if (pdfFiles.length > 0) {
        let categoryId = categoriesCache.get(folderId);

        if (!categoryId) {
          const categoryName = formatCategoryName(currentFolderName, parentFolderName);

          const { data: cat } = await supabase
            .from("categories")
            .upsert(
              {
                name: categoryName,
                drive_folder_id: folderId,
                sort_order: 10,
              },
              { onConflict: "drive_folder_id" }
            )
            .select()
            .single();

          if (cat?.id) {
            categoryId = cat.id;
            categoriesCache.set(folderId, cat.id);
            syncedCategories++;
          }
        }

        if (categoryId) {
          for (const file of pdfFiles) {
            if (!file.id || !file.name) continue;

            const { data: existingDoc } = await supabase
              .from("documents")
              .select("id")
              .eq("drive_file_id", file.id)
              .maybeSingle();

            const cleanTitle = formatDocTitle(file.name);
            const sizeBytes = parseInt(file.size || "0", 10);

            const { data: upsertedDoc } = await supabase
              .from("documents")
              .upsert(
                {
                  drive_file_id: file.id,
                  title: cleanTitle,
                  description: `Study notes from ${currentFolderName}`,
                  category_id: categoryId,
                  course_id: courseId,
                  mime_type: "application/pdf",
                  size_bytes: sizeBytes,
                  is_published: true,
                  show_watermark: true,
                },
                { onConflict: "drive_file_id" }
              )
              .select()
              .single();

            if (upsertedDoc && !existingDoc) {
              syncedDocuments++;
              await supabase.from("notifications").insert({
                title: `New Note: ${cleanTitle}`,
                body: `New study material has been added to ${currentFolderName}. Tap to read.`,
                type: "auto",
                audience: "all",
                document_id: upsertedDoc.id,
              });
              newNotifications++;
            }
          }
        }
      }

      // Recurse into all subfolders
      for (const sub of subfolders) {
        if (sub.id && sub.name) {
          await traverse(sub.id, sub.name, currentFolderName);
        }
      }
    }

    await traverse(masterFolderId, "FYBSCAI", "");

    // Invalidate Redis cache to ensure fresh data is immediately served
    await cacheInvalidatePrefix("notes_club:");

    return NextResponse.json({
      success: true,
      syncedCategories,
      syncedDocuments,
      newNotifications,
    });
  } catch (err: any) {
    console.error("POST /api/sync/drive error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
