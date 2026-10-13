"use client";

import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function AdminUsersPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedCourse !== "all") params.set("courseId", selectedCourse);
      if (search.trim()) params.set("q", search.trim());

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
  }, [selectedCourse, search]);

  const handleToggleBlock = async (studentId: string, currentBlocked: boolean) => {
    const action = currentBlocked ? "unblock" : "block";
    if (
      !confirm(
        `Are you sure you want to ${action} this student? ${
          action === "block" ? "They will lose access to reading immediately." : ""
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
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (studentId: string) => {
    if (!confirm("Delete this student profile and revoke all permissions?")) return;

    try {
      const res = await fetch(`/api/admin/users/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      });
      const data = await res.json();
      if (data.success) {
        setStudents((prev) => prev.filter((s) => s.id !== studentId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Enrolled Students Roster
        </h1>
        <p className="text-xs text-slate-500">
          Manage enrolled students, monitor note reading progress, and instantly block or unblock accounts.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, roll number, or email..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        </div>

        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        >
          <option value="all">All Departments & Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading student roster...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No students found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px] dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Student</th>
                  <th className="px-5 py-3.5 font-bold">Roll Number</th>
                  <th className="px-5 py-3.5 font-bold">Course</th>
                  <th className="px-5 py-3.5 font-bold">Books Started</th>
                  <th className="px-5 py-3.5 font-bold">Status</th>
                  <th className="px-5 py-3.5 font-bold">Joined</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {student.full_name}
                      </div>
                      <div className="text-[11px] text-slate-400">{student.email}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {student.roll_number || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                      {student.courses?.code || "Unassigned"}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center space-x-1 font-semibold text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{student.booksReadCount || 0}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {student.is_blocked ? (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                          <Ban className="h-3 w-3" />
                          <span>Blocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(student.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleToggleBlock(student.id, student.is_blocked)}
                        className={`rounded-lg p-1.5 transition ${
                          student.is_blocked
                            ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        }`}
                        title={student.is_blocked ? "Unblock Student" : "Block Student"}
                      >
                        <Ban className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteUser(student.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Student"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
