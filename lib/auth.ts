import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface UserProfile {
  id: string;
  full_name: string;
  roll_number: string | null;
  course_id: string | null;
  email: string;
  role: "student" | "teacher";
  is_blocked: boolean;
  courses?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

/**
 * Retrieves the current authenticated user and their profile from Supabase.
 */
export async function getCurrentProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*, courses:course_id(id, name, code)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile as UserProfile;
  } catch (err) {
    console.error("Error retrieving user profile:", err);
    return null;
  }
}

/**
 * Route guard that ensures caller is authenticated and not blocked.
 */
export async function requireAuth(): Promise<UserProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.is_blocked) {
    redirect("/blocked");
  }

  return profile;
}

/**
 * Route guard for Admin / Teacher consoles.
 */
export async function requireTeacher(): Promise<UserProfile> {
  const profile = await requireAuth();

  if (profile.role !== "teacher") {
    redirect("/home");
  }

  return profile;
}
