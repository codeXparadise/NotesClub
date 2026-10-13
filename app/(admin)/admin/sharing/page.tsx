"use client";

import React, { useEffect, useState } from "react";
import {
  Share2,
  Plus,
  Trash2,
  GraduationCap,
  User,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default function AdminSharingPage() {
  const [grants, setGrants] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New grant modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<"course" | "student">("course");
  const [selectedDocId, setSelectedDocId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSharingData = async () => {
    try {
      setIsLoading(true);
      const [grantsRes, docsRes, coursesRes, usersRes] = await Promise.all([
        fetch("/api/admin/grants"),
        fetch("/api/documents"),
        fetch("/api/courses"),
        fetch("/api/admin/users"),
      ]);

      const [grantsData, docsData, coursesData, usersData] = await Promise.all([
        grantsRes.json(),
        docsRes.json(),
        coursesRes.json(),
        usersRes.json(),
      ]);

      setGrants(grantsData.grants || []);
      setDocuments(docsData.documents || []);
      setCourses(coursesData.courses || []);
      setStudents(usersData.students || []);

      if (docsData.documents?.length > 0) {
        setSelectedDocId(docsData.documents[0].id);
      }
      if (coursesData.courses?.length > 0) {
        setSelectedCourseId(coursesData.courses[0].id);
      }
      if (usersData.students?.length > 0) {
        setSelectedStudentId(usersData.students[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSharingData();
  }, []);

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        documentId: selectedDocId,
        action: "grant",
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      if (targetType === "course") {
        payload.courseId = selectedCourseId;
      } else {
        payload.studentId = selectedStudentId;
      }

      const res = await fetch("/api/admin/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchSharingData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeGrant = async (grantId: string) => {
    if (!confirm("Are you sure you want to revoke this access grant?")) return;

    try {
      await fetch("/api/admin/grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", grantId }),
      });
      setGrants((prev) => prev.filter((g) => g.id !== grantId));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Sharing & Access Grants
          </h1>
          <p className="text-xs text-slate-500">
            Control which batches and individual students can access study notes in their catalog.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} size="sm" className="rounded-xl">
          <Plus className="mr-1.5 h-4 w-4" />
          <span>New Access Grant</span>
        </Button>
      </div>

      {/* Grants Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
            Loading permissions...
          </div>
        ) : grants.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No custom access grants yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[10px] dark:border-slate-800 dark:bg-slate-800/40">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Document</th>
                  <th className="px-5 py-3.5 font-bold">Granted To</th>
                  <th className="px-5 py-3.5 font-bold">Scope</th>
                  <th className="px-5 py-3.5 font-bold">Expires</th>
                  <th className="px-5 py-3.5 font-bold">Granted On</th>
                  <th className="px-5 py-3.5 font-bold text-right">Revoke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {grants.map((grant) => (
                  <tr key={grant.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                      {grant.documents?.title || "All Department Notes"}
                    </td>
                    <td className="px-5 py-4">
                      {grant.course_id ? (
                        <div className="flex items-center space-x-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                          <GraduationCap className="h-4 w-4" />
                          <span>{grant.courses?.name || grant.courses?.code || "Course Batch"}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <User className="h-4 w-4" />
                          <span>
                            {grant.profiles?.full_name} ({grant.profiles?.roll_number})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {grant.course_id ? "Batch Grant" : "Individual Student"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {grant.expires_at ? formatDate(grant.expires_at) : "Permanent"}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(grant.created_at)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleRevokeGrant(grant.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Revoke Grant"
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

      {/* Grant Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Access Grant
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGrant} className="space-y-4">
              {/* Document selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Study Material
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Type Switcher */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Grant Access To
                </label>
                <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                  <button
                    type="button"
                    onClick={() => setTargetType("course")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      targetType === "course"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Entire Course Batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType("student")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                      targetType === "student"
                        ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    Specific Student
                  </button>
                </div>
              </div>

              {targetType === "course" ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Course Batch
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Student
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name} ({s.roll_number || s.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Optional Expiration */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Optional Expiry Date (Leave empty for permanent)
                </label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Grant Access
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
