"use client";

import React, { useEffect, useState } from "react";
import {
  Inbox,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Building,
  User,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AccessRequest {
  id: string;
  student_id?: string;
  email: string;
  full_name: string;
  roll_number?: string;
  college_name?: string;
  type: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  created_at: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, status: action === "approve" ? "approved" : "rejected" } : r
          )
        );
      } else {
        alert(data.error || "Action failed");
      }
    } catch (e: any) {
      alert(e.message || "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.roll_number?.toLowerCase().includes(q) ||
      r.college_name?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const rejectedCount = requests.filter((r) => r.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Student Access Requests
            </h1>
            {pendingCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 animate-pulse">
                {pendingCount} Pending
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review and resolve student canvas access and unblock requests. Approving automatically restores their reading access.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          title="Refresh"
          className="inline-flex items-center space-x-1.5 p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Quick Summary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("all")}
          className={`p-3 rounded-2xl border text-left transition ${
            statusFilter === "all"
              ? "border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-xs text-slate-500 block">Total Requests</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">{requests.length}</span>
        </button>

        <button
          onClick={() => setStatusFilter("pending")}
          className={`p-3 rounded-2xl border text-left transition ${
            statusFilter === "pending"
              ? "border-purple-600 bg-purple-50/50 dark:border-purple-500 dark:bg-purple-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-xs text-purple-600 dark:text-purple-400 block font-semibold">
            Pending Action
          </span>
          <span className="text-xl font-bold text-purple-700 dark:text-purple-300">
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("approved")}
          className={`p-3 rounded-2xl border text-left transition ${
            statusFilter === "approved"
              ? "border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">
            Approved & Granted
          </span>
          <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter("rejected")}
          className={`p-3 rounded-2xl border text-left transition ${
            statusFilter === "rejected"
              ? "border-rose-600 bg-rose-50/50 dark:border-rose-500 dark:bg-rose-950/20"
              : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          }`}
        >
          <span className="text-xs text-rose-600 dark:text-rose-400 block font-semibold">
            Rejected
          </span>
          <span className="text-xl font-bold text-rose-700 dark:text-rose-300">
            {rejectedCount}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search request by student name, roll number, college or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-500" />
            Loading student requests...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-900">
            <Inbox className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            No access requests found in this view.
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isPending = req.status === "pending";
            const isApproved = req.status === "approved";
            const isRejected = req.status === "rejected";
            const isBusy = actionLoadingId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Student & Request Details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {req.full_name || "Student"}
                      </h3>
                      {req.roll_number && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {req.roll_number}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">({req.email})</span>

                      {/* Status Badge */}
                      {isPending && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                          Pending Review
                        </span>
                      )}
                      {isApproved && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Approved
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                          Rejected
                        </span>
                      )}
                    </div>

                    {req.college_name && (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                        <Building className="h-3.5 w-3.5 text-slate-400" />
                        <span>{req.college_name}</span>
                      </div>
                    )}

                    {/* Reason Message */}
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-800 dark:bg-slate-800/40 dark:text-slate-200 border border-slate-100 dark:border-slate-800">
                      <span className="font-semibold text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                        Student Message / Request Reason:
                      </span>
                      &ldquo;{req.reason || "No reason specified"}&rdquo;
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>Submitted on {formatDate(req.created_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleAction(req.id, "approve")}
                          disabled={isBusy}
                          className="inline-flex items-center space-x-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve & Unblock</span>
                        </button>

                        <button
                          onClick={() => handleAction(req.id, "reject")}
                          disabled={isBusy}
                          className="inline-flex items-center space-x-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-rose-950/30 active:scale-95 transition disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleAction(req.id, isApproved ? "reject" : "approve")}
                        disabled={isBusy}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline"
                      >
                        {isApproved ? "Revoke Approval" : "Re-approve"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
