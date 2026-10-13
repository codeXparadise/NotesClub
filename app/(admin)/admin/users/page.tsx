"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Search,
  Ban,
  CheckCircle,
  Trash2,
  GraduationCap,
  BookOpen,
  Filter,
  ShieldAlert,
  Download,
  X,
  Clock,
  Heart,
  Eye,
  Calendar,
  Building,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  full_name: string;
  roll_number: string;
  email: string;
  role: string;
  is_blocked: boolean;
  college_name?: string;
  education_level?: string;
  stream?: string;
  course_name?: string;
  year_or_class?: string;
  created_at: string;
  last_active_at?: string;
  last_login_at?: string;
  courses?: { id: string; name: string; code: string };
}

interface UserDossier {
  student: Student;
  readingHistory: any[];
  wishlist: any[];
  searches: any[];
}

export default function AdminUsersPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [streamFilter, setStreamFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [collegeQuery, setCollegeQuery] = useState("");

  // Dossier state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [dossier, setDossier] = useState<UserDossier | null>(null);
  const [isDossierLoading, setIsDossierLoading] = useState(false);
  const [dossierTab, setDossierTab] = useState<"info" | "reading" | "wishlist" | "searches">("info");

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (streamFilter !== "all") params.set("stream", streamFilter);
      if (levelFilter !== "all") params.set("educationLevel", levelFilter);
      if (collegeQuery.trim()) params.set("college", collegeQuery.trim());
      if (statusFilter !== "all") params.set("status", statusFilter);

      const [usersRes, coursesRes] = await Promise.all([
        fetch(`/api/admin/users?${params.toString()}`),
        fetch("/api/courses"),
      ]);

      const [usersData, coursesData] = await Promise.all([
        usersRes.json(),
        coursesRes.json(),
      ]);

      setStudents(usersData.students || []);
      setCourses(coursesData.courses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, streamFilter, levelFilter, collegeQuery, statusFilter]);

  // Load single student dossier
  const handleOpenDossier = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsDossierLoading(true);
    setDossierTab("info");
    try {
      const res = await fetch(`/api/admin/users/${studentId}`);
      const data = await res.json();
      if (data.student) {
        setDossier(data);
      }
    } catch (e) {
      console.error("Failed to load user dossier:", e);
    } finally {
      setIsDossierLoading(false);
    }
  };

  const handleToggleBlock = async (studentId: string, currentBlocked: boolean) => {
    const action = currentBlocked ? "unblock" : "block";
    if (
      !confirm(
        `Are you sure you want to ${action} this student? ${
          action === "block"
            ? "They will immediately be blocked from accessing the canvas."
            : "They will regain canvas access."
        }`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/users/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) =>
          prev.map((s) => (s.id === studentId ? { ...s, is_blocked: !currentBlocked } : s))
        );
        if (dossier && dossier.student.id === studentId) {
          setDossier((prev) =>
            prev ? { ...prev, student: { ...prev.student, is_blocked: !currentBlocked } } : null
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (studentId: string) => {
    if (
      !confirm(
        "PERMANENT DELETE: Are you sure? This will delete all user data, including reading history, wishlist, access logs, and their profile account."
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/users/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
        if (selectedStudentId === studentId) {
          setSelectedStudentId(null);
          setDossier(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export current table view as CSV (Excel compatible)
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("No student records to export.");
      return;
    }

    const headers = [
      "Student Name",
      "Roll Number",
      "Email",
      "College / Institution",
      "Class / Level",
      "Stream",
      "Course",
      "Year / Class",
      "Status",
      "Account Created",
      "Last Active",
      "Last Login",
    ];

    const rows = students.map((s) => [
      `"${(s.full_name || "").replace(/"/g, '""')}"`,
      `"${(s.roll_number || "").replace(/"/g, '""')}"`,
      `"${(s.email || "").replace(/"/g, '""')}"`,
      `"${(s.college_name || "").replace(/"/g, '""')}"`,
      `"${(s.education_level || "").replace(/"/g, '""')}"`,
      `"${(s.stream || "").replace(/"/g, '""')}"`,
      `"${(s.course_name || s.courses?.name || "").replace(/"/g, '""')}"`,
      `"${(s.year_or_class || "").replace(/"/g, '""')}"`,
      s.is_blocked ? "Blocked" : "Active",
      s.created_at ? new Date(s.created_at).toISOString() : "",
      s.last_active_at ? new Date(s.last_active_at).toISOString() : "",
      s.last_login_at ? new Date(s.last_login_at).toISOString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `NotesClub_Students_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Students Roster
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {students.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Spreadsheet-style student directory. Click any row to inspect complete reading dossier, search logs & access controls.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchUsers}
            title="Refresh Table"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Query */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, roll, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* College Filter */}
          <div className="relative">
            <Building className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by college..."
              value={collegeQuery}
              onChange={(e) => setCollegeQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Academic Stream */}
          <div>
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Streams</option>
              <option value="Science">Science (PCM/PCB)</option>
              <option value="Commerce">Commerce</option>
              <option value="Arts">Arts / Humanities</option>
              <option value="Engineering">Engineering / Tech</option>
              <option value="Medical">Medical / Pharmacy</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Education Level */}
          <div>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Class Levels</option>
              <option value="school">School (1st - 10th)</option>
              <option value="junior">Junior College (11th & 12th)</option>
              <option value="undergraduate">Undergraduate (UG)</option>
              <option value="postgraduate">Postgraduate (PG)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="blocked">Blocked Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            {/* Table Header like Excel Sheet */}
            <thead className="bg-slate-100/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4 w-12 text-center border-r border-slate-200 dark:border-slate-800">#</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">Student Profile</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">Roll No</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">College / School</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">Class & Stream</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">Account Created</th>
                <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading students dataset...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                students.map((student, index) => {
                  const isBlocked = student.is_blocked;
                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleOpenDossier(student.id)}
                      className={`cursor-pointer transition hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 ${
                        index % 2 === 1 ? "bg-slate-50/40 dark:bg-slate-900/40" : ""
                      } ${selectedStudentId === student.id ? "bg-indigo-50 dark:bg-indigo-950/40 ring-1 ring-inset ring-indigo-500" : ""}`}
                    >
                      {/* Row Index */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px] border-r border-slate-200/60 dark:border-slate-800/60">
                        {index + 1}
                      </td>

                      {/* Student Profile */}
                      <td className="py-3 px-4 border-r border-slate-200/60 dark:border-slate-800/60">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {(student.full_name || "S").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {student.full_name || "Unnamed"}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {student.email || "No email"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Roll No */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-800 dark:text-slate-200 border-r border-slate-200/60 dark:border-slate-800/60">
                        {student.roll_number || "—"}
                      </td>

                      {/* College */}
                      <td className="py-3 px-4 max-w-[200px] truncate text-slate-700 dark:text-slate-300 border-r border-slate-200/60 dark:border-slate-800/60" title={student.college_name || "Not specified"}>
                        {student.college_name || "Not specified"}
                      </td>

                      {/* Stream & Level */}
                      <td className="py-3 px-4 border-r border-slate-200/60 dark:border-slate-800/60">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {student.stream || student.education_level || "General"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {student.year_or_class || student.course_name || student.courses?.name || "Standard"}
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap border-r border-slate-200/60 dark:border-slate-800/60">
                        {formatDate(student.created_at)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 border-r border-slate-200/60 dark:border-slate-800/60">
                        {isBlocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            <ShieldAlert className="h-3 w-3" /> Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td
                        className="py-3 px-4 text-right space-x-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleToggleBlock(student.id, isBlocked)}
                          title={isBlocked ? "Unblock Student" : "Block Canvas Access"}
                          className={`p-1.5 rounded-lg border transition ${
                            isBlocked
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950"
                              : "border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950"
                          }`}
                        >
                          {isBlocked ? <CheckCircle className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteUser(student.id)}
                          title="Permanently Delete Student"
                          className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Dossier Drawer (Slides in on row click) */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            {/* Dossier Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-600/25">
                  {(dossier?.student.full_name || "S").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {dossier?.student.full_name || "Student Profile"}
                    </h2>
                    {dossier?.student.is_blocked ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                        Blocked
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Roll No: {dossier?.student.roll_number || "—"} • {dossier?.student.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedStudentId(null);
                    setDossier(null);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Dossier Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-2 bg-white dark:bg-slate-900">
              <button
                onClick={() => setDossierTab("info")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
                  dossierTab === "info"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Academic Dossier
              </button>
              <button
                onClick={() => setDossierTab("reading")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
                  dossierTab === "reading"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Reading History ({dossier?.readingHistory.length || 0})
              </button>
              <button
                onClick={() => setDossierTab("wishlist")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
                  dossierTab === "wishlist"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Wishlist ({dossier?.wishlist.length || 0})
              </button>
              <button
                onClick={() => setDossierTab("searches")}
                className={`py-3 px-3 text-xs font-semibold border-b-2 transition ${
                  dossierTab === "searches"
                    ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400"
                }`}
              >
                Search Queries ({dossier?.searches.length || 0})
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isDossierLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-500" />
                  Loading student dossier...
                </div>
              ) : !dossier ? (
                <div className="py-10 text-center text-slate-400">Profile data not found.</div>
              ) : (
                <>
                  {/* TAB 1: ACADEMIC & ACCOUNT DETAILS */}
                  {dossierTab === "info" && (
                    <div className="space-y-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Academic Profile
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">College / Institute</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {dossier.student.college_name || "Not registered"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Class Level</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {dossier.student.education_level || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Academic Stream</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {dossier.student.stream || "General"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Year / Standard</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {dossier.student.year_or_class || dossier.student.course_name || "—"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                          Timeline & Activity
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Account Created</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {formatDate(dossier.student.created_at)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Last Login</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {dossier.student.last_login_at
                                ? formatDate(dossier.student.last_login_at)
                                : "Never recorded"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Last Active Reading</span>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {dossier.student.last_active_at
                                ? formatDate(dossier.student.last_active_at)
                                : "Never recorded"}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">User ID</span>
                            <span className="font-mono text-[10px] text-slate-500 truncate block">
                              {dossier.student.id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Administrative Access Controls */}
                      <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                          Administrative Controls
                        </h3>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleToggleBlock(dossier.student.id, dossier.student.is_blocked)
                            }
                            className={`flex-1 inline-flex items-center justify-center space-x-2 rounded-xl py-2.5 text-xs font-semibold transition ${
                              dossier.student.is_blocked
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-amber-600 text-white hover:bg-amber-700"
                            }`}
                          >
                            {dossier.student.is_blocked ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span>Unblock Student Access</span>
                              </>
                            ) : (
                              <>
                                <Ban className="h-4 w-4" />
                                <span>Block Canvas Access</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(dossier.student.id)}
                            className="inline-flex items-center justify-center space-x-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-rose-700 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete All Data</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {dossier.student.is_blocked
                            ? "Student cannot access document reader. They see 'Admin has blocked access, request now'."
                            : "Student can view all study materials assigned to their course."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: READING HISTORY */}
                  {dossierTab === "reading" && (
                    <div className="space-y-3">
                      {dossier.readingHistory.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                          Student has not opened any study documents yet.
                        </div>
                      ) : (
                        dossier.readingHistory.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <BookOpen className="h-5 w-5 text-indigo-500 shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {item.documents?.title || "Untitled Document"}
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  Last page read: {item.last_page} / {item.total_pages || item.documents?.page_count || "?"} ({item.percent || 0}%)
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap pl-2">
                              {formatDate(item.updated_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 3: WISHLIST / FAVORITES */}
                  {dossierTab === "wishlist" && (
                    <div className="space-y-3">
                      {dossier.wishlist.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                          Student has not favorited any study notes yet.
                        </div>
                      ) : (
                        dossier.wishlist.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <Heart className="h-5 w-5 text-rose-500 fill-rose-500 shrink-0" />
                              <div className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                                  {item.documents?.title || "Study Note"}
                                </h4>
                                <p className="text-[11px] text-slate-400">
                                  {item.documents?.page_count ? `${item.documents.page_count} pages` : "Document"}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap pl-2">
                              Added {formatDate(item.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 4: SEARCH QUERIES */}
                  {dossierTab === "searches" && (
                    <div className="space-y-2">
                      {dossier.searches.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                          No search activity recorded for this student.
                        </div>
                      ) : (
                        dossier.searches.map((s, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-800/30 text-xs"
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                &quot;{s.query}&quot;
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap pl-2">
                              {formatDate(s.created_at)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
