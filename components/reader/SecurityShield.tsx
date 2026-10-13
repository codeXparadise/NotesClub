"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { ShieldAlert, Lock, AlertTriangle } from "lucide-react";

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

  const showWarning = useCallback((message: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setWarningToast(message);
    toastTimeoutRef.current = setTimeout(() => {
      setWarningToast(null);
    }, 3500);
  }, []);

  // 1. Scrub clipboard whenever suspicious action or printscreen is triggered
  const scrubClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(
          "⚠️ Protected Academic Material: Screenshots & copying are strictly prohibited on Notes Club."
        );
      }
    } catch {
      // Ignore permission errors if user denied clipboard write
    }
  }, []);

  useEffect(() => {
    // 2. Window Blur & Visibility Change (Desktop + Android background/screenshot detection)
    const handleBlur = () => {
      setShieldReason("Content shielded: Window lost focus or screen capture tool invoked");
      setIsShieldActive(true);
      scrubClipboard();
    };

    const handleFocus = () => {
      // Delay unshielding slightly to ensure screen capture / snipping tool has exited
      setTimeout(() => {
        setIsShieldActive(false);
      }, 350);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setShieldReason("Content shielded: Screen backgrounded or captured");
        setIsShieldActive(true);
        scrubClipboard();
      } else {
        setTimeout(() => {
          setIsShieldActive(false);
        }, 350);
      }
    };

    // 3. Strict Key Combination Interception (Anti-Save, Anti-Print, Anti-DevTools)
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const code = e.code;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // PrintScreen key (Windows & Linux)
      if (key === "printscreen" || code === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        scrubClipboard();
        setShieldReason("Screenshot key detected: Action blocked and logged");
        setIsShieldActive(true);
        showWarning("Screenshots are strictly blocked on Notes Club.");
        setTimeout(() => setIsShieldActive(false), 2000);
        return false;
      }

      // Windows + Shift + S (Snipping Tool heuristic - Shift + S with Meta or keyup capture)
      if (isCtrlOrMeta && e.shiftKey && (key === "s" || code === "KeyS")) {
        e.preventDefault();
        scrubClipboard();
        setShieldReason("Screen snip combination detected: Action blocked");
        setIsShieldActive(true);
        showWarning("Screen snipping is strictly prohibited.");
        setTimeout(() => setIsShieldActive(false), 2000);
        return false;
      }

      // Mac Screenshot Shortcuts: Cmd + Shift + 3, Cmd + Shift + 4, Cmd + Shift + 5
      if (e.metaKey && e.shiftKey && ["3", "4", "5", "$", "#", "%"].includes(key)) {
        e.preventDefault();
        scrubClipboard();
        setShieldReason("Screenshot command detected: Action blocked");
        setIsShieldActive(true);
        showWarning("macOS screen capture is strictly prohibited.");
        setTimeout(() => setIsShieldActive(false), 2000);
        return false;
      }

      // Block Ctrl+S / Cmd+S (Save page / download)
      if (isCtrlOrMeta && (key === "s" || code === "KeyS")) {
        e.preventDefault();
        showWarning("Downloading file content is strictly disabled.");
        return false;
      }

      // Block Ctrl+P / Cmd+P (Print page / save as PDF)
      if (isCtrlOrMeta && (key === "p" || code === "KeyP")) {
        e.preventDefault();
        showWarning("Printing or exporting to PDF is strictly disabled.");
        return false;
      }

      // Block Ctrl+U / Cmd+U (View page source)
      if (isCtrlOrMeta && (key === "u" || code === "KeyU")) {
        e.preventDefault();
        return false;
      }

      // Block Ctrl+C / Cmd+C (Copy)
      if (isCtrlOrMeta && (key === "c" || code === "KeyC")) {
        e.preventDefault();
        scrubClipboard();
        showWarning("Copying text or content is strictly disabled.");
        return false;
      }

      // Block Ctrl+A / Cmd+A (Select All)
      if (isCtrlOrMeta && (key === "a" || code === "KeyA")) {
        e.preventDefault();
        return false;
      }

      // Block F12 and DevTools shortcuts (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C)
      if (
        key === "f12" ||
        code === "F12" ||
        (isCtrlOrMeta && e.shiftKey && ["i", "j", "c"].includes(key))
      ) {
        e.preventDefault();
        showWarning("Developer inspection is disabled.");
        return false;
      }
    };

    // 4. PrintScreen keyup listener (since some OS trigger snapshot on keyup)
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || e.code === "PrintScreen" || e.keyCode === 44) {
        scrubClipboard();
        setShieldReason("Screenshot action intercepted");
        setIsShieldActive(true);
        showWarning("Screenshot intercepted. Content protected.");
        setTimeout(() => setIsShieldActive(false), 2000);
      }
    };

    // 5. Block Context Menu (Right Click & Android long-press)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarning("Context menu and saving are disabled.");
      return false;
    };

    // 6. Block Dragging (Canvas / Image / Text dragging)
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 7. Block Copy & Cut
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      scrubClipboard();
      showWarning("Copying content is disabled.");
    };

    // 8. Android Touch Protections: Block Long Press Context Menu
    let touchTimer: NodeJS.Timeout | null = null;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 2) {
        // Multi-finger screenshot gesture detection on Android (e.g. 3-finger swipe)
        setIsShieldActive(true);
        setTimeout(() => setIsShieldActive(false), 1500);
      }
      touchTimer = setTimeout(() => {
        // Long press detected - cancel Android system popup
        scrubClipboard();
      }, 450);
    };

    const handleTouchEnd = () => {
      if (touchTimer) clearTimeout(touchTimer);
    };

    const handleTouchMove = () => {
      if (touchTimer) clearTimeout(touchTimer);
    };

    // 9. Poison Canvas Data Extraction (anti-canvas-scraping extensions)
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;

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
      // Ignore prototype lock
    }

    // Attach listeners
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    window.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCopy, true);
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      window.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCopy, true);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchmove", handleTouchMove);

      // Restore canvas prototype
      try {
        HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
        HTMLCanvasElement.prototype.toBlob = originalToBlob;
        CanvasRenderingContext2D.prototype.getImageData = originalGetImageData;
      } catch {
        // Ignore
      }
    };
  }, [scrubClipboard, showWarning]);

  return (
    <div
      className="relative w-full h-full select-none reader-secure-viewport"
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      {/* Underlying Content */}
      <div
        className={`w-full h-full transition-all duration-150 ${
          isShieldActive ? "blur-2xl opacity-10 pointer-events-none filter scale-[0.98]" : "opacity-100"
        }`}
      >
        {children}
      </div>

      {/* Screen Capture / Backgrounding Blackout Curtain */}
      {isShieldActive && (
        <div
          onClick={() => setIsShieldActive(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white p-6 text-center select-none cursor-pointer backdrop-blur-3xl animate-in fade-in duration-100"
        >
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 shadow-2xl">
            <Lock className="h-8 w-8 animate-pulse text-red-400" />
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-zinc-100 mb-2">
            Protected Study Material
          </h2>

          <p className="max-w-md text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
            {shieldReason}. For security, content is hidden while the reader window is
            unfocused or an external capture tool is active.
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
      )}

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
