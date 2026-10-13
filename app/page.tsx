import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function IndexPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "teacher") {
    redirect("/admin");
  }

  redirect("/home");
}
