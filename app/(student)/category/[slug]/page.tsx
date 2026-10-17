"use client";

import React, { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  BookOpen,
  ArrowLeft,
  Sun,
  Moon,
  X,
  FileText,
  FolderOpen,
  Sparkles,
  ChevronRight,
  Filter,
  Heart,
} from "lucide-react";

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  "E-Books": ["#5E8AC7", "#7FB0E0"],
  "DSA": ["#E0A23F", "#F0C878"],
  "Web Development": ["#3F9E77", "#6FC6A0"],
  "Interview Prep": ["#C77BA0", "#E0A6C0"],
  "Cheat Sheets": ["#E08A4A", "#F0B078"],
  "Handwritten Notes": ["#B77B7B", "#D6A0A0"],
  "Projects": ["#A08A5E", "#C4B084"],
  "Roadmaps": ["#5E9BB5", "#8CC0D6"],
  "Resume & Career": ["#7E8FB0", "#A6B6D0"],
  "Tools & Shortcuts": ["#6E9B6E", "#9CC09C"],
  "Semester Notes": ["#C99A5B", "#E0BE86"],
  "Resources": ["#8A8A8A", "#B0B0B0"],
};

function getCategoryGradient(name: string): [string, string] {
  for (const [key, grad] of Object.entries(CATEGORY_GRADIENTS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return grad;
    }
  }
  return ["#5E8AC7", "#7FB0E0"];
}

