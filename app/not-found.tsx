import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-4">
        <BookOpen className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
        Page Not Found
      </h2>
      <p className="mt-1 text-xs text-slate-500 max-w-xs">
        The study note or portal page you are looking for does not exist or has been moved.
      </p>
      <Link href="/home" className="mt-5">
        <Button size="sm">Return to Home</Button>
      </Link>
    </div>
  );
}
