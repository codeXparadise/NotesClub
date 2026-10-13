import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify teacher role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "teacher") {
      return NextResponse.json(
        { error: "Forbidden: Teacher access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      id,
      title,
      description,
      categoryId,
      courseId,
      isPublished,
      isFeatured,
      allowDownload,
      showWatermark,
      driveFileId,
      pageCount,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const docPayload: any = {
      title,
      description: description || "",
      category_id: categoryId || null,
      course_id: courseId || null,
      is_published: isPublished ?? true,
      is_featured: isFeatured ?? false,
      allow_download: allowDownload ?? false,
      show_watermark: showWatermark ?? true,
      page_count: pageCount || 1,
      updated_at: new Date().toISOString(),
    };

    if (driveFileId) {
      docPayload.drive_file_id = driveFileId;
    }

    let result;
    if (id) {
      // Update existing document
      result = await supabase
        .from("documents")
        .update(docPayload)
        .eq("id", id)
        .select()
        .single();
    } else {
      // Insert new document
      if (!docPayload.drive_file_id) {
        docPayload.drive_file_id = `manual_${Date.now()}`;
      }
      result = await supabase
        .from("documents")
        .insert(docPayload)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, document: result.data });
  } catch (err: any) {
    console.error("POST /api/admin/documents error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
