"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, BookOpen, Send, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BlockedPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError("Please provide your name and email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          reason: reason.trim() || "Student requested access restoration.",
          type: "unblock",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request.");
      }

      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-center font-sans">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-rose-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-rose-950/60 dark:bg-slate-900 text-left">
        {/* Header Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 shadow-inner">
          <ShieldAlert className="h-9 w-9" />
        </div>

        <div className="space-y-1.5 text-center">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Admin has blocked access
          </h1>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
            Your reading portal and canvas access is currently suspended.
          </p>
        </div>

        {isSubmitted ? (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-5 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Request Sent Successfully!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Your unblock request has been transmitted to the instructor. You will regain access once approved.
              </p>
            </div>
            <Link href="/login" className="inline-block pt-2">
              <Button variant="outline" size="sm" className="text-xs rounded-xl">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Return to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-slate-700">
              To regain reading access to teacher notes, submit an unblock request below:
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Full Name
              </label>
              <Input
                type="text"
                placeholder="Student Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Registered Email
              </label>
              <Input
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message / Reason
              </label>
              <textarea
                placeholder="Explain why you need access restored..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-md active:scale-95 transition"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center justify-center space-x-1.5">
                  <Send className="h-3.5 w-3.5" />
                  <span>Request Now</span>
                </span>
              )}
            </Button>

            <Link href="/login" className="block text-center pt-2">
              <span className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline">
                Sign in with another account
              </span>
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
