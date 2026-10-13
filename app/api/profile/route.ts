import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // 1. Fetch user profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("*, courses(id, name, code)")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 2. Fetch user activity log
    const { data: activities } = await supabaseAdmin
      .from("user_activities")
      .select("id, activity_type, description, details, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    return NextResponse.json({
      profile: {
        ...profile,
        division: profile.division || "—",
        college_name: profile.college_name || "KES Shroff College",
        stream: profile.stream || "General",
        year_or_class: profile.year_or_class || "FY",
        course_name: profile.course_name || profile.courses?.name || "General Course",
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

    // Prepare update payload
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    const changedFields: string[] = [];

    if (typeof fullName === "string" && fullName.trim()) {
      updates.full_name = fullName.trim();
      changedFields.push("Name");
    }
    if (typeof division === "string") {
      updates.division = division.trim().toUpperCase();
      changedFields.push("Division");
    }
    if (typeof stream === "string" && stream.trim()) {
      updates.stream = stream.trim();
      changedFields.push("Stream");
    }
    if (typeof courseName === "string" && courseName.trim()) {
      updates.course_name = courseName.trim();
      changedFields.push("Course");
    }
    if (typeof yearOrClass === "string" && yearOrClass.trim()) {
      updates.year_or_class = yearOrClass.trim();
      changedFields.push("Class");
    }

    // Update in profiles table
    const { data: updatedProfile, error: updateErr } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // Also sync user_metadata on auth.users
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        ...updates,
      },
    });

    // Record activity in user_activities
    const description =
      changedFields.length > 0
        ? `Student updated profile fields: ${changedFields.join(", ")}`
        : "Student updated profile details";

    await supabaseAdmin.from("user_activities").insert({
      user_id: user.id,
      activity_type: "profile_update",
      description,
      details: updates,
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
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

    const supabaseAdmin = createAdminClient();
    await supabaseAdmin.from("user_activities").insert({
      user_id: user.id,
      activity_type,
      description,
      details: { timestamp: new Date().toISOString() },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
