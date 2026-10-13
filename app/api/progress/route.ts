import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: progressRows, error } = await supabase
      .from("reading_progress")
      .select(
        "id, document_id, last_page, total_pages, percent, updated_at, documents(id, title, cover_url, page_count, categories(name))"
      )
      .eq("student_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ progress: progressRows || [] });
  } catch (err: any) {
    console.error("GET /api/progress error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentId, lastPage, totalPages } = body;

    if (!documentId || !lastPage) {
      return NextResponse.json(
        { error: "Missing documentId or lastPage" },
        { status: 400 }
      );
    }

    const total = Math.max(totalPages || 1, 1);
    const page = Math.max(lastPage, 1);
    const percent = Math.min(100, Math.round((page / total) * 10000) / 100);

    const { data: progress, error } = await supabase
      .from("reading_progress")
      .upsert(
        {
          student_id: user.id,
          document_id: documentId,
          last_page: page,
          total_pages: total,
          percent,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,document_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also record view log entry
    supabase
      .from("view_logs")
      .insert({
        student_id: user.id,
        document_id: documentId,
        page,
      })
      .then(() => {});

    return NextResponse.json({ success: true, progress });
  } catch (err: any) {
    console.error("POST /api/progress error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
