"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Lock, AlertTriangle } from "lucide-react";

interface SecurityShieldProps {
  children: React.ReactNode;
  studentName: string;
  rollNumber: string | null;
  email: string;
  documentTitle: string;
}

export const SecurityShield: React.FC<SecurityShieldProps> = ({
  children,
  studentName,
  rollNumber,
  email,
  documentTitle,
}) => {
  const [isShieldActive, setIsShieldActive] = useState(false);
  const [shieldReason, setShieldReason] = useState<string>(
    "Screen capture, recording, or window backgrounding detected"
  );
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unshieldTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showWarning = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setWarningToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setWarningToast(null);
    }, 3500);
  }, []);

  // Synchronous DOM-level blackout to beat screenshot capture
  const applyHardBlackout = useCallback((reason: string, durationMs = 2500) => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.add("secure-screen-blackout");
    }

    setShieldReason(reason);
    setIsShieldActive(true);

    if (unshieldTimeoutRef.current) clearTimeout(unshieldTimeoutRef.current);
    if (durationMs > 0) {
      unshieldTimeoutRef.current = setTimeout(() => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("secure-screen-blackout");
        }
        setIsShieldActive(false);
      }, durationMs);
    }
  }, []);

  const removeHardBlackout = useCallback((delayMs = 0) => {
    if (unshieldTimeoutRef.current) clearTimeout(unshieldTimeoutRef.current);
    const execute = () => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.remove("secure-screen-blackout");
      }
      setIsShieldActive(false);
    };
    if (delayMs > 0) {
      unshieldTimeoutRef.current = setTimeout(execute, delayMs);
    } else {
      execute();
    }
  }, []);

  useEffect(() => {
    // 1. Android & Desktop Blur, PageHide, Visibility Change
    // Defeats system screenshot flash, notification shade screenshot, assistant overlay
    const handleBlur = () => {
      applyHardBlackout("Screen capture or window backgrounding detected", 2000);
    };

    const handleFocus = () => {
      removeHardBlackout(300);
    };

    const handlePageHide = () => {
      applyHardBlackout("Page backgrounded", 2000);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        applyHardBlackout("Screen capture or window backgrounding detected", 2000);
      } else {
        removeHardBlackout(300);
      }
    };

    // 2. Hardware Button Combinations & Keyboard Screenshot Keys
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();
      const code = (e.code || "").toLowerCase();
      const keyCode = e.keyCode || e.which || 0;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Android Hardware Volume & Power Keys:
      // KEYCODE_VOLUME_UP (24), KEYCODE_VOLUME_DOWN (25), KEYCODE_POWER (26)
      // AudioVolumeDown (174), AudioVolumeUp (175), VolumeMute (173)
      if (
        key.includes("volume") ||
        code.includes("volume") ||
        key.includes("power") ||
        code.includes("power") ||
        keyCode === 24 ||
        keyCode === 25 ||
        keyCode === 26 ||
        keyCode === 174 ||
        keyCode === 175 ||
        keyCode === 173
      ) {
        applyHardBlackout("Hardware screenshot combination intercepted", 2500);
        showWarning("Hardware screenshot capture is blocked.");
        return;
      }

      // PrintScreen key (Windows & Linux)
      if (key === "printscreen" || code === "printscreen" || keyCode === 44) {
        e.preventDefault();
        applyHardBlackout("Screenshot key intercepted", 2500);
        showWarning("Screenshots are strictly blocked on Notes Club.");
        return false;
      }

      // Windows + Shift + S (Snipping Tool heuristic)
      if (isCtrlOrMeta && e.shiftKey && (key === "s" || code === "keys")) {
        e.preventDefault();
        applyHardBlackout("Screen snip combination detected", 2500);
        showWarning("Screen snipping is strictly prohibited.");
        return false;
      }

      // Mac Screenshot Shortcuts: Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5
      if (e.metaKey && e.shiftKey && ["3", "4", "5", "$", "#", "%"].includes(key)) {
        e.preventDefault();
        applyHardBlackout("Screenshot command intercepted", 2500);
        showWarning("macOS screen capture is strictly prohibited.");
        return false;
      }

      // Block Ctrl+S / Cmd+S (Save page / download)
      if (isCtrlOrMeta && (key === "s" || code === "keys")) {
        e.preventDefault();
        showWarning("Downloading file content is strictly disabled.");
        return false;
      }

      // Block Ctrl+P / Cmd+P (Print page / save as PDF)
      if (isCtrlOrMeta && (key === "p" || code === "keyp")) {
        e.preventDefault();
        showWarning("Printing or exporting to PDF is strictly disabled.");
        return false;
      }

      // Block Ctrl+U / Cmd+U (View page source)
      if (isCtrlOrMeta && (key === "u" || code === "keyu")) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+C / Cmd+C (Copy)
      if (isCtrlOrMeta && (key === "c" || code === "keyc")) {
        e.preventDefault();
        showWarning("Copying text or content is strictly disabled.");
        return false;
      }

      // Block Ctrl+A / Cmd+A (Select All)
      if (isCtrlOrMeta && (key === "a" || code === "keya")) {
        e.preventDefault();
        return false;
      }

      // Block F12 and DevTools shortcuts
      if (
        key === "f12" ||
        code === "f12" ||
        (isCtrlOrMeta && e.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        showWarning("Developer inspection is disabled.");
        return false;
      }
    };

    // Keyup listener for hardware buttons & printscreen
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = (e.key || "").toLowerCase();
      const code = (e.code || "").toLowerCase();
      const keyCode = e.keyCode || e.which || 0;
      if (
        key.includes("volume") ||
        code.includes("volume") ||
        key.includes("power") ||
        code.includes("power") ||
        key === "printscreen" ||
        code === "printscreen" ||
        keyCode === 44 ||
        keyCode === 24 ||
        keyCode === 25 ||
        keyCode === 26 ||
        keyCode === 174 ||
        keyCode === 175
      ) {
        applyHardBlackout("Screenshot key intercepted", 2500);
        showWarning("Screenshot intercepted. Content protected.");
      }
    };

    // 3. Android Touch Gestures: Only block 3 or more fingers (3-Finger Swipe Screenshot)
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 3) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        applyHardBlackout("3-Finger screenshot gesture blocked", 2500);
        showWarning("3-Finger screenshot gesture blocked.");
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length >= 3) {
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        applyHardBlackout("3-Finger screenshot gesture blocked", 2500);
      }
    };

    // 4. Block Context Menu & Drag
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarning("Context menu and saving are disabled.");
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 5. Block Copy & Cut
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showWarning("Copying content is disabled.");
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showWarning("Cutting content is disabled.");
    };

    // 6. Poison Canvas Data Extraction
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    try {
      HTMLCanvasElement.prototype.toDataURL = function () {
        console.warn("Canvas export blocked by Notes Club security policy");
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
      };
      HTMLCanvasElement.prototype.toBlob = function (callback: BlobCallback) {
        console.warn("Canvas export blocked by Notes Club security policy");
        const emptyBlob = new Blob([], { type: "image/png" });
        callback(emptyBlob);
      };
    } catch {
      // Ignore prototype freeze
    }

    // Attach listeners
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    window.addEventListener("touchstart", handleTouchStart, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);

      if (unshieldTimeoutRef.current) clearTimeout(unshieldTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);

      try {
        HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
      } catch {
        // Ignore
      }
    };
  }, [applyHardBlackout, removeHardBlackout, showWarning]);

  return (
    <div
      className="relative w-full h-full select-none reader-secure-viewport"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Underlying Content: instantly zeroed and blurred when shield triggers */}
      <div
        className={`reader-content-layer w-full h-full transition-all duration-75 ${
          isShieldActive
            ? "blur-3xl opacity-0 pointer-events-none filter scale-[0.95]"
            : "opacity-100 filter-none"
        }`}
      >
        {children}
      </div>

      {/* Screen Capture / Gesture Blackout Curtain */}
      <div
        id="security-blackout-curtain"
        onClick={() => removeHardBlackout(0)}
        className={`fixed inset-0 flex flex-col items-center justify-center bg-black text-white p-6 text-center select-none cursor-pointer backdrop-blur-3xl transition-opacity duration-75 ${
          isShieldActive ? "z-50 opacity-100" : "hidden opacity-0 pointer-events-none"
        }`}
      >
        <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-2xl">
          <Lock className="h-8 w-8 animate-pulse text-red-400" />
        </div>

        <h2 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 mb-2">
          Protected Study Material
        </h2>

        <p className="max-w-md text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
          {shieldReason}. Screenshots and screen capture are strictly blocked on Notes Club to protect author rights.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2 text-[11px] font-mono text-zinc-500 bg-zinc-900/80 px-4 py-2 rounded-xl border border-zinc-800">
          <span>Student: {studentName}</span>
          <span className="hidden sm:inline">&bull;</span>
          <span>{rollNumber || email}</span>
        </div>

        <p className="mt-8 text-[11px] text-zinc-500 flex items-center gap-1.5">
          <span>Tap anywhere to resume reading</span>
        </p>
      </div>

      {/* Warning Notification Toast */}
      {warningToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2.5 rounded-full bg-red-950/90 border border-red-800/80 px-5 py-2.5 text-xs text-red-200 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="font-medium">{warningToast}</span>
        </div>
      )}
    </div>
  );
};
