import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { LiveTicker } from "@/components/marketing/LiveTicker";
import { InteractiveWindowsMockup } from "@/components/marketing/InteractiveWindowsMockup";
import { InteractiveAndroidMockup } from "@/components/marketing/InteractiveAndroidMockup";
import { InteractiveAIChatPreview } from "@/components/marketing/InteractiveAIChatPreview";
import { InteractiveFeaturesMatrix } from "@/components/marketing/InteractiveFeaturesMatrix";
import {
  BookOpen,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  Heart,
  ExternalLink,
  Code2,
  GraduationCap,
  ChevronRight,
  Database,
  Smartphone,
  CheckCircle2,
} from "lucide-react";

export const metadata = {
  title: "About Notes Club | Mission, Production Stack & Future Roadmap",
  description:
    "Discover the engineering, architecture, and story behind Notes Club. Built with Supabase, Redis, and Google Drive by student Vishal Prajapati to solve academic note fragmentation.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#151412] text-[#26261F] dark:text-[#F5F2EA] flex flex-col font-sans selection:bg-[#B0542E] selection:text-white">
      {/* SaaS Navigation */}
      <MarketingNavbar />

      {/* ACT 1: APP FIRST - HERO & LIVE VISION */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden border-b border-[#E9E2D6] dark:border-[#2E2C27]">
        {/* Warm Radial Ambient Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[340px] bg-[#B0542E]/6 dark:bg-[#B0542E]/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Live Text Animation Pill / Ticker */}
          <div className="flex justify-center mb-2">
            <LiveTicker
              phrases={[
                "Engineered For Zero WhatsApp Clutter",
                "Sub-50ms Redis Cloud Lookups",
                "Hardware Anti-Screenshot Shield",
                "Offline Android App In Active R&D",
                "Upcoming Free RAG-Based AI Chatbot",
              ]}
              prefix="Real-Time Engine: "
            />
          </div>

          {/* Headline (70% visual typography, 30% concise text) */}
          <h1 className="font-serif-fraunces text-4xl sm:text-6xl font-bold tracking-tight text-[#26261F] dark:text-[#F5F2EA] max-w-4xl mx-auto leading-[1.12]">
            An Academic Reading Engine.{" "}
            <span className="italic font-normal text-[#B0542E]">
              Zero Noise. Absolute Speed.
            </span>
          </h1>

          <p className="text-sm sm:text-lg text-[#5A5A4E] dark:text-[#C4BFB2] max-w-2xl mx-auto leading-relaxed">
            Notes Club replaces the chaos of scattered WhatsApp group forwards, expired Drive links, and ad-infested portals with an authentic, unified, distraction-free study desk.
          </p>

          {/* Quick Real-Time Metrics Strip */}
          <div className="pt-6 max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] shadow-xs">
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
                400+
              </div>
              <div className="text-[11px] font-medium text-[#8E8C7E] mt-0.5">
                Verified Notes
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] shadow-xs">
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#B0542E]">
                &lt; 24ms
              </div>
              <div className="text-[11px] font-medium text-[#8E8C7E] mt-0.5">
                Redis Search Cache
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] shadow-xs">
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#4E7A5E]">
                0 Ads
              </div>
              <div className="text-[11px] font-medium text-[#8E8C7E] mt-0.5">
                Pure Non-Profit
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] shadow-xs">
              <div className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
                Active
              </div>
              <div className="text-[11px] font-medium text-[#8E8C7E] mt-0.5">
                Anti-Screenshot Shield
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACT 2: ARCHITECTURE - WINDOWS APP DESK (LEFT) + TECH STACK LIST (RIGHT) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
            Production Architecture
          </span>
          <h2 className="font-serif-fraunces text-3xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
            Interactive Desktop App & Technology Stack
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] mt-2">
            Explore the live Windows 11 reading desk on the left, paired with our zero-bloat production stack on the right.
          </p>
        </div>

        {/* Side-by-Side Windows App Mockup & Tech Stack Component */}
        <InteractiveWindowsMockup />
      </section>

      {/* ACT 3: KEY APP FEATURES MATRIX (70% Design, 30% Concise Text) */}
      <section className="py-20 bg-[#F1ECE3] dark:bg-[#1A1916] border-y border-[#E9E2D6] dark:border-[#2E2C27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
              Core Capabilities
            </span>
            <h2 className="font-serif-fraunces text-3xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
              Engineered With Purpose: Key Platform Features
            </h2>
            <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] mt-2">
              Every detail was designed to protect educators and supercharge student productivity.
            </p>
          </div>

          <InteractiveFeaturesMatrix />
        </div>
      </section>

      {/* ACT 4: UPCOMING ANDROID APP (MOBILE MOCKUP WITH OFFLINE ACCESS) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InteractiveAndroidMockup />
      </section>

      {/* ACT 5: FUTURE OVERVIEW & AI ROADMAP (RAG-BASED CHATBOT) */}
      <section className="py-20 bg-[#F1ECE3] dark:bg-[#1A1916] border-y border-[#E9E2D6] dark:border-[#2E2C27]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <InteractiveAIChatPreview />
        </div>
      </section>

      {/* ACT 6: DEVELOPER STORY & PERSONAL INITIATIVE (MID/LAST) */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#DED5C6] dark:border-[#3E3B34] bg-[#FFFFFF] dark:bg-[#1E1D19] p-8 sm:p-12 shadow-xl space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E2D6] dark:border-[#2E2C27] pb-6">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-2xl bg-[#B0542E] text-white flex items-center justify-center font-serif-fraunces text-2xl font-bold shadow-sm">
                VP
              </div>
              <div>
                <h3 className="font-serif-fraunces text-xl sm:text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
                  Vishal Prajapati
                </h3>
                <p className="text-xs text-[#8E8C7E] flex items-center gap-1.5 mt-0.5">
                  <GraduationCap className="h-3.5 w-3.5 text-[#B0542E]" />
                  <span>Student &amp; Creator • KES Shroff College of Arts &amp; Commerce</span>
                </p>
              </div>
            </div>

            {/* Official Instagram Card Link */}
            <a
              href="https://instagram.com/vishalprajapati.co"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#F58529]/10 via-[#DD2A7B]/10 to-[#8134AF]/10 border border-[#DD2A7B]/30 hover:border-[#DD2A7B] text-[#26261F] dark:text-[#F5F2EA] text-xs font-semibold shadow-xs hover:shadow-md transition-all duration-200 group shrink-0"
              title="Official Instagram Profile"
            >
              <svg className="w-5 h-5 text-[#E4405F] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              <span>@vishalprajapati.co</span>
              <ExternalLink className="h-3.5 w-3.5 text-[#8E8C7E]" />
            </a>
          </div>

          {/* Letter & Motive (Concise, authentic, 70/30 balance) */}
          <div className="space-y-4 text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
            <p>
              &ldquo;I built Notes Club because as a college student, I spent far too many late nights scouring 10 different WhatsApp groups, clicking broken Google Drive permissions, and closing spam popups just to find a 20-page syllabus note for an exam scheduled the next morning.
            </p>
            <p>
              <strong>My motive is simple:</strong> Save hundreds of hours for students by organizing semester notes in one fast, verified, distraction-free portal. My intention is 100% clean, non-profit academic learning.
            </p>
            <p>
              To ensure complete ethical harmony with professors and authors, I intentionally engineered the <strong>Dynamic Watermarking</strong> and <strong>Anti-Screenshot Hardware Shield</strong>. This prevents unauthorized mass piracy while keeping study completely free and accessible for genuine learners.&rdquo;
            </p>
          </div>

          {/* Core Commitments Pill Row */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] flex items-center space-x-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0" />
              <span className="font-semibold text-[#26261F] dark:text-[#F5F2EA]">Zero Commercial Ads</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] flex items-center space-x-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0" />
              <span className="font-semibold text-[#26261F] dark:text-[#F5F2EA]">Author Copyrights Honored</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] flex items-center space-x-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0" />
              <span className="font-semibold text-[#26261F] dark:text-[#F5F2EA]">Always Free for Students</span>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] shadow-md space-y-6">
          <h2 className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
            Ready to Experience Distraction-Free Study?
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] max-w-md mx-auto">
            Log in to your account, bookmark your upcoming syllabus units, and prepare smarter tonight.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#B0542E] hover:bg-[#974522] text-white font-bold text-xs sm:text-sm shadow-sm transition"
            >
              Start Learning Now (Free)
            </Link>
            <Link
              href="/legal"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-[#DED5C6] dark:border-[#3E3B34] text-[#26261F] dark:text-[#F5F2EA] hover:bg-[#F1ECE3] dark:hover:bg-[#282622] font-semibold text-xs sm:text-sm transition"
            >
              Read Legal &amp; Attribution Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
