"use client";

import { useState, useEffect } from "react";

interface LiveTickerProps {
  phrases?: string[];
  prefix?: string;
}

const DEFAULT_PHRASES = [
  "Sub-50ms Redis Cloud Search",
  "Military-Grade Anti-Screenshot Shield",
  "Zero Cluttered WhatsApp Groups",
  "Dynamic Student Watermark Protection",
  "Cross-Device Instant Page Resume",
  "Upcoming RAG-Based AI Study Assistant",
];

export function LiveTicker({ phrases = DEFAULT_PHRASES, prefix = "Live Feature: " }: LiveTickerProps) {
  const [index, setIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(60);

  useEffect(() => {
    const currentPhrase = phrases[index];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing characters
        setDisplayText(currentPhrase.substring(0, displayText.length + 1));
        setTypingSpeed(45);

        if (displayText.length + 1 === currentPhrase.length) {
          // Pause before deleting
          setTypingSpeed(2200);
          setIsDeleting(true);
        }
      } else {
        // Deleting characters
        setDisplayText(currentPhrase.substring(0, displayText.length - 1));
        setTypingSpeed(25);

        if (displayText.length === 0) {
          setIsDeleting(false);
          setIndex((prev) => (prev + 1) % phrases.length);
          setTypingSpeed(400);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, index, phrases, typingSpeed]);

  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFFFF]/90 dark:bg-[#1E1D19]/90 border border-[#DED5C6] dark:border-[#3E3B34] shadow-xs text-xs font-mono backdrop-blur-md">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B0542E] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B0542E]" />
      </span>
      <span className="text-[#8E8C7E] font-medium hidden sm:inline">{prefix}</span>
      <span className="font-semibold text-[#26261F] dark:text-[#F5F2EA] min-w-[200px] text-left">
        {displayText}
        <span className="inline-block w-1.5 h-3.5 bg-[#B0542E] ml-1 animate-pulse align-middle" />
      </span>
    </div>
  );
}
