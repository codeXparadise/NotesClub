"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/student/Navbar";
import {
  Bell,
  CheckCheck,
  BookOpen,
  Sparkles,
  Calendar,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "manual" | "auto";
  document_id: string | null;
  audience: string;
  created_at: string;
  is_read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error("Notifications fetch error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.is_read) {
      try {
        await fetch("/api/notifications/read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20 dark:bg-slate-950">
      <Navbar unreadCount={unreadCount} />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/home"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 transition"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Notifications
              </h1>
              <p className="text-xs text-slate-500">
                Announcements from your instructor & updates on new study materials
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-1.5 rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 transition"
            >
              <CheckCheck className="h-4 w-4 text-indigo-600" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse dark:bg-slate-900 dark:border-slate-800"
              />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Bell className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
              No notifications yet
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              When the instructor posts an announcement or a new book is published, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const content = (
                <div
                  onClick={() => handleNotificationClick(n)}
                  className={`group relative flex items-start space-x-4 rounded-2xl border p-4.5 transition cursor-pointer ${
                    !n.is_read
                      ? "border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50/70 dark:border-indigo-900/60 dark:bg-indigo-950/20"
                      : "border-slate-200/90 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      n.type === "auto"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    }`}
                  >
                    {n.type === "auto" ? (
                      <Sparkles className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4
                        className={`text-sm tracking-tight ${
                          !n.is_read
                            ? "font-bold text-slate-900 dark:text-white"
                            : "font-semibold text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {n.body}
                    </p>

                    <div className="flex items-center space-x-3 pt-1 text-[11px] text-slate-400">
                      <span>{formatDate(n.created_at)}</span>
                      {n.document_id && (
                        <span className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium">
                          <BookOpen className="mr-1 h-3 w-3" />
                          Tap to open attached note
                        </span>
                      )}
                    </div>
                  </div>

                  {n.document_id && (
                    <ChevronRight className="h-5 w-5 self-center text-slate-400 group-hover:text-indigo-600 transition" />
                  )}
                </div>
              );

              if (n.document_id) {
                return (
                  <Link key={n.id} href={`/read/${n.document_id}`}>
                    {content}
                  </Link>
                );
              }

              return <div key={n.id}>{content}</div>;
            })}
          </div>
        )}
      </main>
    </div>
  );
}
