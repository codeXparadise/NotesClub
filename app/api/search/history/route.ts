import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserSearches, clearUserSearches, deleteUserSearch } from "@/lib/redis";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ searches: [] });
    }

    const searches = await getUserSearches(user.id, 20);
    return NextResponse.json({ searches });
  } catch (err: any) {
    console.error("GET /api/search/history error:", err);
    return NextResponse.json({ searches: [] });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { query, all } = body;

    if (all || !query) {
      await clearUserSearches(user.id);
      return NextResponse.json({ success: true, message: "Search history cleared" });
    } else {
      await deleteUserSearch(user.id, query);
      return NextResponse.json({ success: true, message: `Removed "${query}" from search history` });
    }
  } catch (err: any) {
    console.error("DELETE /api/search/history error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
