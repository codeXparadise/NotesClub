"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  User,
  ArrowLeft,
  Mail,
  Lock,
  Hash,
  Layers,
  GraduationCap,
  Calendar,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  ShieldCheck,
  Edit3,
  Save,
  X,
  KeyRound,
  BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StudentProfile {
  id: string;
  full_name: string;
  roll_number: string;
  division?: string;
  stream?: string;
  course_name?: string;
  year_or_class?: string;
  college_name?: string;
  email: string;
  role: string;
  created_at: string;
  updated_at?: string;
}

interface ActivityItem {
  id: string;
  activity_type: string;
  description: string;
  details?: any;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editDivision, setEditDivision] = useState("");
  const [editStream, setEditStream] = useState<"Science" | "Commerce" | "Arts">("Science");
  const [editCourseName, setEditCourseName] = useState("");
  const [editClass, setEditClass] = useState<"FY" | "SY" | "TY" | "Final">("FY");

  // Change Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Feedback messages
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch Profile & Activities
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/profile");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.profile) {
        setProfile(data.profile);
        setActivities(data.activities || []);
        // Populate edit fields
        setEditFullName(data.profile.full_name || "");
        setEditDivision(data.profile.division || "");
        setEditStream((data.profile.stream as any) || "Science");
        setEditCourseName(data.profile.course_name || "");
        setEditClass((data.profile.year_or_class as any) || "FY");
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Save Profile Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (!editFullName.trim()) {
      setProfileError("Full Name is required.");
      return;
    }
    if (!editCourseName.trim()) {
      setProfileError("Course is required.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          division: editDivision.trim().toUpperCase(),
          stream: editStream,
          courseName: editCourseName.trim(),
          yearOrClass: editClass,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update profile.");
      }

      setProfile(json.profile);
      setProfileSuccess("Profile updated successfully!");
      setIsEditing(false);
      // Refresh activities
      fetchProfileData();
    } catch (err: any) {
      setProfileError(err.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error: authErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authErr) throw authErr;

      // Log activity to server
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: "password_change",
          description: "Student updated their account password",
        }),
      });

      setPasswordSuccess("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      // Refresh activity log
      fetchProfileData();
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Shimmering Loading Animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4 animate-in fade-in">
          <div className="h-16 w-16 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 animate-pulse">
            <User className="h-8 w-8" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Loading Profile & Activities...
            </h2>
            <p className="text-xs text-slate-400">
              Fetching verified student records from Notes Club
            </p>
          </div>
          <div className="h-1.5 w-48 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full w-2/3 animate-indeterminate" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/home"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Return to Study Vault"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-serif font-bold text-sm">
                N
              </div>
              <span className="font-serif font-bold text-base tracking-tight">
                Notes Club Profile
              </span>
            </div>
          </div>

          <Link
            href="/home"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Profile Identity Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="h-20 w-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-indigo-600/20">
                {(profile?.full_name || "S").slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {profile?.full_name || "Student"}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                    <ShieldCheck className="h-3 w-3" /> Verified Student
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Roll No: <span className="font-semibold text-slate-700 dark:text-slate-300">{profile?.roll_number}</span> • {profile?.email}
                </p>
                <p className="text-xs text-slate-400">
                  Institute: <span className="font-medium text-slate-600 dark:text-slate-300">{profile?.college_name || "KES Shroff College"}</span>
                </p>
              </div>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-sm hover:bg-indigo-700 transition self-start sm:self-auto"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Academic Info</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition self-start sm:self-auto"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel Editing</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Feedback Banners */}
        {profileSuccess && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2.5 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{profileSuccess}</span>
          </div>
        )}
        {profileError && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-4 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2.5 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{profileError}</span>
          </div>
        )}

        {/* Grid: Academic Info & Password Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1 & 2: Academic Profile Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Academic Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your institutional registration & course information.
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  {isEditing ? "Editing Mode" : "Read-Only View"}
                </span>
              </div>

              {!isEditing ? (
                /* View Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Full Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {profile?.full_name}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Roll Number (Unique ID)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-sm">
                      {profile?.roll_number}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Division</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {profile?.division || "—"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Academic Stream</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {profile?.stream || "General"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Course Program</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {profile?.course_name || "—"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                    <span className="text-slate-400 text-[11px] block">Year / Class</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {profile?.year_or_class || "—"}
                    </span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1 sm:col-span-2">
                    <span className="text-slate-400 text-[11px] block">College</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                      {profile?.college_name || "KES Shroff College"} (Fixed Default)
                    </span>
                  </div>
                </div>
              ) : (
                /* Edit Mode */
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full pl-10 pr-4 h-11 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Division & Stream */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Division *
                      </label>
                      <div className="relative">
                        <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          value={editDivision}
                          onChange={(e) => setEditDivision(e.target.value)}
                          placeholder="e.g. A / B / C"
                          className="w-full pl-10 pr-4 h-11 rounded-xl text-xs uppercase bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Stream *
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                          value={editStream}
                          onChange={(e) =>
                            setEditStream(e.target.value as "Science" | "Commerce" | "Arts")
                          }
                          className="w-full pl-10 pr-4 h-11 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Science">Science</option>
                          <option value="Commerce">Commerce</option>
                          <option value="Arts">Arts</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Course (Manual write) & Class */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Course * (Manual write)
                      </label>
                      <input
                        type="text"
                        value={editCourseName}
                        onChange={(e) => setEditCourseName(e.target.value)}
                        placeholder="e.g. BSC AI, BSC IT, BCOM, BMS..."
                        className="w-full px-4 h-11 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Class *
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                        <select
                          value={editClass}
                          onChange={(e) =>
                            setEditClass(e.target.value as "FY" | "SY" | "TY" | "Final")
                          }
                          className="w-full pl-10 pr-4 h-11 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="FY">FY (First Year)</option>
                          <option value="SY">SY (Second Year)</option>
                          <option value="TY">TY (Third Year)</option>
                          <option value="Final">Final (Final Year)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* College & Roll Number (Notice: Non-editable) */}
                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Institute: <strong>KES Shroff College</strong> (Fixed)</span>
                    <span className="font-mono">Roll: <strong>{profile?.roll_number}</strong></span>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md hover:bg-indigo-700 active:scale-[0.98] transition disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>Save Changes</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Account Activity Timeline Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Account & Study Activities
                    </h2>
                    <p className="text-xs text-slate-500">
                      Chronological history visible to student & verified instructors.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activities.length} Events
                </span>
              </div>

              {activities.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No account changes recorded yet. Your profile updates and password changes will appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start space-x-3.5 p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800/60 text-xs"
                    >
                      <div className="h-8 w-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                        {act.activity_type.includes("password") ? (
                          <KeyRound className="h-4 w-4" />
                        ) : act.activity_type.includes("profile") ? (
                          <Edit3 className="h-4 w-4" />
                        ) : (
                          <BookOpen className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {act.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {formatDate(act.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Change Password Card */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="space-y-1 border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Change Password
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Update your security credentials directly.
                </p>
              </div>

              {passwordSuccess && (
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2 animate-in fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3 text-xs text-rose-700 dark:text-rose-300 flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-10 pr-4 h-11 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="w-full pl-10 pr-4 h-11 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full h-11 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-md hover:bg-indigo-700 active:scale-[0.98] transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
                >
                  {isChangingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  <span>Update Password</span>
                </button>
              </form>
            </div>

            {/* Quick Session Card */}
            <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-xs space-y-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Session Security
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Password updates immediately encrypt your account across all authenticated mobile and desktop sessions.
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                Account created: {profile?.created_at ? formatDate(profile.created_at) : "—"}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
