"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  Hash,
  GraduationCap,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  UserPlus,
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  // Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);

  // Login form state
  const [loginMode, setLoginMode] = useState<"password" | "magic">("password");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regRollNumber, setRegRollNumber] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCourseId, setRegCourseId] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);

  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [alreadyRegisteredPrompt, setAlreadyRegisteredPrompt] = useState(false);

  const supabase = createClient();

  // Fetch available courses for registration dropdown
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          if (data?.courses && data.courses.length > 0) {
            setCourses(data.courses);
            setRegCourseId(data.courses[0].id);
          }
        }
      } catch (e) {
        console.warn("Failed to load courses list:", e);
      }
    }
    loadCourses();
  }, []);

  // Clear messages on tab switch
  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError(null);
    setErrorField(null);
    setInfoMessage(null);
    setAlreadyRegisteredPrompt(false);
  };

  // Switch to login tab and prefill email
  const promptToLogin = (emailToFill: string) => {
    setActiveTab("login");
    setLoginEmail(emailToFill);
    setError(null);
    setErrorField(null);
    setAlreadyRegisteredPrompt(false);
    setInfoMessage("An account with this email is already registered. Please enter your password to sign in.");
  };

  // Password Login Handler
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });

      if (signInError) throw signInError;

      // Check if user is blocked
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, role")
        .eq("id", data.user.id)
        .single();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        router.push("/blocked");
        return;
      }

      if (profile?.role === "teacher") {
        router.push("/admin");
      } else {
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // Magic Link Login Handler
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) {
      setError("Please enter your student email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const { error: magicError } = await supabase.auth.signInWithOtp({
        email: loginEmail.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}`,
        },
      });

      if (magicError) throw magicError;
      setInfoMessage("Magic link sent! Check your email inbox to sign in instantly.");
    } catch (err: any) {
      setError(err.message || "Failed to send magic link.");
    } finally {
      setIsLoading(false);
    }
  };

  // Student Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorField(null);
    setInfoMessage(null);
    setAlreadyRegisteredPrompt(false);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanRoll = regRollNumber.trim().toUpperCase();

    if (!regFullName.trim() || !cleanRoll || !cleanEmail || !regPassword) {
      setError("Please fill in all required registration fields.");
      setIsLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setErrorField("password");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: regFullName.trim(),
          rollNumber: cleanRoll,
          email: cleanEmail,
          password: regPassword,
          courseId: regCourseId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setErrorField(data.field || null);

        if (data.alreadyRegistered && data.field === "email") {
          setAlreadyRegisteredPrompt(true);
        }
        return;
      }

      // Auto login on successful registration
      setInfoMessage("Account created successfully! Logging you in...");
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: regPassword,
      });

      if (!loginErr) {
        router.push(redirectTo);
      } else {
        promptToLogin(cleanEmail);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Top Segmented Tab Switcher (Sign In vs Create Account) */}
      <div className="flex p-1 bg-zinc-200/70 dark:bg-zinc-900/80 rounded-2xl border border-zinc-300/60 dark:border-zinc-800 shadow-inner">
        <button
          type="button"
          onClick={() => switchTab("login")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === "login"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Student Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("register")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === "register"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all">
        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-start space-x-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-medium leading-relaxed">{error}</p>
              {alreadyRegisteredPrompt && (
                <button
                  type="button"
                  onClick={() => promptToLogin(regEmail)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 transition"
                >
                  <span>Switch to Sign In</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info Message Box */}
        {infoMessage && (
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-600 dark:text-emerald-400 flex items-start space-x-3">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{infoMessage}</p>
          </div>
        )}

        {/* =========================================================================
            TAB 1: STUDENT SIGN IN
           ========================================================================= */}
        {activeTab === "login" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Welcome back
              </h2>
              <p className="text-xs text-zinc-500">
                Sign in with your university email to resume reading.
              </p>
            </div>

            {/* Login Mode Pill (Password vs Magic Link) */}
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLoginMode("password")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === "password"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("magic")}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === "magic"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Magic Link
              </button>
            </div>

            {loginMode === "password" ? (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Student Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="student@university.edu"
                      required
                      className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setLoginMode("magic")}
                      className="text-[11px] text-[var(--accent)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Sign In & Continue &rarr;</span>
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Student Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="student@university.edu"
                      required
                      className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Send Magic Link &rarr;</span>
                  )}
                </Button>
              </form>
            )}

            <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800/80">
              <p className="text-xs text-zinc-500">
                New student?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  Create your account &rarr;
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: STUDENT REGISTRATION (UNIQUE ROLL NUMBER & EMAIL VERIFIED)
           ========================================================================= */}
        {activeTab === "register" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Student Registration
              </h2>
              <p className="text-xs text-zinc-500">
                Create your student portal account. Roll number must be unique.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Vishal Prajapati"
                    required
                    className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              {/* Roll Number (Strictly Unique) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Roll Number
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">Unique Identifier</span>
                </div>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    value={regRollNumber}
                    onChange={(e) => setRegRollNumber(e.target.value)}
                    placeholder="FDAI044A"
                    required
                    className={`pl-10 h-11 rounded-xl text-xs uppercase font-mono bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "rollNumber"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

              {/* Student Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
                    className={`pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "email"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

              {/* Enrolled Course */}
              {courses.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Course / Branch
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <select
                      value={regCourseId}
                      onChange={(e) => setRegCourseId(e.target.value)}
                      className="w-full pl-10 pr-4 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className={`pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "password"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition mt-2"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Create Account & Continue &rarr;</span>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800/80">
              <p className="text-xs text-zinc-500">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  Sign in here &rarr;
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased select-none"
      style={{ backgroundColor: "var(--bg)", color: "var(--ink)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto py-2">
        <Link href="/" className="flex items-center space-x-3 group">
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Notes Club
            </span>
            <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono">
              Academic Portal
            </span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center my-6">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              <p className="text-xs text-zinc-500">Loading portal...</p>
            </div>
          }
        >
          <AuthForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-zinc-400 max-w-md mx-auto">
        Protected study material and verified course notes.
      </footer>
    </div>
  );
}
