"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Zap,
  HardDrive,
  Database,
  Cpu,
  Layers,
  Search,
  Lock,
  Maximize2,
  Minus,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Sparkles,
} from "lucide-react";

export function InteractiveWindowsMockup() {
  const [activeTab, setActiveTab] = useState<"dbms" | "os" | "dsa">("dbms");
  const [isBlackoutActive, setIsBlackoutActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const documents = {
    dbms: {
      title: "Unit 2: Relational Schema & 3NF Normalization",
      course: "B.Sc AI — Semester 2",
      pages: "Page 14 of 78 (18% Read)",
      content:
        "A relational database schema is in Third Normal Form (3NF) if it satisfies 2NF and contains no transitive dependencies for non-prime attributes.",
      formula: "Rule: X → A holds only if X is a Super Key OR A is a Prime Attribute.",
    },
    os: {
      title: "Unit 4: Process Synchronization & Mutex Semaphores",
      course: "B.Sc CS — Operating Systems",
      pages: "Page 22 of 64 (34% Read)",
      content:
        "A semaphore S is an integer variable that, apart from initialization, is accessed only through two standard atomic operations: wait() and signal().",
      formula: "wait(S) { while (S <= 0); S--; } | signal(S) { S++; }",
    },
    dsa: {
      title: "Unit 3: Balanced Binary Search Trees & AVL Rotations",
      course: "B.Tech / B.Sc — Data Structures",
      pages: "Page 39 of 92 (42% Read)",
      content:
        "An AVL tree is a self-balancing binary search tree where the difference between heights of left and right subtrees cannot be more than 1.",
      formula: "Balance Factor = height(Left Subtree) - height(Right Subtree) ∈ {-1, 0, 1}",
    },
  };

  const currentDoc = documents[activeTab];

  const techStack = [
    {
      name: "Supabase Backend",
      role: "PostgreSQL Database & Auth",
      metric: "99.98% Uptime",
      badge: "RLS Secured",
      color: "#3ECF8E",
      desc: "Handles identity, student role policies, wishlists, and metadata security via strict Row-Level Security rules.",
      icon: Database,
    },
    {
      name: "Google Drive Storage",
      role: "Secure Cloud File Vault",
      metric: "0 Server Bloat",
      badge: "Chunk Streaming",
      color: "#4285F4",
      desc: "Large academic PDF documents are stored in secure cloud folders and streamed chunk-by-chunk without RAM overload.",
      icon: HardDrive,
    },
    {
      name: "Redis In-Memory Engine",
      role: "Sub-Second Query Cache",
      metric: "< 24ms Latency",
      badge: "High Throughput",
      color: "#FF4438",
      desc: "Caches syllabus catalogs, frequent search lookups, and session locks so student queries return instantaneously.",
      icon: Zap,
    },
    {
      name: "Next.js 15 & React 19",
      role: "Editorial Web App Frontend",
      metric: "Instant Hydration",
      badge: "Turbopack",
      color: "#B0542E",
      desc: "Server-side rendered components deliver ultra-fast initial page loads with smooth client transitions.",
      icon: Cpu,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
      {/* LEFT COLUMN: Windows 11 Desktop Interactive App Mockup (7 cols) */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="rounded-3xl border border-[#DED5C6] dark:border-[#3E3B34] bg-[#FFFFFF] dark:bg-[#1E1D19] shadow-xl overflow-hidden flex flex-col h-full">
          {/* Windows 11 Window Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#F1ECE3] dark:bg-[#282622] border-b border-[#E9E2D6] dark:border-[#2E2C27] select-none">
            {/* Windows Controls on Left / App Icon */}
            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 rounded-md bg-[#B0542E] flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                N
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#26261F] dark:text-[#F5F2EA] flex items-center gap-1.5">
                  Notes Club Desktop
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FFFFFF] dark:bg-[#1A1916] text-[#8E8C7E] border border-[#E9E2D6] dark:border-[#2E2C27]">
                    Win11
                  </span>
                </span>
              </div>
            </div>

            {/* Window Controls (Minimize, Maximize, Close) */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="h-7 w-8 rounded flex items-center justify-center text-[#5A5A4E] hover:bg-[#E9E2D6] dark:hover:bg-[#3E3B34] transition"
                title="Minimize"
              >
                <Minus className="h-3 w-3" />
              </button>
              <button
                type="button"
                className="h-7 w-8 rounded flex items-center justify-center text-[#5A5A4E] hover:bg-[#E9E2D6] dark:hover:bg-[#3E3B34] transition"
                title="Maximize"
              >
                <Maximize2 className="h-2.5 w-2.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsBlackoutActive(!isBlackoutActive)}
                className="h-7 w-8 rounded flex items-center justify-center text-[#5A5A4E] hover:bg-rose-500 hover:text-white transition"
                title="Close / Test Trigger"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Windows App Toolbar with Interactive Tabs */}
          <div className="p-3 bg-[#F7F4EE] dark:bg-[#1A1916] border-b border-[#E9E2D6] dark:border-[#2E2C27] flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Tab Switches */}
            <div className="flex items-center space-x-1 bg-[#FFFFFF] dark:bg-[#282622] p-1 rounded-xl border border-[#E9E2D6] dark:border-[#2E2C27]">
              <button
                type="button"
                onClick={() => setActiveTab("dbms")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "dbms"
                    ? "bg-[#B0542E] text-white shadow-xs font-semibold"
                    : "text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#F1ECE3] dark:hover:bg-[#1E1D19]"
                }`}
              >
                DBMS 3NF
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("os")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "os"
                    ? "bg-[#B0542E] text-white shadow-xs font-semibold"
                    : "text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#F1ECE3] dark:hover:bg-[#1E1D19]"
                }`}
              >
                OS Semaphores
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("dsa")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  activeTab === "dsa"
                    ? "bg-[#B0542E] text-white shadow-xs font-semibold"
                    : "text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#F1ECE3] dark:hover:bg-[#1E1D19]"
                }`}
              >
                AVL Trees
              </button>
            </div>

            {/* Test Anti-Piracy Blackout Button */}
            <button
              type="button"
              onClick={() => setIsBlackoutActive(!isBlackoutActive)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium hover:bg-amber-500/20 transition text-xs"
            >
              <EyeOff className="h-3.5 w-3.5" />
              <span>{isBlackoutActive ? "Disable Blackout" : "Simulate Piracy Block"}</span>
            </button>
          </div>

          {/* Interactive Document Workspace Area */}
          <div className="relative p-6 sm:p-8 flex-1 flex flex-col justify-between bg-[#FFFFFF] dark:bg-[#151412] overflow-hidden select-none min-h-[340px]">
            {/* BLACKOUT CURTAIN OVERLAY (Triggered when user clicks simulate or screenshots) */}
            {isBlackoutActive && (
              <div className="absolute inset-0 bg-[#0E0D0C]/95 backdrop-blur-xl z-30 flex flex-col items-center justify-center p-6 text-center text-white space-y-3 animate-fade-in">
                <div className="h-12 w-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-rose-200">
                    Military-Grade Anti-Piracy Shield Triggered
                  </h4>
                  <p className="text-xs text-rose-100/70 max-w-sm mt-1 leading-relaxed">
                    Canvas hardware blackout engaged! PrintScreen, Snipping Tool, and unauthenticated screen captures are instantly blinded to protect creator notes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBlackoutActive(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-md"
                >
                  Resume Safe View
                </button>
              </div>
            )}

            {/* DYNAMIC WATERMARK LAYER (Simulating live student imprint) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] dark:opacity-[0.08] select-none -rotate-12 z-10">
              <div className="text-center font-black text-2xl sm:text-4xl text-[#26261F] dark:text-[#F5F2EA] tracking-widest uppercase leading-tight">
                KES SHROFF • VISHAL PRAJAPATI
                <br />
                ROLL: 104 • 192.168.1.1
              </div>
            </div>

            {/* Live Document Preview Card */}
            <div className="space-y-4 relative z-0">
              <div className="flex items-center justify-between border-b border-[#E9E2D6] dark:border-[#2E2C27] pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-[#4E7A5E]/10 text-[#4E7A5E] text-[10px] font-bold font-mono">
                      VERIFIED SYLLABUS
                    </span>
                    <span className="text-xs font-semibold text-[#8E8C7E]">
                      {currentDoc.course}
                    </span>
                  </div>
                  <h3 className="font-serif-fraunces text-base sm:text-lg font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
                    {currentDoc.title}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#8E8C7E] hidden sm:inline">
                  {currentDoc.pages}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
                {currentDoc.content}
              </p>

              <div className="p-3.5 rounded-xl bg-[#F7F4EE] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] font-mono text-xs text-[#26261F] dark:text-[#F5F2EA] shadow-inner">
                {currentDoc.formula}
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="pt-4 mt-6 border-t border-[#E9E2D6] dark:border-[#2E2C27] flex items-center justify-between text-[11px] text-[#8E8C7E] relative z-0">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-[#4E7A5E] animate-pulse" />
                <span>Watermark Imprint: Active</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-[#F1ECE3] dark:bg-[#282622] text-[#B0542E] font-medium">
                  Auto-Resume: Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Production Tech Stack List (5 cols) */}
      <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
        <div className="mb-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#B0542E]/10 text-[#B0542E] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Core Architecture</span>
          </div>
          <h3 className="font-serif-fraunces text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
            Modern Production Tech Stack
          </h3>
          <p className="text-xs text-[#5A5A4E] dark:text-[#C4BFB2] mt-1">
            Engineered with enterprise security, sub-50ms latency, and zero server bloat.
          </p>
        </div>

        {/* 4 Interactive Stack Cards */}
        <div className="space-y-3 flex-1">
          {techStack.map((tech, idx) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.name}
                className="group p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] hover:border-[#B0542E]/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: `${tech.color}15`, color: tech.color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-sm text-[#26261F] dark:text-[#F5F2EA] group-hover:text-[#B0542E] transition">
                          {tech.name}
                        </h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#F1ECE3] dark:bg-[#282622] text-[#5A5A4E] dark:text-[#C4BFB2]">
                          {tech.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8E8C7E]">{tech.role}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-[#4E7A5E] dark:text-[#5D9170] flex items-center justify-end gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4E7A5E] animate-ping" />
                      {tech.metric}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#5A5A4E] dark:text-[#C4BFB2] mt-2 leading-relaxed pl-12">
                  {tech.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
