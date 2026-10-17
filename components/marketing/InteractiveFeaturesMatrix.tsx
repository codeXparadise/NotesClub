"use client";

import {
  ShieldCheck,
  EyeOff,
  Zap,
  Bookmark,
  Layers,
  Sparkles,
  Lock,
  Clock,
  CheckCircle2,
} from "lucide-react";

export function InteractiveFeaturesMatrix() {
  const features = [
    {
      title: "Anti-Screenshot Shield",
      tag: "Military-Grade",
      color: "#B0542E",
      icon: EyeOff,
      metric: "Hardware Blackout",
      visual: (
        <div className="h-20 rounded-xl bg-[#F1ECE3] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] flex items-center justify-center p-3 relative overflow-hidden group-hover:border-[#B0542E]/50 transition">
          <div className="absolute inset-0 bg-radial from-[#B0542E]/10 to-transparent pointer-events-none" />
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#B0542E]">
            <ShieldCheck className="h-4 w-4" />
            <span>CAPTURE_BLOCKED</span>
          </div>
        </div>
      ),
      summary: "Zero-latency blackout curtain masks reading content during Snipping Tool, PrintScreen, or window switching.",
    },
    {
      title: "Dynamic Watermarking",
      tag: "Content Integrity",
      color: "#4E7A5E",
      icon: Lock,
      metric: "Encrypted Imprint",
      visual: (
        <div className="h-20 rounded-xl bg-[#F1ECE3] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] flex items-center justify-center p-2 relative overflow-hidden select-none">
          <div className="text-[11px] font-mono text-[#8E8C7E] -rotate-6 font-bold tracking-wider opacity-60">
            KES • STUDENT #104 • 192.168.1.1
          </div>
        </div>
      ),
      summary: "Every document page receives faint, tamper-resistant imprints with student identity to protect educator works.",
    },
    {
      title: "Cross-Device Reading Sync",
      tag: "Continuous Resume",
      color: "#B0542E",
      icon: Layers,
      metric: "Auto-Saved",
      visual: (
        <div className="h-20 rounded-xl bg-[#F1ECE3] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] p-3 flex flex-col justify-center space-y-2">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-[#8E8C7E]">Unit 2 Progress</span>
            <span className="text-[#4E7A5E] font-bold">Page 14 / 78</span>
          </div>
          <div className="h-2 rounded-full bg-[#E9E2D6] dark:bg-[#2E2C27] overflow-hidden">
            <div className="h-full bg-[#4E7A5E] rounded-full w-[28%] animate-pulse" />
          </div>
        </div>
      ),
      summary: "Read on your smartphone in transit, then open your laptop at home — resume at the exact line seamlessly.",
    },
    {
      title: "Sub-50ms Redis Cloud Search",
      tag: "Instant Lookups",
      color: "#D26E45",
      icon: Zap,
      metric: "< 24ms Speed",
      visual: (
        <div className="h-20 rounded-xl bg-[#F1ECE3] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-[#8E8C7E]">&gt; search:</span>
            <span className="text-[#26261F] dark:text-[#F5F2EA] font-semibold">&quot;3NF Normalization&quot;</span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            18ms
          </span>
        </div>
      ),
      summary: "Redis in-memory caching scans 400+ documents across all degrees and categories simultaneously in milliseconds.",
    },
    {
      title: "Personal Wishlist & Pins",
      tag: "Exam Bookmarks",
      color: "#4E7A5E",
      icon: Bookmark,
      metric: "1-Click Access",
      visual: (
        <div className="h-20 rounded-xl bg-[#F1ECE3] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="h-4 w-4 text-[#B0542E] fill-[#B0542E]" />
            <span className="text-xs font-bold text-[#26261F] dark:text-[#F5F2EA]">Pinned to Favorites</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F7F4EE] dark:bg-[#282622] text-[#8E8C7E]">
            Saved
          </span>
        </div>
      ),
      summary: "Pin important question banks, formula sheets, and chapter summaries to your dashboard for rapid revision.",
    },
    {
      title: "100% Ad-Free Focus Desk",
      tag: "Pure Study",
      color: "#B0542E",
      icon: Sparkles,
      metric: "Zero Commercials",
      visual: (
        <div className="h-20 rounded-xl bg-[#F1ECE3] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] flex items-center justify-center p-3">
          <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#4E7A5E]">
            <CheckCircle2 className="h-4 w-4" />
            <span>0 Popups • 0 Cookies • 100% Academic</span>
          </div>
        </div>
      ),
      summary: "No intrusive video ads, sponsored links, or misleading download timers. Just authentic, high-resolution study.",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((feat) => {
        const Icon = feat.icon;
        return (
          <div
            key={feat.title}
            className="group p-5 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] hover:border-[#B0542E]/50 hover:shadow-lg transition-all duration-200 flex flex-col justify-between space-y-4"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-[#F1ECE3] dark:bg-[#282622] flex items-center justify-center text-[#B0542E] group-hover:scale-105 transition">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#F7F4EE] dark:bg-[#151412] text-[#8E8C7E]">
                    {feat.tag}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#4E7A5E] dark:text-[#5D9170]">
                  {feat.metric}
                </span>
              </div>

              <h4 className="font-serif-fraunces text-base font-bold text-[#26261F] dark:text-[#F5F2EA] group-hover:text-[#B0542E] transition">
                {feat.title}
              </h4>
            </div>

            {/* Visual element (70% design) */}
            <div>{feat.visual}</div>

            {/* Concise summary (30% text) */}
            <p className="text-xs text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
              {feat.summary}
            </p>
          </div>
        );
      })}
    </div>
  );
}
