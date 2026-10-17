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
  ScrollText,
  BookOpen,
  Search,
} from "lucide-react";
import { Watermark } from "./Watermark";
import { SecurityShield } from "./SecurityShield";
import { PdfPageItem } from "./PdfPageItem";

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

// Standalone script loader with local vendor priority and CDN fallback
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
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // General State
  const [docFormat, setDocFormat] = useState<"pdf" | "docx" | "excel" | "markdown">("pdf");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(800);

  // View Mode: Continuous Vertical Scroll (Default) vs Single Page Flip
  const [viewMode, setViewMode] = useState<"continuous" | "single">("continuous");

  // PDF specific state
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [pageInput, setPageInput] = useState(initialPage.toString());

  // Navigation Utilities State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [readingTone, setReadingTone] = useState<"default" | "night" | "sepia">("default");
  const [swipeIndicator, setSwipeIndicator] = useState<string | null>(null);

  // Non-PDF content states
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [excelSheets, setExcelSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [excelSearchQuery, setExcelSearchQuery] = useState("");

  // Favorites / Wishlist State
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFavLoading, setIsFavLoading] = useState(false);

  // Measure container width for responsive scaling
  useEffect(() => {
    const updateWidth = () => {
      if (mainScrollRef.current) {
        setContainerWidth(mainScrollRef.current.clientWidth);
      } else if (typeof window !== "undefined") {
        setContainerWidth(window.innerWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Fetch Wishlist status
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

  // Fetch document bytes & detect format using Magic Bytes + Filename + MIME
  useEffect(() => {
    let isCancelled = false;

    async function loadDocument() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        let arrayBuffer: ArrayBuffer | null = null;

        if (documentBufferCache.has(documentId)) {
          arrayBuffer = documentBufferCache.get(documentId)!;
        } else {
          // 1. Check Browser CacheStorage (instant sub-5ms local load without network request)
          let cachedFromBrowser = false;
          if (typeof window !== "undefined" && "caches" in window) {
            try {
              const cache = await caches.open("notesclub_doc_cache_v1");
              const cachedResp = await cache.match(`/doc-cache/${documentId}`);
              if (cachedResp) {
                arrayBuffer = await cachedResp.arrayBuffer();
                documentBufferCache.set(documentId, arrayBuffer);
                cachedFromBrowser = true;
              }
            } catch (cacheErr) {
              console.warn("Browser CacheStorage read ignored:", cacheErr);
            }
          }

          if (!cachedFromBrowser) {
            const fileUrl = `/api/file/${documentId}?token=${encodeURIComponent(streamToken)}`;
            let response: Response;
            try {
              response = await fetch(fileUrl);
            } catch {
              // Automatic retry after 600ms on network blip
              await new Promise((r) => setTimeout(r, 600));
              response = await fetch(fileUrl);
            }

            if (!response.ok) {
              if (response.status === 403) {
                throw new Error("Access restricted. Please refresh or verify permissions.");
              }
              throw new Error(`Failed to load document (${response.status})`);
            }

            arrayBuffer = await response.arrayBuffer();
            documentBufferCache.set(documentId, arrayBuffer);

            // Persist to browser CacheStorage for future 0ms loads
            if (typeof window !== "undefined" && "caches" in window) {
              try {
                const cache = await caches.open("notesclub_doc_cache_v1");
                const mime = response.headers.get("Content-Type") || "application/pdf";
                await cache.put(
                  `/doc-cache/${documentId}`,
                  new Response(arrayBuffer.slice(0), {
                    headers: { "Content-Type": mime },
                  })
                );
              } catch (cacheWriteErr) {
                console.warn("Browser CacheStorage write skipped:", cacheWriteErr);
              }
            }
          }
        }

        if (isCancelled) return;
        if (!arrayBuffer) {
          throw new Error("Could not retrieve document stream. Please try again.");
        }

        // Magic byte detection
        const uint8 = new Uint8Array(arrayBuffer);
        const isPdf =
          uint8.length >= 4 &&
          uint8[0] === 0x25 &&
          uint8[1] === 0x50 &&
          uint8[2] === 0x44 &&
          uint8[3] === 0x46; // %PDF

        const isZip =
          uint8.length >= 4 &&
          uint8[0] === 0x50 &&
          uint8[1] === 0x4b; // PK (Office XML / Zip)

        const lowerTitle = documentTitle.toLowerCase();
        const lowerMime = (mimeType || "").toLowerCase();

        // 1. WORD DOCUMENT (.docx, .doc)
        if (
          lowerTitle.endsWith(".docx") ||
          lowerTitle.endsWith(".doc") ||
          lowerMime.includes("word") ||
          (isZip && (lowerTitle.includes("doc") || !lowerTitle.includes("xls")))
        ) {
          try {
            // Load local mammoth script first, fallback to CDN
            await loadExternalScript("/vendor/mammoth.browser.min.js").catch(() =>
              loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js")
            );

            const mammoth = (window as any).mammoth;
            if (mammoth) {
              const result = await mammoth.convertToHtml({ arrayBuffer });
              if (!isCancelled) {
                setDocFormat("docx");
                setHtmlContent(result.value || "<p>Empty document</p>");
                setTotalPages(1);
                setIsLoading(false);
                return;
              }
            }
          } catch (docxErr) {
            console.warn("Mammoth conversion failed, trying fallback:", docxErr);
          }
        }

        // 2. EXCEL SPREADSHEET (.xlsx, .xls, .csv)
        if (
          lowerTitle.endsWith(".xlsx") ||
          lowerTitle.endsWith(".xls") ||
          lowerTitle.endsWith(".csv") ||
          lowerMime.includes("spreadsheet") ||
          lowerMime.includes("excel") ||
          (isZip && lowerTitle.includes("xls"))
        ) {
          try {
            // Load local xlsx script first, fallback to CDN
            await loadExternalScript("/vendor/xlsx.full.min.js").catch(() =>
              loadExternalScript("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js")
            );

            const XLSX = (window as any).XLSX;
            if (XLSX) {
              const workbook = XLSX.read(arrayBuffer, { type: "array" });
              if (workbook.SheetNames && workbook.SheetNames.length > 0) {
                const sheets = workbook.SheetNames.map((sheetName: string) => ({
                  name: sheetName,
                  html: XLSX.utils.sheet_to_html(workbook.Sheets[sheetName], {
                    header: "",
                    footer: "",
                  }),
                }));

                if (!isCancelled) {
                  setDocFormat("excel");
                  setExcelSheets(sheets);
                  setActiveSheetIndex(0);
                  setTotalPages(sheets.length || 1);
                  setIsLoading(false);
                  return;
                }
              }
            }
          } catch (xlsErr) {
            console.warn("XLSX parsing failed, trying fallback:", xlsErr);
          }
        }

        // 3. CODE / TEXT / MARKDOWN
        if (
          !isPdf &&
          !isZip &&
          (lowerTitle.endsWith(".md") ||
            lowerTitle.endsWith(".txt") ||
            lowerTitle.endsWith(".htm") ||
            lowerTitle.endsWith(".html") ||
            lowerTitle.endsWith(".json") ||
            lowerTitle.endsWith(".js") ||
            lowerTitle.endsWith(".py") ||
            lowerTitle.endsWith(".cpp") ||
            lowerTitle.endsWith(".java") ||
            lowerMime.includes("text") ||
            lowerMime.includes("json"))
        ) {
          const text = new TextDecoder("utf-8").decode(arrayBuffer);
          if (!isCancelled) {
            setDocFormat("markdown");
            setHtmlContent(text);
            setTotalPages(1);
            setIsLoading(false);
            return;
          }
        }

        // 4. PDF DOCUMENT (Default & Standard)
        setDocFormat("pdf");
        // Load local PDF.js script first, fallback to CDN
        await loadExternalScript("/vendor/pdf.min.js").catch(() =>
          loadExternalScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js")
        );

        const pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) throw new Error("PDF renderer not ready. Please refresh.");

        pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.js";

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

        // Scroll to initial page if continuous scroll and starting page > 1
        setTimeout(() => {
          if (validStart > 1) {
            document.getElementById(`pdf-page-${validStart}`)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 300);
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
  }, [documentId, streamToken, documentTitle, mimeType, initialPage, saveProgress]);

  // Smooth Zoom Handlers with Clamp
  const handleZoomIn = useCallback(() => {
    setScale((prev) => {
      const next = Math.min(Math.round((prev + 0.15) * 100) / 100, 3.0);
      setSwipeIndicator(`${Math.round(next * 100)}% Zoom In`);
      setTimeout(() => setSwipeIndicator(null), 900);
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(Math.round((prev - 0.15) * 100) / 100, 0.5);
      setSwipeIndicator(`${Math.round(next * 100)}% Zoom Out`);
      setTimeout(() => setSwipeIndicator(null), 900);
      return next;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1.0);
    setSwipeIndicator("100% Fit Width");
    setTimeout(() => setSwipeIndicator(null), 900);
  }, []);

  // Keyboard Shortcuts: Ctrl + / Ctrl - / Ctrl 0, Page Up / Page Down, Arrow Keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Zoom Shortcuts: Ctrl + / Ctrl = (Zoom In), Ctrl - (Zoom Out), Ctrl 0 (Reset)
      if (isCtrlOrMeta) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoomIn();
          return;
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          handleZoomOut();
          return;
        } else if (e.key === "0") {
          e.preventDefault();
          handleResetZoom();
          return;
        }
      }

      // Page Navigation
      if (docFormat === "pdf") {
        if (e.key === "ArrowDown" || e.key === "PageDown") {
          if (viewMode === "single") {
            goToNextPage();
          }
        } else if (e.key === "ArrowUp" || e.key === "PageUp") {
          if (viewMode === "single") {
            goToPrevPage();
          }
        } else if (e.key === "Home") {
          jumpToPage(1);
        } else if (e.key === "End") {
          jumpToPage(totalPages);
        }
      }

      // Hide / Show controls with 'H'
      if (e.key.toLowerCase() === "h") {
        setControlsVisible((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [docFormat, viewMode, totalPages, handleZoomIn, handleZoomOut, handleResetZoom]);

  // Page Navigation Handlers
  const jumpToPage = useCallback(
    (page: number) => {
      const target = Math.min(Math.max(1, page), totalPages);
      setCurrentPage(target);
      setPageInput(target.toString());
      saveProgress(target, totalPages);
      setIsDrawerOpen(false);

      if (viewMode === "continuous") {
        const pageEl = document.getElementById(`pdf-page-${target}`);
        if (pageEl) {
          pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    },
    [totalPages, saveProgress, viewMode]
  );

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      jumpToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, jumpToPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      jumpToPage(currentPage - 1);
    }
  }, [currentPage, jumpToPage]);

  // Called when a page enters the viewport during continuous scroll
  const handlePageVisible = useCallback(
    (pageNumber: number) => {
      setCurrentPage(pageNumber);
      setPageInput(pageNumber.toString());
      saveProgress(pageNumber, totalPages);
    },
    [saveProgress, totalPages]
  );

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

  // Canvas visual tone filter class
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
        className="relative flex flex-col h-screen w-screen bg-[#09090b] text-zinc-100 select-text overflow-hidden font-sans reader-secure-viewport"
      >
        {/* Zoom & Action Feedback Toast */}
        {swipeIndicator && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-700 text-xs font-semibold text-zinc-200 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
            {swipeIndicator}
          </div>
        )}

        {/* 1. TOP TOOLBAR PILL */}
        <header
          className={`fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-[96%] sm:w-auto max-w-4xl ${
            controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
          }`}
        >
          <div className="flex items-center justify-between sm:justify-start space-x-2 sm:space-x-3 rounded-full border border-zinc-800/90 bg-zinc-950/90 px-3 sm:px-4 py-2 shadow-2xl backdrop-blur-md">
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
            <div className="flex items-center space-x-2 min-w-0 max-w-[120px] sm:max-w-xs md:max-w-sm truncate">
              <span className="truncate text-xs font-medium text-zinc-200" title={documentTitle}>
                {documentTitle}
              </span>
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase bg-zinc-800 text-zinc-400">
                {docFormat}
              </span>
            </div>

            <div className="h-3.5 w-px bg-zinc-800 shrink-0 hidden sm:block" />

            {/* View Mode Toggle (Continuous Vertical Scroll vs Single Page) */}
            {docFormat === "pdf" && (
              <div className="hidden sm:flex items-center bg-zinc-900 rounded-full p-0.5 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setViewMode("continuous")}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition ${
                    viewMode === "continuous"
                      ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Continuous Vertical Scroll (Normal PDF View)"
                >
                  <ScrollText className="h-3 w-3" />
                  <span>Scroll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("single")}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition ${
                    viewMode === "single"
                      ? "bg-[var(--accent)] text-white shadow-xs font-semibold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Single Page Flip Mode"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Page</span>
                </button>
              </div>
            )}

            <div className="h-3.5 w-px bg-zinc-800 shrink-0 hidden md:block" />

            {/* Reading Tone Toggles (Paper, Night, Sepia) */}
            <div className="hidden md:flex items-center space-x-1">
              <button
                type="button"
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
                type="button"
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
                type="button"
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

            {/* Smooth Zoom Controls & Reset */}
            <div className="flex items-center space-x-1 text-zinc-400">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 hover:text-white transition"
                title="Zoom Out (Ctrl -)"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="px-1.5 py-0.5 text-[11px] font-mono text-zinc-300 hover:text-white transition cursor-pointer"
                title="Click to reset zoom (Ctrl 0)"
              >
                {Math.round(scale * 100)}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 hover:text-white transition"
                title="Zoom In (Ctrl +)"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="h-3.5 w-px bg-zinc-800 shrink-0" />

            {/* Quick Page Jump Drawer Toggle */}
            {docFormat === "pdf" && (
              <button
                type="button"
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

            {/* Wishlist / Favorite Button */}
            <button
              type="button"
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
              type="button"
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

        {/* 2. MAIN READING VIEWPORT */}
        <main
          ref={mainScrollRef}
          className="relative flex-1 overflow-y-auto overflow-x-auto bg-[#09090b] flex flex-col items-center pt-16 sm:pt-20 pb-20 px-2 sm:px-6 scroll-smooth select-text"
          onClick={() => {
            if (isDrawerOpen) setIsDrawerOpen(false);
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 text-center my-auto">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
              <p className="text-xs font-medium text-zinc-400 tracking-wide">
                Loading study document...
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center max-w-sm p-6 text-center rounded-2xl border border-zinc-800 bg-zinc-900/60 shadow-xl my-auto">
              <ShieldAlert className="h-8 w-8 text-rose-500 mb-2" />
              <h3 className="text-sm font-semibold text-zinc-200">Unable to Open Note</h3>
              <p className="mt-1 text-xs text-zinc-400">{errorMessage}</p>
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition"
              >
                Return to Library
              </button>
            </div>
          ) : docFormat === "pdf" && pdfDoc ? (
            /* PDF VIEWPORT (Continuous Vertical Scroll or Single Page) */
            viewMode === "continuous" ? (
              <div
                className="flex flex-col items-center w-full max-w-full transition-transform duration-75 select-text"
                style={{
                  transformOrigin: "top center",
                }}
              >
                {Array.from({ length: totalPages }, (_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <PdfPageItem
                      key={pNum}
                      pageNumber={pNum}
                      pdfDoc={pdfDoc}
                      scale={scale}
                      toneFilterClass={toneFilterClass}
                      showWatermark={showWatermark}
                      studentName={studentName}
                      rollNumber={rollNumber}
                      email={email}
                      containerWidth={containerWidth}
                      onPageVisible={handlePageVisible}
                      onLinkClick={jumpToPage}
                    />
                  );
                })}
              </div>
            ) : (
              /* Single Page Mode */
              <div className="my-auto">
                <PdfPageItem
                  pageNumber={currentPage}
                  pdfDoc={pdfDoc}
                  scale={scale}
                  toneFilterClass={toneFilterClass}
                  showWatermark={showWatermark}
                  studentName={studentName}
                  rollNumber={rollNumber}
                  email={email}
                  containerWidth={containerWidth}
                  onPageVisible={handlePageVisible}
                  onLinkClick={jumpToPage}
                />
              </div>
            )
          ) : docFormat === "docx" ? (
            /* WORD DOCUMENT VIEWPORT */
            <div className="relative w-full max-w-4xl bg-zinc-900/90 border border-zinc-800 p-8 sm:p-14 rounded-2xl shadow-2xl my-auto text-zinc-100 select-text overflow-hidden">
              <div
                className="docx-rendered-content prose prose-invert max-w-none text-zinc-200 selection:bg-zinc-800 leading-relaxed space-y-4"
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
            /* EXCEL SPREADSHEET VIEWPORT */
            <div className="relative w-full max-w-6xl bg-zinc-900/95 border border-zinc-800 p-4 sm:p-6 rounded-2xl shadow-2xl my-auto text-zinc-100 select-text">
              {/* Sheet Switcher & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3 mb-4">
                {/* Sheets Tabs */}
                <div className="flex items-center space-x-1 overflow-x-auto">
                  {excelSheets.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSheetIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        activeSheetIndex === idx
                          ? "bg-[var(--accent)] text-white font-semibold shadow-xs"
                          : "bg-zinc-800/60 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                {/* Filter Table Rows */}
                <div className="flex items-center space-x-2 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <Search className="h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={excelSearchQuery}
                    onChange={(e) => setExcelSearchQuery(e.target.value)}
                    placeholder="Search spreadsheet rows..."
                    className="bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none w-48"
                  />
                  {excelSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setExcelSearchQuery("")}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Formatted Excel Table */}
              <div
                className="excel-reader-table overflow-x-auto max-h-[75vh]"
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
            /* CODE / MARKDOWN / TEXT VIEWPORT */
            <div className="relative w-full max-w-4xl bg-zinc-900/90 border border-zinc-800 p-6 sm:p-10 rounded-2xl shadow-2xl my-auto text-zinc-100 select-text overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                  <FileCode className="h-4 w-4 text-[var(--accent)]" />
                  <span>{documentTitle}</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Formatted Text
                </span>
              </div>
              <pre className="font-mono text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[75vh] p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
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

        {/* 3. QUICK PAGE NAVIGATION DRAWER (Slide-Over Panel) */}
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
                  type="button"
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
                  type="button"
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
                      type="button"
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

            {/* Helper tips */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-1 text-[11px] text-zinc-500">
              <div className="flex items-center space-x-1.5">
                <ScrollText className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                <span>Continuous vertical scroll active</span>
              </div>
              <div className="text-[10px] text-zinc-600">
                Shortcuts: Ctrl + / Ctrl - to zoom, Ctrl 0 to reset
              </div>
            </div>
          </div>
        )}

        {/* 4. BOTTOM FLOATING SCRUBBER BAR */}
        {docFormat === "pdf" && (
          <footer
            className={`fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 w-[95%] sm:w-auto max-w-lg ${
              controlsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            }`}
          >
            <div className="flex items-center space-x-3 rounded-full border border-zinc-800/80 bg-zinc-950/90 px-4 py-2 shadow-2xl backdrop-blur-md">
              {/* Prev Page Button */}
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage <= 1}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Previous Page (Up Arrow or PgUp)"
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
                type="button"
                onClick={goToNextPage}
                disabled={currentPage >= totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
                title="Next Page (Down Arrow or PgDn)"
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
