"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Check,
  X,
  BookOpen,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "auto" | "manual" | "alert" | string;
  document_id?: string | null;
  audience?: string;
  created_at: string;
  is_read?: boolean;
}

interface TopNotificationPanelProps {
  initialUnreadCount?: number;
  onUnreadCountChange?: (count: number) => void;
}

export const TopNotificationPanel: React.FC<TopNotificationPanelProps> = ({
  initialUnreadCount = 0,
  onUnreadCountChange,
}) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Sync internal unreadCount with prop if provided
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  // Load notifications from API
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const list: NotificationItem[] = data.notifications || [];
        setNotifications(list);
        const count = typeof data.unreadCount === "number" ? data.unreadCount : list.filter((n) => !n.is_read).length;
        setUnreadCount(count);
        onUnreadCountChange?.(count);
      }
    } catch (e) {
      console.warn("Failed to fetch notifications:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch when opened
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Initial silent load to get unread count
  useEffect(() => {
    loadNotifications();
  }, []);

  // Handle outside clicks to close overlay
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      onUnreadCountChange?.(0);

      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (e) {
      console.error("Mark all read failed:", e);
    }
  };

  // Mark single as read
  const handleMarkSingleRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => {
        const next = Math.max(0, c - 1);
        onUnreadCountChange?.(next);
        return next;
      });

      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (e) {
      console.error("Mark single read failed:", e);
    }
  };

  // Format relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = new Date();
      const past = new Date(dateStr);
      const diffMs = now.getTime() - past.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return past.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    return true;
  });

  return (
    <div className="relative">
      {/* Bell Trigger Button beside the search bar */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative h-12 w-12 rounded-[14px] flex items-center justify-center shrink-0 transition-all duration-200 border shadow-[var(--shadow)] active:scale-95 ${
          isOpen
            ? "ring-2 ring-[var(--accent)] text-[var(--accent)]"
            : "text-[var(--ink-2)] hover:text-[var(--ink)]"
        }`}
        style={{
          backgroundColor: isOpen ? "var(--accent-soft)" : "var(--surface)",
          borderColor: isOpen ? "var(--accent)" : "var(--line-2)",
        }}
        title="Notifications & Announcements"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-4 w-4 shrink-0 transition-transform duration-200 hover:rotate-12" />

        {/* Live Red Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-md ring-2 ring-[var(--surface)] animate-in zoom-in-50 duration-200">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* OVERLAY WITH SMOOTH ANIMATION */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-14 sm:w-[390px] md:w-[420px] z-50 rounded-[22px] border shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-3 duration-250 ease-out"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--line-2)",
            boxShadow: "0 20px 45px -10px rgba(0,0,0,0.25), 0 0 1px 1px rgba(0,0,0,0.05)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5 border-b"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
              >
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-[var(--ink)] tracking-tight">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-[11px] text-[var(--muted)]">
                    {unreadCount} unread update{unreadCount > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--accent)] hover:bg-[var(--accent-soft)] transition"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Mark all read</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                title="Close notification panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div
            className="flex items-center space-x-2 px-4 py-2 border-b text-xs"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--line)" }}
          >
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full font-medium transition ${
                filter === "all"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm font-semibold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("unread")}
              className={`px-3 py-1 rounded-full font-medium transition ${
                filter === "unread"
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm font-semibold"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--line)] overscroll-contain scrollbar-thin">
            {isLoading && notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-[var(--muted)]">
                <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                <span className="text-xs">Loading announcements...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-2">
                <div
                  className="mx-auto flex h-12 w-12 items-center justify-center rounded-full opacity-60"
                  style={{ backgroundColor: "var(--surface-2)" }}
                >
                  <Bell className="h-6 w-6 text-[var(--muted)]" />
                </div>
                <p className="text-sm font-medium text-[var(--ink)]">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                  You are completely caught up! New study material and teacher alerts will appear here.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isAuto = notif.type === "auto";
                const isDoc = Boolean(notif.document_id);

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) handleMarkSingleRead(notif.id);
                      if (notif.document_id) {
                        setIsOpen(false);
                        router.push(`/read/${notif.document_id}`);
                      }
                    }}
                    className={`group relative p-3.5 transition-colors cursor-pointer flex items-start space-x-3 ${
                      notif.is_read
                        ? "opacity-80 hover:opacity-100 hover:bg-[var(--surface-2)]"
                        : "bg-[var(--accent-soft)]/20 hover:bg-[var(--accent-soft)]/35 font-medium"
                    }`}
                  >
                    {/* Unread dot */}
                    {!notif.is_read && (
                      <span className="absolute left-1.5 top-5 h-2 w-2 rounded-full bg-[var(--accent)] shrink-0" />
                    )}

                    {/* Icon */}
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isDoc
                          ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          : isAuto
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {isDoc ? (
                        <BookOpen className="h-4 w-4" />
                      ) : isAuto ? (
                        <Sparkles className="h-4 w-4" />
                      ) : (
                        <Info className="h-4 w-4" />
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--ink)] line-clamp-1">
                          {notif.title}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] font-mono shrink-0 flex items-center space-x-1">
                          <Clock className="h-2.5 w-2.5 inline" />
                          <span>{formatTimeAgo(notif.created_at)}</span>
                        </span>
                      </div>

                      <p className="text-xs text-[var(--ink-2)] mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.body}
                      </p>

                      {/* Document Quick Open Chip */}
                      {notif.document_id && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface)] text-[var(--accent)] border border-[var(--line)] shadow-2xs group-hover:bg-[var(--accent)] group-hover:text-white transition">
                            <BookOpen className="h-3 w-3" />
                            <span>Read Document &rarr;</span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mark read button on hover */}
                    {!notif.is_read && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkSingleRead(notif.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--surface)] transition self-start"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-t text-xs font-medium"
            style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--line)" }}
          >
            <span className="text-[11px] text-[var(--muted)]">Synced with announcements</span>
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center space-x-1 text-[var(--accent)] hover:underline font-semibold"
            >
              <span>View full page</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
