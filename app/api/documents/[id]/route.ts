import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateStreamToken } from "@/lib/token";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query document through RLS: will only succeed if user is granted or teacher
    const { data: doc, error } = await supabase
      .from("documents")
      .select(
        "id, title, description, category_id, course_id, mime_type, size_bytes, page_count, cover_url, is_published, allow_download, show_watermark, categories(name)"
      )
      .eq("id", id)
      .single();

    if (error || !doc) {
      return NextResponse.json(
        { error: "Document not found or access denied" },
        { status: 404 }
      );
    }

    // Get current reading progress if available
    const { data: progress } = await supabase
      .from("reading_progress")
      .select("last_page, total_pages, percent")
      .eq("student_id", user.id)
      .eq("document_id", id)
      .maybeSingle();

    // Generate short-lived HMAC signed token (60 seconds)
    const streamToken = generateStreamToken(doc.id, user.id, 60);

    return NextResponse.json({
      document: doc,
      progress: progress || null,
      streamToken,
    });
  } catch (err: any) {
    console.error("GET /api/documents/:id error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
