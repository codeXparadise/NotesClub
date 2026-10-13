"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  Search,
} from "lucide-react";

interface NavbarProps {
  userRole?: string;
  userName?: string;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  userRole = "student",
  userName = "Student",
  unreadCount: initialUnread = 0,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(initialUnread);

  useEffect(() => {
    // Poll or fetch unread count
    async function checkUnread() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (typeof data.unreadCount === "number") {
          setUnreadCount(data.unreadCount);
        }
      } catch (e) {
        // silent
      }
    }
    checkUnread();
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/home" className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
            Notes Club
          </span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Admin link if teacher */}
          {userRole === "teacher" && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center space-x-1.5 rounded-xl bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400 transition"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Teacher Console</span>
            </Link>
          )}

          {/* Notifications Bell */}
          <Link
            href="/notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* User profile / Logout */}
          <button
            onClick={handleSignOut}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
