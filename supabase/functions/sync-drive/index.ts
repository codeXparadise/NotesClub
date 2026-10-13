// Supabase Edge Function: sync-drive
// Scheduled via Supabase pg_cron or called with DRIVE_SYNC_SECRET

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
}

async function getGoogleAccessToken(saKey: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: saKey.client_email,
    scope: "https://www.googleapis.com/auth/drive.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const b64Url = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  const encodedHeader = b64Url(header);
  const encodedClaim = b64Url(claimSet);
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  // Import private key for WebCrypto
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = saKey.private_key
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s+/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const assertion = `${unsignedToken}.${encodedSignature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(`Failed to obtain Google token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    const syncSecret = Deno.env.get("DRIVE_SYNC_SECRET");

    if (syncSecret && authHeader !== `Bearer ${syncSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("NEXT_PUBLIC_SUPABASE_URL") || Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const driveFolderId = Deno.env.get("GOOGLE_DRIVE_FOLDER_ID");
    const saJsonB64 = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

    if (!saJsonB64 || !driveFolderId) {
      return new Response(
        JSON.stringify({ error: "Missing GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_DRIVE_FOLDER_ID" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const saKey: ServiceAccountKey = JSON.parse(atob(saJsonB64));
    const accessToken = await getGoogleAccessToken(saKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let syncedCategories = 0;
    let syncedDocuments = 0;
    let newNotifications = 0;
    let removedDocuments = 0;
    const driveFileIds = new Set<string>();

    // Recursive traversal across all folders and subfolders
    async function traverseFolder(folderId: string, folderName: string) {
      if (
        folderName.toLowerCase().includes("html-css-javascript-projects") ||
        folderName.toLowerCase().includes("all projects")
      ) {
        return;
      }

      const itemsQuery = encodeURIComponent(
        `'${folderId}' in parents and trashed = false`
      );
      const itemsRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${itemsQuery}&fields=files(id,name,mimeType,size)&pageSize=100`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const itemsData = await itemsRes.json();
      const items = itemsData.files || [];

      const subfolders = items.filter(
        (i: any) => i.mimeType === "application/vnd.google-apps.folder"
      );
      const pdfFiles = items.filter(
        (i: any) => i.mimeType === "application/pdf" || i.name?.toLowerCase().endsWith(".pdf")
      );

      if (pdfFiles.length > 0) {
        const cleanCatName =
          folderName.replace(/^\d+[\.\-_ ]+/, "").trim() || folderName;

        const { data: category } = await supabase
          .from("categories")
          .upsert(
            {
              name: cleanCatName,
              drive_folder_id: folderId,
              sort_order: 10,
            },
            { onConflict: "drive_folder_id" }
          )
          .select()
          .single();

        if (category) {
          syncedCategories++;

          for (const file of pdfFiles) {
            driveFileIds.add(file.id);

            const { data: existingDoc } = await supabase
              .from("documents")
              .select("id, is_published")
              .eq("drive_file_id", file.id)
              .maybeSingle();

            const docTitle = file.name
              .replace(/\.[^/.]+$/, "")
              .replace(/_/g, " ")
              .trim();

            const { data: upsertedDoc } = await supabase
              .from("documents")
              .upsert(
                {
                  drive_file_id: file.id,
                  title: docTitle,
                  category_id: category.id,
                  mime_type: "application/pdf",
                  size_bytes: parseInt(file.size || "0", 10),
                  is_published: true,
                },
                { onConflict: "drive_file_id" }
              )
              .select()
              .single();

            if (upsertedDoc && !existingDoc) {
              syncedDocuments++;
              await supabase.from("notifications").insert({
                title: `New Note: ${docTitle}`,
                body: `New study material added to ${category.name}. Tap to read.`,
                type: "auto",
                audience: "all",
                document_id: upsertedDoc.id,
              });
              newNotifications++;
            }
          }
        }
      }

      for (const sub of subfolders) {
        await traverseFolder(sub.id, sub.name);
      }
    }

    await traverseFolder(driveFolderId, "FYBSCAI");

    // Check for deleted or trashed files from Google Drive
    const { data: dbDocs } = await supabase
      .from("documents")
      .select("id, drive_file_id, title, category_id, categories(name)")
      .eq("is_published", true);

    if (dbDocs) {
      for (const doc of dbDocs) {
        if (!driveFileIds.has(doc.drive_file_id)) {
          // Soft-unpublish so links don't crash
          await supabase
            .from("documents")
            .update({ is_published: false })
            .eq("id", doc.id);
          removedDocuments++;

          const catName = (doc.categories as any)?.name || "Library";
          await supabase.from("notifications").insert({
            title: `Note Removed: ${doc.title}`,
            body: `Note "${doc.title}" has been removed from ${catName}.`,
            type: "auto",
            audience: "all",
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        syncedCategories,
        syncedDocuments,
        newNotifications,
        removedDocuments,
        totalDriveFiles: driveFileIds.size,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
