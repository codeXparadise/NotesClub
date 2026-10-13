"use client";

import Link from "next/link";
import { ShieldAlert, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-center">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-rose-200 bg-white p-8 shadow-xl dark:border-rose-950/60 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50">
          <ShieldAlert className="h-9 w-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Account Access Suspended
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Your Notes Club student account has been temporarily restricted by the instructor or administrator.
          </p>
        </div>
        <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
          If you believe this is an error or need your reading access restored, please reach out directly to your course teacher or department coordinator.
        </p>
        <Link href="/login" className="block w-full">
          <Button variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}
