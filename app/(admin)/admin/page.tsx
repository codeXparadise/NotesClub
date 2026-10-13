"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Eye,
  Share2,
  FolderSync,
  Clock,
  ArrowRight,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Inbox,
  Bell,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface StatData {
  stats: {
    totalStudents: number;
    blockedStudents: number;
    totalDocuments: number;
    totalViews: number;
    activeGrants: number;
    pendingRequests: number;
  };
  streamDistribution: { name: string; value: number }[];
  levelDistribution: { name: string; value: number }[];
  readingTrend: { date: string; count: number }[];
  topDocuments: { id: string; title: string; page_count: number }[];
  recentActivity: any[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"stream" | "level">("stream");

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const json = await res.json();
      if (json.stats) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSyncDrive = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sync/drive", { method: "POST" });
      const resData = await res.json();
      if (resData.success) {
        setSyncStatus(
          `Sync completed! Found ${resData.syncedCategories} categories, ${resData.syncedDocuments} documents, sent ${resData.newNotifications} notifications.`
        );
        fetchDashboardData();
      } else {
        setSyncStatus(`Sync error: ${resData.error || "Check Drive credentials."}`);
      }
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const stats = data?.stats || {
    totalStudents: 0,
    blockedStudents: 0,
    totalDocuments: 0,
    totalViews: 0,
    activeGrants: 0,
    pendingRequests: 0,
  };

  // Pie chart calculation
  const streamData = data?.streamDistribution || [];
  const totalStreamCount = streamData.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const STREAM_COLORS = [
    "#6366f1", // Indigo (Science)
    "#10b981", // Emerald (Commerce)
    "#f59e0b", // Amber (Arts)
    "#3b82f6", // Blue (Engineering)
    "#ec4899", // Pink (Medical)
    "#8b5cf6", // Purple (General)
  ];

  // Calculate SVG Pie/Donut slices
  let cumulativePercent = 0;
  const pieSlices = streamData.map((item, idx) => {
    const percent = item.value / totalStreamCount;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 360;
    return {
      ...item,
      color: STREAM_COLORS[idx % STREAM_COLORS.length],
      percent: Math.round(percent * 100),
      startAngle,
      endAngle,
    };
  });

  // Level bar chart max value for scaling
  const levelData = data?.levelDistribution || [];
  const maxLevelVal = Math.max(...levelData.map((d) => d.value), 1);

  // Line chart calculation
  const trend = data?.readingTrend || [];
  const maxTrend = Math.max(...trend.map((t) => t.count), 5);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Instructor Intelligence & Analytics
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              <Sparkles className="h-3 w-3" /> Live
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time student cohorts, reading behaviors, demographic breakdowns & catalog management.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-2.5">
          <Link
            href="/admin/users"
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <Users className="h-3.5 w-3.5 text-slate-500" />
            <span>Students Table</span>
          </Link>

          <button
            onClick={handleSyncDrive}
            disabled={isSyncing}
            className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
          >
            <FolderSync className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Drive Notes"}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-medium ${
            syncStatus.includes("error")
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900"
          }`}
        >
          <span>{syncStatus}</span>
          <button
            onClick={() => setSyncStatus(null)}
            className="text-[11px] underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-5 w-5" />
            </div>
            {stats.blockedStudents > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <ShieldAlert className="h-3 w-3" /> {stats.blockedStudents} blocked
              </span>
            ) : (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                All Active
              </span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : stats.totalStudents}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Enrolled Students
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800/80">
            <span>Verified with roll number</span>
            <Link href="/admin/users" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              View roster &rarr;
            </Link>
          </div>
        </div>

        {/* Documents */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Catalog</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : stats.totalDocuments}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Published Study Notes
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800/80">
            <span>Synced from Google Drive</span>
            <Link href="/admin/notes" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Browse &rarr;
            </Link>
          </div>
        </div>

        {/* Total Reads */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <Eye className="h-5 w-5" />
            </div>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp className="h-3 w-3" /> High intent
            </span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : stats.totalViews}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Document Read Events
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800/80">
            <span>Granular page flips tracked</span>
            <span className="text-slate-500">Live feed below</span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Inbox className="h-5 w-5" />
            </div>
            {stats.pendingRequests > 0 ? (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 animate-pulse">
                Action Required
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">Clear queue</span>
            )}
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {loading ? "..." : stats.pendingRequests}
            </div>
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Student Unblock Requests
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800/80">
            <span>Students requesting canvas access</span>
            <Link href="/admin/requests" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              Resolve &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Statistical Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stream & Level Demographic Breakdown (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Student Demographic Composition
                </h2>
              </div>
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab("stream")}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    activeTab === "stream"
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  By Academic Stream
                </button>
                <button
                  onClick={() => setActiveTab("level")}
                  className={`px-3 py-1 rounded-lg font-semibold transition ${
                    activeTab === "level"
                      ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400"
                      : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                  }`}
                >
                  By Class / Level
                </button>
              </div>
            </div>

            {/* Chart Body */}
            {activeTab === "stream" ? (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Donut Chart representation */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-44 h-44">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      {pieSlices.length === 0 || streamData.every((s) => s.value === 0) ? (
                        <circle
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke="currentColor"
                          className="text-slate-200 dark:text-slate-800"
                          strokeWidth="14"
                        />
                      ) : (
                        pieSlices.map((slice, i) => {
                          const circumference = 2 * Math.PI * 38;
                          const strokeDash = `${(slice.percent / 100) * circumference} ${circumference}`;
                          let previousOffset = 0;
                          for (let j = 0; j < i; j++) {
                            previousOffset += (pieSlices[j].percent / 100) * circumference;
                          }
                          return (
                            <circle
                              key={slice.name}
                              cx="50"
                              cy="50"
                              r="38"
                              fill="none"
                              stroke={slice.color}
                              strokeWidth="14"
                              strokeDasharray={strokeDash}
                              strokeDashoffset={-previousOffset}
                              className="transition-all duration-500 hover:opacity-80"
                            />
                          );
                        })
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-slate-900 dark:text-white">
                        {stats.totalStudents}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        Students
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend & Stats */}
                <div className="space-y-2.5">
                  {pieSlices.map((slice) => (
                    <div
                      key={slice.name}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 hover:bg-slate-100/70 dark:bg-slate-800/40 dark:hover:bg-slate-800/70 transition"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: slice.color }}
                        />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {slice.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {slice.value}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">
                          ({slice.percent}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Education Level Bar Plot */
              <div className="mt-6 space-y-3.5">
                {levelData.map((lvl, idx) => {
                  const percent = Math.round((lvl.value / (stats.totalStudents || 1)) * 100);
                  const barWidth = Math.max(Math.round((lvl.value / maxLevelVal) * 100), 4);
                  const colors = [
                    "bg-indigo-600",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-blue-500",
                    "bg-purple-500",
                  ];
                  return (
                    <div key={lvl.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300">{lvl.name}</span>
                        <span className="text-slate-900 dark:text-white">
                          {lvl.value} students <span className="text-slate-400 font-normal">({percent}%)</span>
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            colors[idx % colors.length]
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Filter detailed profiles by stream and college</span>
            <Link
              href="/admin/users"
              className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400 inline-flex items-center gap-1"
            >
              Open filterable roster <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: 7-Day Reading Trend Line Chart (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reading Trend (Last 7 Days)
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Daily Active Reads</span>
            </div>

            {/* Line/Bar Trend representation */}
            <div className="mt-6">
              <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-1 border-b border-slate-200 dark:border-slate-800">
                {trend.map((day) => {
                  const barHeight = Math.max(Math.round((day.count / maxTrend) * 100), 8);
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none transition whitespace-nowrap z-10">
                        {day.count} sessions
                      </div>
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-emerald-600 to-teal-400 transition-all duration-300 group-hover:from-emerald-500 group-hover:to-teal-300"
                        style={{ height: `${barHeight}%` }}
                      />
                      <span className="text-[10px] font-medium text-slate-400 rotate-0 truncate max-w-[42px] text-center">
                        {day.date.split(",")[0] || day.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {trend.reduce((a, b) => a + b.count, 0)}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">Total Week Reads</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {(trend.reduce((a, b) => a + b.count, 0) / (trend.length || 1)).toFixed(1)}
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">Daily Average</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Anti-piracy protected sessions</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">100% Watermarked</span>
          </div>
        </div>
      </div>

      {/* Live Recent View Stream & Quick Navigation Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Student Reading Feed (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Student Activity Feed
              </h2>
            </div>
            <Link
              href="/admin/notifications"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              All Notifications &rarr;
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
            {(!data?.recentActivity || data.recentActivity.length === 0) ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No reading events logged yet.
              </div>
            ) : (
              data.recentActivity.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                      {(act.profiles?.full_name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {act.profiles?.full_name || "Student"}{" "}
                        <span className="text-slate-400 font-normal">
                          ({act.profiles?.roll_number || "No roll"})
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Reading: {act.documents?.title || "Document"} (p. {act.page})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap pl-2">
                    {formatDate(act.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Admin Actions & Center Shortcuts (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Instructor Control Center
            </h2>

            <div className="grid grid-cols-1 gap-2.5">
              <Link
                href="/admin/users"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 dark:border-slate-800 dark:hover:bg-indigo-950/20 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      Students Excel Sheet
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Filter by college, stream, year & block/delete students
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/admin/requests"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-purple-400 hover:bg-purple-50/40 dark:border-slate-800 dark:hover:bg-purple-950/20 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
                    <Inbox className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                        Access & Unblock Requests
                      </h3>
                      {stats.pendingRequests > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-purple-600 text-white">
                          {stats.pendingRequests}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Review blocked students requesting canvas access
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/admin/notifications"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/40 dark:border-slate-800 dark:hover:bg-amber-950/20 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      Notification Broadcast
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Send exam announcements or alerts to all students
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>

              <Link
                href="/admin/upload"
                className="flex items-center justify-between p-3 rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/40 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Upload Center
                      </h3>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-600">
                        Upcoming
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Direct manual PDF and lecture note uploader
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
