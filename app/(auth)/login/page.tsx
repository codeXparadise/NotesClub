"use client";

import React, { useState, useEffect, Suspense, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Mail,
  Lock,
  User,
  Hash,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  LogIn,
  UserPlus,
  Building2,
  KeyRound,
  RefreshCw,
  Search,
  Check,
  ChevronDown,
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface CollegeItem {
  id: string;
  name: string;
  state: string;
  district: string;
}

interface DegreeItem {
  id: string;
  name: string;
  shortName: string;
  category: "engineering" | "science" | "commerce" | "management" | "arts" | "junior_college" | "school";
  level: "ug" | "pg" | "junior_college" | "school";
  specializations: string[];
}

const DEGREES_DATA: DegreeItem[] = [
  // UG Degrees
  {
    id: "bsc",
    name: "B.Sc (Bachelor of Science)",
    shortName: "B.Sc",
    category: "science",
    level: "ug",
    specializations: [
      "Artificial Intelligence (AI)",
      "Data Science (DS)",
      "Cyber Security",
      "Computer Science (CS)",
      "Information Technology (IT)",
      "Mathematics & Computing",
      "Biotechnology",
      "Physics & Electronics",
      "Chemistry",
      "General Science",
    ],
  },
  {
    id: "btech",
    name: "B.Tech / B.E (Engineering & Tech)",
    shortName: "B.Tech",
    category: "engineering",
    level: "ug",
    specializations: [
      "Computer Science (CSE)",
      "Artificial Intelligence & Machine Learning (AI & ML)",
      "Data Science (DS)",
      "Cyber Security & Forensics",
      "Information Technology (IT)",
      "Electronics & Communication (ECE)",
      "Electrical & Electronics (EEE)",
      "Mechanical Engineering (ME)",
      "Civil Engineering (CE)",
      "Robotics & Automation",
      "Biotechnology",
      "Chemical Engineering",
    ],
  },
  {
    id: "bca",
    name: "BCA (Bachelor of Computer Applications)",
    shortName: "BCA",
    category: "engineering",
    level: "ug",
    specializations: [
      "Artificial Intelligence (AI)",
      "Data Science & Analytics",
      "Cyber Security & Ethical Hacking",
      "Cloud Computing & DevOps",
      "Full Stack Development",
      "General Computer Applications",
    ],
  },
  {
    id: "bcom",
    name: "B.Com (Bachelor of Commerce)",
    shortName: "B.Com",
    category: "commerce",
    level: "ug",
    specializations: [
      "Business Analytics & AI",
      "Accounting & Finance (A&F)",
      "Banking & Insurance (B&I)",
      "Financial Markets (FM)",
      "E-Commerce & Digital Marketing",
      "Taxation & Auditing",
      "General Commerce",
    ],
  },
  {
    id: "bba",
    name: "BBA / BMS (Business Administration)",
    shortName: "BBA",
    category: "management",
    level: "ug",
    specializations: [
      "Business Analytics & Big Data",
      "Digital Marketing & E-Commerce",
      "Finance & Investment Banking",
      "Human Resource Management (HR)",
      "International Business",
      "Supply Chain & Logistics",
      "General Management",
    ],
  },
  {
    id: "ba",
    name: "B.A (Bachelor of Arts)",
    shortName: "B.A",
    category: "arts",
    level: "ug",
    specializations: [
      "Economics & Econometrics",
      "Psychology & Behavioral Studies",
      "English Literature",
      "Journalism & Mass Media",
      "Political Science & Public Policy",
      "Sociology",
      "General Arts",
    ],
  },

  // PG Degrees
  {
    id: "mtech",
    name: "M.Tech / M.E (Masters in Technology)",
    shortName: "M.Tech",
    category: "engineering",
    level: "pg",
    specializations: [
      "Artificial Intelligence & Machine Learning",
      "Data Science & Analytics",
      "Cyber Security & Information Assurance",
      "Computer Science & Engineering (CSE)",
      "VLSI Design & Embedded Systems",
      "Thermal / Structural Engineering",
    ],
  },
  {
    id: "msc",
    name: "M.Sc (Master of Science)",
    shortName: "M.Sc",
    category: "science",
    level: "pg",
    specializations: [
      "Artificial Intelligence & Data Science",
      "Computer Science (CS)",
      "Cyber Security",
      "Information Technology (IT)",
      "Applied Mathematics & Computing",
      "Biotechnology & Bioinformatics",
      "Physics / Chemistry",
    ],
  },
  {
    id: "mca",
    name: "MCA (Master of Computer Applications)",
    shortName: "MCA",
    category: "engineering",
    level: "pg",
    specializations: [
      "AI & Deep Learning",
      "Cloud Architecture & DevOps",
      "Cyber Security & Cryptography",
      "Enterprise Software Engineering",
      "General MCA",
    ],
  },
  {
    id: "mba",
    name: "MBA / PGDM (Master of Business Admin)",
    shortName: "MBA",
    category: "management",
    level: "pg",
    specializations: [
      "Business Analytics & AI",
      "Finance & Wealth Management",
      "Marketing & Brand Growth",
      "Operations & Supply Chain",
      "Human Resource Management (HR)",
      "Information Technology (IT)",
    ],
  },
  {
    id: "mcom",
    name: "M.Com (Master of Commerce)",
    shortName: "M.Com",
    category: "commerce",
    level: "pg",
    specializations: [
      "Banking & Financial Analytics",
      "Advanced Accounting & Taxation",
      "Business Economics",
    ],
  },
  {
    id: "ma",
    name: "M.A (Master of Arts)",
    shortName: "M.A",
    category: "arts",
    level: "pg",
    specializations: [
      "Economics",
      "Psychology",
      "English Literature",
      "Mass Communication & Journalism",
      "Political Science",
    ],
  },

  // Junior College (11th & 12th)
  {
    id: "jc_science",
    name: "11th / 12th Science (Junior College)",
    shortName: "11-12th Science",
    category: "junior_college",
    level: "junior_college",
    specializations: [
      "PCM with Computer Science / AI",
      "PCM with Information Technology",
      "PCB (Medical / Biology)",
      "PCMB (General Science)",
    ],
  },
  {
    id: "jc_commerce",
    name: "11th / 12th Commerce (Junior College)",
    shortName: "11-12th Commerce",
    category: "junior_college",
    level: "junior_college",
    specializations: [
      "Commerce with Mathematics & IT",
      "Commerce with Secretarial Practice (SP)",
      "General Commerce & Banking",
    ],
  },
  {
    id: "jc_arts",
    name: "11th / 12th Arts & Humanities",
    shortName: "11-12th Arts",
    category: "junior_college",
    level: "junior_college",
    specializations: [
      "Economics & Psychology",
      "Sociology & Political Science",
      "General Arts",
    ],
  },

  // School
  {
    id: "school_sec",
    name: "Secondary School (6th - 10th)",
    shortName: "School",
    category: "school",
    level: "school",
    specializations: [
      "General Curriculum (All Subjects)",
      "Class 9th Foundation",
      "Class 10th Board Exam Prep",
    ],
  },
];

function getCollegeCategories(collegeName: string): Set<string> {
  const upper = (collegeName || "").toUpperCase();
  const cats = new Set<string>();

  if (!upper) return new Set(["all"]);

  const isEngineering =
    upper.includes("ENGINEERING") ||
    upper.includes("TECHNOLOGY") ||
    upper.includes("POLYTECHNIC") ||
    upper.includes("TECHNICAL") ||
    upper.includes("IIIT") ||
    upper.includes("IIT") ||
    upper.includes("NIT") ||
    upper.includes("TECH");

  const isManagement =
    upper.includes("MANAGEMENT") ||
    upper.includes("BUSINESS") ||
    upper.includes("MBA") ||
    upper.includes("COMMERCE") ||
    upper.includes("B-SCHOOL") ||
    upper.includes("FINANCE");

  const isScience =
    upper.includes("SCIENCE") ||
    upper.includes("RESEARCH") ||
    upper.includes("DEGREE COLLEGE") ||
    upper.includes("UNIVERSITY") ||
    upper.includes("CAMPUS") ||
    upper.includes("INSTITUTE");

  const isArts =
    upper.includes("ARTS") ||
    upper.includes("HUMANITIES") ||
    upper.includes("DEGREE COLLEGE") ||
    upper.includes("UNIVERSITY") ||
    upper.includes("MAHAVIDYALAYA");

  const isSchool =
    upper.includes("SCHOOL") ||
    upper.includes("JUNIOR") ||
    upper.includes("INTERMEDIATE") ||
    upper.includes("VIDYALAYA");

  if (isEngineering) {
    cats.add("engineering");
    cats.add("science");
  }
  if (isManagement) {
    cats.add("commerce");
    cats.add("management");
  }
  if (isScience) {
    cats.add("science");
    cats.add("engineering");
  }
  if (isArts) {
    cats.add("arts");
    cats.add("commerce");
  }
  if (isSchool) {
    cats.add("junior_college");
    cats.add("school");
  }

  if (
    cats.size === 0 ||
    upper.includes("UNIVERSITY") ||
    upper.includes("DEGREE COLLEGE") ||
    upper.includes("MAHAVIDYALAYA") ||
    upper.includes("GROUP OF INSTITUTIONS") ||
    upper.includes("CAMPUS")
  ) {
    return new Set(["all"]);
  }

  return cats;
}

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  // Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialMode);

  // Login Mode: 'password' | 'otp' | 'forgot'
  const [loginMode, setLoginMode] = useState<"password" | "otp" | "forgot">("password");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // OTP Login state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regRollNumber, setRegRollNumber] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState<"school" | "junior_college" | "ug" | "pg">("ug");
  const [selectedDegreeId, setSelectedDegreeId] = useState("bsc");
  const [selectedSpecialization, setSelectedSpecialization] = useState("Artificial Intelligence (AI)");
  const [showAllDegrees, setShowAllDegrees] = useState(false);
  const [yearOrClass, setYearOrClass] = useState("FY");

  // College search combobox state
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegeList, setCollegeList] = useState<CollegeItem[]>([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [isCustomCollege, setIsCustomCollege] = useState(false);
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
  const collegeComboboxRef = useRef<HTMLDivElement>(null);

  // Courses fallback list
  const [courses, setCourses] = useState<Course[]>([]);
  const [regCourseId, setRegCourseId] = useState("");

  // Status & Messages
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorField, setErrorField] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [alreadyRegisteredPrompt, setAlreadyRegisteredPrompt] = useState(false);

  const supabase = createClient();

  // Load courses
  useEffect(() => {
    async function loadCourses() {
      try {
        const res = await fetch("/api/courses");
        if (res.ok) {
          const data = await res.json();
          if (data?.courses && data.courses.length > 0) {
            setCourses(data.courses);
            setRegCourseId(data.courses[0].id);
          }
        }
      } catch (e) {
        console.warn("Failed to load courses:", e);
      }
    }
    loadCourses();
  }, []);

  // Debounced search for colleges from /api/colleges
  useEffect(() => {
    if (!collegeSearch.trim() || isCustomCollege) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearchingColleges(true);
        const res = await fetch(`/api/colleges?q=${encodeURIComponent(collegeSearch.trim())}&limit=25`);
        if (res.ok) {
          const data = await res.json();
          setCollegeList(data.colleges || []);
        }
      } catch (e) {
        console.error("Colleges search error:", e);
      } finally {
        setIsSearchingColleges(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [collegeSearch, isCustomCollege]);

  // Close college dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (collegeComboboxRef.current && !collegeComboboxRef.current.contains(e.target as Node)) {
        setIsCollegeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for recovery session or callback errors
  useEffect(() => {
    if (searchParams.get("recovery") === "true" || searchParams.get("type") === "recovery") {
      setLoginMode("forgot");
      setForgotOtpSent(true);
      setHasRecoverySession(true);
      setInfoMessage("Email link verified! Enter your new password below.");
    }
    if (searchParams.get("error") === "auth_callback_failed") {
      setError("Authentication link may have expired or is invalid. Please try requesting a new OTP.");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setLoginMode("forgot");
        setForgotOtpSent(true);
        setHasRecoverySession(true);
        setInfoMessage("Email link verified! Enter your new password below.");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, supabase]);

  // College-inferred stream categories
  const collegeCategories = useMemo(
    () => getCollegeCategories(selectedCollege || collegeSearch),
    [selectedCollege, collegeSearch]
  );

  // Available degrees filtered by college stream categories and education level
  const availableDegrees = useMemo(() => {
    return DEGREES_DATA.filter((deg) => {
      if (showAllDegrees) return true;
      if (deg.level !== educationLevel) return false;
      if (collegeCategories.has("all")) return true;
      return collegeCategories.has(deg.category);
    });
  }, [educationLevel, collegeCategories, showAllDegrees]);

  // Current degree item
  const currentDegree = useMemo(() => {
    return (
      availableDegrees.find((d) => d.id === selectedDegreeId) ||
      availableDegrees[0] ||
      DEGREES_DATA.find((d) => d.id === selectedDegreeId) ||
      DEGREES_DATA[0]
    );
  }, [availableDegrees, selectedDegreeId]);

  // Specializations for currently selected degree
  const availableSpecializations = useMemo(() => {
    return currentDegree?.specializations || [];
  }, [currentDegree]);

  // Combined stream string (e.g. "B.Sc - AI" or "B.Tech - Cyber Security")
  const combinedCourse = useMemo(() => {
    if (!currentDegree) return "General";
    return `${currentDegree.shortName} - ${selectedSpecialization}`;
  }, [currentDegree, selectedSpecialization]);

  // Sync selected specialization when degree changes
  useEffect(() => {
    if (currentDegree && !currentDegree.specializations.includes(selectedSpecialization)) {
      setSelectedSpecialization(currentDegree.specializations[0] || "General");
    }
  }, [currentDegree, selectedSpecialization]);

  // When education level changes, pick a relevant degree
  useEffect(() => {
    const match = DEGREES_DATA.find((d) => d.level === educationLevel);
    if (match) {
      setSelectedDegreeId(match.id);
      setSelectedSpecialization(match.specializations[0] || "General");
    }
    if (educationLevel === "school") {
      setYearOrClass("Class 9");
    } else if (educationLevel === "junior_college") {
      setYearOrClass("FY (11th)");
    } else {
      setYearOrClass("FY");
    }
  }, [educationLevel]);

  // Year options based on level: FY, SY, TY, Final Year
  const yearOptions =
    educationLevel === "school"
      ? ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"]
      : educationLevel === "junior_college"
      ? ["FY (11th)", "SY (12th)"]
      : ["FY", "SY", "TY", "Final Year"];

  const switchTab = (tab: "login" | "register") => {
    setActiveTab(tab);
    setError(null);
    setErrorField(null);
    setInfoMessage(null);
    setAlreadyRegisteredPrompt(false);
  };

  // 1. Password Login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const cleanEmail = loginEmail.trim().toLowerCase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: loginPassword,
      });

      if (signInError) throw signInError;

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, role")
        .eq("id", data.user.id)
        .single();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        router.push("/blocked");
        return;
      }

      // Record login time
      await supabase
        .from("profiles")
        .update({ last_login_at: new Date().toISOString(), last_active_at: new Date().toISOString() })
        .eq("id", data.user.id);

      if (profile?.role === "teacher") {
        router.push("/admin");
      } else {
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Send 6-Digit OTP / Magic Link
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const productionUrl = "https://notes-club.netlify.app";
      const appOrigin =
        typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        !window.location.hostname.includes("localhost")
          ? window.location.origin
          : productionUrl;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${appOrigin}/auth/callback?next=${redirectTo}`,
        },
      });

      if (otpError) throw otpError;

      setOtpSent(true);
      setInfoMessage("Verification code sent! Enter the 6-digit OTP code received in your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send verification OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP and Sign In
  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: cleanOtp,
        type: "email",
      });

      if (verifyError) throw verifyError;

      setInfoMessage("Verification successful! Signing you in...");

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, role")
        .eq("id", data.user?.id)
        .single();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        router.push("/blocked");
        return;
      }

      if (profile?.role === "teacher") {
        router.push("/admin");
      } else {
        router.push(redirectTo);
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Send Forgot Password Recovery Magic Link
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      // Production URL prevents Supabase from ever defaulting to localhost:3000
      const productionUrl = "https://notes-club.netlify.app";
      const appOrigin =
        typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        !window.location.hostname.includes("localhost")
          ? window.location.origin
          : productionUrl;

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${appOrigin}/auth/callback?next=${encodeURIComponent("/login?recovery=true")}`,
      });

      if (resetErr) throw resetErr;

      setForgotOtpSent(true);
      setInfoMessage(`Password reset link sent to ${cleanEmail}! Please check your email.`);
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Verify Recovery OTP & Reset Password
  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = forgotEmail.trim().toLowerCase();
    const cleanOtp = forgotOtp.trim();

    if (!hasRecoverySession && (!cleanOtp || cleanOtp.length < 6)) {
      setError("Please enter the 6-digit recovery code or click the email link.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!hasRecoverySession) {
        // Verify OTP recovery token
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanOtp,
          type: "recovery",
        });

        if (verifyErr) throw verifyErr;
      }

      // Update password with active session
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) throw updateErr;

      setInfoMessage("Password updated successfully! Logging you in...");
      setTimeout(() => {
        router.push(redirectTo);
      }, 800);
    } catch (err: any) {
      setError(err.message || "Invalid recovery code or expired request.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Student Registration with Indian College dataset & academic stream
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setErrorField(null);
    setInfoMessage(null);
    setAlreadyRegisteredPrompt(false);

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanRoll = regRollNumber.trim().toUpperCase();
    const cleanName = regFullName.trim();
    const cleanCollege = (selectedCollege || collegeSearch).trim();

    if (!cleanName || !cleanRoll || !cleanEmail || !regPassword) {
      setError("Please fill in all mandatory fields.");
      setIsLoading(false);
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setErrorField("password");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: cleanName,
          rollNumber: cleanRoll,
          email: cleanEmail,
          password: regPassword,
          courseId: regCourseId || null,
          collegeName: cleanCollege || "Not Specified",
          educationLevel,
          stream: combinedCourse,
          courseName: combinedCourse,
          yearOrClass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        setErrorField(data.field || null);

        if (data.alreadyRegistered && data.field === "email") {
          setAlreadyRegisteredPrompt(true);
        }
        return;
      }

      setInfoMessage("Account created successfully! Logging you in...");
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: regPassword,
      });

      if (!loginErr) {
        router.push(redirectTo);
      } else {
        switchTab("login");
        setLoginEmail(cleanEmail);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Top Segmented Tab Switcher (Sign In vs Create Account) */}
      <div className="flex p-1 bg-zinc-200/70 dark:bg-zinc-900/80 rounded-2xl border border-zinc-300/60 dark:border-zinc-800 shadow-inner">
        <button
          type="button"
          onClick={() => switchTab("login")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === "login"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <LogIn className="h-3.5 w-3.5" />
          <span>Student Sign In</span>
        </button>

        <button
          type="button"
          onClick={() => switchTab("register")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === "register"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Create Account</span>
        </button>
      </div>

      {/* Main Glassmorphic Auth Card */}
      <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 sm:p-8 shadow-xl backdrop-blur-md transition-all">
        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-600 dark:text-rose-400 flex items-start space-x-3 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-medium leading-relaxed">{error}</p>
              {alreadyRegisteredPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    switchTab("login");
                    setLoginEmail(regEmail);
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 transition"
                >
                  <span>Switch to Sign In</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info Message Box */}
        {infoMessage && (
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-600 dark:text-emerald-400 flex items-start space-x-3 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{infoMessage}</p>
          </div>
        )}

        {/* =========================================================================
            TAB 1: STUDENT SIGN IN (PASSWORD, EMAIL OTP, OR FORGOT PASSWORD)
           ========================================================================= */}
        {activeTab === "login" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Welcome back
              </h2>
              <p className="text-xs text-zinc-500">
                Sign in with your registered student credentials.
              </p>
            </div>

            {/* Sub-modes: Password vs Email OTP vs Forgot Password */}
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/60 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("password");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === "password"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("otp");
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === "otp"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Email OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("forgot");
                  setError(null);
                  setForgotEmail(loginEmail);
                }}
                className={`flex-1 py-1.5 rounded-lg transition ${
                  loginMode === "forgot"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                Forgot Password
              </button>
            </div>

            {/* Mode A: Standard Password Login */}
            {loginMode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMode("forgot");
                        setForgotEmail(loginEmail);
                      }}
                      className="text-[11px] text-[var(--accent)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Sign In & Continue &rarr;</span>
                  )}
                </Button>
              </form>
            )}

            {/* Mode B: Email OTP Login */}
            {loginMode === "otp" && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendLoginOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <Input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        We will send a 6-digit verification code to your email.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Send 6-Digit OTP Code &rarr;</span>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyLoginOtp} className="space-y-4 animate-in fade-in">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          Enter 6-Digit OTP
                        </label>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="text-[11px] text-[var(--accent)] hover:underline flex items-center space-x-1"
                        >
                          <RefreshCw className="h-3 w-3" />
                          <span>Change Email</span>
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <Input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          required
                          autoFocus
                          className="pl-10 h-11 rounded-xl text-center text-sm font-mono tracking-widest bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Sent to <strong className="text-zinc-700 dark:text-zinc-300">{loginEmail}</strong>
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Verify OTP & Sign In &rarr;</span>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* Mode C: Forgot Password via Magic Link & Recovery */}
            {loginMode === "forgot" && (
              <div className="space-y-4">
                {!forgotOtpSent ? (
                  <form onSubmit={handleSendForgotOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                        <Input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Enter your registered email address. We will send you a secure magic link to reset your password.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition"
                      style={{ backgroundColor: "var(--accent)" }}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <span>Send Reset Link &rarr;</span>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyForgotOtp} className="space-y-4 animate-in fade-in">
                    {hasRecoverySession ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <div>
                          <p className="font-semibold">Email Link Verified!</p>
                          <p className="text-[11px] opacity-90">Enter your new password below to update and sign in.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-center space-y-3">
                        <div className="mx-auto w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Check Your Inbox
                          </h4>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            We sent a password reset link to <strong className="text-zinc-900 dark:text-zinc-200">{forgotEmail}</strong>.
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            Click the <strong>Reset Password</strong> link in the email to set your new password.
                          </p>
                        </div>

                        <div className="pt-2 flex flex-col gap-2">
                          <Button
                            type="button"
                            onClick={handleSendForgotOtp}
                            disabled={isLoading}
                            variant="outline"
                            className="h-9 rounded-xl text-xs w-full"
                          >
                            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Resend Email Link"}
                          </Button>

                          <button
                            type="button"
                            onClick={() => setShowCodeInput(!showCodeInput)}
                            className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 underline"
                          >
                            {showCodeInput ? "Hide code input" : "Have a 6-digit recovery code instead?"}
                          </button>
                        </div>

                        {showCodeInput && (
                          <div className="space-y-1.5 text-left pt-2 border-t border-zinc-200 dark:border-zinc-800">
                            <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                              6-Digit Recovery Code
                            </label>
                            <div className="relative">
                              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                              <Input
                                type="text"
                                maxLength={6}
                                value={forgotOtp}
                                onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                                placeholder="123456"
                                className="pl-10 h-10 rounded-xl text-center text-sm font-mono tracking-widest bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {(hasRecoverySession || showCodeInput) && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            New Password
                          </label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                            <Input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="Minimum 6 characters"
                              required
                              className="pl-10 h-11 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={isLoading}
                          className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition"
                          style={{ backgroundColor: "var(--accent)" }}
                        >
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span>Save New Password &amp; Sign In &rarr;</span>
                          )}
                        </Button>
                      </>
                    )}
                  </form>
                )}

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode("password");
                      setForgotOtpSent(false);
                      setError(null);
                      setInfoMessage(null);
                      setShowCodeInput(false);
                    }}
                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    &larr; Back to standard login
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800/80">
              <p className="text-xs text-zinc-500">
                New student?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  Create your account &rarr;
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: STUDENT REGISTRATION (INDIAN COLLEGES & ACADEMIC STREAM FORM)
           ========================================================================= */}
        {activeTab === "register" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="font-serif text-xl sm:text-2xl font-medium tracking-tight text-zinc-900 dark:text-zinc-100">
                Student Registration
              </h2>
              <p className="text-xs text-zinc-500">
                Complete your academic profile to unlock verified study notes.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* 1. Full Name & Roll Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Vishal Kumar"
                      required
                      className="pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Roll Number *
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Unique ID</span>
                  </div>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={regRollNumber}
                      onChange={(e) => setRegRollNumber(e.target.value)}
                      placeholder="e.g. 21BCE1042"
                      required
                      className={`pl-10 h-10 rounded-xl text-xs uppercase font-mono bg-zinc-50 dark:bg-zinc-800/50 ${
                        errorField === "rollNumber"
                          ? "border-rose-500 ring-1 ring-rose-500"
                          : "border-zinc-200 dark:border-zinc-700"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 2. College / School Combobox (Indian Colleges Database) */}
              <div className="space-y-1.5" ref={collegeComboboxRef}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    College / School Name *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomCollege(!isCustomCollege);
                      setSelectedCollege("");
                      setCollegeSearch("");
                    }}
                    className="text-[11px] text-[var(--accent)] hover:underline"
                  >
                    {isCustomCollege ? "Search Indian Colleges" : "+ Type Manually"}
                  </button>
                </div>

                {isCustomCollege ? (
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={collegeSearch}
                      onChange={(e) => {
                        setCollegeSearch(e.target.value);
                        setSelectedCollege(e.target.value);
                      }}
                      placeholder="Enter school or college name"
                      required
                      className="pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="text"
                      value={selectedCollege || collegeSearch}
                      onChange={(e) => {
                        setSelectedCollege("");
                        setCollegeSearch(e.target.value);
                        setIsCollegeDropdownOpen(true);
                      }}
                      onFocus={() => setIsCollegeDropdownOpen(true)}
                      placeholder="Search across 12,000+ Indian Colleges..."
                      required
                      className="pl-10 pr-8 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 truncate"
                    />
                    {isSearchingColleges && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-zinc-400" />
                    )}

                    {/* Autocomplete Dropdown */}
                    {isCollegeDropdownOpen && collegeList.length > 0 && !selectedCollege && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl z-50 p-1 divide-y divide-zinc-100 dark:divide-zinc-800/50">
                        {collegeList.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => {
                              setSelectedCollege(col.name);
                              setCollegeSearch(col.name);
                              setIsCollegeDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-xs flex flex-col space-y-0.5"
                          >
                            <span className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">
                              {col.name}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {col.district ? `${col.district}, ` : ""}
                              {col.state}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Education Level (School vs Junior College vs UG vs PG) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Education Level *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("school");
                      setYearOrClass("Class 9");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "school"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    1st–10th
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("junior_college");
                      setYearOrClass("FY (11th)");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "junior_college"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    11th–12th
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("ug");
                      setYearOrClass("FY");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "ug"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    UG (Degree)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEducationLevel("pg");
                      setYearOrClass("FY");
                    }}
                    className={`py-1.5 px-2 rounded-lg text-center transition ${
                      educationLevel === "pg"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                    }`}
                  >
                    PG (Masters)
                  </button>
                </div>
              </div>

              {/* 4. Stream & Degree Cascade (College Filtered) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Degree / Course &amp; Specialization *
                  </label>
                  {!collegeCategories.has("all") && (
                    <button
                      type="button"
                      onClick={() => setShowAllDegrees(!showAllDegrees)}
                      className="text-[11px] text-[var(--accent)] hover:underline"
                    >
                      {showAllDegrees ? "Filter by college" : "Show all degrees"}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Select Degree */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                      1. Degree / Course
                    </span>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                      <select
                        value={selectedDegreeId}
                        onChange={(e) => setSelectedDegreeId(e.target.value)}
                        className="w-full pl-9 pr-3 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] truncate"
                      >
                        {availableDegrees.map((deg) => (
                          <option key={deg.id} value={deg.id}>
                            {deg.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Select Specialization */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                      2. Specialization / Branch
                    </span>
                    <select
                      value={selectedSpecialization}
                      onChange={(e) => setSelectedSpecialization(e.target.value)}
                      className="w-full px-3 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] truncate"
                    >
                      {availableSpecializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Preview Badge */}
                <div className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Selected Program:</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
                    🎓 {combinedCourse}
                  </span>
                </div>
              </div>

              {/* 5. Year / Class (FY, SY, TY, Final Year) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Year / Class *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {yearOptions.map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setYearOrClass(yr)}
                      className={`h-9 px-2 rounded-xl text-xs font-medium text-center transition border ${
                        yearOrClass === yr
                          ? "bg-[var(--accent)] text-white border-transparent shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Email & Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className={`pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "email"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                  <Input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className={`pl-10 h-10 rounded-xl text-xs bg-zinc-50 dark:bg-zinc-800/50 ${
                      errorField === "password"
                        ? "border-rose-500 ring-1 ring-rose-500"
                        : "border-zinc-200 dark:border-zinc-700"
                    }`}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-xl text-xs font-semibold text-white shadow-md active:scale-[0.99] transition mt-2"
                style={{ backgroundColor: "var(--accent)" }}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>Register & Continue &rarr;</span>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center border-t border-zinc-100 dark:border-zinc-800/80">
              <p className="text-xs text-zinc-500">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  Sign in here &rarr;
                </button>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans antialiased select-none"
      style={{ backgroundColor: "var(--bg)", color: "var(--ink)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto py-2">
        <Link href="/" className="flex items-center space-x-3 group">
          <div
            className="h-10 w-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Notes Club
            </span>
            <span className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono">
              Academic Portal
            </span>
          </div>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center my-6">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
              <p className="text-xs text-zinc-500">Loading portal...</p>
            </div>
          }
        >
          <AuthForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-zinc-400 max-w-md mx-auto">
        Protected study material and verified university notes.
      </footer>
    </div>
  );
}
