"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  UserPlus,
  BookOpen,
  Heart,
  Inbox,
  Send,
  Sparkles,
  Filter,
  RefreshCw,
  Clock,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SystemEvent {
  id: string;
  type: "signup" | "read" | "favorite" | "request";
  title: string;
  description: string;
  created_at: string;
  meta?: any;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  link?: string;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  // Broadcast composer state
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastLink, setBroadcastLink] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const fetchNotificationData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notifications");
      const data = await res.json();
      setEvents(data.events || []);
      setAnnouncements(data.announcements || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;

    try {
      setIsBroadcasting(true);
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          body: broadcastMessage.trim(),
          message: broadcastMessage.trim(),
          link: broadcastLink.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBroadcastSuccess(true);
        setBroadcastTitle("");
        setBroadcastMessage("");
        setBroadcastLink("");
        fetchNotificationData();
        setTimeout(() => setBroadcastSuccess(false), 4000);
      } else {
        alert(data.error || "Failed to broadcast announcement");
      }
    } catch (err: any) {
      alert(err.message || "Failed to broadcast announcement");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    if (eventTypeFilter === "all") return true;
    return ev.type === eventTypeFilter;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Notifications & Activity Stream
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time notifications of new user registrations, note interactions, checkout attempts & student broadcasts.
          </p>
        </div>

        <button
          onClick={fetchNotificationData}
          title="Refresh"
          className="inline-flex items-center space-x-1.5 p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Event Stream (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Real-Time Activity Stream
                </h2>
              </div>

              <div className="flex flex-wrap gap-1">
                {[
                  { id: "all", label: "All" },
                  { id: "signup", label: "Joins" },
                  { id: "read", label: "Reads" },
                  { id: "favorite", label: "Wishlist" },
                  { id: "request", label: "Requests" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setEventTypeFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                      eventTypeFilter === tab.id
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event List */}
            <div className="mt-4 space-y-3">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading notifications feed...
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No events found in this category.
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  let Icon = Bell;
                  let iconBg = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

                  if (ev.type === "signup") {
                    Icon = UserPlus;
                    iconBg = "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400";
                  } else if (ev.type === "read") {
                    Icon = BookOpen;
                    iconBg = "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400";
                  } else if (ev.type === "favorite") {
                    Icon = Heart;
                    iconBg = "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400";
                  } else if (ev.type === "request") {
                    Icon = Inbox;
                    iconBg = "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400";
                  }

                  return (
                    <div
                      key={ev.id}
                      className="flex items-start justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 transition gap-3"
                    >
                      <div className="flex items-start space-x-3 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                            {ev.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {ev.description}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                        {formatDate(ev.created_at)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Broadcast Announcement Composer (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <Send className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Broadcast Announcement
              </h2>
            </div>

            {broadcastSuccess && (
              <div className="mt-4 flex items-center space-x-2 rounded-xl bg-emerald-50 p-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Announcement published to all students successfully!</span>
              </div>
            )}

            <form onSubmit={handleBroadcast} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Physics Notes Uploaded!"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Message Details
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Inform students about upcoming revisions, uploaded papers, or exam instructions..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. /home or /reader?id=..."
                  value={broadcastLink}
                  onChange={(e) => setBroadcastLink(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full inline-flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isBroadcasting ? "Publishing..." : "Send Announcement"}</span>
              </button>
            </form>
          </div>

          {/* Past Announcements Archive */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-3 border-b border-slate-100 dark:border-slate-800">
              Active Broadcasts ({announcements.length})
            </h3>
            <div className="mt-3 space-y-3 max-h-60 overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No broadcast announcements published yet.
                </div>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{a.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {formatDate(a.created_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {a.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
