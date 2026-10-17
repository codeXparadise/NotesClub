import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserActivities, logUserActivity } from "@/lib/redis";

// GET /api/profile: Fetch current user profile and activity log
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Fetch user base profile from profiles table
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("*, courses(id, name, code)")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 2. Fetch user metadata from Supabase Auth
    const metadata = user.user_metadata || {};

    // 3. Fetch user activities from Redis
    const activities = await getUserActivities(user.id, 30);

    return NextResponse.json({
      profile: {
        ...profile,
        division: metadata.division || profile.division || "—",
        college_name: metadata.college_name || profile.college_name || "KES Shroff College",
        stream: metadata.stream || profile.stream || profile.courses?.name || "General",
        year_or_class: metadata.year_or_class || profile.year_or_class || "FY",
        course_name: metadata.course_name || profile.course_name || profile.courses?.name || "General Course",
      },
      activities: activities || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/profile: Update user profile details & log activity
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, division, stream, courseName, yearOrClass } = body;

    const supabaseAdmin = createAdminClient();

    // Academic updates to persist in user_metadata
    const metadataUpdates: Record<string, any> = {};
    // Base table updates (only existing columns in profiles table: full_name, updated_at)
    const baseUpdates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const changedFields: string[] = [];

    if (typeof fullName === "string" && fullName.trim()) {
      baseUpdates.full_name = fullName.trim();
      metadataUpdates.full_name = fullName.trim();
      changedFields.push("Name");
    }
    if (typeof division === "string") {
      metadataUpdates.division = division.trim().toUpperCase();
      changedFields.push("Division");
    }
    if (typeof stream === "string" && stream.trim()) {
      metadataUpdates.stream = stream.trim();
      changedFields.push("Stream");
    }
    if (typeof courseName === "string" && courseName.trim()) {
      metadataUpdates.course_name = courseName.trim();
      changedFields.push("Course");
    }
    if (typeof yearOrClass === "string" && yearOrClass.trim()) {
      metadataUpdates.year_or_class = yearOrClass.trim();
      changedFields.push("Class");
    }

    // 1. Update in profiles table (only safe base columns)
    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update(baseUpdates)
      .eq("id", user.id)
      .select("*, courses(id, name, code)")
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // 2. Persist extended academic metadata in Supabase Auth user_metadata
    const newMetadata = {
      ...user.user_metadata,
      ...metadataUpdates,
    };

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: newMetadata,
    });

    // 3. Record activity in Redis activity log
    const description =
      changedFields.length > 0
        ? `Student updated profile fields: ${changedFields.join(", ")}`
        : "Student updated profile details";

    await logUserActivity(user.id, {
      activity_type: "profile_update",
      description,
      details: metadataUpdates,
    });

    return NextResponse.json({
      success: true,
      profile: {
        ...updatedProfile,
        ...newMetadata,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/profile: Log user action (such as password_change)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { activity_type = "account_activity", description = "User updated account" } = body;

    // Log to Redis
    await logUserActivity(user.id, {
      activity_type,
      description,
      details: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
