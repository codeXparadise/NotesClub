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
  Building2,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  UserPlus,
  Layers,
  Calendar,
  LockKeyhole,
} from "lucide-react";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  // Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regRollNumber, setRegRollNumber] = useState("");
  const [regDivision, setRegDivision] = useState("");
  const [regStream, setRegStream] = useState<"Science" | "Commerce" | "Arts">("Science");
  const [regCourseName, setRegCourseName] = useState("");
  const [regClass, setRegClass] = useState<"FY" | "SY" | "TY" | "Final">("FY");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Status & Messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [alreadyRegisteredPrompt, setAlreadyRegisteredPrompt] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("mode") === "register") {
      setActiveTab("register");
    } else if (searchParams.get("mode") === "login") {
      setActiveTab("login");
    }
  }, [searchParams]);

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError(null);
    setErrorField(null);
    setInfoMessage(null);
    setAlreadyRegisteredPrompt(false);
  };

  // 1. Student / Teacher Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const cleanInput = loginEmail.trim();
      let emailToUse = cleanInput.toLowerCase();

      // If user entered a roll number instead of an email, look up the email from profiles
      if (!cleanInput.includes("@")) {
        const { data: profileWithRoll } = await supabase
          .from("profiles")
          .select("email")
          .eq("roll_number", cleanInput.toUpperCase())
          .maybeSingle();

        if (profileWithRoll?.email) {
          emailToUse = profileWithRoll.email.toLowerCase();
        }
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password: loginPassword,
      });

      if (signInError) throw signInError;

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

      // Record login time
      await supabase
        .from("profiles")
        .update({
          last_login_at: new Date().toISOString(),
          last_active_at: new Date().toISOString(),
        })
        .eq("id", data.user.id);

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

  // 2. Student Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorField(null);
    setInfoMessage(null);
    setAlreadyRegisteredPrompt(false);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanRoll = regRollNumber.trim().toUpperCase();
    const cleanName = regFullName.trim();
    const cleanDivision = regDivision.trim().toUpperCase();
    const cleanStream = regStream.trim();
    const cleanCourseName = regCourseName.trim();
    const cleanClass = regClass.trim();

    if (!cleanName || !cleanRoll || !cleanEmail || !regPassword) {
      setError("Please fill in all mandatory fields.");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      setErrorField("email");
      setIsLoading(false);
      return;
    }

    if (!cleanCourseName) {
      setError("Please specify your course (e.g. BSC AI, BSC IT, B.Com, BMS, BA...).");
      setErrorField("courseName");
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
          fullName: cleanName,
          rollNumber: cleanRoll,
          division: cleanDivision,
          stream: cleanStream,
          courseName: cleanCourseName,
          yearOrClass: cleanClass,
          collegeName: "KES Shroff College",
          email: cleanEmail,
          password: regPassword,
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

      setInfoMessage("Account created successfully! Logging you in...");
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: regPassword,
      });

      if (!loginErr) {
        router.push(redirectTo);
      } else {
        switchTab("login");
        setLoginEmail(cleanEmail);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
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
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all">
        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-start space-x-3 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-medium leading-relaxed">{error}</p>
              {alreadyRegisteredPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    switchTab("login");
                    setLoginEmail(regEmail);
                  }}
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
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-600 dark:text-emerald-400 flex items-start space-x-3 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{infoMessage}</p>
          </div>
        )}

        {/* =========================================================================
            TAB 1: SIGN IN (CLEAN & DIRECT)
           ========================================================================= */}
        {activeTab === "login" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Welcome back
              </h2>
              <p className="text-xs text-zinc-500">
                Sign in with your email or roll number and password.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email ID or Roll Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="name@example.com or roll number"
                    required
                    className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password
                </label>
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
                className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition mt-2"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Sign In & Continue &rarr;</span>
                )}
              </Button>
            </form>

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
            TAB 2: STUDENT REGISTRATION
           ========================================================================= */}
        {activeTab === "register" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Create Account
              </h2>
              <p className="text-xs text-zinc-500">
                Fill in your student details to register your account.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* 1. Student Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Student Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Enter student full name"
                    required
                    className="pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                  />
                </div>
              </div>

              {/* 2. Roll Number & Division Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Roll Number *
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Unique</span>
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={regRollNumber}
                      onChange={(e) => setRegRollNumber(e.target.value)}
                      placeholder="e.g. FDAI044A"
                      required
                      className={`pl-10 h-10 rounded-xl text-xs uppercase font-mono bg-zinc-50 dark:bg-zinc-800/50 ${
                        errorField === "rollNumber"
                          ? "border-rose-500 ring-1 ring-rose-500"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Division *
                  </label>
                  <div className="relative">
                    <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={regDivision}
                      onChange={(e) => setRegDivision(e.target.value)}
                      placeholder="e.g. A / B / C"
                      required
                      className="pl-10 h-10 rounded-xl text-xs uppercase bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Stream (Sci / Com / Arts Dropdown) & Course (Manual Write) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Stream *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <select
                      value={regStream}
                      onChange={(e) =>
                        setRegStream(e.target.value as "Science" | "Commerce" | "Arts")
                      }
                      className="w-full pl-9 pr-3 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    >
                      <option value="Science">Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Arts">Arts</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Course *
                  </label>
                  <Input
                    type="text"
                    value={regCourseName}
                    onChange={(e) => setRegCourseName(e.target.value)}
                    placeholder="e.g. BSC AI, BSC IT, BCOM, BMS..."
                    required
                    className={`h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "courseName"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

              {/* 4. Class (FY, SY, TY, Final Dropdown) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Class *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <select
                    value={regClass}
                    onChange={(e) =>
                      setRegClass(e.target.value as "FY" | "SY" | "TY" | "Final")
                    }
                    className="w-full pl-9 pr-3 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value="FY">FY (First Year)</option>
                    <option value="SY">SY (Second Year)</option>
                    <option value="TY">TY (Third Year)</option>
                    <option value="Final">Final (Final Year)</option>
                  </select>
                </div>
              </div>

              {/* 5. College (KES Shroff College - Locked & Cannot be changed) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    College *
                  </label>
                  <span className="inline-flex items-center space-x-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    <LockKeyhole className="h-2.5 w-2.5" />
                    <span>Fixed Default</span>
                  </span>
                </div>
                <div className="relative">
                  <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="text"
                    value="KES Shroff College"
                    readOnly
                    disabled
                    className="pl-10 h-10 rounded-xl text-xs bg-zinc-100 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 cursor-not-allowed font-medium select-none"
                  />
                </div>
              </div>

              {/* 6. Email ID (Must be valid) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email ID *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@example.com"
                    required
                    className={`pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "email"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

              {/* 7. Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className={`pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
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
                Already have an account?{" "}
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
        Protected study material and verified university notes.
      </footer>
    </div>
  );
}