function getCategoryMonogram(name: string): string {
  const parts = name.split(/[\s·\-_/]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "NC";
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "1.2 MB";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getFileBadge(mime: string, title: string) {
  const lowerTitle = title.toLowerCase();
  if (mime?.includes("pdf") || lowerTitle.endsWith(".pdf")) {
    return { label: "PDF", bg: "rgba(224, 90, 71, 0.12)", color: "#E05A47" };
  }
  if (mime?.includes("sheet") || mime?.includes("excel") || lowerTitle.endsWith(".xlsx") || lowerTitle.endsWith(".csv")) {
    return { label: "EXCEL", bg: "rgba(63, 158, 119, 0.12)", color: "#3F9E77" };
  }
  if (mime?.includes("word") || mime?.includes("document") || lowerTitle.endsWith(".docx")) {
    return { label: "DOC", bg: "rgba(94, 138, 199, 0.12)", color: "#5E8AC7" };
  }
  if (mime?.includes("markdown") || lowerTitle.endsWith(".md")) {
    return { label: "MD", bg: "rgba(201, 154, 91, 0.12)", color: "#C99A5B" };
  }
  return { label: "NOTE", bg: "rgba(126, 143, 176, 0.12)", color: "#7E8FB0" };
}

interface Subcategory {
  name: string;
  slug: string;
  count: number;
  subjects: string[];
}

interface DocumentItem {
  id: string;
  title: string;
  slug: string;
  path: string;
  subcategory: string;
  subject: string;
  mime_type: string;
  size_bytes: number;
  page_count: number;
  updated_at?: string;
}

interface CategoryData {
  name: string;
  slug: string;
  totalDocs: number;
  subcategories: Subcategory[];
}

export default function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [category, setCategory] = useState<CategoryData | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Fetch favorites
  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.favoriteIds)) {
          setFavoriteIds(new Set(data.favoriteIds));
        }
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = async (docId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isFav = favoriteIds.has(docId);
    const next = new Set(favoriteIds);
    if (isFav) {
      next.delete(docId);
      setFavoriteIds(next);
      await fetch(`/api/favorites?documentId=${docId}`, { method: "DELETE" });
    } else {
      next.add(docId);
      setFavoriteIds(next);
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
    }
  };

  // Theme setup
  useEffect(() => {
    const isDark =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("notes_club_theme") === "dark";
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("notes_club_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("notes_club_theme", "light");
    }
  };

  // Fetch category data
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    async function loadCategory() {
      try {
        const res = await fetch(`/api/category/${resolvedParams.slug}`);
        if (!res.ok) throw new Error("Category load failed");
        const data = await res.json();
        if (isCancelled) return;

        setCategory(data.category);
        setDocuments(data.documents || []);
      } catch (err) {
        console.error("Failed to load category:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadCategory();
    return () => {
      isCancelled = true;
    };
  }, [resolvedParams.slug]);

  // Active subcategory details
  const currentSubcategoryObj = useMemo(() => {
    if (!category || selectedSubcategory === "all") return null;
    return category.subcategories.find((s) => s.name === selectedSubcategory) || null;
  }, [category, selectedSubcategory]);

  // Available subjects for the active subcategory
  const availableSubjects = useMemo(() => {
    return currentSubcategoryObj?.subjects || [];
  }, [currentSubcategoryObj]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Subcategory filter
      if (selectedSubcategory !== "all" && doc.subcategory !== selectedSubcategory) {
        return false;
      }
      // Subject filter
      if (selectedSubject !== "all" && doc.subject !== selectedSubject) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = doc.title.toLowerCase().includes(q);
        const pathMatch = doc.path.toLowerCase().includes(q);
        const subMatch = doc.subcategory.toLowerCase().includes(q);
        const subjMatch = doc.subject.toLowerCase().includes(q);
        return titleMatch || pathMatch || subMatch || subjMatch;
      }
      return true;
    });
  }, [documents, selectedSubcategory, selectedSubject, searchQuery]);

  const [gradStart, gradEnd] = getCategoryGradient(category?.name || "Category");
  const monogram = getCategoryMonogram(category?.name || "NC");

  return (
    <div
      className="min-h-screen font-sans text-[var(--ink)] antialiased transition-colors duration-300 pb-20"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      {/* Top Bar Header */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-md"
        style={{
          backgroundColor: isDarkMode ? "rgba(26, 23, 20, 0.85)" : "rgba(247, 245, 238, 0.85)",
          borderColor: "var(--line)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/home"
              className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition hover:opacity-80"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--line)",
                color: "var(--ink)",
              }}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Library</span>
            </Link>

            <span className="text-[var(--muted)] text-xs">/</span>
            <span className="font-serif text-sm font-medium truncate max-w-[200px] sm:max-w-none text-[var(--ink)]">
              {category?.name || "Category"}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="h-9 w-9 rounded-full flex items-center justify-center border transition"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--line)",
              }}
              title="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-amber-500" />
              ) : (
                <Moon className="h-4 w-4 text-[var(--ink-2)]" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-8 pt-8 sm:pt-10 space-y-8">
        {/* Category Hero Banner */}
        <section
          className="rounded-[24px] border p-6 sm:p-8 relative overflow-hidden shadow-sm"
          style={{
            backgroundColor: "var(--surface)",
            borderColor: "var(--line)",
          }}
        >
          {/* Subtle background glow */}
          <div
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
            style={{
              background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
            }}
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center space-x-4 sm:space-x-5">
              {/* Monogram Box */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-[18px] shrink-0 flex items-center justify-center text-white shadow-md relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none opacity-20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, rgba(255,255,255,.2) 0 4px, transparent 4px 8px)",
                  }}
                />
                <span className="font-serif text-2xl sm:text-3xl font-bold select-none drop-shadow">
                  {monogram}
                </span>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight text-[var(--ink)]">
                  {category?.name || "Loading collection…"}
                </h1>
                <p className="text-xs sm:text-sm text-[var(--muted)] flex items-center gap-2">
                  <span>{category?.totalDocs || documents.length} study files</span>
                  {category?.subcategories && category.subcategories.length > 0 && (
                    <>
                      <span>&bull;</span>
                      <span>{category.subcategories.length} subcategories</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Quick in-category Search Bar */}
            <div className="w-full sm:w-72 lg:w-80">
              <div
                className="relative flex items-center w-full h-11 rounded-[14px] px-3 transition border focus-within:ring-2"
                style={{
                  backgroundColor: "var(--surface-2)",
                  borderColor: "var(--line)",
                }}
              >
                <Search className="h-4 w-4 shrink-0 text-[var(--muted)] mr-2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search inside this collection…"
                  className="w-full bg-transparent text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Subcategories Row (if category has subcategories) */}
        {category && category.subcategories.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs uppercase font-bold tracking-wider text-[var(--muted)] flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5" />
                <span>Subcategories ({category.subcategories.length})</span>
              </h2>
              {selectedSubcategory !== "all" && (
                <button
                  onClick={() => {
                    setSelectedSubcategory("all");
                    setSelectedSubject("all");
                  }}
                  className="text-xs text-[var(--accent)] hover:underline font-medium"
                >
                  Reset filter
                </button>
              )}
            </div>

            {/* Scrollable Subcategory Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => {
                  setSelectedSubcategory("all");
                  setSelectedSubject("all");
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all border ${
                  selectedSubcategory === "all"
                    ? "text-white shadow-sm"
                    : "hover:bg-[var(--surface-2)] text-[var(--ink-2)]"
                }`}
                style={{
                  backgroundColor:
                    selectedSubcategory === "all" ? "var(--ink)" : "var(--surface)",
                  borderColor:
                    selectedSubcategory === "all" ? "var(--ink)" : "var(--line)",
                }}
              >
                All Files ({documents.length})
              </button>

              {category.subcategories.map((sub) => {
                const isActive = selectedSubcategory === sub.name;
                return (
                  <button
                    key={sub.name}
                    onClick={() => {
                      setSelectedSubcategory(sub.name);
                      setSelectedSubject("all");
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 transition-all border flex items-center space-x-1.5 ${
                      isActive
                        ? "text-white shadow-sm"
                        : "hover:bg-[var(--surface-2)] text-[var(--ink-2)]"
                    }`}
                    style={{
                      backgroundColor: isActive ? "var(--accent)" : "var(--surface)",
                      borderColor: isActive ? "var(--accent)" : "var(--line)",
                    }}
                  >
                    <span>{sub.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-[var(--surface-2)] text-[var(--muted)]"
                      }`}
                    >
                      {sub.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Secondary Subject Filter Pills (if active subcategory has subjects) */}
            {availableSubjects.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
                <span className="text-[11px] text-[var(--muted)] shrink-0 mr-1">Subject:</span>
                <button
                  onClick={() => setSelectedSubject("all")}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium shrink-0 transition ${
                    selectedSubject === "all"
                      ? "bg-[var(--surface-2)] text-[var(--ink)] font-semibold border"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                  style={{
                    borderColor: selectedSubject === "all" ? "var(--line-2)" : "transparent",
                  }}
                >
                  All
                </button>
                {availableSubjects.map((subj) => {
                  const isSubjActive = selectedSubject === subj;
                  return (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`px-3 py-1 rounded-md text-[11px] font-medium shrink-0 transition ${
                        isSubjActive
                          ? "bg-[var(--surface-2)] text-[var(--ink)] font-semibold border"
                          : "text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                      style={{
                        borderColor: isSubjActive ? "var(--line-2)" : "transparent",
                      }}
                    >
                      {subj}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Content Files List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg sm:text-xl font-medium text-[var(--ink)]">
              {selectedSubcategory === "all"
                ? "All Files in Collection"
                : `${selectedSubcategory} Files`}
              <span className="ml-2 text-xs font-mono text-[var(--muted)]">
                ({filteredDocuments.length})
              </span>
            </h2>
          </div>

          {isLoading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-[18px] border p-4 h-36 animate-pulse"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--line)",
                  }}
                />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            /* Empty Filter State */
            <div
              className="rounded-[20px] border p-12 text-center"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--line)",
              }}
            >
              <FileText className="h-10 w-10 mx-auto text-[var(--muted)] opacity-50 mb-3" />
              <h3 className="font-serif text-lg font-medium text-[var(--ink)]">
                No matching files found
              </h3>
              <p className="mt-1 text-xs text-[var(--muted)] max-w-sm mx-auto">
                Try clearing your search query or choosing a different subcategory.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSubcategory("all");
                  setSelectedSubject("all");
                }}
                className="mt-4 px-4 py-2 rounded-full text-xs font-semibold text-white transition active:scale-95"
                style={{ backgroundColor: "var(--accent)" }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            /* Bento File Content Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((doc) => {
                const badge = getFileBadge(doc.mime_type, doc.title);
                const bookUrl = `/read/${doc.id}`;

                return (
                  <Link
                    key={doc.id}
                    href={bookUrl}
                    prefetch={true}
                    className="group flex flex-col justify-between rounded-[18px] border p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md select-none"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <div>
                      {/* Top Badges: File type, subcategory path & Wishlist heart */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono"
                          style={{
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.label}
                        </span>

                        <div className="flex items-center space-x-2">
                          <span
                            className="text-[10px] text-[var(--muted)] truncate max-w-[140px] font-medium"
                            title={doc.path}
                          >
                            {doc.subject ? `${doc.subcategory} / ${doc.subject}` : doc.subcategory}
                          </span>
                          <button
                            onClick={(e) => toggleFavorite(doc.id, e)}
                            className="p-1 rounded-full text-zinc-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition"
                            title={favoriteIds.has(doc.id) ? "Remove from wishlist" : "Add to wishlist"}
                          >
                            <Heart
                              className={`h-3.5 w-3.5 ${
                                favoriteIds.has(doc.id)
                                  ? "fill-rose-500 text-rose-500"
                                  : "text-zinc-400"
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* FULL, UNSHORTENED BOOK TITLE */}
                      <h3
                        className="font-semibold text-sm sm:text-[14px] text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition break-words"
                        title={doc.title}
                      >
                        {doc.title}
                      </h3>
                    </div>

                    {/* Bottom Metadata & Read CTA */}
                    <div className="mt-5 pt-3 border-t flex items-center justify-between text-xs text-[var(--muted)]"
                      style={{ borderColor: "var(--line-2)" }}
                    >
                      <div className="flex items-center space-x-2 font-mono text-[11px]">
                        <span>{doc.page_count} {doc.page_count === 1 ? "page" : "pages"}</span>
                        <span>&bull;</span>
                        <span>{formatBytes(doc.size_bytes)}</span>
                      </div>

                      <span
                        className="inline-flex items-center space-x-1 font-semibold text-[11px] group-hover:translate-x-1 transition-transform"
                        style={{ color: "var(--accent)" }}
                      >
                        <span>Read</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
