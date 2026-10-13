import { requireAuth } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { generateStreamToken } from "@/lib/token";
import { DocumentReader } from "@/components/reader/DocumentReader";
import { notFound } from "next/navigation";

export default async function ReadDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireAuth();
  const { id } = await params;

  const admin = createAdminClient();

  const isUUID =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let doc = null;

  if (isUUID) {
    const { data } = await admin
      .from("documents")
      .select("id, title, mime_type, page_count, show_watermark, is_published, description")
      .eq("id", id)
      .maybeSingle();
    doc = data;
  }

  if (!doc) {
    // Look up by clean filename-slug
    const decodedSlug = decodeURIComponent(id).trim().toLowerCase();
    
    // 1. Exact slug match with pipe boundary: slug:<decodedSlug> |
    const { data: slugDoc } = await admin
      .from("documents")
      .select("id, title, mime_type, page_count, show_watermark, is_published, description")
      .ilike("description", `%slug:${decodedSlug} |%`)
      .maybeSingle();

    if (slugDoc) {
      doc = slugDoc;
    } else {
      // 2. Slug match with space boundary
      const { data: spaceDoc } = await admin
        .from("documents")
        .select("id, title, mime_type, page_count, show_watermark, is_published, description")
        .ilike("description", `%slug:${decodedSlug} %`)
        .maybeSingle();

      if (spaceDoc) {
        doc = spaceDoc;
      } else {
        // 3. Fallback: match anywhere in slug or title keywords
        const titleSearch = decodedSlug.replace(/[-_]+/g, " ");
        const { data: fallbackDoc } = await admin
          .from("documents")
          .select("id, title, mime_type, page_count, show_watermark, is_published, description")
          .or(`description.ilike.%slug:${decodedSlug}%,title.ilike.%${titleSearch}%`)
          .limit(1)
          .maybeSingle();
        doc = fallbackDoc;
      }
    }
  }

  if (!doc || !doc.is_published) {
    notFound();
  }

  // Fetch saved reading progress for cross-device resume
  const supabase = await createClient();
  const { data: progress } = await supabase
    .from("reading_progress")
    .select("last_page, total_pages")
    .eq("student_id", profile.id)
    .eq("document_id", doc.id)
    .maybeSingle();

  const initialPage = progress?.last_page || 1;

  // Generate short-lived HMAC streaming token bound to this student & document (60 seconds)
  const streamToken = generateStreamToken(doc.id, profile.id, 60);

  return (
    <DocumentReader
      documentId={doc.id}
      documentTitle={doc.title}
      mimeType={doc.mime_type || "application/pdf"}
      streamToken={streamToken}
      initialPage={initialPage}
      studentName={profile.full_name}
      rollNumber={profile.roll_number}
      email={profile.email}
      showWatermark={doc.show_watermark}
    />
  );
}
