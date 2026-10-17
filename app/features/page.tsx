import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Zap,
  Search,
  BookOpen,
  ShieldCheck,
  Bookmark,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Layers,
  HelpCircle,
  Clock,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "Platform Features & Capabilities — Notes Club",
  description:
    "Explore the student-first innovations of Notes Club: sub-second search, fast reader canvas, cross-device resume, and department filters.",
};

export default function FeaturesPage() {
  const faqs = [
    {
      q: "Is Notes Club completely free for students?",
      a: "Yes, 100%. Notes Club was created as a non-profit educational study portal by a fellow student. There are zero paywalls, zero subscription fees, and no locked notes.",
    },
    {
      q: "How does the cross-device resume feature work?",
      a: "When you read a note on Notes Club, your current page number is automatically synchronized to your student profile. If you switch from your phone to your laptop, the reader automatically resumes on the exact page you were studying.",
    },
    {
      q: "Why is there a watermark on the reader canvas?",
      a: "The non-destructive dynamic watermark and anti-screenshot shield protect original educators and authors from unauthorized commercial redistribution, ensuring Notes Club remains an ethical, non-profit academic resource for students.",
    },
    {
      q: "How can I search notes from a specific stream or class?",
      a: "Our global search engine instantly indexes all categories. You can also filter by department (Science, Commerce, Arts) and academic class (FY, SY, TY, Final) directly from your student dashboard.",
    },
    {
      q: "Where do the notes come from and who gets the credit?",
      a: "Notes are curated from college professors, top academic contributors, and teaching assistants. Full credits and gratitude belong to the original creators. We maintain an open attribution policy outlined in our Legal section.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#151412] text-[#26261F] dark:text-[#F5F2EA] flex flex-col font-sans selection:bg-[#B0542E] selection:text-white">
      <MarketingNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden border-b border-[#E9E2D6] dark:border-[#2E2C27]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#F1ECE3] dark:bg-[#282622] border border-[#DED5C6] dark:border-[#3E3B34] text-xs font-semibold text-[#5A5A4E] dark:text-[#C4BFB2] mb-6">
            <Zap className="h-3.5 w-3.5 text-[#B0542E]" />
            <span>PLATFORM CAPABILITIES & ARCHITECTURE</span>
          </div>

          <h1 className="font-serif-fraunces text-4xl sm:text-6xl font-bold tracking-tight text-[#26261F] dark:text-[#F5F2EA] leading-[1.15] mb-6">
            Engineered for Serious Exam Prep.{" "}
            <span className="italic font-normal text-[#B0542E]">
              Built Without Fluff.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#5A5A4E] dark:text-[#C4BFB2] max-w-2xl mx-auto leading-relaxed mb-8">
            Every feature on Notes Club is purposefully engineered to eliminate digital friction during stressful exam nights.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-[#B0542E] hover:bg-[#974522] text-white font-bold text-sm shadow-sm transition"
            >
              <span>Experience It Live (Free)</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* DETAILED FEATURE SHOWCASES */}
      <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Feature 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
              Feature 01 • Instant Global Search
            </span>
            <h2 className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              Sub-Second Search Across All Folders & Categories
            </h2>
            <p className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
              Traditional college Drive folders require you to click 6 layers deep into confusing directories. With Notes Club&apos;s real-time search, simply type a keyword, question topic, or unit title to instantly surface the exact lecture document.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-[#26261F] dark:text-[#F5F2EA] font-medium pt-2">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4E7A5E]" />
                Sub-50ms query latency powered by Redis memory cache
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4E7A5E]" />
                Searches across all categories simultaneously
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4E7A5E]" />
                Debounced auto-complete prevents UI stutter
              </li>
            </ul>
          </div>

          <div className="p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] shadow-md space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27]">
              <Search className="h-4 w-4 text-[#B0542E]" />
              <span className="text-xs font-mono text-[#5A5A4E] dark:text-[#C4BFB2]">
                search &quot;3NF vs BCNF solved questions&quot;
              </span>
              <span className="ml-auto text-[10px] text-[#4E7A5E] font-mono">18ms</span>
            </div>
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-xl bg-[#F1ECE3] dark:bg-[#282622] text-xs">
                <div className="font-bold text-[#26261F] dark:text-[#F5F2EA]">DBMS Unit 2: Functional Dependencies & Normalization</div>
                <div className="text-[10px] text-[#8E8C7E]">B.Sc AI / CS • 14 Pages</div>
              </div>
              <div className="p-3 rounded-xl bg-[#F1ECE3] dark:bg-[#282622] text-xs">
                <div className="font-bold text-[#26261F] dark:text-[#F5F2EA]">Question Bank: 3NF vs BCNF Solved Numerical Problems</div>
                <div className="text-[10px] text-[#8E8C7E]">Model Paper • 8 Pages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-[#E9E2D6] dark:border-[#2E2C27] pb-3 text-xs">
              <span className="text-[#B0542E] font-bold font-serif-fraunces">Smart Sync Coordinator</span>
              <span className="text-[#4E7A5E] font-mono text-[10px]">Session Active</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27]">
                <span className="text-[#26261F] dark:text-[#F5F2EA]">📱 Mobile Phone (Chrome / Android)</span>
                <span className="text-[#B0542E] font-mono">Stopped at Page 23</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27]">
                <span className="text-[#26261F] dark:text-[#F5F2EA]">💻 Laptop (Windows PC)</span>
                <span className="text-[#4E7A5E] font-mono">Auto-Resumed Page 23 ✓</span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
              Feature 02 • Seamless Sync
            </span>
            <h2 className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              Read Anywhere. Resume From the Exact Page.
            </h2>
            <p className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
              Ever read halfway through an 80-page textbook PDF on your phone during class, then struggled to find your spot on your computer at night?
            </p>
            <p className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed">
              Notes Club synchronizes your reading coordinates continuously. Log in anywhere, click any document, and you will be returned directly to the sentence you were studying.
            </p>
          </div>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="py-16 bg-[#F1ECE3] dark:bg-[#1A1916] border-y border-[#E9E2D6] dark:border-[#2E2C27]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
              Why Notes Club
            </span>
            <h2 className="font-serif-fraunces text-2xl sm:text-3xl font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
              Compared to the Old Messy Way
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[#DED5C6] dark:border-[#3E3B34] bg-[#FFFFFF] dark:bg-[#1E1D19] shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F7F4EE] dark:bg-[#151412] border-b border-[#E9E2D6] dark:border-[#2E2C27] text-[#26261F] dark:text-[#F5F2EA]">
                <tr>
                  <th className="py-4 px-6 font-bold">Capabilities</th>
                  <th className="py-4 px-6 font-bold text-[#B0542E]">Notes Club</th>
                  <th className="py-4 px-6 font-bold text-[#8E8C7E]">Messy Google Drives</th>
                  <th className="py-4 px-6 font-bold text-[#8E8C7E]">Commercial Ad Sites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9E2D6]/60 dark:divide-[#2E2C27]/60 text-[#5A5A4E] dark:text-[#C4BFB2]">
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#26261F] dark:text-[#F5F2EA]">Instant Global Search</td>
                  <td className="py-4 px-6 text-[#4E7A5E] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Sub-Second (&lt;50ms)
                  </td>
                  <td className="py-4 px-6 text-[#8E8C7E]">Slow & Folder-based</td>
                  <td className="py-4 px-6 text-[#8E8C7E]">Gated by Captchas</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#26261F] dark:text-[#F5F2EA]">Cross-Device Reading Resume</td>
                  <td className="py-4 px-6 text-[#4E7A5E] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Automatic
                  </td>
                  <td className="py-4 px-6 text-rose-500 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> No memory
                  </td>
                  <td className="py-4 px-6 text-rose-500 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> No memory
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#26261F] dark:text-[#F5F2EA]">Clean Distraction-Free Reader</td>
                  <td className="py-4 px-6 text-[#4E7A5E] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> 100% Focused
                  </td>
                  <td className="py-4 px-6 text-[#8E8C7E]">Generic PDF viewer</td>
                  <td className="py-4 px-6 text-rose-500 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Full of Ads
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-semibold text-[#26261F] dark:text-[#F5F2EA]">Student Pricing</td>
                  <td className="py-4 px-6 text-[#4E7A5E] font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> 100% Free Always
                  </td>
                  <td className="py-4 px-6 text-[#8E8C7E]">Free</td>
                  <td className="py-4 px-6 text-rose-500 flex items-center gap-1.5">
                    <XCircle className="h-4 w-4" /> Expensive Paywalls
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B0542E]">
            Common Queries
          </span>
          <h2 className="font-serif-fraunces text-3xl sm:text-4xl font-bold text-[#26261F] dark:text-[#F5F2EA] mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] space-y-2 shadow-sm"
            >
              <h4 className="font-serif-fraunces text-base font-bold text-[#26261F] dark:text-[#F5F2EA] flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#B0542E] shrink-0" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs sm:text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <MarketingFooter />
    </div>
  );
}
