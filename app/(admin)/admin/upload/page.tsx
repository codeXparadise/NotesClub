"use client";

import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Sparkles,
  ShieldCheck,
  FolderSync,
  Clock,
  ArrowRight,
  Layers,
  BookOpen,
} from "lucide-react";

export default function AdminUploadPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          <Sparkles className="h-3.5 w-3.5" /> Upcoming Feature
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Direct Note Upload Center
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Currently, notes are automatically ingested and synced via your Google Drive root folder. A dedicated direct upload pipeline is currently in development.
        </p>
      </div>

      {/* Feature Preview Card */}
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 sm:p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/60 backdrop-blur">
        <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4 shadow-inner">
          <UploadCloud className="h-8 w-8" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Drag & Drop Document Ingestion Engine
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
          You will soon be able to directly drop PDFs, lecture slides, and handwritten notes here to instantly generate anti-piracy watermarks and stream them to students.
        </p>

        {/* Feature Highlights Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="h-5 w-5 text-emerald-500 mb-2" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Instant Watermarking
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Automatic student roll number and IP stamping on every single rendered page.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <Layers className="h-5 w-5 text-indigo-500 mb-2" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Smart Categorization
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Auto-assign notes to Science, Commerce, Arts, or specific college semesters.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <FolderSync className="h-5 w-5 text-amber-500 mb-2" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              Drive Mirroring
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Uploaded files automatically back up into your linked Google Drive folder.
            </p>
          </div>
        </div>

        {/* Current Alternative Action */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
          <span className="text-xs text-slate-500">In the meantime, sync your notes from Drive:</span>
          <Link
            href="/admin"
            className="inline-flex items-center space-x-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
          >
            <FolderSync className="h-3.5 w-3.5" />
            <span>Go to Drive Sync Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
