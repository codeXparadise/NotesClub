"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileCode,
  ShieldAlert,
  Sliders,
  Grid,
  Sun,
  Moon,
  Sparkles,
  RotateCw,
  Eye,
  X,
  Smartphone,
  Heart,
} from "lucide-react";
import { Watermark } from "./Watermark";
import { SecurityShield } from "./SecurityShield";

interface DocumentReaderProps {
  documentId: string;
  documentTitle: string;
  mimeType?: string;
  streamToken: string;
  initialPage?: number;
  studentName: string;
  rollNumber: string | null;
  email: string;
  showWatermark?: boolean;
}

// Global in-memory buffer cache across components to avoid re-fetching on navigation
const documentBufferCache = new Map<string, ArrayBuffer>();

// Standalone script loader
function loadExternalScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return resolve();
    if (document.querySelector(`script[src="${src}"]`)) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load engine from ${src}`));
    document.head.appendChild(script);
  });
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  documentId,
  documentTitle,
  mimeType,
  streamToken,
  initialPage = 1,
  studentName,
  rollNumber,
  email,
  showWatermark = true,
}) => {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  // General State
  const [docFormat, setDocFormat] = useState<"pdf" | "docx" | "excel" | "markdown">("pdf");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scale, setScale] = useState(1.15);

  // PDF specific state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [pageInput, setPageInput] = useState(initialPage.toString());

  // Navigation Utilities State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [readingTone, setReadingTone] = useState<"default" | "night" | "sepia">("default");
  const [swipeIndicator, setSwipeIndicator] = useState<string | null>(null);

  // Non-PDF content states
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [excelSheets, setExcelSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  // Favorites / Wishlist State
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  // Touch gesture refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.favoriteIds)) {
          setIsFavorited(data.favoriteIds.includes(documentId));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [documentId]);

  const handleToggleFavorite = async () => {
    if (isFavLoading) return;
    setIsFavLoading(true);
    const nextState = !isFavorited;
    setIsFavorited(nextState);
    try {
      if (nextState) {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId }),
        });
        setSwipeIndicator("Saved to Wishlist ♥");
      } else {
        await fetch(`/api/favorites?documentId=${documentId}`, {
          method: "DELETE",
        });
        setSwipeIndicator("Removed from Wishlist");
      }
      setTimeout(() => setSwipeIndicator(null), 1800);
    } catch {
      setIsFavorited(!nextState);
    } finally {
      setIsFavLoading(false);
    }
  };

  // Detect format
  useEffect(() => {
    const lowerTitle = documentTitle.toLowerCase();
    const lowerMime = (mimeType || "").toLowerCase();

    if (lowerTitle.endsWith(".docx") || lowerTitle.endsWith(".doc") || lowerMime.includes("word")) {
      setDocFormat("docx");
    } else if (
      lowerTitle.endsWith(".xlsx") ||
      lowerTitle.endsWith(".xls") ||
      lowerTitle.endsWith(".csv") ||
      lowerMime.includes("spreadsheet") ||
      lowerMime.includes("excel")
    ) {
      setDocFormat("excel");
    } else if (
      lowerTitle.endsWith(".md") ||
      lowerTitle.endsWith(".txt") ||
      lowerTitle.endsWith(".htm") ||
      lowerTitle.endsWith(".html") ||
      lowerMime.includes("markdown") ||
      lowerMime === "text/plain" ||
      lowerMime === "text/html"
    ) {
      setDocFormat("markdown");
    } else {
      setDocFormat("pdf");
    }
  }, [documentTitle, mimeType]);

  // Save progress back to server
  const saveProgress = useCallback(
    async (page: number, total: number) => {
      try {
        await fetch("/api/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            lastPage: page,
            totalPages: total,
          }),
        });
      } catch (err) {
        console.warn("Failed to persist reading progress:", err);
      }
    },
    [documentId]
  );

  // Fetch document bytes (using in-memory cache when available)
  useEffect(() => {
    let isCancelled = false;

    async function loadDocument() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let arrayBuffer: ArrayBuffer;

        if (documentBufferCache.has(documentId)) {
          arrayBuffer = documentBufferCache.get(documentId)!;
        } else {
          const fileUrl = `/api/file/${documentId}?token=${encodeURIComponent(streamToken)}`;
          const response = await fetch(fileUrl);

          if (!response.ok) {
            if (response.status === 403) {
              throw new Error("Access restricted. Please refresh or verify permissions.");
            }
            throw new Error(`Failed to load document (${response.status})`);
          }

          arrayBuffer = await response.arrayBuffer();
          documentBufferCache.set(documentId, arrayBuffer);
        }

        if (isCancelled) return;

        // Render based on format
        if (docFormat === "docx") {
          await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
          const mammoth = (window as any).mammoth;
          if (!mammoth) throw new Error("Document previewer not ready. Please refresh.");
          const result = await mammoth.convertToHtml({ arrayBuffer });
          if (!isCancelled) {
            setHtmlContent(result.value || "<p>Empty document</p>");
            setTotalPages(1);
          }
        } else if (docFormat === "excel") {
          await loadExternalScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js");
          const XLSX = (window as any).XLSX;
          if (!XLSX) throw new Error("Spreadsheet previewer not ready. Please refresh.");
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          const sheets = workbook.SheetNames.map((sheetName: string) => ({
            name: sheetName,
            html: XLSX.utils.sheet_to_html(workbook.Sheets[sheetName], {
              header: "",
              footer: "",
            }),
          }));
          if (!isCancelled) {
            setExcelSheets(sheets);
            setActiveSheetIndex(0);
            setTotalPages(sheets.length || 1);
          }
        } else if (docFormat === "markdown") {
          const text = new TextDecoder().decode(arrayBuffer);
          if (!isCancelled) {
            setHtmlContent(text);
            setTotalPages(1);
          }
        } else {
          // PDF renderer using robust CDN bundle
          await loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
          const pdfjs = (window as any).pdfjsLib;
          if (!pdfjs) throw new Error("PDF renderer not ready. Please refresh.");

          pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

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

          const validStart = Math.min(Math.max(1, initialPage), count);
          setCurrentPage(validStart);
          setPageInput(validStart.toString());
          saveProgress(validStart, count);
        }
      } catch (err: any) {
        console.error("Document loader error:", err);
        if (!isCancelled) {
          setErrorMessage(err.message || "Failed to render document.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [documentId, streamToken, docFormat, initialPage, saveProgress]);

  // High-DPI Canvas Page Renderer with Background Pre-fetching
  const renderPdfPage = useCallback(
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

        let computedScale = scale;
        if (containerWidth < 768) {
          const fitScale = (containerWidth - 24) / baseViewport.width;
          computedScale = Math.max(fitScale, 0.5) * (scale / 1.15);
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

        // Pre-fetch next page in background for zero-latency page flips
        if (pageNumber < pdfDoc.numPages) {
          pdfDoc.getPage(pageNumber + 1).catch(() => {});
        }
        if (pageNumber > 1) {
          pdfDoc.getPage(pageNumber - 1).catch(() => {});
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error("Canvas render error:", err);
        }
      } finally {
        setIsRenderingPage(false);
      }
    },
    [pdfDoc, scale]
  );

  useEffect(() => {
    if (pdfDoc && docFormat === "pdf") {
      renderPdfPage(currentPage);
    }
  }, [pdfDoc, currentPage, scale, docFormat, renderPdfPage]);

  // Page navigation handlers
  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setPageInput(next.toString());
      saveProgress(next, totalPages);
    }
  }, [currentPage, totalPages, saveProgress]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setPageInput(prev.toString());
      saveProgress(prev, totalPages);
    }
  }, [currentPage, totalPages, saveProgress]);

  const jumpToPage = useCallback(
    (page: number) => {
      const target = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(target);
      setPageInput(target.toString());
      saveProgress(target, totalPages);
      setIsDrawerOpen(false);
    },
    [totalPages, saveProgress]
  );

  // Swipe Gesture Handlers (Mobile & Touchscreen)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const start = touchStartRef.current;
    touchStartRef.current = null;

    const deltaX = e.changedTouches[0].clientX - start.x;
    const deltaY = e.changedTouches[0].clientY - start.y;
    const deltaTime = Date.now() - start.time;

    // Must be predominantly horizontal and quick (<500ms)
    if (deltaTime < 500 && Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
      if (deltaX < 0) {
        // Swipe Left -> Next Page
        setSwipeIndicator("Next Page →");
        setTimeout(() => setSwipeIndicator(null), 700);
        goToNextPage();
      } else {
        // Swipe Right -> Previous Page
        setSwipeIndicator("← Previous Page");
        setTimeout(() => setSwipeIndicator(null), 700);
        goToPrevPage();
      }
    }
  };

  // Keyboard navigation & security interceptors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (docFormat === "pdf") {
        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
          goToNextPage();
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
          goToPrevPage();
        } else if (e.key === "Home") {
          jumpToPage(1);
        } else if (e.key === "End") {
          jumpToPage(totalPages);
        }
      }

      // Toggle controls with 'H'
      if (e.key.toLowerCase() === "h") {
        setControlsVisible((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docFormat, goToNextPage, goToPrevPage, jumpToPage, totalPages]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Canvas visual filter based on reading tone
  const toneFilterClass = useMemo(() => {
    if (readingTone === "night") {
      return "filter invert-[0.92] hue-rotate-180 contrast-[1.08] brightness-[0.96]";
    }
    if (readingTone === "sepia") {
      return "filter sepia-[0.38] contrast-[0.96] brightness-[0.97]";
    }
    return "";
  }, [readingTone]);

  return (
    <SecurityShield
      studentName={studentName}
      rollNumber={rollNumber}
      email={email}
      documentTitle={documentTitle}
    >
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 select-none overflow-hidden font-sans"
      >
        {/* Swipe Visual Feedback Toast */}
        {swipeIndicator && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-700 text-xs font-semibold text-zinc-200 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            {swipeIndicator}
          </div>
        )}

        {/* 1. Sleek Floating Header Pill */}
        <header
          className={`fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-[95%] sm:w-auto max-w-3xl ${
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-3 rounded-full border border-zinc-800/80 bg-zinc-950/85 px-3 sm:px-4 py-2 shadow-2xl backdrop-blur-md">
            {/* Back button */}
            <Link
              href="/home"
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition shrink-0"
              title="Return to Library"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="h-3.5 w-px bg-zinc-800 shrink-0" />

            {/* Document Title & Format Badge */}
            <div className="flex items-center space-x-2 min-w-0 max-w-[130px] sm:max-w-xs md:max-w-sm truncate">
              <span className="truncate text-xs font-medium text-zinc-200" title={documentTitle}>
                {documentTitle}
              </span>
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400">
                View Only
              </span>
            </div>

            <div className="h-3.5 w-px bg-zinc-800 shrink-0 hidden sm:block" />

            {/* Reading Tone Toggles (Paper, Night, Sepia) */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setReadingTone("default")}
                className={`px-2 py-0.5 text-[10px] rounded-full transition ${
                  readingTone === "default"
                    ? "bg-zinc-700 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Natural Paper tone"
              >
                Paper
              </button>
              <button
                onClick={() => setReadingTone("night")}
                className={`px-2 py-0.5 text-[10px] rounded-full transition ${
                  readingTone === "night"
                    ? "bg-zinc-700 text-white font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Night reading tone (dark)"
              >
                Night
              </button>
              <button
                onClick={() => setReadingTone("sepia")}
                className={`px-2 py-0.5 text-[10px] rounded-full transition ${
                  readingTone === "sepia"
                    ? "bg-amber-900/60 text-amber-200 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
                title="Sepia warm paper tone"
              >
                Sepia
              </button>
            </div>

            <div className="h-3.5 w-px bg-zinc-800 shrink-0" />

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1 text-zinc-400">
              <button
                onClick={() => setScale((s) => Math.max(0.7, s - 0.15))}
                className="p-1 hover:text-white transition"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="px-1 text-[11px] font-mono text-zinc-400 hidden sm:inline">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
                className="p-1 hover:text-white transition"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-3.5 w-px bg-zinc-800 shrink-0" />

            {/* Quick Page Jump Drawer Toggle */}
            {docFormat === "pdf" && (
              <button
                onClick={() => setIsDrawerOpen((o) => !o)}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                  isDrawerOpen
                    ? "bg-zinc-700 text-white"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
                title="Page Drawer & Quick Jump"
              >
                <Grid className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Wishlist / Favorite Heart Button */}
            <button
              onClick={handleToggleFavorite}
              disabled={isFavLoading}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                isFavorited
                  ? "bg-rose-500/20 text-rose-500 ring-1 ring-rose-500/50"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-rose-400"
              }`}
              title={isFavorited ? "Remove from Wishlist" : "Save to Wishlist"}
              aria-label="Wishlist"
            >
              <Heart
                className={`h-3.5 w-3.5 transition-transform ${
                  isFavorited ? "fill-rose-500 scale-110" : ""
                }`}
              />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </header>

        {/* 2. Main Reading Viewport */}
        <main
          className="relative flex-1 overflow-auto bg-[#09090b] flex items-center justify-center p-2 sm:p-6"
          onClick={() => {
            if (isDrawerOpen) setIsDrawerOpen(false);
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
              <p className="text-xs font-medium text-zinc-400 tracking-wide">
                Loading study document...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center max-w-sm p-6 text-center rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl">
              <ShieldAlert className="h-8 w-8 text-rose-500 mb-2" />
              <h3 className="text-sm font-semibold text-zinc-200">Unable to Open Note</h3>
              <p className="mt-1 text-xs text-zinc-400">{errorMessage}</p>
              <button
                onClick={() => router.push("/home")}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
              >
                Return to Library
              </button>
            </div>
          ) : docFormat === "pdf" ? (
            /* PDF Canvas Viewport with Gesture Support & Tone Filter */
            <div className="relative shadow-2xl transition-all duration-150">
              <canvas
                ref={canvasRef}
                className={`block rounded-sm transition-all duration-150 ${toneFilterClass}`}
                style={{
                  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.7)",
                }}
              />
              {showWatermark && (
                <Watermark
                  studentName={studentName}
                  rollNumber={rollNumber}
                  email={email}
                  page={currentPage}
                />
              )}
            </div>
          ) : docFormat === "docx" ? (
            /* Word Document Viewport */
            <div className="relative w-full max-w-4xl bg-zinc-900/90 border border-zinc-800 p-8 sm:p-12 rounded-2xl shadow-2xl overflow-auto max-h-[88vh]">
              <div
                className="docx-rendered-content text-zinc-200 selection:bg-zinc-800"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
              {showWatermark && (
                <Watermark
                  studentName={studentName}
                  rollNumber={rollNumber}
                  email={email}
                  page={1}
                />
              )}
            </div>
          ) : docFormat === "excel" ? (
            /* Excel Spreadsheet Viewport */
            <div className="relative w-full max-w-5xl bg-zinc-900/90 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-2xl overflow-auto max-h-[88vh]">
              {excelSheets.length > 1 && (
                <div className="flex space-x-2 border-b border-zinc-800 pb-2 mb-4 overflow-x-auto">
                  {excelSheets.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSheetIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                        activeSheetIndex === idx
                          ? "bg-zinc-800 text-white font-semibold"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
              <div
                className="excel-reader-table overflow-auto"
                dangerouslySetInnerHTML={{
                  __html: excelSheets[activeSheetIndex]?.html || "<p>Empty sheet</p>",
                }}
              />
              {showWatermark && (
                <Watermark
                  studentName={studentName}
                  rollNumber={rollNumber}
                  email={email}
                  page={activeSheetIndex + 1}
                />
              )}
            </div>
          ) : (
            /* Markdown / Text Viewport */
            <div className="relative w-full max-w-3xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-10 rounded-2xl shadow-2xl overflow-auto max-h-[88vh]">
              <pre className="font-mono text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {htmlContent}
              </pre>
              {showWatermark && (
                <Watermark
                  studentName={studentName}
                  rollNumber={rollNumber}
                  email={email}
                  page={1}
                />
              )}
            </div>
          )}
        </main>

        {/* 3. Quick Page Navigation Drawer (Slide-Over Panel) */}
        {isDrawerOpen && docFormat === "pdf" && (
          <div className="absolute right-0 top-0 bottom-0 w-72 sm:w-80 bg-zinc-950/95 border-l border-zinc-800/80 p-5 z-40 shadow-2xl flex flex-col justify-between backdrop-blur-xl animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <Grid className="h-4 w-4 text-[var(--accent)]" />
                  <span className="font-serif text-sm font-semibold text-zinc-100">
                    Jump to Page
                  </span>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Direct Jump Input */}
              <div className="my-4 flex items-center space-x-2">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      jumpToPage(parseInt(pageInput, 10) || 1);
                    }
                  }}
                  className="w-full h-9 rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-xs text-zinc-100 focus:outline-none focus:border-[var(--accent)]"
                  placeholder={`1 - ${totalPages}`}
                />
                <button
                  onClick={() => jumpToPage(parseInt(pageInput, 10) || 1)}
                  className="px-3 h-9 rounded-lg text-xs font-semibold text-white bg-[var(--accent)] hover:opacity-90 transition shrink-0"
                >
                  Go
                </button>
              </div>

              {/* Grid of Pages */}
              <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
                All Pages ({totalPages})
              </div>
              <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[58vh] pr-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  const isActive = pNum === currentPage;
                  return (
                    <button
                      key={pNum}
                      onClick={() => jumpToPage(pNum)}
                      className={`h-11 rounded-xl text-xs font-mono font-semibold flex items-center justify-center transition border ${
                        isActive
                          ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-md"
                          : "bg-zinc-900/90 text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile swipe helper tip */}
            <div className="pt-4 border-t border-zinc-800/80 flex items-center space-x-2 text-[11px] text-zinc-500">
              <Smartphone className="h-3.5 w-3.5 shrink-0" />
              <span>Swipe left / right on screen to flip pages</span>
            </div>
          </div>
        )}

        {/* 4. Bottom Scrubber & Quick Page Navigation Bar */}
        {docFormat === "pdf" && (
          <footer
            className={`fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-[95%] sm:w-auto max-w-lg ${
              controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="flex items-center space-x-3 rounded-full border border-zinc-800/80 bg-zinc-950/85 px-4 py-2 shadow-2xl backdrop-blur-md">
              {/* Prev Page Button */}
              <button
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Previous Page (← or Swipe Right)"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Interactive Page Scrubber Slider */}
              <div className="flex items-center space-x-2 flex-1 min-w-[130px] sm:min-w-[180px]">
                <input
                  type="range"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    jumpToPage(val);
                  }}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                />
              </div>

              {/* Page Counter Display */}
              <div className="flex items-center space-x-1 font-mono text-xs text-zinc-300 shrink-0">
                <span className="font-semibold text-white">{currentPage}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-500">{totalPages}</span>
              </div>

              {/* Next Page Button */}
              <button
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Next Page (→ or Swipe Left)"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        )}
      </div>
    </SecurityShield>
  );
};
