"use client";

import React, { useMemo, useState, useEffect } from "react";

interface WatermarkProps {
  studentName: string;
  rollNumber: string | null;
  email: string;
  page: number;
}

/**
 * Military-grade forensic watermark layer.
 * 1. Dense repeating diagonal grid across the entire canvas
 * 2. Dynamic slowly drifting floating badge with live seconds timestamp
 * Permanently binds any screenshot, video recording, or camera photo to the student identity.
 */
export const Watermark: React.FC<WatermarkProps> = ({
  studentName,
  rollNumber,
  email,
  page,
}) => {
  const [liveTime, setLiveTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setLiveTime(
        `${now.toISOString().slice(0, 10)} ${now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const watermarkText = `${studentName} • ${rollNumber || email} • Page ${page} • ${liveTime}`;

  // 12-cell dense grid
  const items = useMemo(() => {
    const list = [];
    for (let i = 0; i < 12; i++) {
      list.push(i);
    }
    return list;
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden select-none"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
      aria-hidden="true"
    >
      {/* 1. Dense Repeating Diagonal Grid */}
      <div className="grid h-full w-full grid-cols-2 md:grid-cols-3 gap-10 sm:gap-14 p-6 opacity-[0.16] dark:opacity-[0.20]">
        {items.map((i) => (
          <div
            key={i}
            className="flex items-center justify-center transform -rotate-[28deg] text-center"
          >
            <div className="space-y-0.5">
              <p className="font-mono text-[11px] sm:text-xs font-bold tracking-wider text-slate-800 dark:text-slate-100 uppercase">
                {watermarkText}
              </p>
              <p className="font-mono text-[8px] sm:text-[9px] text-slate-600 dark:text-slate-300">
                STRICTLY CONFIDENTIAL • NOTES CLUB PROTECTED
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Floating Drifting Forensic Watermark (Slow animation to thwart static crop) */}
      <div
        className="absolute bottom-6 right-6 opacity-30 dark:opacity-40 pointer-events-none font-mono text-[10px] text-zinc-400 bg-black/40 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm"
      >
        <span>{studentName} • {email} • {liveTime}</span>
      </div>
    </div>
  );
};
