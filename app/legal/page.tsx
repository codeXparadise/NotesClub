import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import {
  Scale,
  Award,
  ShieldCheck,
  FileText,
  Mail,
  AlertCircle,
  CheckCircle2,
  Lock,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Legal Documentation & Creator Credits — Notes Club",
  description:
    "Official educational fair use policy, creator shoutout declaration, DMCA content takedown process, and terms of use for Notes Club.",
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-[#F7F4EE] dark:bg-[#151412] text-[#26261F] dark:text-[#F5F2EA] flex flex-col font-sans selection:bg-[#B0542E] selection:text-white">
      <MarketingNavbar />

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-20 overflow-hidden border-b border-[#E9E2D6] dark:border-[#2E2C27]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#F1ECE3] dark:bg-[#282622] border border-[#DED5C6] dark:border-[#3E3B34] text-xs font-semibold text-[#5A5A4E] dark:text-[#C4BFB2] mb-6">
            <Scale className="h-3.5 w-3.5 text-[#B0542E]" />
            <span>LEGAL DOCUMENTATION & EDUCATIONAL POLICIES</span>
          </div>

          <h1 className="font-serif-fraunces text-4xl sm:text-6xl font-bold tracking-tight text-[#26261F] dark:text-[#F5F2EA] leading-[1.15] mb-6">
            Platform Purpose,{" "}
            <span className="italic font-normal text-[#B0542E]">
              Creator Credits
            </span>{" "}
            & Fair Use Policy.
          </h1>

          <p className="text-base sm:text-lg text-[#5A5A4E] dark:text-[#C4BFB2] max-w-2xl mx-auto leading-relaxed mb-8">
            Notes Club operates with total transparency, gratitude towards original educators, and strict adherence to non-profit student educational standards.
          </p>

          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#B0542E]/10 text-[#B0542E] border border-[#B0542E]/20 text-xs font-bold">
            <Award className="h-4 w-4" />
            <span>Full shoutout & complete credits belong to the original note creators and professors.</span>
          </div>
        </div>
      </section>

      {/* QUICK SECTION DIRECTORY */}
      <section className="py-4 border-b border-[#E9E2D6] dark:border-[#2E2C27] bg-[#F1ECE3]/80 dark:bg-[#1A1916]/80 backdrop-blur-sm sticky top-20 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar text-xs font-semibold text-[#5A5A4E] dark:text-[#C4BFB2] whitespace-nowrap">
            <a href="#platform-purpose" className="hover:text-[#B0542E] transition py-1">
              1. Platform Purpose
            </a>
            <span className="text-[#DED5C6] dark:text-[#3E3B34]">•</span>
            <a href="#creator-shoutout" className="text-[#B0542E] hover:underline transition py-1 font-bold">
              2. Creator Shoutout & Credits
            </a>
            <span className="text-[#DED5C6] dark:text-[#3E3B34]">•</span>
            <a href="#fair-use" className="hover:text-[#B0542E] transition py-1">
              3. Fair Use Disclaimer
            </a>
            <span className="text-[#DED5C6] dark:text-[#3E3B34]">•</span>
            <a href="#dmca" className="hover:text-[#B0542E] transition py-1">
              4. DMCA & Takedown Policy
            </a>
            <span className="text-[#DED5C6] dark:text-[#3E3B34]">•</span>
            <a href="#terms" className="hover:text-[#B0542E] transition py-1">
              5. Student Terms of Use
            </a>
            <span className="text-[#DED5C6] dark:text-[#3E3B34]">•</span>
            <a href="#privacy" className="hover:text-[#B0542E] transition py-1">
              6. Privacy Policy
            </a>
          </div>
        </div>
      </section>

      {/* DETAILED LEGAL SECTIONS */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* SECTION 1: PLATFORM PURPOSE */}
        <section id="platform-purpose" className="scroll-mt-36 space-y-4">
          <div className="flex items-center space-x-3 text-[#B0542E]">
            <GraduationCap className="h-6 w-6" />
            <h2 className="font-serif-fraunces text-xl sm:text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              1. Purpose of the Platform
            </h2>
          </div>

          <div className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed space-y-3">
            <p>
              <strong>Notes Club</strong> is a non-profit, student-centric academic digital reading platform created for college students to easily find, organize, and study lecture notes, textbook summaries, and previous years&apos; question papers.
            </p>
            <p>
              The platform solves the ubiquitous problem of scattered links, lost files, and chaotic study groups by organizing notes systematically by college, course, stream (Science, Commerce, Arts), and semester (FY, SY, TY, Final).
            </p>
            <div className="p-4 rounded-2xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#E9E2D6] dark:border-[#2E2C27] text-xs text-[#26261F] dark:text-[#F5F2EA]">
              <strong>Non-Commercial Guarantee:</strong> Notes Club does not charge student subscription fees, does not sell study notes, does not run third-party advertising networks, and does not commercially monetize uploaded educational materials.
            </div>
          </div>
        </section>

        {/* SECTION 2: CREATOR SHOUTOUT & FULL CREDITS */}
        <section id="creator-shoutout" className="scroll-mt-36 space-y-4 p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] shadow-sm">
          <div className="flex items-center space-x-3 text-[#B0542E]">
            <Award className="h-7 w-7" />
            <h2 className="font-serif-fraunces text-xl sm:text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              2. Creator Shoutout & Full Attribution Policy
            </h2>
          </div>

          <div className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed space-y-4">
            <p className="font-semibold text-base text-[#26261F] dark:text-[#F5F2EA]">
              We would like to give our deepest gratitude, shoutout, and 100% full credit to all original creators, professors, authors, teaching assistants, and student contributors whose lecture notes are featured on this platform.
            </p>

            <p>
              Educators and passionate note-takers invest countless hours drafting clear diagrams, solving complex formulas, and summarizing dense textbooks. Their work forms the backbone of college education and empowers thousands of students who might otherwise struggle to afford expensive commercial guides.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0 mt-0.5" />
                <span>
                  <strong>Full Intellectual Ownership:</strong> All copyright, moral rights, and intellectual property remain solely with the original creators and authors.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0 mt-0.5" />
                <span>
                  <strong>Preservation of Original Branding:</strong> Notes Club does not remove, crop, or alter creator watermarks, signatures, or institutional headers present in the source documents.
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="h-4 w-4 text-[#4E7A5E] shrink-0 mt-0.5" />
                <span>
                  <strong>Creator Recognition:</strong> If you are a creator whose notes are indexed here and would like your name, YouTube channel, website, or social links explicitly highlighted, please let us know! We would be honored to credit you prominently.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: EDUCATIONAL FAIR USE DISCLAIMER */}
        <section id="fair-use" className="scroll-mt-36 space-y-4">
          <div className="flex items-center space-x-3 text-[#B0542E]">
            <Scale className="h-6 w-6" />
            <h2 className="font-serif-fraunces text-xl sm:text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              3. Educational Fair Use Declaration
            </h2>
          </div>

          <div className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed space-y-3">
            <p>
              Materials referenced on Notes Club are provided under the doctrine of <strong>Fair Use</strong> for non-commercial educational purposes, in accordance with:
            </p>

            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong>Section 107 of the US Copyright Act:</strong> Fair use for purposes such as criticism, comment, scholarship, education, and study is not an infringement of copyright.
              </li>
              <li>
                <strong>Section 52(1)(a) of the Indian Copyright Act, 1957:</strong> Fair dealing with any work for private or personal use, including research or study, does not constitute copyright infringement.
              </li>
            </ul>

            <p>
              The platform acts as an organized digital library index. We do not claim ownership of any copyrighted textbooks, syllabus blueprints, or institutional syllabi.
            </p>
          </div>
        </section>

        {/* SECTION 4: CONTENT TAKEDOWN & DMCA */}
        <section id="dmca" className="scroll-mt-36 space-y-4 p-8 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] shadow-sm">
          <div className="flex items-center space-x-3 text-[#B0542E]">
            <AlertCircle className="h-6 w-6" />
            <h2 className="font-serif-fraunces text-xl sm:text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              4. Content Removal & DMCA Takedown Procedure
            </h2>
          </div>

          <div className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed space-y-3">
            <p>
              We respect intellectual property rights and will promptly remove any document upon the legitimate request of the copyright owner, author, or authorized representative.
            </p>

            <p>
              If you believe your copyrighted work has been uploaded without authorization, or if you prefer that your educational material not be indexed on our student portal, please send an email with the following details:
            </p>

            <div className="p-4 rounded-2xl bg-[#F7F4EE] dark:bg-[#151412] border border-[#E9E2D6] dark:border-[#2E2C27] space-y-2 text-xs font-mono text-[#26261F] dark:text-[#F5F2EA]">
              <div>1. Document Title / URL on Notes Club</div>
              <div>2. Proof of authorship or copyright ownership</div>
              <div>3. Your full name and contact information</div>
              <div>4. Preferred action: (A) Complete Removal, or (B) Add Custom Creator Shoutout & Social Links</div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <Mail className="h-5 w-5 text-[#B0542E]" />
              <span className="text-xs font-semibold text-[#26261F] dark:text-[#F5F2EA]">
                Official Removal Contact:{" "}
                <a href="mailto:admin@notesclub.com" className="text-[#B0542E] underline">
                  admin@notesclub.com
                </a>
              </span>
            </div>
            <p className="text-[11px] text-[#8E8C7E]">
              * Takedown requests are processed within 24 to 48 business hours with zero complications.
            </p>
          </div>
        </section>

        {/* SECTION 5: STUDENT TERMS OF USE */}
        <section id="terms" className="scroll-mt-36 space-y-4">
          <div className="flex items-center space-x-3 text-[#B0542E]">
            <FileText className="h-6 w-6" />
            <h2 className="font-serif-fraunces text-xl sm:text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              5. Student Terms of Use & Anti-Piracy Protection
            </h2>
          </div>

          <div className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed space-y-3">
            <p>
              By accessing Notes Club, all students agree to adhere to the following community guidelines:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start space-x-2">
                <span className="font-bold text-[#26261F] dark:text-[#F5F2EA]">1. Non-Commercial Use:</span>
                <span>You may read and study materials solely for personal academic preparation. Commercial redistribution, selling, or re-packaging of notes is strictly prohibited.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-[#26261F] dark:text-[#F5F2EA]">2. Anti-Piracy Watermark:</span>
                <span>The platform applies dynamic student watermarks to safeguard educational content. Tampering with or bypassing reader security measures is grounds for immediate account suspension.</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="font-bold text-[#26261F] dark:text-[#F5F2EA]">3. Academic Integrity:</span>
                <span>Notes Club encourages collaborative learning. The platform must never be used for cheating or academic misconduct during active examinations.</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: PRIVACY POLICY */}
        <section id="privacy" className="scroll-mt-36 space-y-4">
          <div className="flex items-center space-x-3 text-[#B0542E]">
            <Lock className="h-6 w-6" />
            <h2 className="font-serif-fraunces text-xl sm:text-2xl font-bold text-[#26261F] dark:text-[#F5F2EA]">
              6. Privacy & Data Protection Policy
            </h2>
          </div>

          <div className="text-sm text-[#5A5A4E] dark:text-[#C4BFB2] leading-relaxed space-y-3">
            <p>
              We take student privacy seriously. We collect only minimal essential information required for student authentication:
            </p>

            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Student Name & College Roll Number (for institutional division matching)</li>
              <li>Valid Email Address & Encrypted Authentication Credentials (managed securely via Supabase)</li>
              <li>Reading bookmark coordinates (to enable cross-device resume)</li>
            </ul>

            <p className="text-xs">
              We never sell student data, never share personal contact details with commercial third parties, and never run tracking trackers or advertisements.
            </p>
          </div>
        </section>

        {/* SUMMARY CALLOUT */}
        <div className="p-6 rounded-3xl bg-[#FFFFFF] dark:bg-[#1E1D19] border border-[#DED5C6] dark:border-[#3E3B34] text-center space-y-3">
          <h3 className="font-serif-fraunces text-base font-bold text-[#26261F] dark:text-[#F5F2EA]">
            Have Questions Regarding Creator Credits or Content Policies?
          </h3>
          <p className="text-xs text-[#5A5A4E] dark:text-[#C4BFB2] max-w-md mx-auto">
            Our admin team is always available to assist authors, professors, and students alike.
          </p>
          <div className="pt-2">
            <a
              href="mailto:admin@notesclub.com"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#B0542E] hover:bg-[#974522] text-white font-bold text-xs shadow-sm transition"
            >
              <Mail className="h-4 w-4" />
              <span>Contact Admin Team</span>
            </a>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
