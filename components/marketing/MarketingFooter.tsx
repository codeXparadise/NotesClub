import Link from "next/link";
import {
  BookOpen,
  Heart,
  Scale,
  Award,
  ExternalLink,
  Code,
} from "lucide-react";

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#E9E2D6] dark:border-[#2E2C27] bg-[#F1ECE3] dark:bg-[#1A1916] text-[#5A5A4E] dark:text-[#C4BFB2] transition-colors">
      {/* Top Banner: Creator Gratitude & Non-Commercial Mission */}
      <div className="border-b border-[#E9E2D6]/80 dark:border-[#2E2C27]/80 bg-[#F7F4EE] dark:bg-[#151412] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-[#26261F] dark:text-[#F5F2EA]">
            <Award className="h-4 w-4 text-[#B0542E] shrink-0" />
            <p>
              <strong>Honoring Content Creators:</strong> 100% full credit & gratitude goes to all professors, educators, and authors who authored these notes.
            </p>
          </div>
          <Link
            href="/legal"
            className="inline-flex items-center space-x-1 font-semibold text-[#B0542E] hover:underline"
          >
            <span>Read Creator Attribution & Fair Use Policy</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Column 1: Brand & Creator Note */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-9 w-9 rounded-xl bg-[#B0542E] flex items-center justify-center text-white shadow-sm">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-serif-fraunces text-2xl font-bold tracking-tight text-[#26261F] dark:text-[#F5F2EA]">
                Notes<span className="text-[#B0542E]">Club</span>
              </span>
            </Link>

            <p className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed max-w-sm">
              An authentic, non-profit academic reading portal crafted by students, for students. Helping you access clean, organized college coding and semester notes with sub-second search and cross-device resume.
            </p>

            <div className="pt-2 flex items-center space-x-2 text-xs font-semibold text-[#4E7A5E] dark:text-[#5D9170]">
              <div className="h-2 w-2 rounded-full bg-[#4E7A5E] dark:bg-[#5D9170] animate-pulse" />
              <span>Non-Profit Educational Study Portal • Active</span>
            </div>

            <div className="pt-2">
              <a
                href="https://instagram.com/vishalprajapati.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#E9E2D6] dark:border-[#2E2C27] bg-[#F7F4EE] dark:bg-[#151412] text-[#26261F] dark:text-[#F5F2EA] hover:border-[#B0542E] hover:text-[#B0542E] transition shadow-xs"
                title="Vishal Prajapati on Instagram"
              >
                <svg className="w-4 h-4 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Follow @vishalprajapati.co</span>
              </a>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26261F] dark:text-[#F5F2EA] mb-4">
              Explore Pages
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-[#B0542E] transition">
                  Home Landing
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-[#B0542E] transition">
                  Platform Features
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[#B0542E] transition">
                  About & Developer Story
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-[#B0542E] transition">
                  Legal & Creator Credits
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Academic Streams */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26261F] dark:text-[#F5F2EA] mb-4">
              Academic Streams
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/login" className="hover:text-[#B0542E] transition">
                  B.Sc Computer Science
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#B0542E] transition">
                  B.Sc Information Tech (IT)
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#B0542E] transition">
                  B.Sc Artificial Intelligence (AI)
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#B0542E] transition">
                  Commerce & Accounts
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[#B0542E] transition">
                  Arts & Humanities
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Legal & Fair Use */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#26261F] dark:text-[#F5F2EA] mb-4">
              Legal & Integrity
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/legal#fair-use" className="hover:text-[#B0542E] transition">
                  Educational Fair Use
                </Link>
              </li>
              <li>
                <Link href="/legal#creator-shoutout" className="hover:text-[#B0542E] transition">
                  Creator Shoutouts & Credits
                </Link>
              </li>
              <li>
                <Link href="/legal#dmca" className="hover:text-[#B0542E] transition">
                  Content Takedown / DMCA
                </Link>
              </li>
              <li>
                <Link href="/legal#terms" className="hover:text-[#B0542E] transition">
                  Student Terms of Use
                </Link>
              </li>
              <li>
                <Link href="/legal#privacy" className="hover:text-[#B0542E] transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer Box */}
        <div className="mt-12 p-4 rounded-2xl border border-[#E9E2D6] dark:border-[#2E2C27] bg-[#F7F4EE] dark:bg-[#151412] text-xs text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
          <p className="flex items-start gap-2">
            <Scale className="h-4 w-4 text-[#B0542E] shrink-0 mt-0.5" />
            <span>
              <strong>Educational Non-Profit Notice:</strong> Notes Club is an academic index created solely for student revision and time-saving study. We do not sell materials, run ads, or commercialize notes. All copyrights belong to the respective authors, institutions, and professors. To request attribution updates or removals, please email us directly via our <Link href="/legal#dmca" className="underline font-semibold text-[#B0542E]">DMCA Takedown section</Link>.
            </span>
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-[#E9E2D6] dark:border-[#2E2C27] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Notes Club. Built with dedication by a student for students. All creator copyrights honored.</p>
          <div className="flex items-center space-x-6">
            <Link href="/" className="hover:text-[#B0542E] transition">
              Home
            </Link>
            <Link href="/about" className="hover:text-[#B0542E] transition">
              About
            </Link>
            <Link href="/features" className="hover:text-[#B0542E] transition">
              Features
            </Link>
            <Link href="/legal" className="hover:text-[#B0542E] transition">
              Legal Documentation
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
