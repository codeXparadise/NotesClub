"use client";

import { useState } from "react";
import {
  Smartphone,
  Wifi,
  WifiOff,
  Download,
  CheckCircle2,
  Lock,
  Battery,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export function InteractiveAndroidMockup() {
  const [isOffline, setIsOffline] = useState(true);

  return (
    <div className="rounded-3xl border border-[#DED5C6] dark:border-[#3E3B34] bg-[#FFFFFF] dark:bg-[#1E1D19] p-6 sm:p-10 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Content Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#B0542E]/10 text-[#B0542E] text-xs font-bold uppercase tracking-wider">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Upcoming Release</span>
          </div>

          <h3 className="font-serif-fraunces text-2xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA] leading-tight">
            Notes Club for Android.{" "}
            <span className="italic font-normal text-[#B0542E]">
              Study Anywhere, Even Without Internet.
            </span>
          </h3>

          <p className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
            Everything you love about the web app — anti-screenshot security, clean typography, sub-50ms search — packaged into a native Android app with one game-changing addition: <strong>Offline Document Downloads</strong>.
          </p>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] space-y-1.5">
              <div className="flex items-center space-x-2 text-[#4E7A5E] font-bold text-xs">
                <Download className="h-4 w-4" />
                <span>Offline Vault Access</span>
              </div>
              <p className="text-xs text-[#5A5A4E] dark:text-[#C4BFB2]">
                Download semester units on college Wi-Fi. Revise on local trains, buses, or offline study rooms with zero data usage.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] space-y-1.5">
              <div className="flex items-center space-x-2 text-[#B0542E] font-bold text-xs">
                <Lock className="h-4 w-4" />
                <span>FLAG_SECURE Hardware Shield</span>
              </div>
              <p className="text-xs text-[#5A5A4E] dark:text-[#C4BFB2]">
                Native Android hardware flags prevent screen recording, snippets, or external captures to keep educator notes ethical.
              </p>
            </div>
          </div>

          {/* Interactive Switcher Callout */}
          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs font-semibold text-[#26261F] dark:text-[#F5F2EA]">
              Test Mockup Mode:
            </span>
            <button
              type="button"
              onClick={() => setIsOffline(!isOffline)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition shadow-xs ${
                isOffline
                  ? "bg-[#4E7A5E] text-white"
                  : "bg-[#F1ECE3] dark:bg-[#282622] text-[#26261F] dark:text-[#F5F2EA] border border-[#DED5C6] dark:border-[#3E3B34]"
              }`}
            >
              {isOffline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
              <span>{isOffline ? "Offline Mode (Active)" : "Online Mode (Click to Toggle)"}</span>
            </button>
          </div>
        </div>

        {/* Right Phone Mockup Column (5 cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-[280px] sm:w-[300px] rounded-[44px] p-3 bg-[#26261F] dark:bg-[#0E0D0C] shadow-2xl border-4 border-[#3E3B34] dark:border-[#282622]">
            {/* Phone Screen Bezel */}
            <div className="relative rounded-[36px] bg-[#FFFFFF] dark:bg-[#151412] overflow-hidden border border-black/10 flex flex-col h-[520px]">
              {/* Dynamic Island / Status Bar */}
              <div className="pt-3 px-5 pb-2 flex items-center justify-between text-[10px] font-mono font-bold text-[#26261F] dark:text-[#F5F2EA] select-none bg-[#F7F4EE] dark:bg-[#1E1D19]">
                <span>9:41</span>
                <div className="h-4 w-20 rounded-full bg-black/80 dark:bg-black/90 mx-auto" />
                <div className="flex items-center space-x-1">
                  {isOffline ? <WifiOff className="h-3 w-3 text-amber-500" /> : <Wifi className="h-3 w-3 text-emerald-500" />}
                  <Battery className="h-3 w-3" />
                </div>
              </div>

              {/* App Bar */}
              <div className="p-3 bg-[#F1ECE3] dark:bg-[#1E1D19] border-b border-[#E9E2D6] dark:border-[#2E2C27] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 rounded-lg bg-[#B0542E] flex items-center justify-center text-white text-[10px] font-bold">
                    N
                  </div>
                  <span className="font-serif-fraunces text-xs font-bold text-[#26261F] dark:text-[#F5F2EA]">
                    Notes Club Mobile
                  </span>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isOffline
                    ? "bg-[#4E7A5E]/15 text-[#4E7A5E]"
                    : "bg-blue-500/15 text-blue-500"
                }`}>
                  {isOffline ? "OFFLINE VAULT" : "ONLINE STREAM"}
                </span>
              </div>

              {/* Offline Notification Banner */}
              <div className={`px-3 py-2 text-[10px] font-medium flex items-center justify-between border-b ${
                isOffline
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
              }`}>
                <span>{isOffline ? "● 0 KB Cellular Data • Read Local Files" : "● Synchronized with Supabase & GDrive"}</span>
              </div>

              {/* Mobile Content List */}
              <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#8E8C7E]">
                  {isOffline ? "Downloaded for Offline Study" : "Available in Cloud Vault"}
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F4EE] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#26261F] dark:text-[#F5F2EA]">
                      DBMS_Unit2_3NF.pdf
                    </span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4E7A5E]" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8E8C7E]">
                    <span>B.Sc AI • 78 Pages</span>
                    <span className="font-mono text-[#4E7A5E] font-bold">4.2 MB • Saved</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F4EE] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#26261F] dark:text-[#F5F2EA]">
                      OS_Semaphores_Locks.pdf
                    </span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4E7A5E]" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8E8C7E]">
                    <span>B.Sc CS • 64 Pages</span>
                    <span className="font-mono text-[#4E7A5E] font-bold">3.1 MB • Saved</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F7F4EE] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#26261F] dark:text-[#F5F2EA]">
                      DSA_AVL_Trees_Cheat.pdf
                    </span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#4E7A5E]" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8E8C7E]">
                    <span>Tech Core • 92 Pages</span>
                    <span className="font-mono text-[#4E7A5E] font-bold">5.8 MB • Saved</span>
                  </div>
                </div>
              </div>

              {/* Bottom Phone Action Bar */}
              <div className="p-3 bg-[#F1ECE3] dark:bg-[#1E1D19] border-t border-[#E9E2D6] dark:border-[#2E2C27] flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-[10px] text-[#8E8C7E]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#4E7A5E]" />
                  <span>FLAG_SECURE Enabled</span>
                </div>
                <span className="text-[10px] font-bold text-[#B0542E]">
                  Android APK V1
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
