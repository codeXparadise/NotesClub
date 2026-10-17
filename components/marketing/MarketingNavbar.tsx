"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Zap,
  Info,
} from "lucide-react";

export function MarketingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "/features", icon: Zap },
    { name: "About", href: "/about", icon: Info },
    { name: "Legal & Credits", href: "/legal", icon: ShieldCheck },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#F7F4EE]/90 dark:bg-[#151412]/90 backdrop-blur-md border-b border-[#E9E2D6] dark:border-[#2E2C27] shadow-sm"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo - Warm Editorial Serif */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="h-10 w-10 rounded-xl bg-[#B0542E] flex items-center justify-center text-white shadow-md shadow-[#B0542E]/20 group-hover:scale-105 transition duration-200">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif-fraunces text-2xl font-bold tracking-tight text-[#26261F] dark:text-[#F5F2EA]">
                Notes<span className="text-[#B0542E]">Club</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-[#8E8C7E] -mt-1">
                Student Study Canvas
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "text-[#B0542E] bg-[#F1ECE3] dark:bg-[#282622] font-bold"
                      : "text-[#5A5A4E] dark:text-[#C4BFB2] hover:text-[#26261F] dark:hover:text-[#F5F2EA] hover:bg-[#F1ECE3]/60 dark:hover:bg-[#282622]/60"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#5A5A4E] dark:text-[#C4BFB2] hover:text-[#26261F] dark:hover:text-[#F5F2EA] hover:bg-[#F1ECE3] dark:hover:bg-[#282622] transition"
            >
              Login Now
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#B0542E] hover:bg-[#974522] shadow-sm shadow-[#B0542E]/25 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150"
            >
              <span>Start Learning</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Hamburger */}
          <div className="flex md:hidden items-center space-x-2">
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#B0542E] bg-[#F1ECE3] dark:bg-[#282622]"
            >
              Login
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#F1ECE3] dark:hover:bg-[#282622]"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#E9E2D6] dark:border-[#2E2C27] bg-[#F7F4EE] dark:bg-[#151412] px-4 pt-2 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-3 duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon || Info;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#F1ECE3] text-[#B0542E] dark:bg-[#282622] font-bold"
                    : "text-[#5A5A4E] dark:text-[#C4BFB2] hover:bg-[#F1ECE3]/60 dark:hover:bg-[#282622]/60"
                }`}
              >
                <Icon className="h-4 w-4 text-[#B0542E]" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          <div className="pt-4 border-t border-[#E9E2D6] dark:border-[#2E2C27] grid grid-cols-2 gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl border border-[#DED5C6] dark:border-[#3E3B34] text-xs font-bold text-[#26261F] dark:text-[#F5F2EA] bg-[#FFFFFF] dark:bg-[#1E1D19]"
            >
              Login Now
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-xl bg-[#B0542E] text-xs font-bold text-white shadow-sm"
            >
              Start Learning
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
