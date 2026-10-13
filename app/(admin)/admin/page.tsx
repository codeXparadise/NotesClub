"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  Eye,
  Share2,
  FolderSync,
  PlusCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDocuments: 0,
    totalViews: 0,
    activeGrants: 0,
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
        setActivity(data.recentActivity || []);
      }
    } catch (e) {
      console.error(e);
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
      const data = await res.json();
      if (data.success) {
        setSyncStatus(
          `Sync completed! Found ${data.syncedCategories} categories, ${data.syncedDocuments} documents, sent ${data.newNotifications} notifications.`
        );
        fetchDashboardData();
      } else {
        setSyncStatus(`Sync error: ${data.error || "Check Drive credentials."}`);
      }
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Teacher Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor student reading activity, study material catalog, and Google Drive sync.
          </p>
        </div>

        {/* Sync Drive Action */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSyncDrive}
            disabled={isSyncing}
            className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50"
          >
            <FolderSync className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing Drive..." : "Sync Drive Notes"}</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          className={`flex items-center space-x-2 rounded-2xl p-4 text-xs font-medium ${
            syncStatus.includes("error")
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
          }`}
        >
          {syncStatus.includes("error") ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Key Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Students</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.totalStudents}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Catalog Notes</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.totalDocuments}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Reading Views</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.totalViews}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Active Grants</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.activeGrants}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/notes"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4.5 hover:border-indigo-300 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Manage Notes
              </h4>
              <p className="text-[11px] text-slate-500">Add, rename, feature notes</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition" />
        </Link>

        <Link
          href="/admin/sharing"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4.5 hover:border-indigo-300 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Grant Access
              </h4>
              <p className="text-[11px] text-slate-500">Share with courses & students</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 transition" />
        </Link>

        <Link
          href="/admin/users"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4.5 hover:border-indigo-300 hover:shadow-md transition dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Students Roster
              </h4>
              <p className="text-[11px] text-slate-500">Inspect history, block/unblock</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition" />
        </Link>
      </div>

      {/* Live Reading Activity Feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
            <Clock className="h-4 w-4 text-indigo-600" />
            <span>Recent Reading Activity (Audit Trail)</span>
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          {activity.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No student reading activity logged yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold uppercase dark:bg-slate-800 dark:text-slate-300">
                      {item.profiles?.full_name?.charAt(0) || "S"}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.profiles?.full_name || "Student"}
                        <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                          ({item.profiles?.roll_number || "No Roll"})
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Read:{" "}
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          {item.documents?.title || "Note"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      Page {item.page}
                    </span>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
