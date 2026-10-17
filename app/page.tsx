import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LiveTicker } from "@/components/marketing/LiveTicker";
import { InteractiveWindowsMockup } from "@/components/marketing/InteractiveWindowsMockup";
import { InteractiveFeaturesMatrix } from "@/components/marketing/InteractiveFeaturesMatrix";
import {
  BookOpen,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Bookmark,
  CheckCircle2,
  GraduationCap,
  Layers,
  Award,
  ChevronRight,
  Code2,
  Lock,
  Clock,
  Sparkles,
  Smartphone,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await getCurrentProfile();
  const isLoggedIn = !!profile;
  const isTeacher = profile?.role === "teacher";

  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#151412] text-[#26261F] dark:text-[#F5F2EA] flex flex-col font-sans selection:bg-[#B0542E] selection:text-white">
      {/* SaaS Navigation */}
      <MarketingNavbar />

      {/* HERO SECTION - 70% VISUAL TYPOGRAPHY & LIVE MOTION */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden border-b border-[#E9E2D6] dark:border-[#2E2C27]">
        {/* Subtle Warm Atmospheric Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[640px] h-[340px] bg-[#B0542E]/6 dark:bg-[#B0542E]/10 blur-[110px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Live Text Animation Pill / Ticker */}
          <div className="flex justify-center mb-2">
            <LiveTicker
              phrases={[
                "Sub-50ms Redis Cloud Search",
                "Military-Grade Anti-Screenshot Shield",
                "Zero WhatsApp Group Clutter",
                "Dynamic Student Watermark Protection",
                "Upcoming RAG-Based AI Study Assistant",
              ]}
              prefix="Live Platform: "
            />
          </div>

          {/* Main Headline - Bold Fraunces Serif */}
          <h1 className="font-serif-fraunces text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#26261F] dark:text-[#F5F2EA] max-w-4xl mx-auto leading-[1.12]">
            All Your College Notes & Coding Resources.{" "}
            <span className="italic font-normal text-[#B0542E]">
              In One Distraction-Free Place.
            </span>
          </h1>

          {/* Concise Subtitle (30% Text Rule) */}
          <p className="text-base sm:text-xl text-[#5A5A4E] dark:text-[#C4BFB2] max-w-2xl mx-auto leading-relaxed">
            Search 400+ verified semester notes, question sets, and formulas across degrees with sub-second Redis speed. Zero ads, zero WhatsApp noise.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            {isLoggedIn ? (
              <Link
                href={isTeacher ? "/admin" : "/home"}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#B0542E] hover:bg-[#974522] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
              >
                <span>{isTeacher ? "Go to Admin Dashboard" : "Open Student Canvas"}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-8 py-4 rounded-xl text-base font-bold text-white bg-[#B0542E] hover:bg-[#974522] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                >
                  <span>Start Learning Free</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-4 rounded-xl text-base font-semibold text-[#26261F] dark:text-[#F5F2EA] bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] hover:bg-[#F1ECE3] dark:hover:bg-[#282622] transition-all duration-150 shadow-xs"
                >
                  <span>Login to Account</span>
                </Link>
              </>
            )}

            <Link
              href="/about"
              className="inline-flex items-center space-x-1 text-sm font-semibold text-[#B0542E] hover:underline py-2"
            >
              <span>Explore Tech &amp; Vision</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Real App Metrics Strip with Live Ping */}
          <div className="pt-8 border-t border-[#E9E2D6] dark:border-[#2E2C27] max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
                400+
              </div>
              <div className="text-xs text-[#8E8C7E] font-medium mt-0.5">
                Verified Documents
              </div>
            </div>
            <div>
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
                B.Sc CS, IT &amp; AI
              </div>
              <div className="text-xs text-[#8E8C7E] font-medium mt-0.5">
                Core Curriculum
              </div>
            </div>
            <div>
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#B0542E] flex items-center justify-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#B0542E] animate-ping" />
                &lt; 24ms
              </div>
              <div className="text-xs text-[#8E8C7E] font-medium mt-0.5">
                Redis Search Cache
              </div>
            </div>
            <div>
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#4E7A5E]">
                100% Free
              </div>
              <div className="text-xs text-[#8E8C7E] font-medium mt-0.5">
                Non-Profit Education
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PRODUCTION DESK & TECH STACK (70% DESIGN) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
            Live Experience
          </span>
          <h2 className="font-serif-fraunces text-3xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
            Windows 11 Study Desk &amp; Cloud Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] mt-2">
            Test the live anti-piracy blackout simulation below and review the 4 core services powering our stack.
          </p>
        </div>

        <InteractiveWindowsMockup />
      </section>

      {/* VISUAL COMPARISON: TRADITIONAL VS NOTES CLUB */}
      <section className="py-20 bg-[#F1ECE3] dark:bg-[#1A1916] border-y border-[#E9E2D6] dark:border-[#2E2C27]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
              The Problem &amp; Solution
            </span>
            <h2 className="font-serif-fraunces text-3xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
              Why Students Prefer Notes Club
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Old Way */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-rose-300/40 dark:border-rose-900/30 space-y-4 shadow-sm">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider font-mono">
                <XCircle className="h-4 w-4" />
                <span>The Frustrating Old Way</span>
              </div>
              <h3 className="font-serif-fraunces text-xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
                Scattered WhatsApp Chaos
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2]">
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>10+ chaotic WhatsApp groups sharing blurry phone camera photos.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Broken Google Drive permission links right on the night before exams.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Ad-ridden websites hiding download buttons behind 30-second timers.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-rose-500 font-bold">✕</span>
                  <span>Zero reading resume — you lose your page every time you switch apps.</span>
                </li>
              </ul>
            </div>

            {/* The Notes Club Way */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-emerald-400/40 dark:border-emerald-800/40 space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles className="h-24 w-24 text-[#4E7A5E]" />
              </div>
              <div className="flex items-center space-x-2 text-[#4E7A5E] font-bold text-xs uppercase tracking-wider font-mono">
                <CheckCircle2 className="h-4 w-4" />
                <span>The Notes Club Experience</span>
              </div>
              <h3 className="font-serif-fraunces text-xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
                Focused, Verified Study Desk
              </h3>
              <ul className="space-y-3 text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2]">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0 mt-0.5" />
                  <span>Sub-50ms instant search scans all semester units simultaneously.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0 mt-0.5" />
                  <span>Cross-device reading sync automatically resumes your exact page.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0 mt-0.5" />
                  <span>Zero advertisements, zero tracking popups, 100% academic focus.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0 mt-0.5" />
                  <span>Dynamic student watermark &amp; hardware anti-screenshot shield.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CORE HUMAN-CRAFTED VALUE PROPOSITIONS (70% DESIGN) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
            Platform Matrix
          </span>
          <h2 className="font-serif-fraunces text-3xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
            Engineered For Speed, Security &amp; Fair Use
          </h2>
        </div>

        <InteractiveFeaturesMatrix />
      </section>

      {/* CREATOR STORY TEASER BOX */}
      <section className="py-16 bg-[#F1ECE3] dark:bg-[#1A1916] border-y border-[#E9E2D6] dark:border-[#2E2C27]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
            Student Initiative
          </span>
          <h2 className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
            &ldquo;I built Notes Club to save every student from the chaos of exam week.&rdquo;
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] max-w-xl mx-auto leading-relaxed">
            Read the founder story of Vishal Prajapati (KES Shroff College), why this platform was created, and how anti-piracy security safeguards creator notes.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/about"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-[#B0542E] hover:bg-[#974522] text-white font-bold text-xs shadow-sm transition"
            >
              <span>Read Full Story &amp; Tech Stack</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="https://instagram.com/vishalprajapati.co"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-5 py-3 rounded-xl border border-[#DED5C6] dark:border-[#3E3B34] bg-[#FFFFFF] dark:bg-[#1E1D19] text-[#26261F] dark:text-[#F5F2EA] font-semibold text-xs hover:border-[#B0542E] transition shadow-xs"
            >
              <svg className="w-4 h-4 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>@vishalprajapati.co</span>
            </a>
          </div>
        </div>
      </section>

      {/* FINAL WARM CTA */}
      <section className="py-20 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-10 sm:p-14 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] shadow-md space-y-6">
          <h2 className="font-serif-fraunces text-3xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
            Ready to Study Smarter Tonight?
          </h2>
          <p className="text-[#5A5A4E] dark:text-[#C4BFB2] max-w-md mx-auto text-sm">
            Join fellow students, find your semester notes immediately, and prepare without distractions.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#B0542E] hover:bg-[#974522] text-white font-bold text-sm shadow-sm transition"
            >
              Start Learning Now (Free)
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#DED5C6] dark:border-[#3E3B34] text-[#26261F] dark:text-[#F5F2EA] hover:bg-[#F1ECE3] dark:hover:bg-[#282622] font-semibold text-sm transition"
            >
              About the Developer
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
