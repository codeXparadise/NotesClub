import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logUserSearch } from "@/lib/redis";

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

    // Log search query in Redis (saved in search history & activity timeline)
    await logUserSearch(user.id, cleanQuery);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    // Non-blocking logger
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
