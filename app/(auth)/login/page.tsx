"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
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
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  UserPlus,
  Building2,
  KeyRound,
  RefreshCw,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface CollegeItem {
  id: string;
  name: string;
  state: string;
  district: string;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  // Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);

  // Login Mode: 'password' | 'otp' | 'forgot'
  const [loginMode, setLoginMode] = useState<"password" | "otp" | "forgot">("password");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // OTP Login state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regRollNumber, setRegRollNumber] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState<"school" | "junior_college" | "ug" | "pg">("ug");
  const [stream, setStream] = useState("Engineering (B.Tech / B.E)");
  const [yearOrClass, setYearOrClass] = useState("1st Year");

  // College search combobox state
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeList, setCollegeList] = useState<CollegeItem[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  const collegeComboboxRef = useRef<HTMLDivElement>(null);

  // Courses fallback list
  const [courses, setCourses] = useState<Course[]>([]);
  const [regCourseId, setRegCourseId] = useState("");

  // Status & Messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [alreadyRegisteredPrompt, setAlreadyRegisteredPrompt] = useState(false);

  const supabase = createClient();

  // Load courses
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
        console.warn("Failed to load courses:", e);
      }
    }
    loadCourses();
  }, []);

  // Debounced search for colleges from /api/colleges
  useEffect(() => {
    if (!collegeSearch.trim() || isCustomCollege) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingColleges(true);
        const res = await fetch(`/api/colleges?q=${encodeURIComponent(collegeSearch.trim())}&limit=25`);
        if (res.ok) {
          const data = await res.json();
          setCollegeList(data.colleges || []);
        }
      } catch (e) {
        console.error("Colleges search error:", e);
      } finally {
        setIsSearchingColleges(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [collegeSearch, isCustomCollege]);

  // Close college dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (collegeComboboxRef.current && !collegeComboboxRef.current.contains(e.target as Node)) {
        setIsCollegeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for recovery session or callback errors
  useEffect(() => {
    if (searchParams.get("recovery") === "true" || searchParams.get("type") === "recovery") {
      setLoginMode("forgot");
      setForgotOtpSent(true);
      setHasRecoverySession(true);
      setInfoMessage("Email link verified! Enter your new password below.");
    }
    if (searchParams.get("error") === "auth_callback_failed") {
      setError("Authentication link may have expired or is invalid. Please try requesting a new OTP.");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLoginMode("forgot");
        setForgotOtpSent(true);
        setHasRecoverySession(true);
        setInfoMessage("Email link verified! Enter your new password below.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  // Stream options based on education level
  const streamOptions = {
    school: ["General (All Subjects)", "Class 9th Foundation", "Class 10th Board"],
    junior_college: [
      "Science (PCM - Physics, Chem, Math)",
      "Science (PCB - Physics, Chem, Biology)",
      "Science (PCMB - All Sciences)",
      "Commerce (Accounts, Math, Eco)",
      "Arts & Humanities",
    ],
    ug: [
      "Engineering & Tech (B.Tech / B.E)",
      "Computer Applications (BCA / B.Sc CS)",
      "Science (B.Sc General)",
      "Commerce & Business (B.Com / BBA)",
      "Arts & Humanities (B.A)",
      "Medical & Dental (MBBS / BDS)",
      "Pharmacy (B.Pharm)",
      "Law (LL.B / B.A. LL.B)",
    ],
    pg: [
      "Technology & Engineering (M.Tech / M.E)",
      "Computer Science & MCA",
      "Science (M.Sc)",
      "Business Administration (MBA / PGDM)",
      "Commerce (M.Com)",
      "Arts & Humanities (M.A)",
      "Law (LL.M)",
    ],
  }[educationLevel];

  // Year options based on level
  const yearOptions =
    educationLevel === "school"
      ? ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
      : educationLevel === "junior_college"
      ? ["11th Standard", "12th Standard"]
      : educationLevel === "ug"
      ? ["1st Year", "2nd Year", "3rd Year", "4th Year", "Final Year"]
      : ["1st Year (Junior)", "2nd Year (Final)"];

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError(null);
    setErrorField(null);
    setInfoMessage(null);
    setAlreadyRegisteredPrompt(false);
  };

  // 1. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
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
        .update({ last_login_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
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

  // 2. Send 6-Digit OTP / Magic Link
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your student email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${appOrigin}/auth/callback?next=${redirectTo}`,
        },
      });

      if (otpError) throw otpError;

      setOtpSent(true);
      setInfoMessage("Verification code sent! Enter the 6-digit OTP code received in your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send verification OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP and Sign In
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });

      if (verifyError) throw verifyError;

      setInfoMessage("Verification successful! Signing you in...");

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, role")
        .eq("id", data.user?.id)
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
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Send Forgot Password Recovery OTP
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${appOrigin}/auth/callback?next=${encodeURIComponent("/login?recovery=true")}`,
      });

      if (resetErr) throw resetErr;

      setForgotOtpSent(true);
      setInfoMessage("Password reset code sent! Check your email for the 6-digit recovery code or click the reset link.");
    } catch (err: any) {
      setError(err.message || "Failed to send recovery code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Verify Recovery OTP & Reset Password
  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!hasRecoverySession && (!cleanOtp || cleanOtp.length < 6)) {
      setError("Please enter the 6-digit recovery code or click the email link.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!hasRecoverySession) {
        // Verify OTP recovery token
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: "recovery",
        });

        if (verifyErr) throw verifyErr;
      }

      // Update password with active session
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      setInfoMessage("Password updated successfully! Logging you in...");
      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch (err: any) {
      setError(err.message || "Invalid recovery code or expired request.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Student Registration with Indian College dataset & academic stream
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
    const cleanCollege = (selectedCollege || collegeSearch).trim();

    if (!cleanName || !cleanRoll || !cleanEmail || !regPassword) {
      setError("Please fill in all mandatory fields.");
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
          email: cleanEmail,
          password: regPassword,
          courseId: regCourseId || null,
          collegeName: cleanCollege || "Not Specified",
          educationLevel,
          stream,
          courseName: stream,
          yearOrClass,
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
            TAB 1: STUDENT SIGN IN (PASSWORD, EMAIL OTP, OR FORGOT PASSWORD)
           ========================================================================= */}
        {activeTab === "login" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Welcome back
              </h2>
              <p className="text-xs text-zinc-500">
                Sign in with your registered student credentials.
              </p>
            </div>

            {/* Sub-modes: Password vs Email OTP vs Forgot Password */}
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("password");
                  setError(null);
                }}
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
                onClick={() => {
                  setLoginMode("otp");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === "otp"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Email OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("forgot");
                  setError(null);
                  setForgotEmail(loginEmail);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === "forgot"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Forgot Password
              </button>
            </div>

            {/* Mode A: Standard Password Login */}
            {loginMode === "password" && (
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
                      onClick={() => {
                        setLoginMode("forgot");
                        setForgotEmail(loginEmail);
                      }}
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
            )}

            {/* Mode B: Email OTP Login */}
            {loginMode === "otp" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendLoginOtp} className="space-y-4">
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
                      <p className="text-[11px] text-zinc-500">
                        We will send a 6-digit verification code to your email.
                      </p>
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
                        <span>Send 6-Digit OTP Code &rarr;</span>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-in fade-in">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Enter 6-Digit OTP
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] text-[var(--accent)] hover:underline flex items-center space-x-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Change Email</span>
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <Input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          required
                          autoFocus
                          className="pl-10 h-11 rounded-xl text-center text-sm font-mono tracking-widest bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Sent to <strong className="text-zinc-700 dark:text-zinc-300">{loginEmail}</strong>
                      </p>
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
                        <span>Verify OTP & Sign In &rarr;</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Mode C: Forgot Password via OTP Recovery */}
            {loginMode === "forgot" && (
              <div className="space-y-4">
                {!forgotOtpSent ? (
                  <form onSubmit={handleSendForgotOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Registered Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <Input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="student@university.edu"
                          required
                          className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Enter your registered email to receive a password reset verification code.
                      </p>
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
                        <span>Send Reset Code &rarr;</span>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyForgotOtp} className="space-y-4 animate-in fade-in">
                    {hasRecoverySession ? (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Email recovery link verified! Set your new password below.</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          6-Digit Recovery Code
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                          <Input
                            type="text"
                            maxLength={6}
                            value={forgotOtp}
                            onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="123456"
                            required
                            className="pl-10 h-11 rounded-xl text-center text-sm font-mono tracking-widest bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Minimum 6 characters"
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
                        <span>Reset Password & Sign In &rarr;</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
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
            TAB 2: STUDENT REGISTRATION (INDIAN COLLEGES & ACADEMIC STREAM FORM)
           ========================================================================= */}
        {activeTab === "register" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Student Registration
              </h2>
              <p className="text-xs text-zinc-500">
                Complete your academic profile to unlock verified study notes.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* 1. Full Name & Roll Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Vishal Kumar"
                      required
                      className="pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Roll Number *
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Unique ID</span>
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={regRollNumber}
                      onChange={(e) => setRegRollNumber(e.target.value)}
                      placeholder="e.g. 21BCE1042"
                      required
                      className={`pl-10 h-10 rounded-xl text-xs uppercase font-mono bg-zinc-50 dark:bg-zinc-800/50 ${
                        errorField === "rollNumber"
                          ? "border-rose-500 ring-1 ring-rose-500"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Education Level (School vs Junior College vs UG vs PG) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Education Level *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("school");
                      setStream("General (All Subjects)");
                      setYearOrClass("Class 10");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "school"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    1st–10th
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("junior_college");
                      setStream("Science (PCM - Physics, Chem, Math)");
                      setYearOrClass("12th Standard");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "junior_college"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    11th–12th
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("ug");
                      setStream("Engineering & Tech (B.Tech / B.E)");
                      setYearOrClass("1st Year");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "ug"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    UG (Degree)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("pg");
                      setStream("Technology & Engineering (M.Tech / M.E)");
                      setYearOrClass("1st Year (Junior)");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "pg"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    PG (Masters)
                  </button>
                </div>
              </div>

              {/* 3. Stream & Year Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Stream / Course *
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <select
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      className="w-full pl-9 pr-3 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] truncate"
                    >
                      {streamOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Year / Class *
                  </label>
                  <select
                    value={yearOrClass}
                    onChange={(e) => setYearOrClass(e.target.value)}
                    className="w-full px-3 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {yearOptions.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. College / School Combobox (Indian Colleges Database) */}
              <div className="space-y-1.5" ref={collegeComboboxRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    College / School Name *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCollege(!isCustomCollege);
                      setSelectedCollege("");
                      setCollegeSearch("");
                    }}
                    className="text-[11px] text-[var(--accent)] hover:underline"
                  >
                    {isCustomCollege ? "Search Indian Colleges" : "+ Type Manually"}
                  </button>
                </div>

                {isCustomCollege ? (
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={collegeSearch}
                      onChange={(e) => {
                        setCollegeSearch(e.target.value);
                        setSelectedCollege(e.target.value);
                      }}
                      placeholder="Enter school or college name"
                      required
                      className="pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={selectedCollege || collegeSearch}
                      onChange={(e) => {
                        setSelectedCollege("");
                        setCollegeSearch(e.target.value);
                        setIsCollegeDropdownOpen(true);
                      }}
                      onFocus={() => setIsCollegeDropdownOpen(true)}
                      placeholder="Search across 12,000+ Indian Colleges..."
                      required
                      className="pl-10 pr-8 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 truncate"
                    />
                    {isSearchingColleges && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-zinc-400" />
                    )}

                    {/* Autocomplete Dropdown */}
                    {isCollegeDropdownOpen && collegeList.length > 0 && !selectedCollege && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl z-50 p-1 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {collegeList.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => {
                              setSelectedCollege(col.name);
                              setCollegeSearch(col.name);
                              setIsCollegeDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-xs flex flex-col space-y-0.5"
                          >
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                              {col.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {col.district ? `${col.district}, ` : ""}
                              {col.state}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Email & Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Student Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@university.edu"
                    required
                    className={`pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "email"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

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
                  <span>Register & Continue &rarr;</span>
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
        Protected study material and verified university notes.
      </footer>
    </div>
  );
}
