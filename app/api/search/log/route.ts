import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const { query } = await request.json();
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json({ success: false });
    }

    const cleanQuery = query.trim().slice(0, 100);

    // Save search log
    await supabase.from("user_searches").insert({
      student_id: user.id,
      query: cleanQuery,
    });

    // Also update last_active_at on profile
    await supabase
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Non-blocking logger
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
