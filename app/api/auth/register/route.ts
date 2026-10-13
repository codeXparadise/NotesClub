import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, rollNumber, courseId, email, password } = body;

    if (!fullName?.trim() || !rollNumber?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
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

    // 3. Create user in auth.users with auto-confirmation so student can log in instantly
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        roll_number: cleanRoll,
        course_id: courseId || null,
        role: "student",
      },
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

    // 4. Upsert user into profiles
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: authUser.user.id,
        full_name: cleanName,
        roll_number: cleanRoll,
        course_id: courseId || null,
        email: cleanEmail,
        role: "student",
        is_blocked: false,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.error("Profile creation error:", profileError);
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
