import { NextRequest, NextResponse } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/home";

  // Resolve true production URL dynamically to prevent localhost:3000 redirects on Netlify/production
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const netlifyUrl = process.env.URL;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (forwardedHost ? `${forwardedProto}://${forwardedHost}` : netlifyUrl || origin);

  const supabase = await createClient();

  // 1. Verify token_hash if provided by Supabase email link (magic link, recovery, invite)
  if (token_hash && type) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });
    if (!otpError) {
      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  // 2. Exchange PKCE authorization code for session
  if (code) {
    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!codeError) {
      return NextResponse.redirect(`${appUrl}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`);
}
