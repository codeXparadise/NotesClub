"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Watermark } from "./Watermark";
import { SecurityShield } from "./SecurityShield";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCw,
  Loader2,
  ShieldAlert,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface PdfViewerProps {
  documentId: string;
  documentTitle: string;
  streamToken: string;
  initialPage?: number;
  studentName: string;
  rollNumber: string | null;
  email: string;
  showWatermark?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  documentId,
  documentTitle,
  streamToken,
  initialPage = 1,
  studentName,
  rollNumber,
  email,
  showWatermark = true,
}) => {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.1);
  const [isLoadingDoc, setIsLoadingDoc] = useState<boolean>(true);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>(initialPage.toString());
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const renderTaskRef = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save reading progress to database
  const saveProgress = useCallback(
    (page: number, total: number) => {
      if (!documentId) return;

      const payload = {
        documentId,
        lastPage: page,
        totalPages: total || 1,
      };

      // Debounced fetch
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch("/api/progress", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } catch (e) {
          console.error("Progress save error:", e);
        }
      }, 600);
    },
    [documentId]
  );

  // Save on unload / page hide via keepalive fetch
  useEffect(() => {
    const handleUnload = () => {
      const payload = JSON.stringify({
        documentId,
        lastPage: currentPage,
        totalPages,
      });
      navigator.sendBeacon?.(
        "/api/progress",
        new Blob([payload], { type: "application/json" })
      );
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, [documentId, currentPage, totalPages]);

  // Load PDF document on mount
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      try {
        setIsLoadingDoc(true);
        setErrorMessage(null);

        // Load PDF.js safely via CDN without canvas bundling issue
        await new Promise<void>((resolve, reject) => {
          if ((window as any).pdfjsLib) return resolve();
          if (document.querySelector('script[src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"]')) {
            return resolve();
          }
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          s.async = true;
          s.onload = () => resolve();
          s.onerror = (e) => reject(e);
          document.head.appendChild(s);
        });

        const pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) throw new Error("PDF renderer not ready. Please refresh.");
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

        // Fetch protected stream with short-lived token
        const fileUrl = `/api/file/${documentId}?token=${encodeURIComponent(streamToken)}`;
        const response = await fetch(fileUrl);

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error("Access denied. You do not have permission to view this document.");
          } else if (response.status === 401) {
            throw new Error("Session expired or invalid view token. Please refresh.");
          } else {
            throw new Error(`Failed to load document (Status ${response.status}).`);
          }
        }

        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjs.getDocument({
          data: arrayBuffer,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/",
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        const count = doc.numPages;
        setTotalPages(count);

        // Validate page range
        const validStartPage = Math.min(Math.max(1, initialPage), count);
        setCurrentPage(validStartPage);
        setPageInput(validStartPage.toString());
        saveProgress(validStartPage, count);
      } catch (err: any) {
        console.error("PDF load error:", err);
        if (!isCancelled) {
          setErrorMessage(err.message || "Failed to load document.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDoc(false);
        }
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [documentId, streamToken, initialPage, saveProgress]);

  // Render current page to Canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        setIsRenderingPage(true);

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const containerWidth =
          containerRef.current?.clientWidth || window.innerWidth;
        const baseViewport = page.getViewport({ scale: 1 });

        // Calculate responsive scale (mobile-first auto-fit width)
        let computedScale = scale;
        if (containerWidth < 640) {
          // Mobile: fit screen width with 16px padding
          const fitScale = (containerWidth - 32) / baseViewport.width;
          computedScale = Math.max(fitScale, 0.6) * (scale / 1.1);
        }

        const viewport = page.getViewport({ scale: computedScale });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Page render error:", err);
        }
      } finally {
        setIsRenderingPage(false);
      }
    },
    [pdfDoc, scale]
  );

  useEffect(() => {
    if (pdfDoc) {
      renderPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, renderPage]);

  // Page Navigation Handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setPageInput(next.toString());
      saveProgress(next, totalPages);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setPageInput(prev.toString());
      saveProgress(prev, totalPages);
    }
  };

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setCurrentPage(p);
      saveProgress(p, totalPages);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.2, 2.5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.2, 0.7));
  const resetZoom = () => setScale(1.1);

  // Security deterrents: intercept right click and print shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setSecurityWarning("Content is protected. Right-click actions are disabled.");
      setTimeout(() => setSecurityWarning(null), 3500);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Intercept Ctrl+P (Print), Ctrl+S (Save), Ctrl+U (Source), F12 (Inspect)
      if (
        (e.ctrlKey && (e.key === "p" || e.key === "s" || e.key === "u")) ||
        (e.metaKey && (e.key === "p" || e.key === "s")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
        setSecurityWarning("Content protection: Printing, saving and inspect tools are disabled.");
        setTimeout(() => setSecurityWarning(null), 3500);
      }

      // Keyboard arrow navigation
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        goToNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        goToPrevPage();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPage, totalPages, goToNextPage, goToPrevPage]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  return (
    <SecurityShield
      studentName={studentName}
      rollNumber={rollNumber}
      email={email}
      documentTitle={documentTitle}
    >
      <div
        ref={containerRef}
        className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 select-none protected-canvas-container overflow-hidden"
      >
      {/* Top Bar: Nav & Metadata */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-3 md:px-5 backdrop-blur z-30">
        <div className="flex items-center space-x-3 overflow-hidden">
          <Link
            href="/home"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="truncate">
            <h1 className="truncate text-xs md:text-sm font-semibold text-slate-100">
              {documentTitle}
            </h1>
            <p className="text-[10px] md:text-xs text-indigo-400">
              Resume Synced • Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {/* Desktop Zoom & View Controls */}
        <div className="flex items-center space-x-1.5 md:space-x-2">
          <div className="hidden sm:flex items-center space-x-1 bg-slate-800/80 rounded-lg p-1">
            <button
              onClick={zoomOut}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={resetZoom}
              className="px-2 text-xs font-mono text-slate-300 hover:text-white transition"
              title="Reset Zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={zoomIn}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Security Deterrent Toast */}
      {securityWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 rounded-xl bg-amber-500/95 px-4 py-2.5 text-xs font-medium text-slate-950 shadow-lg backdrop-blur animate-fade-in">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{securityWarning}</span>
        </div>
      )}

      {/* Main Reader Viewport */}
      <main className="relative flex-1 overflow-auto bg-slate-900/60 p-2 md:p-6 flex items-center justify-center">
        {isLoadingDoc ? (
          <div className="flex flex-col items-center justify-center space-y-3 p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-300">
              Loading note from Google Drive...
            </p>
            <p className="text-xs text-slate-500 max-w-xs">
              Verifying security token and preparing canvas reader with your personal watermark.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center max-w-md space-y-4 p-8 text-center bg-slate-900 rounded-2xl border border-slate-800">
            <ShieldAlert className="h-10 w-10 text-rose-500" />
            <h3 className="text-base font-semibold text-slate-100">
              Access Restricted
            </h3>
            <p className="text-xs text-slate-400">{errorMessage}</p>
            <button
              onClick={() => router.push("/home")}
              className="mt-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-medium text-white hover:bg-indigo-700 transition"
            >
              Return to Catalogue
            </button>
          </div>
        ) : (
          <div className="relative inline-block shadow-2xl rounded-lg overflow-hidden border border-slate-800 bg-white">
            {/* Watermark Overlay */}
            {showWatermark && (
              <Watermark
                studentName={studentName}
                rollNumber={rollNumber}
                email={email}
                page={currentPage}
              />
            )}

            {/* Rendering Spinner */}
            {isRenderingPage && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            )}

            {/* High-Resolution Canvas */}
            <canvas ref={canvasRef} className="block max-w-full" />
          </div>
        )}
      </main>

      {/* Bottom Floating Navigation Toolbar */}
      {!isLoadingDoc && !errorMessage && (
        <footer className="flex h-16 shrink-0 items-center justify-between border-t border-slate-800/80 bg-slate-900/95 px-4 md:px-8 backdrop-blur z-30">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="flex items-center space-x-1 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Jump-to-Page Input */}
          <form
            onSubmit={handlePageSubmit}
            className="flex items-center space-x-2 text-xs text-slate-400"
          >
            <span>Page</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              className="h-8 w-14 rounded-lg border border-slate-700 bg-slate-800 text-center text-xs font-semibold text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
            <span>of {totalPages}</span>
          </form>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="flex items-center space-x-1 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none transition shadow-sm shadow-indigo-600/30"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </footer>
      )}
      </div>
    </SecurityShield>
  );
};
