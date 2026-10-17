import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      rollNumber,
      division,
      stream,
      courseName,
      yearOrClass,
      collegeName,
      email,
      password,
      courseId,
    } = body;

    if (!fullName?.trim() || !rollNumber?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Student Name, Roll Number, Email, and Password are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address.", field: "email" },
        { status: 400 }
      );
    }

    if (!stream?.trim()) {
      return NextResponse.json(
        { error: "Please select your Stream (Science, Commerce, or Arts).", field: "stream" },
        { status: 400 }
      );
    }

    if (!courseName?.trim()) {
      return NextResponse.json(
        { error: "Please enter your Course.", field: "courseName" },
        { status: 400 }
      );
    }

    if (!yearOrClass?.trim()) {
      return NextResponse.json(
        { error: "Please select your Class (FY, SY, TY, or Final).", field: "yearOrClass" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanName = fullName.trim();
    const cleanDivision = (division || "").trim().toUpperCase();
    const cleanCollege = (collegeName || "KES Shroff College").trim();
    const cleanStream = (stream || "").trim();
    const cleanCourseName = (courseName || "").trim();
    const cleanYear = (yearOrClass || "FY").trim();

    const supabaseAdmin = createAdminClient();

    // 1. Check if roll number already exists (must be strictly unique)
    const { data: existingRoll } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("roll_number", cleanRoll)
      .maybeSingle();

    if (existingRoll) {
      return NextResponse.json(
        {
          error: "This student roll number is already registered. Each student must have a unique roll number.",
          field: "rollNumber",
          alreadyRegistered: true,
        },
        { status: 400 }
      );
    }

    // 2. Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        {
          error: "An account with this email address already exists. Please sign in instead.",
          field: "email",
          alreadyRegistered: true,
        },
        { status: 400 }
      );
    }

    // Resolve valid course_id so user profile is never null
    let resolvedCourseId = courseId;
    if (!resolvedCourseId) {
      const lowerCourse = cleanCourseName.toLowerCase();
      if (lowerCourse.includes("cse") || lowerCourse.includes("computer") || lowerCourse.includes("btech") || lowerCourse.includes("cs")) {
        resolvedCourseId = "c1000000-0000-0000-0000-000000000001"; // CSE
      } else if (lowerCourse.includes("it") || lowerCourse.includes("information") || lowerCourse.includes("web")) {
        resolvedCourseId = "c1000000-0000-0000-0000-000000000002"; // IT
      } else if (lowerCourse.includes("ece") || lowerCourse.includes("electronics")) {
        resolvedCourseId = "c1000000-0000-0000-0000-000000000003"; // ECE
      } else {
        resolvedCourseId = "b22ae884-83a8-4aef-a710-cddb1af60854"; // First Year B.Sc AI
      }
    }

    // 3. Create user in auth.users with auto-confirmation so student can log in instantly
    const metadata = {
      full_name: cleanName,
      roll_number: cleanRoll,
      division: cleanDivision,
      college_name: cleanCollege,
      stream: cleanStream,
      course_name: cleanCourseName,
      year_or_class: cleanYear,
      course_id: resolvedCourseId,
      role: "student",
    };

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (authError) {
      const msg = authError.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists")) {
        return NextResponse.json(
          {
            error: "An account with this email address already exists. Please sign in instead.",
            field: "email",
            alreadyRegistered: true,
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: "Failed to create user account." },
        { status: 500 }
      );
    }

    // 4. Upsert user into profiles with base columns only (safe for schema cache)
    const profilePayload = {
      id: authUser.user.id,
      full_name: cleanName,
      roll_number: cleanRoll,
      course_id: resolvedCourseId,
      email: cleanEmail,
      role: "student",
      is_blocked: false,
    };

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      console.warn("Profile upsert warning:", profileError.message);
    }

    // 5. Log account creation in Redis activity feed
    try {
      const { logUserActivity } = await import("@/lib/redis");
      await logUserActivity(authUser.user.id, {
        activity_type: "account_created",
        description: `Student account registered (${cleanRoll}) - ${cleanStream}`,
        details: { rollNumber: cleanRoll, stream: cleanStream, course: cleanCourseName },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email: cleanEmail,
        fullName: cleanName,
      },
    });
  } catch (err: any) {
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json(
      { error: err.message || "Registration failed." },
      { status: 500 }
    );
  }
}
