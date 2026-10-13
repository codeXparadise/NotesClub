"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Search,
  BookOpen,
  PieChart,
  Lightbulb,
} from "lucide-react";

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>({
    viewsByCategory: [],
    readsPerDay: [],
    mostReadBooks: [],
    avgCompletion: 0,
    zeroSearches: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/admin/analytics");
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="space-y-2">
          <div className="h-7 w-80 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 animate-pulse space-y-3"
            >
              <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          <div className="h-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Reading Analytics & Content Gap Finder
        </h1>
        <p className="text-xs text-slate-500">
          Understand which topics students read most and identify missing study materials from zero-result search queries.
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Average Reading Completion</p>
          <div className="mt-2 flex items-baseline space-x-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.avgCompletion}%
            </h2>
            <span className="text-xs text-emerald-600 font-semibold">Active cohorts</span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${Math.min(100, data.avgCompletion)}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Top Read Category</p>
          <div className="mt-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
              {data.viewsByCategory[0]?.name || "Data Structures"}
            </h2>
            <p className="text-xs text-indigo-600 font-semibold mt-1">
              {data.viewsByCategory[0]?.views || 0} page views recorded
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs text-slate-500">Unanswered Search Gaps</p>
          <div className="mt-2 flex items-baseline space-x-2">
            <h2 className="text-2xl font-bold text-amber-600">
              {data.zeroSearches?.length || 0}
            </h2>
            <span className="text-xs text-slate-400">queries yielded 0 books</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            See table below for requested topics
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Views by Category */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Views by Category (Most-Viewed First)
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.viewsByCategory}
                margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="views" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart: Daily Reading Activity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Reads Per Day
            </h3>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.readsPerDay}
                margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#f8fafc",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Leaderboard + Zero Results Finder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Read Notes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Top Most-Read Study Notes
            </h3>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.mostReadBooks.map((b: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                    {b.title}
                  </span>
                </div>
                <span className="font-mono text-slate-500 font-medium">
                  {b.views} reads
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Zero Results Finder (Content Gap) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Zero-Result Searches (Content-Gap Finder)
            </h3>
          </div>

          <p className="text-[11px] text-slate-500">
            Topics and keywords students searched for that returned 0 results. Use this to know which notes to upload next.
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.zeroSearches.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                No zero-result searches recorded yet.
              </div>
            ) : (
              data.zeroSearches.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between py-2.5 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Search className="h-3.5 w-3.5 text-amber-500" />
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      "{s.query}"
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {s.profiles?.full_name || "Student search"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
