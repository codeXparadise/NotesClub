"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?mode=register");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
    </div>
  );
}
