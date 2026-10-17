"use client";

import { useState } from "react";
import {
  Sparkles,
  Bot,
  User,
  BookOpen,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Heart,
} from "lucide-react";

export function InteractiveAIChatPreview() {
  const [selectedPrompt, setSelectedPrompt] = useState<"3nf" | "deadlock" | "summary">("3nf");

  const prompts = {
    "3nf": {
      question: "Can you explain 3NF with a quick example from our semester DBMS syllabus?",
      citation: "Database_Management_Unit2.pdf • Page 14 • KES Shroff AI Notes",
      answer:
        "Third Normal Form (3NF) eliminates transitive dependency: every non-key column must depend solely on the primary key, and nothing else. For example, if a table has (Student_ID, Department, Dept_Head), Student_ID determines Department, and Department determines Dept_Head. That transitive link is broken into two separate 3NF tables.",
      rule: "Rule Check: X → A holds only if X is Super Key or A is Prime Attribute.",
    },
    deadlock: {
      question: "What are the 4 Coffman conditions for Deadlock in Operating Systems?",
      citation: "Operating_Systems_Unit3.pdf • Page 28 • Core Tech Notes",
      answer:
        "For a deadlock to occur, all four Coffman conditions must hold simultaneously: 1) Mutual Exclusion (resources cannot be shared), 2) Hold and Wait (process holds 1 resource and requests another), 3) No Preemption (resources cannot be forcibly taken), 4) Circular Wait (a circular chain of processes waiting on each other).",
      rule: "Quick Tip: Eliminating any ONE condition prevents deadlock entirely.",
    },
    summary: {
      question: "Give me a 3-bullet revision summary for AVL tree rotations before tomorrow's viva.",
      citation: "Data_Structures_Unit4.pdf • Page 51 • Algorithm Sheets",
      answer:
        "1) Balance factor must stay within {-1, 0, +1}. 2) Single rotations (LL or RR) fix insertions in outer subtrees. 3) Double rotations (LR or RL) fix insertions in inner zigzag subtrees.",
      rule: "Viva Guarantee: AVL search, insertion, and deletion worst-case time is always O(log n).",
    },
  };

  const current = prompts[selectedPrompt];

  return (
    <div className="rounded-3xl border border-[#DED5C6] dark:border-[#3E3B34] bg-[#FFFFFF] dark:bg-[#1E1D19] p-6 sm:p-10 shadow-lg space-y-8">
      {/* Top Banner & Heading */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#B0542E]/10 text-[#B0542E] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Future Roadmap • In Active R&D</span>
          </div>
          <h3 className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
            RAG-Powered AI Study Assistant & Dedicated Chatbot
          </h3>
          <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] mt-1 max-w-xl">
            Imagine asking any complex semester doubt, and receiving an instant answer grounded directly in your teacher&apos;s verified notes — with exact page citations.
          </p>
        </div>

        {/* Free for all students guarantee */}
        <div className="p-3.5 rounded-2xl bg-[#4E7A5E]/10 border border-[#4E7A5E]/20 text-xs text-[#4E7A5E] font-medium shrink-0 max-w-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-bold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Target: 100% Free For Everyone</span>
          </div>
          <p className="text-[11px] leading-tight text-[#4E7A5E]/90">
            I will work towards keeping this AI integration completely free for all students without paid paywalls.
          </p>
        </div>
      </div>

      {/* Interactive Chat Simulation */}
      <div className="rounded-2xl border border-[#E9E2D6] dark:border-[#2E2C27] bg-[#F7F4EE] dark:bg-[#151412] p-4 sm:p-6 space-y-4 shadow-inner">
        {/* Prompt Selector Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-[#8E8C7E]">Try Simulated Queries:</span>
          <button
            type="button"
            onClick={() => setSelectedPrompt("3nf")}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              selectedPrompt === "3nf"
                ? "bg-[#B0542E] text-white shadow-xs"
                : "bg-[#FFFFFF] dark:bg-[#282622] text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#E9E2D6]"
            }`}
          >
            Explain 3NF Normalization
          </button>
          <button
            type="button"
            onClick={() => setSelectedPrompt("deadlock")}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              selectedPrompt === "deadlock"
                ? "bg-[#B0542E] text-white shadow-xs"
                : "bg-[#FFFFFF] dark:bg-[#282622] text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#E9E2D6]"
            }`}
          >
            OS Coffman Deadlocks
          </button>
          <button
            type="button"
            onClick={() => setSelectedPrompt("summary")}
            className={`px-3 py-1.5 rounded-xl font-medium transition ${
              selectedPrompt === "summary"
                ? "bg-[#B0542E] text-white shadow-xs"
                : "bg-[#FFFFFF] dark:bg-[#282622] text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#E9E2D6]"
            }`}
          >
            AVL Trees Viva Summary
          </button>
        </div>

        {/* User Question Bubble */}
        <div className="flex items-start justify-end space-x-2 pt-2">
          <div className="max-w-lg p-3.5 rounded-2xl rounded-tr-xs bg-[#B0542E] text-white text-xs sm:text-sm font-medium shadow-sm">
            {current.question}
          </div>
          <div className="h-7 w-7 rounded-full bg-[#B0542E]/20 text-[#B0542E] flex items-center justify-center shrink-0">
            <User className="h-4 w-4" />
          </div>
        </div>

        {/* AI RAG Grounding Status Pill */}
        <div className="flex items-center space-x-2 text-[11px] text-[#8E8C7E] pl-10 font-mono">
          <span className="h-2 w-2 rounded-full bg-[#4E7A5E] animate-ping" />
          <span>Grounded in syllabus document:</span>
          <span className="font-bold text-[#4E7A5E] bg-[#4E7A5E]/10 px-2 py-0.5 rounded">
            {current.citation}
          </span>
        </div>

        {/* AI Answer Bubble */}
        <div className="flex items-start space-x-2">
          <div className="h-8 w-8 rounded-full bg-[#4E7A5E]/20 text-[#4E7A5E] flex items-center justify-center shrink-0 mt-1">
            <Bot className="h-4 w-4" />
          </div>
          <div className="max-w-xl p-4 rounded-2xl rounded-tl-xs bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] shadow-sm space-y-2">
            <p className="text-xs sm:text-sm text-[#26261F] dark:text-[#F5F2EA] leading-relaxed">
              {current.answer}
            </p>
            <div className="p-2.5 rounded-lg bg-[#F7F4EE] dark:bg-[#282622] text-[11px] font-mono text-[#8E8C7E] border border-[#E9E2D6] dark:border-[#3E3B34]">
              {current.rule}
            </div>
          </div>
        </div>
      </div>

      {/* Stay Tuned Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#B0542E]/10 via-[#F7F4EE] to-[#4E7A5E]/10 dark:from-[#B0542E]/20 dark:via-[#1A1916] dark:to-[#4E7A5E]/20 border border-[#E9E2D6] dark:border-[#2E2C27] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h4 className="font-serif-fraunces text-lg font-bold text-[#26261F] dark:text-[#F5F2EA] flex items-center gap-2 justify-center sm:justify-start">
            <Sparkles className="h-4 w-4 text-[#B0542E]" />
            <span>Stay Tuned • Many More Coming!</span>
          </h4>
          <p className="text-xs text-[#5A5A4E] dark:text-[#C4BFB2] mt-0.5">
            Smart formula calculators, voice query answers, and automatic previous-year question generators are currently under active development.
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-[#26261F] dark:bg-[#F5F2EA] text-white dark:text-[#26261F] font-bold text-xs shrink-0 shadow-sm">
          Phase 2 Roadmap
        </div>
      </div>
    </div>
  );
}
