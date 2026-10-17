"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  BookOpen,
  Compass,
  Library,
  Bell,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  X,
  LogOut,
  FolderOpen,
  Heart,
  FileText,
  Trash2,
  History,
  RotateCcw,
  Check,
} from "lucide-react";
import { TopNotificationPanel } from "@/components/student/TopNotificationPanel";

// =========================================================================
// Category Color Map (Name -> [startColor, endColor])
// =========================================================================
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
  // Deterministic fallback based on string char code sum
  const fallbacks: [string, string][] = [
    ["#5E8AC7", "#7FB0E0"],
    ["#E0A23F", "#F0C878"],
    ["#3F9E77", "#6FC6A0"],
    ["#C77BA0", "#E0A6C0"],
    ["#E08A4A", "#F0B078"],
    ["#C99A5B", "#E0BE86"],
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return fallbacks[sum % fallbacks.length];
}

function getCategoryMonogram(name: string): string {
  const parts = name.split(/[\s·\-_/]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "NC";
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "Today";
  try {
    const d = new Date(dateString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (isToday) return `Today, ${timeStr}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
  } catch {
    return "Recently";
  }
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ROOT_COLLECTIONS = [
  "Semester Notes",
  "DSA",
  "Web Development",
  "Interview Prep",
  "Cheat Sheets",
  "E-Books",
  "Handwritten Notes",
  "Projects",
  "Roadmaps",
  "Resume & Career",
  "Tools & Shortcuts",
  "Resources",
];

interface Category {
  id: string;
  name: string;
  slug: string;
  docCount?: number;
  subcategoryCount?: number;
}

interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  category_id?: string;
  categories?: { id: string; name: string } | null;
  page_count?: number;
}

interface ReadingProgressItem {
  id: string;
  document_id: string;
  last_page: number;
  total_pages: number;
  percent: number;
  updated_at?: string;
  documents?: {
    id: string;
    title: string;
    page_count: number;
    categories?: { name: string } | null;
  } | null;
}

export default function StudentHomePage() {
  const router = useRouter();
  const supabase = createClient();

  // Theme & Layout State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [studentName, setStudentName] = useState("Vishal");
  const [unreadCount, setUnreadCount] = useState(0);

  // Data State
  const [allDocuments, setAllDocuments] = useState<DocumentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingProgressItem[]>([]);
  const [favoriteDocs, setFavoriteDocs] = useState<DocumentItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Search State
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentItem[]>([]);
  const [isSearchingServer, setIsSearchingServer] = useState(false);
  const [searchCategoryFilter, setSearchCategoryFilter] = useState("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const historyScrollRef = useRef<HTMLDivElement>(null);
  const favScrollRef = useRef<HTMLDivElement>(null);

  // Search History State
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearchHistoryOpen, setIsSearchHistoryOpen] = useState(false);

  // Profile Menu State
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Clear Reading History State
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const [confirmClearHistory, setConfirmClearHistory] = useState(false);
  const [clearedNotice, setClearedNotice] = useState<string | null>(null);

  // Load search history from API
  useEffect(() => {
    fetch("/api/search/history")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.searches)) {
          const queries = data.searches
            .map((s: any) => (typeof s === "string" ? s : s.query))
            .filter(Boolean);
          setSearchHistory(queries);
        }
      })
      .catch(() => {});
  }, []);

  // Close search history dropdown and profile menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsSearchHistoryOpen(false);
      }
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(e.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSearchHistory = (q: string) => {
    setRawQuery(q);
    setDebouncedQuery(q.trim().toLowerCase());
    setIsSearchHistoryOpen(false);
  };

  const handleClearSearchHistory = async () => {
    try {
      setSearchHistory([]);
      await fetch("/api/search/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (e) {
      console.error("Clear search history failed:", e);
    }
  };

  const handleDeleteSearchQuery = async (queryToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setSearchHistory((prev) => prev.filter((q) => q !== queryToDelete));
      await fetch("/api/search/history", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryToDelete }),
      });
    } catch (e) {
      console.error("Delete search query failed:", e);
    }
  };

  const handleClearReadingHistory = async () => {
    if (isClearingHistory) return;
    setIsClearingHistory(true);
    try {
      setReadingHistory([]);
      setConfirmClearHistory(false);
      setClearedNotice("Reading history cleared successfully");
      setTimeout(() => setClearedNotice(null), 3000);

      await fetch("/api/progress", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch (err) {
      console.error("Failed to clear reading history:", err);
    } finally {
      setIsClearingHistory(false);
    }
  };

  const handleRemoveReadingItem = async (documentId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setReadingHistory((prev) => prev.filter((item) => item.document_id !== documentId));
      await fetch("/api/progress", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
    } catch (err) {
      console.error("Failed to remove item from reading history:", err);
    }
  };

  const prefetchDocument = useCallback((docId: string) => {
    if (typeof window === "undefined" || !docId) return;
    router.prefetch(`/read/${docId}`);
  }, [router]);

  // Dark mode init
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") ||
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

  // Keyboard shortcut listener: ⌘K or Ctrl+K to focus search, Esc to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setRawQuery("");
        setDebouncedQuery("");
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounce search ~200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(rawQuery.trim().toLowerCase());
    }, 200);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  // Live server query across all drive files when search query changes
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsSearchingServer(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingServer(true);
    setSearchCategoryFilter("all");

    fetch(`/api/documents?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isCurrent) return;
        if (Array.isArray(data.documents)) {
          setSearchResults(data.documents);
        }
      })
      .catch((err) => console.error("Search API error:", err))
      .finally(() => {
        if (isCurrent) setIsSearchingServer(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery]);

  // Load User, Documents, Categories & Reading History
  useEffect(() => {
    let isCancelled = false;

    async function loadData() {
      setIsLoading(true);
      try {
        // 1. User Profile
        supabase.auth.getUser().then(({ data }) => {
          if (data?.user?.user_metadata?.full_name) {
            const first = data.user.user_metadata.full_name.split(" ")[0];
            if (!isCancelled) setStudentName(first);
          }
        });

        // 2. Parallel API calls (cached via Redis server-side)
        const [docsRes, catsRes, progRes, notifRes, favsRes] = await Promise.all([
          fetch("/api/documents"),
          fetch("/api/categories"),
          fetch("/api/progress"),
          fetch("/api/notifications").catch(() => null),
          fetch("/api/favorites").catch(() => null),
        ]);

        const [docsData, catsData, progData, notifData, favsData] = await Promise.all([
          docsRes.json().catch(() => ({})),
          catsRes.json().catch(() => ({})),
          progRes.json().catch(() => ({})),
          notifRes ? notifRes.json().catch(() => ({})) : Promise.resolve({}),
          favsRes ? favsRes.json().catch(() => ({})) : Promise.resolve({}),
        ]);

        if (isCancelled) return;

        const docs: DocumentItem[] = docsData.documents || [];
        setAllDocuments(docs);

        // Populate Favorites
        if (Array.isArray(favsData?.favorites)) {
          setFavoriteDocs(favsData.favorites);
          setFavoriteIds(new Set(favsData.favorites.map((d: any) => d.id)));
        } else if (Array.isArray(favsData?.favoriteIds)) {
          setFavoriteIds(new Set(favsData.favoriteIds));
          const matchingFavDocs = docs.filter((d) => favsData.favoriteIds.includes(d.id));
          setFavoriteDocs(matchingFavDocs);
        }

        // Group cleanly into the 12 primary collections
        const rawCats: any[] = catsData.categories || [];
        
        // Find all top-level roots present in database
        const rootSet = new Set<string>(ROOT_COLLECTIONS);
        rawCats.forEach((c) => {
          const root = c.name.split(" / ")[0].trim();
          if (root) rootSet.add(root);
        });

        const aggregatedCats: Category[] = Array.from(rootSet).map((root) => {
          const matchingCats = rawCats.filter(
            (c) => c.name === root || c.name.startsWith(root + " / ")
          );
          
          const matchingDocs = docs.filter((d) => {
            const catName = d.categories?.name || "";
            const desc = d.description || "";
            return (
              catName === root ||
              catName.startsWith(root + " / ") ||
              desc.includes(`root:${root}`)
            );
          });

          // Distinct subcategories
          const subSet = new Set<string>();
          matchingCats.forEach((c) => {
            const parts = c.name.split(" / ");
            if (parts[1]) subSet.add(parts[1]);
          });
          matchingDocs.forEach((d) => {
            const pathMatch = d.description?.match(/path:([^|]+)/);
            if (pathMatch) {
              const segs = pathMatch[1].trim().split(" / ");
              if (segs[1]) subSet.add(segs[1]);
            }
          });

          return {
            id: root,
            name: root,
            slug: slugify(root),
            docCount: matchingDocs.length,
            subcategoryCount: subSet.size,
          };
        }).filter((c) => (c.docCount || 0) > 0 || ROOT_COLLECTIONS.includes(c.name));

        setCategories(aggregatedCats);

        if (progData.progress) {
          setReadingHistory(progData.progress.slice(0, 10));
        }

        if (typeof notifData?.unreadCount === "number") {
          setUnreadCount(notifData.unreadCount);
        }
      } catch (err) {
        console.error("Homepage load failed:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Filtered Reading History (Instant live-filter by search query)
  const filteredHistory = useMemo(() => {
    if (!debouncedQuery) return readingHistory;
    return readingHistory.filter((item) => {
      const title = item.documents?.title?.toLowerCase() || "";
      const cat = item.documents?.categories?.name?.toLowerCase() || "";
      return title.includes(debouncedQuery) || cat.includes(debouncedQuery);
    });
  }, [readingHistory, debouncedQuery]);

  // Filtered Categories (Instant live-filter by search query)
  const filteredCategories = useMemo(() => {
    if (!debouncedQuery) return categories;
    return categories.filter((cat) => {
      const matchName = cat.name.toLowerCase().includes(debouncedQuery);
      // Also match if any of its documents match
      const hasMatchingDoc = allDocuments.some((doc) => {
        const catName = doc.categories?.name || "";
        const desc = doc.description || "";
        const belongsTo = catName.startsWith(cat.name) || desc.includes(`root:${cat.name}`);
        return belongsTo && doc.title.toLowerCase().includes(debouncedQuery);
      });
      return matchName || hasMatchingDoc;
    });
  }, [categories, allDocuments, debouncedQuery]);

  // Filtered matching books entirely from the drive across every category
  const allMatchingFiles = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase().trim();
    const tokens = q.split(/\s+/).filter(Boolean);

    // 1. In-memory matches across allDocuments
    const localMatches = allDocuments.filter((doc) => {
      const title = (doc.title || "").toLowerCase();
      const desc = (doc.description || "").toLowerCase();
      const cat = (doc.categories?.name || "").toLowerCase();
      const fullText = `${title} ${desc} ${cat}`;
      return fullText.includes(q) || (tokens.length > 1 && tokens.every((t) => fullText.includes(t)));
    });

    // 2. Merge with searchResults from server, deduplicated by id
    const map = new Map<string, DocumentItem>();
    localMatches.forEach((d) => map.set(d.id, d));
    searchResults.forEach((d) => map.set(d.id, d));

    return Array.from(map.values());
  }, [allDocuments, searchResults, debouncedQuery]);

  // Categories that have matching files
  const matchingCategoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    allMatchingFiles.forEach((d) => {
      const cat = d.categories?.name?.split(" / ")[0]?.trim() || "Other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allMatchingFiles]);

  // Displayed files filtered by optional sub-pill
  const displayedFiles = useMemo(() => {
    if (searchCategoryFilter === "all") return allMatchingFiles;
    return allMatchingFiles.filter((d) => {
      const cat = d.categories?.name || "";
      return cat.startsWith(searchCategoryFilter);
    });
  }, [allMatchingFiles, searchCategoryFilter]);

  // Filtered Favorites (Instant live-filter by search query)
  const filteredFavorites = useMemo(() => {
    if (!debouncedQuery) return favoriteDocs;
    return favoriteDocs.filter((doc) => {
      const titleMatch = doc.title.toLowerCase().includes(debouncedQuery);
      const catMatch = doc.categories?.name?.toLowerCase().includes(debouncedQuery);
      return titleMatch || catMatch;
    });
  }, [favoriteDocs, debouncedQuery]);

  const hasNoResults =
    Boolean(debouncedQuery) &&
    allMatchingFiles.length === 0 &&
    !isSearchingServer;

  // Toggle Favorite
  const toggleFavorite = async (doc: DocumentItem, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const isCurrentlyFav = favoriteIds.has(doc.id);
    const nextIds = new Set(favoriteIds);
    if (isCurrentlyFav) {
      nextIds.delete(doc.id);
      setFavoriteIds(nextIds);
      setFavoriteDocs((prev) => prev.filter((d) => d.id !== doc.id));
      await fetch(`/api/favorites?documentId=${doc.id}`, { method: "DELETE" });
    } else {
      nextIds.add(doc.id);
      setFavoriteIds(nextIds);
      setFavoriteDocs((prev) => [doc, ...prev]);
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      });
    }
  };

  // Horizontal Favorites Scroll Buttons
  const scrollFavorites = (direction: "left" | "right") => {
    if (!favScrollRef.current) return;
    const delta = direction === "left" ? -338 : 338;
    favScrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Horizontal History Scroll Buttons
  const scrollHistory = (direction: "left" | "right") => {
    if (!historyScrollRef.current) return;
    const delta = direction === "left" ? -338 : 338;
    historyScrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const greetingWord = getTimeOfDayGreeting();

  // Loading animation state (prevents zero counts or empty flashes)
  if (isLoading && allDocuments.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300"
        style={{ backgroundColor: "var(--bg)", color: "var(--ink)" }}
      >
        <div className="flex flex-col items-center space-y-6 max-w-sm w-full text-center animate-in fade-in duration-300">
          <div
            className="h-16 w-16 rounded-[22px] flex items-center justify-center text-white shadow-xl animate-pulse"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <span className="font-serif text-3xl font-bold">N</span>
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)]">
              Opening Notes Club Vault...
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Loading verified course collections, study notes & reading progress
            </p>
          </div>
          <div
            className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border"
            style={{ borderColor: "var(--line)" }}
          >
            <div
              className="h-full rounded-full animate-indeterminate"
              style={{ backgroundColor: "var(--accent)", width: "50%" }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans text-[var(--ink)] antialiased transition-colors duration-300"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      {/* =========================================================================
          MOBILE BOTTOM TAB BAR (<768px, Android-First)
         ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-50 border-t flex items-center justify-around px-2 backdrop-blur-md"
        style={{
          backgroundColor: "var(--surface)",
          borderColor: "var(--line)",
          boxShadow: "0 -2px 10px rgba(38,38,31,.05)",
        }}
      >
        <Link
          href="/home"
          className="flex flex-col items-center justify-center p-2 text-xs font-medium"
          style={{ color: "var(--accent)" }}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 font-semibold">Home</span>
        </Link>

        <button
          onClick={() => searchInputRef.current?.focus()}
          className="flex flex-col items-center justify-center p-2 text-[var(--muted)] hover:text-[var(--ink)] text-xs font-medium"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Search</span>
        </button>

        <Link
          href="/home#categories"
          className="flex flex-col items-center justify-center p-2 text-[var(--muted)] hover:text-[var(--ink)] text-xs font-medium"
        >
          <Library className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Library</span>
        </Link>

        <Link
          href="/notifications"
          className="relative flex flex-col items-center justify-center p-2 text-[var(--muted)] hover:text-[var(--ink)] text-xs font-medium"
        >
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5">Alerts</span>
        </Link>

        <Link
          href="/profile"
          className="flex flex-col items-center justify-center p-2 text-[var(--muted)] hover:text-[var(--ink)] text-xs font-medium"
          title="My Profile"
        >
          <User className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Profile</span>
        </Link>

        <button
          onClick={handleSignOut}
          className="flex flex-col items-center justify-center p-2 text-[var(--muted)] hover:text-rose-600 text-xs font-medium"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">Logout</span>
        </button>
      </nav>

      {/* =========================================================================
          MAIN COLUMN (Generous padding ~38px horizontal, max-width container)
         ========================================================================= */}
      <div className="pb-28 md:pb-16 w-full">
        <main className="mx-auto max-w-6xl px-4 sm:px-8 lg:px-[38px] pt-8 sm:pt-12 space-y-10 sm:space-y-12">
          
          {/* =======================================================================
              ZONE 1: TOP BAR (Greeting on LEFT, Search on RIGHT + Theme Toggle)
             ======================================================================= */}
          <section className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-2">
            
            {/* LEFT — Brand & Greeting Block */}
            <div className="flex items-center space-x-3.5 min-w-0">
              <Link
                href="/home"
                className="h-11 w-11 rounded-[14px] flex items-center justify-center text-white shadow-sm shrink-0 transition-transform active:scale-95"
                style={{ backgroundColor: "var(--accent)" }}
                title="Notes Club Home"
              >
                <span className="font-serif text-2xl font-bold leading-none select-none">
                  N
                </span>
              </Link>
              <div className="space-y-0.5 min-w-0">
                <h1 className="font-serif text-2xl sm:text-[31px] font-medium tracking-tight text-[var(--ink)] leading-snug truncate">
                  {greetingWord},{" "}
                  <span style={{ color: "var(--accent)" }}>{studentName}</span>
                </h1>
                <p className="text-xs sm:text-sm text-[var(--muted)] tracking-wide truncate">
                  Continue where you left off &mdash; {allDocuments.length} files across{" "}
                  {categories.length} collections.
                </p>
              </div>
            </div>

            {/* RIGHT — Profile Menu, Search Pill, Notification Panel, and Dark/Light Toggle */}
            <div className="flex items-center space-x-2.5 sm:space-x-3 w-full md:w-auto">
              
              {/* Profile Avatar & Dropdown Menu (Directly Left of Search Panel) */}
              <div ref={profileMenuRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="h-12 w-12 rounded-[14px] flex items-center justify-center font-bold text-xs text-white shadow-[var(--shadow)] border transition active:scale-95 hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  style={{
                    backgroundColor: "var(--accent)",
                    borderColor: "var(--line-2)",
                  }}
                  title={`Profile & Account (${studentName})`}
                  aria-label="Student profile menu"
                >
                  {studentName.slice(0, 2).toUpperCase()}
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div
                    className="absolute left-0 sm:right-auto md:right-0 md:left-auto top-14 z-50 w-56 rounded-[18px] border shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 py-1.5"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line-2)",
                    }}
                  >
                    {/* User Identity Info */}
                    <div className="px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
                      <p className="text-xs font-semibold text-[var(--ink)] truncate">
                        {studentName}
                      </p>
                      <p className="text-[11px] text-[var(--muted)] truncate font-mono">
                        Student Account
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                      >
                        <User className="h-4 w-4 text-[var(--muted)]" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        href="/home#favorites"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Heart className="h-4 w-4 text-rose-500" />
                          <span>Saved Wishlist</span>
                        </div>
                        {favoriteDocs.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500">
                            {favoriteDocs.length}
                          </span>
                        )}
                      </Link>

                      <Link
                        href="/home#history"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center justify-between px-4 py-2 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Clock className="h-4 w-4 text-[var(--muted)]" />
                          <span>Reading History</span>
                        </div>
                        {readingHistory.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-mono">
                            {readingHistory.length}
                          </span>
                        )}
                      </Link>
                    </div>

                    <div className="border-t pt-1" style={{ borderColor: "var(--line)" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          handleSignOut();
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-500/10 transition"
                      >
                        <LogOut className="h-4 w-4 text-rose-600" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Pill Container */}
              <div ref={searchContainerRef} className="relative w-full md:w-[300px] lg:w-[340px]">
                <div
                  className="relative flex items-center w-full h-12 rounded-[14px] px-3.5 transition shadow-[var(--shadow)] border focus-within:ring-4"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--line-2)",
                  }}
                >
                  <Search className="h-4 w-4 shrink-0 text-[var(--muted)] mr-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={rawQuery}
                    onFocus={() => setIsSearchHistoryOpen(true)}
                    onChange={(e) => setRawQuery(e.target.value)}
                    placeholder="Search categories, books, topics…"
                    className="w-full bg-transparent text-xs sm:text-sm text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none"
                    aria-label="Search study material"
                  />

                  {rawQuery ? (
                    <button
                      onClick={() => {
                        setRawQuery("");
                        setDebouncedQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="p-1 rounded-full text-[var(--muted)] hover:text-[var(--ink)] transition"
                      title="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : (
                    <kbd
                      className="hidden sm:inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[10px] text-[var(--muted)] border"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        borderColor: "var(--line)",
                      }}
                    >
                      ⌘K
                    </kbd>
                  )}
                </div>

                {/* Animated Recent Search History Dropdown */}
                {isSearchHistoryOpen && !rawQuery && searchHistory.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-14 z-50 rounded-[18px] border shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
                    style={{
                      backgroundColor: "var(--surface)",
                      borderColor: "var(--line-2)",
                    }}
                  >
                    <div
                      className="flex items-center justify-between px-3.5 py-2.5 border-b text-xs"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <span className="flex items-center space-x-1.5 font-semibold text-[var(--ink)]">
                        <History className="h-3.5 w-3.5 text-[var(--muted)]" />
                        <span>Recent Searches</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSearchHistory}
                        className="text-[11px] font-medium text-[var(--accent)] hover:underline"
                      >
                        Clear search history
                      </button>
                    </div>

                    <div className="max-h-56 overflow-y-auto divide-y divide-[var(--line)]">
                      {searchHistory.map((q) => (
                        <div
                          key={q}
                          onClick={() => handleSelectSearchHistory(q)}
                          className="group flex items-center justify-between px-3.5 py-2.5 text-xs text-[var(--ink)] hover:bg-[var(--surface-2)] cursor-pointer transition"
                        >
                          <div className="flex items-center space-x-2.5 truncate pr-2">
                            <Clock className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                            <span className="truncate">{q}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSearchQuery(q, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-[var(--muted)] hover:text-rose-600 hover:bg-[var(--surface)] transition shrink-0"
                            title="Remove from history"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Panel Button & Animated Overlay beside search bar */}
              <TopNotificationPanel
                initialUnreadCount={unreadCount}
                onUnreadCountChange={setUnreadCount}
              />

              {/* Dark / Light Mode Toggle Button */}
              <button
                onClick={toggleDarkMode}
                className="h-12 w-12 rounded-[14px] flex items-center justify-center shrink-0 transition border shadow-[var(--shadow)] text-[var(--ink-2)] hover:text-[var(--ink)]"
                style={{
                  backgroundColor: "var(--surface)",
                  borderColor: "var(--line-2)",
                }}
                title={isDarkMode ? "Switch to Warm Paper (Light)" : "Switch to Night Library (Dark)"}
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-amber-500" />
                ) : (
                  <Moon className="h-4 w-4 text-[var(--ink-2)]" />
                )}
              </button>
            </div>
          </section>

          {/* =======================================================================
              SEARCH MODE VS NORMAL DASHBOARD MODE
             ======================================================================= */}
          {debouncedQuery ? (
            /* SEARCH MODE: LIST DOWN ALL MATCHING FILES RATHER THAN CATEGORIES */
            <div className="space-y-6">
              {/* Search Header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b"
                style={{ borderColor: "var(--line)" }}
              >
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)] tracking-tight">
                      Matching Books & Files
                    </h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[var(--accent-soft)] text-[var(--accent)] font-mono">
                      {allMatchingFiles.length} {allMatchingFiles.length === 1 ? "file" : "files"}
                    </span>
                    {isSearchingServer && (
                      <span className="text-[11px] text-[var(--muted)] animate-pulse">Searching entire vault...</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    Found {allMatchingFiles.length} files matching &ldquo;<span className="font-semibold text-[var(--ink)]">{rawQuery}</span>&rdquo; across all Drive folders & categories
                  </p>
                </div>

                <button
                  onClick={() => {
                    setRawQuery("");
                    setDebouncedQuery("");
                  }}
                  className="text-xs font-semibold px-3.5 py-2 rounded-xl border bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)] transition self-start sm:self-auto"
                  style={{ borderColor: "var(--line)" }}
                >
                  Clear Search & Return &times;
                </button>
              </div>

              {/* Filter Pills across categories */}
              {matchingCategoriesList.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-xs font-medium text-[var(--muted)] shrink-0 mr-1">Filter collection:</span>
                  <button
                    onClick={() => setSearchCategoryFilter("all")}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                      searchCategoryFilter === "all"
                        ? "text-white shadow-sm"
                        : "border text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                    }`}
                    style={{
                      backgroundColor: searchCategoryFilter === "all" ? "var(--accent)" : "var(--surface)",
                      borderColor: searchCategoryFilter === "all" ? "var(--accent)" : "var(--line)",
                    }}
                  >
                    All Collections ({allMatchingFiles.length})
                  </button>
                  {matchingCategoriesList.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => setSearchCategoryFilter(cat.name)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition ${
                        searchCategoryFilter === cat.name
                          ? "text-white shadow-sm"
                          : "border text-[var(--ink-2)] hover:bg-[var(--surface-2)]"
                      }`}
                      style={{
                        backgroundColor: searchCategoryFilter === cat.name ? "var(--accent)" : "var(--surface)",
                        borderColor: searchCategoryFilter === cat.name ? "var(--accent)" : "var(--line)",
                      }}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {hasNoResults ? (
                <div
                  className="rounded-[var(--radius-card)] border p-12 text-center my-6"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--line)",
                    boxShadow: "var(--shadow)",
                  }}
                >
                  <FileText className="h-10 w-10 mx-auto text-[var(--muted)] opacity-40 mb-3" />
                  <h3 className="font-serif text-xl font-medium text-[var(--ink)]">
                    No files match &ldquo;{rawQuery}&rdquo;
                  </h3>
                  <p className="mt-1.5 text-xs sm:text-sm text-[var(--muted)] max-w-sm mx-auto">
                    Try searching for a different keyword, subject, or chapter name across all categories.
                  </p>
                  <button
                    onClick={() => {
                      setRawQuery("");
                      setDebouncedQuery("");
                    }}
                    className="mt-4 px-4 py-2 rounded-full text-xs font-semibold text-white transition active:scale-95"
                    style={{ backgroundColor: "var(--accent)" }}
                  >
                    Clear Search Filter
                  </button>
                </div>
              ) : (
                /* Direct Files / Books Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedFiles.map((doc) => {
                    const catName = doc.categories?.name || "Study Notes";
                    const [gradStart, gradEnd] = getCategoryGradient(catName);
                    const isFav = favoriteIds.has(doc.id);
                    const pageCount = doc.page_count;

                    return (
                      <Link
                        key={doc.id}
                        href={`/read/${doc.id}`}
                        prefetch={true}
                        onMouseEnter={() => prefetchDocument(doc.id)}
                        onTouchStart={() => prefetchDocument(doc.id)}
                        className="group flex flex-col justify-between rounded-[18px] border p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md select-none"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--line)",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        <div>
                          {/* Top Badges */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase font-mono text-white truncate max-w-[170px]"
                              style={{
                                background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                              }}
                              title={catName}
                            >
                              {catName.split(" / ")[0]}
                            </span>

                            <button
                              onClick={(e) => toggleFavorite(doc, e)}
                              className="p-1 rounded-full text-zinc-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition"
                              title={isFav ? "Remove from wishlist" : "Add to wishlist"}
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  isFav ? "fill-rose-500 text-rose-500" : "text-zinc-400"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Full Unshortened File Title */}
                          <h3
                            className="font-semibold text-sm sm:text-[14px] text-[var(--ink)] leading-snug group-hover:text-[var(--accent)] transition line-clamp-2"
                            title={doc.title}
                          >
                            {doc.title}
                          </h3>

                          {/* Subcategory location */}
                          <p className="text-[11px] text-[var(--muted)] line-clamp-1 mt-1 font-mono">
                            {catName}
                          </p>
                        </div>

                        {/* Bottom Footer */}
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)] text-[11px] text-[var(--muted)]">
                          <span>{pageCount ? `${pageCount} pages` : "Document"}</span>
                          <span className="font-semibold text-[var(--accent)] group-hover:translate-x-0.5 transition inline-flex items-center gap-0.5">
                            Read file &rarr;
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* NORMAL DASHBOARD: READING HISTORY, WISHLIST & CATEGORIES */
            <>
              {/* ZONE 2: READING HISTORY (Horizontal scroll / swipeable row) */}
              {filteredHistory.length > 0 && (
                <section id="history" className="space-y-4">
              {/* Section Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="font-serif text-xl sm:text-[20px] font-medium text-[var(--ink)] tracking-tight">
                    Reading history
                  </h2>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    ({filteredHistory.length})
                  </span>

                  {/* Clear Reading History Button */}
                  {confirmClearHistory ? (
                    <div className="flex items-center space-x-1.5 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/30 animate-in fade-in zoom-in-95 duration-150">
                      <span className="text-[11px] font-medium text-rose-600 dark:text-rose-400">Clear all?</span>
                      <button
                        type="button"
                        onClick={handleClearReadingHistory}
                        disabled={isClearingHistory}
                        className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-700 transition"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearHistory(false)}
                        className="px-1.5 py-0.5 rounded text-[11px] font-medium text-[var(--muted)] hover:text-[var(--ink)] transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearHistory(true)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                      title="Clear reading history"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span className="hidden sm:inline">Clear history</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Desktop scroll arrows */}
                  <div className="hidden sm:flex items-center space-x-1.5">
                    <button
                      onClick={() => scrollHistory("left")}
                      className="h-8 w-8 rounded-full border flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--line)",
                      }}
                      title="Scroll previous"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => scrollHistory("right")}
                      className="h-8 w-8 rounded-full border flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--line)",
                      }}
                      title="Scroll next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <Link
                    href="#categories"
                    className="text-xs font-medium hover:underline tracking-tight ml-2"
                    style={{ color: "var(--accent)" }}
                  >
                    View all &rarr;
                  </Link>
                </div>
              </div>

              {/* Horizontal Scrollable Row (Swipeable on touch, hide scrollbar) */}
              <div
                ref={historyScrollRef}
                className="smooth-scroll-x flex gap-[18px] overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth"
                style={{
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {filteredHistory.map((item) => {
                  const doc = item.documents;
                  if (!doc) return null;

                  const categoryTitle = doc.categories?.name || "General Notes";
                  const [gradStart, gradEnd] = getCategoryGradient(categoryTitle);
                  const total = item.total_pages || doc.page_count || 1;
                  const current = item.last_page || 1;
                  const targetDocId = item.document_id || doc.id;

                  return (
                    <div
                      key={item.id}
                      className="group relative flex-none w-[320px] rounded-[18px] border p-4 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] select-none"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--line)",
                        boxShadow: "var(--shadow)",
                        scrollSnapAlign: "start",
                      }}
                    >
                      {/* Individual Remove Button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveReadingItem(item.document_id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full bg-[var(--surface)] text-[var(--muted)] hover:text-rose-600 shadow-md border border-[var(--line)] transition-all absolute top-2.5 right-2.5 z-10 hover:scale-110 active:scale-95"
                        title="Remove from history"
                      >
                        <X className="h-3 w-3" />
                      </button>

                      <Link
                        href={`/read/${targetDocId}`}
                        prefetch={true}
                        onMouseEnter={() => prefetchDocument(targetDocId)}
                        onTouchStart={() => prefetchDocument(targetDocId)}
                        className="flex space-x-3.5 w-full overflow-hidden"
                      >
                        {/* Cover: 62x88px, radius 9px, gradient fill, book title printed in small Fraunces, darker spine strip */}
                        <div
                          className="relative w-[62px] h-[88px] rounded-[9px] shrink-0 overflow-hidden flex flex-col justify-between p-1.5 text-white shadow-sm"
                          style={{
                            background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                          }}
                        >
                          {/* Darker spine strip on left edge */}
                          <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-black/25" />

                          {/* Faint textured lines */}
                          <div
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(135deg, rgba(255,255,255,.2) 0 4px, transparent 4px 8px)",
                            }}
                          />

                          <div className="relative pl-1">
                            <span className="font-serif text-[8px] leading-tight line-clamp-4 font-medium text-white/95">
                              {doc.title}
                            </span>
                          </div>

                          <div className="relative pl-1">
                            <span className="text-[7px] font-mono tracking-wider uppercase text-white/80">
                              {Math.round(item.percent)}%
                            </span>
                          </div>
                        </div>

                        {/* Right side: Category label, title, progress bar, pages, relative time */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between pr-3">
                          <div>
                            <span
                              className="block text-[10px] uppercase font-bold tracking-wider truncate mb-0.5"
                              style={{ color: "var(--muted)" }}
                            >
                              {categoryTitle}
                            </span>
                            <h3 className="font-semibold text-xs sm:text-[13px] text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition">
                              {doc.title}
                            </h3>
                          </div>

                          <div className="space-y-1.5 mt-2">
                            {/* Progress bar: 6px, track --surface-2, fill --sage */}
                            <div
                              className="h-[6px] w-full rounded-full overflow-hidden"
                              style={{ backgroundColor: "var(--surface-2)" }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, Math.max(6, item.percent))}%`,
                                  backgroundColor: "var(--sage)",
                                }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[var(--muted)]">
                              <span className="font-medium">
                                Page {current} of {total}
                              </span>
                              <div className="flex items-center space-x-2">
                                <span>{formatRelativeTime(item.updated_at)}</span>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    toggleFavorite({
                                      id: item.document_id,
                                      title: doc.title,
                                      categories: doc.categories ? { id: item.document_id, name: doc.categories.name } : null,
                                    }, e);
                                  }}
                                  className="p-1 rounded-full text-zinc-400 hover:text-rose-500 hover:scale-110 active:scale-95 transition"
                                  title={favoriteIds.has(item.document_id) ? "Remove from wishlist" : "Add to wishlist"}
                                >
                                  <Heart
                                    className={`h-3 w-3 ${
                                      favoriteIds.has(item.document_id)
                                        ? "fill-rose-500 text-rose-500"
                                        : "text-zinc-400"
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* =======================================================================
              ZONE 2.5: FAVORITES / WISHLIST (Directly below Reading History)
             ======================================================================= */}
          <section id="favorites" className="space-y-4">
              {/* Section Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400 shadow-sm">
                    <Heart className="h-4 w-4 fill-rose-500" />
                  </div>
                  <h2 className="font-serif text-xl sm:text-[20px] font-medium text-[var(--ink)] tracking-tight">
                    Saved Wishlist
                  </h2>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    ({filteredFavorites.length})
                  </span>
                </div>

                {filteredFavorites.length > 0 && (
                  <div className="hidden sm:flex items-center space-x-1.5">
                    <button
                      onClick={() => scrollFavorites("left")}
                      className="h-8 w-8 rounded-full border flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--line)",
                      }}
                      title="Scroll previous"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => scrollFavorites("right")}
                      className="h-8 w-8 rounded-full border flex items-center justify-center text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--line)",
                      }}
                      title="Scroll next"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {filteredFavorites.length > 0 ? (
                <div
                  ref={favScrollRef}
                  className="smooth-scroll-x flex space-x-3.5 sm:space-x-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {filteredFavorites.map((doc) => {
                    const [gradStart, gradEnd] = getCategoryGradient(
                      doc.categories?.name || "E-Books"
                    );
                    const readUrl = `/read/${doc.id}`;

                    return (
                      <div
                        key={doc.id}
                        className="group relative flex shrink-0 w-[270px] sm:w-[290px] h-[134px] rounded-[var(--radius-card)] p-3 transition-all duration-200 snap-start border hover:-translate-y-0.5"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--line)",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        {/* Book Spine Accent */}
                        <div
                          className="w-[52px] h-full rounded-[10px] shrink-0 mr-3 flex flex-col justify-between p-2 relative overflow-hidden shadow-sm"
                          style={{
                            background: `linear-gradient(145deg, ${gradStart}, ${gradEnd})`,
                          }}
                        >
                          <div
                            className="absolute inset-0 pointer-events-none opacity-20"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(135deg, rgba(255,255,255,.2) 0 4px, transparent 4px 8px)",
                            }}
                          />
                          <BookOpen className="h-4 w-4 text-white/90 relative" />
                          <span className="font-serif text-[8px] leading-tight line-clamp-3 font-medium text-white/95 relative">
                            {doc.title}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <span
                              className="block text-[10px] uppercase font-bold tracking-wider truncate mb-0.5"
                              style={{ color: "var(--muted)" }}
                            >
                              {doc.categories?.name || "Library Note"}
                            </span>
                            <Link
                              href={readUrl}
                              prefetch={true}
                              onMouseEnter={() => prefetchDocument(doc.id)}
                              onTouchStart={() => prefetchDocument(doc.id)}
                            >
                              <h3 className="font-semibold text-xs sm:text-[13px] text-[var(--ink)] line-clamp-2 leading-snug group-hover:text-[var(--accent)] transition">
                                {doc.title}
                              </h3>
                            </Link>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-[var(--line)]">
                            <Link
                              href={readUrl}
                              prefetch={true}
                              onMouseEnter={() => prefetchDocument(doc.id)}
                              onTouchStart={() => prefetchDocument(doc.id)}
                              className="text-[11px] font-semibold text-[var(--accent)] hover:underline flex items-center space-x-1"
                            >
                              <span>Read note</span>
                              <span>&rarr;</span>
                            </Link>
                            <button
                              onClick={(e) => toggleFavorite(doc, e)}
                              className="p-1.5 rounded-full text-rose-500 hover:scale-110 active:scale-95 transition"
                              title="Remove from wishlist"
                            >
                              <Heart className="h-4 w-4 fill-rose-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className="rounded-[var(--radius-card)] border border-dashed p-6 sm:p-7 text-center transition"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--line)",
                  }}
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400 mb-2">
                    <Heart className="h-4 w-4 text-rose-500" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--ink)]">
                    Your Wishlist is empty
                  </p>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 max-w-sm mx-auto">
                    Click the &hearts; heart icon on any note to pin it here for instant one-tap reading.
                  </p>
                </div>
              )}
            </section>

          {/* =======================================================================
              ZONE 3: CATEGORIES GRID (4 cols desktop, 3 cols <=1100px, 2 cols <=760px)
             ======================================================================= */}
          <section id="categories" className="space-y-4">
              {/* Section Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="font-serif text-xl sm:text-[20px] font-medium text-[var(--ink)] tracking-tight">
                    Categories
                  </h2>
                  <span className="text-xs text-[var(--muted)] font-mono">
                    ({filteredCategories.length})
                  </span>
                </div>

                <Link
                  href="/admin"
                  className="text-xs font-medium hover:underline tracking-tight"
                  style={{ color: "var(--accent)" }}
                >
                  Manage &rarr;
                </Link>
              </div>

              {/* Grid: 4 cols desktop, 3 cols <=1100px, 2 cols <=760px */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {isLoading ? (
                  /* Skeleton Loaders */
                  Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-[var(--radius-card)] border overflow-hidden animate-pulse h-44"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--line)",
                      }}
                    />
                  ))
                ) : (
                  filteredCategories.map((cat) => {
                    const [gradStart, gradEnd] = getCategoryGradient(cat.name);
                    const monogram = getCategoryMonogram(cat.name);
                    const count = cat.docCount || 0;

                    return (
                      <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        className="group flex flex-col rounded-[20px] border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 select-none"
                        style={{
                          backgroundColor: "var(--surface)",
                          borderColor: "var(--line)",
                          boxShadow: "var(--shadow)",
                        }}
                      >
                        {/* Top: Cover band ~92px tall with soft two-stop gradient + 45° repeating line texture */}
                        <div
                          className="relative h-[92px] w-full flex items-center justify-center overflow-hidden"
                          style={{
                            background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                          }}
                        >
                          {/* Faint 45° repeating line texture */}
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(135deg, rgba(255,255,255,.10) 0 10px, transparent 10px 20px)",
                            }}
                          />

                          {/* Centred Monogram (2 letters in Fraunces, white, ~34px) */}
                          <span className="relative font-serif text-[34px] font-bold text-white tracking-wider select-none drop-shadow-sm group-hover:scale-105 transition-transform duration-200">
                            {monogram}
                          </span>

                          {/* Bottom-right: Page stack hint (3 thin translucent bars peeking above the body) */}
                          <div className="absolute right-3 bottom-0 flex flex-col space-y-[2px] items-end">
                            <div className="w-5 h-[2px] rounded-t-sm bg-white/40" />
                            <div className="w-6 h-[2px] rounded-t-sm bg-white/60" />
                            <div className="w-7 h-[2px] rounded-t-sm bg-white/90" />
                          </div>
                        </div>

                        {/* Body: Category name in Fraunces ~17px, below it muted X files & subcategories */}
                        <div className="p-4 flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="font-serif text-[16px] sm:text-[17px] font-medium text-[var(--ink)] line-clamp-1 group-hover:text-[var(--accent)] transition">
                              {cat.name}
                            </h3>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono">
                              <span>
                                {count} {count === 1 ? "file" : "files"}
                              </span>
                              {(cat.subcategoryCount || 0) > 0 && (
                                <>
                                  <span>&bull;</span>
                                  <span>
                                    {cat.subcategoryCount}{" "}
                                    {cat.subcategoryCount === 1 ? "subfolder" : "subfolders"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

        {/* Toast Notification for History Operations */}
        {clearedNotice && (
          <div
            className="fixed bottom-20 md:bottom-8 right-6 z-50 rounded-2xl border px-4 py-3 shadow-2xl flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200"
            style={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--line)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-semibold text-[var(--ink)]">{clearedNotice}</span>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
