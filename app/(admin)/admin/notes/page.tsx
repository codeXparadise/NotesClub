"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  FolderPlus,
  Sparkles,
  Shield,
  Eye,
  CheckCircle2,
  X,
  Search,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminNotesPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal / Form state for Add or Edit Note
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [driveFileId, setDriveFileId] = useState("");
  const [pageCount, setPageCount] = useState("1");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Category Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleSyncDrive = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/sync/drive", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncStatus({
          type: "success",
          message: `Sync successful! ${data.syncedCategories} categories and ${data.syncedDocuments} books updated from Google Drive.`,
        });
        await fetchData();
      } else {
        setSyncStatus({
          type: "error",
          message: data.error || "Failed to sync with Google Drive.",
        });
      }
    } catch (err: any) {
      setSyncStatus({
        type: "error",
        message: err.message || "Network error while syncing.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [docRes, catRes, courseRes] = await Promise.all([
        fetch("/api/documents"),
        fetch("/api/categories"),
        fetch("/api/courses"),
      ]);
      const [docData, catData, courseData] = await Promise.all([
        docRes.json(),
        catRes.json(),
        courseRes.json(),
      ]);

      setDocuments(docData.documents || []);
      setCategories(catData.categories || []);
      setCourses(courseData.courses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddNoteModal = () => {
    setEditingDoc(null);
    setTitle("");
    setDescription("");
    setCategoryId(categories[0]?.id || "");
    setCourseId("");
    setDriveFileId("");
    setPageCount("20");
    setIsPublished(true);
    setIsFeatured(false);
    setShowWatermark(true);
    setIsNoteModalOpen(true);
  };

  const openEditNoteModal = (doc: any) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setDescription(doc.description || "");
    setCategoryId(doc.category_id || categories[0]?.id || "");
    setCourseId(doc.course_id || "");
    setDriveFileId(doc.drive_file_id || "");
    setPageCount(String(doc.page_count || 1));
    setIsPublished(doc.is_published ?? true);
    setIsFeatured(doc.is_featured ?? false);
    setShowWatermark(doc.show_watermark ?? true);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: any = {
        title,
        description,
        categoryId: categoryId || null,
        courseId: courseId || null,
        isPublished,
        isFeatured,
        showWatermark,
        pageCount: parseInt(pageCount, 10) || 1,
      };

      if (editingDoc) {
        payload.id = editingDoc.id;
      } else {
        payload.driveFileId = driveFileId || `drive_file_${Date.now()}`;
      }

      const res = await fetch("/api/admin/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsNoteModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCategoryName("");
        setIsCategoryModalOpen(false);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Content & Study Materials
          </h1>
          <p className="text-xs text-slate-500">
            Publish notes, attach Drive files, configure watermarking, and manage categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncDrive}
            disabled={isSyncing}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin text-indigo-600" : ""}`} />
            <span>{isSyncing ? "Syncing Drive..." : "Sync Google Drive"}</span>
          </button>

          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition"
          >
            <FolderPlus className="h-4 w-4 text-indigo-500" />
            <span>New Category</span>
          </button>

          <Button onClick={openAddNoteModal} size="sm" className="rounded-xl">
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Add Study Note</span>
          </Button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          className={`flex items-start space-x-2.5 rounded-2xl p-3.5 text-xs ${
            syncStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
          }`}
        >
          {syncStatus.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          )}
          <div className="flex-1">
            <span>{syncStatus.message}</span>
          </div>
          <button
            onClick={() => setSyncStatus(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter notes by title or keywords..."
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
      </div>

      {/* Documents Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading notes catalog...
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No documents found. Click "Add Study Note" or sync with Google Drive.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px] dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Document</th>
                  <th className="px-5 py-3.5 font-bold">Category</th>
                  <th className="px-5 py-3.5 font-bold">Pages</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Watermark</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {doc.title}
                      </div>
                      {doc.is_featured && (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-600 mt-0.5">
                          <Sparkles className="mr-1 h-3 w-3" /> Featured on Home
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {doc.categories?.name || "General"}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-400">
                      {doc.page_count || 1}
                    </td>
                    <td className="px-5 py-4">
                      {doc.is_published ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        <Shield className="mr-1 h-3 w-3" /> Enabled
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditNoteModal(doc)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:text-slate-400 transition"
                        title="Edit Note"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingDoc ? "Edit Study Material" : "Add Study Material"}
              </h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Title
                </label>
                <Input
                  required
                  placeholder="e.g. DSA: Binary Trees & Graphs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Description / Topic Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of chapters covered..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Est. Page Count
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Published (Visible to granted students)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Feature on Student Home screen</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWatermark}
                    onChange={(e) => setShowWatermark(e.target.checked)}
                    className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Enforce Per-Student Watermark overlay</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNoteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSaving}>
                  Save Material
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Create New Category
            </h3>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <Input
                required
                placeholder="e.g. Distributed Systems"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
