"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  FileText,
  Share2,
  Users,
  FolderSync,
  LogOut,
  ExternalLink,
  ShieldAlert,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [authStatus, setAuthStatus] = useState<"loading" | "unauthenticated" | "not_teacher" | "authorized">("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Admin login form states
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminOtp, setAdminOtp] = useState("");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkAdminAuth = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setAuthStatus("unauthenticated");
        return;
      }

      setUserEmail(user.email || null);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "teacher") {
        setAuthStatus("authorized");
      } else {
        setAuthStatus("not_teacher");
      }
    } catch (e) {
      console.error(e);
      setAuthStatus("unauthenticated");
    }
  };

  useEffect(() => {
    checkAdminAuth();
  }, [pathname]);

  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (data.user) {
        // Verify teacher role
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "teacher") {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("not_teacher");
          setUserEmail(data.user.email || null);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: adminEmail.trim(),
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      setOtpSent(true);
    } catch (err: any) {
      setAuthError(err.message || "Failed to send OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyAdminOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: adminEmail.trim(),
        token: adminOtp.trim(),
        type: "email",
      });

      if (error) {
        setAuthError(error.message);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "teacher") {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("not_teacher");
          setUserEmail(data.user.email || null);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthStatus("unauthenticated");
    setUserEmail(null);
    setOtpSent(false);
    setAdminPassword("");
    setAdminOtp("");
  };

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Students Roster", icon: Users },
    { href: "/admin/requests", label: "Access Requests", icon: Share2 },
    { href: "/admin/notifications", label: "Notifications", icon: FolderSync },
    { href: "/admin/notes", label: "Notes & Content", icon: FileText },
    { href: "/admin/upload", label: "Upload Center", icon: ExternalLink, tag: "Soon" },
  ];

  // 1. Loading screen
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs text-slate-500 font-medium">Verifying instructor session...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render dedicated Admin Portal Login
  if (authStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/80 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          {/* Header Brand */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Instructor Console Login
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sign in with your verified teacher credentials to access admin controls.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Method Toggle: Password vs OTP */}
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 mb-6 text-xs">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("password");
                  setOtpSent(false);
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                  loginMethod === "password"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Password Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("otp");
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                  loginMethod === "otp"
                    ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Supabase OTP Login
              </button>
            </div>

            {authError && (
              <div className="mb-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                {authError}
              </div>
            )}

            {loginMethod === "password" ? (
              <form onSubmit={handleAdminPasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instructor Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="teacher@institution.edu"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isSubmitting ? "Authenticating..." : "Access Admin Console"}</span>
                </button>
              </form>
            ) : !otpSent ? (
              <form onSubmit={handleSendAdminOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instructor Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="teacher@institution.edu"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>{isSubmitting ? "Sending OTP..." : "Send Verification Code"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAdminOtp} className="space-y-4">
                <p className="text-xs text-slate-500">
                  A 6-digit OTP code was sent to <strong className="text-slate-900 dark:text-white">{adminEmail}</strong>.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={adminOtp}
                    onChange={(e) => setAdminOtp(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-sm font-mono tracking-widest text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
                >
                  <Lock className="h-4 w-4" />
                  <span>{isSubmitting ? "Verifying..." : "Verify OTP & Access Console"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Change Email or Resend
                </button>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
              <Link
                href="/login"
                className="text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Looking for student login? Click here &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is logged in, but role is student (not teacher)
  if (authStatus === "not_teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/80 px-4 py-12 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Instructor Access Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            You are currently signed in as <strong className="text-slate-700 dark:text-slate-300">{userEmail}</strong>, which does not have Instructor privileges.
          </p>
          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/home"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
            >
              Go to Student Library
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            >
              Sign Out & Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Teacher: Render the full Instructor Console
  return (
    <div className="flex min-h-screen bg-slate-100/70 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col justify-between border-r border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Notes Club
              </h2>
              <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Instructor Console
              </p>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {"tag" in item && (item as any).tag && (
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {(item as any).tag}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            href="/home"
            className="flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <span className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <span>Student View</span>
            </span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center space-x-2 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              Instructor Console
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/home"
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              Student View
            </Link>
            <button
              onClick={handleSignOut}
              className="p-1 text-slate-500 hover:text-rose-600"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Mobile bottom tabs */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white/95 px-2 py-1 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 justify-around">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1 px-2 text-[10px] font-medium transition ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
