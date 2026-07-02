"use client"

import { motion, useReducedMotion } from "framer-motion"
import { SignInButton } from "@clerk/nextjs"
import InteractiveDemo from "./InteractiveDemo"

interface HeroSectionProps {
  onOpenApp: () => void
  onStudentLogin: () => void
  isSignedIn: boolean
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="7" cy="7" r="7" fill="#059669" fillOpacity="0.2" />
      <path d="M4.5 7l1.8 1.8L10 5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const examPills = [
  "AMC",
  "Olympiad",
  "ACER",
  "ICAS",
  "ATAR",
  "NAPLAN",
  "Bebras",
  "KSF",
]

export default function HeroSection({ onOpenApp, onStudentLogin, isSignedIn }: HeroSectionProps) {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="relative overflow-hidden bg-white pt-10 pb-16 sm:pt-14 sm:pb-20">
      {/* Radial gradient behind demo card */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 70% 50%, #EEF5FF 0%, transparent 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: copy */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Eyebrow */}
            <p
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
            >
              AI EXAM PREP · YEAR 2–12
            </p>

            {/* H1 */}
            <h1
              className="font-extrabold leading-[1.05] tracking-tight mb-6"
              style={{
                fontFamily: "var(--font-jakarta)",
                fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
                color: "#0B1533",
              }}
            >
              Your child&apos;s own tutor. 24/7, for the price of one coffee a month.
            </h1>

            {/* Subheading */}
            <p
              className="mb-8 leading-[1.65] max-w-lg"
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "clamp(1.05rem, 2vw, 1.2rem)",
                color: "#5A6B8C",
              }}
            >
              A patient AI tutor that guides your child to the answer — never just
              hands it over. Calibrated to their exact exam and year level. Try it
              right now, no sign-up needed.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <button
                onClick={onOpenApp}
                className="px-6 py-3.5 rounded-xl font-semibold text-sm text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
                style={{
                  fontFamily: "var(--font-jakarta)",
                  background: "#0066CB",
                }}
                aria-label="Try SelectEd free — no sign-up needed"
              >
                Try it free — no sign-up
              </button>
              <a
                href="#pricing"
                className="px-6 py-3.5 rounded-xl font-semibold text-sm transition-all hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-400 text-center"
                style={{
                  fontFamily: "var(--font-jakarta)",
                  color: "#0066CB",
                  border: "1.5px solid #0066CB",
                }}
              >
                See plans →
              </a>
            </div>

            {/* Student link */}
            <div className="mb-6">
              <button
                onClick={onStudentLogin}
                className="text-sm font-medium transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
              >
                Already a student? Log in here →
              </button>
            </div>

            {/* Trust row */}
            <div
              className="flex flex-wrap gap-4 mb-6"
              style={{ fontFamily: "var(--font-inter)", fontSize: "0.8rem", color: "#5A6B8C" }}
            >
              {[
                "No credit card for free tier",
                "10 free questions daily",
                "Built in Melbourne",
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckIcon />
                  {item}
                </span>
              ))}
            </div>

            {/* Exam pills */}
            <div
              className="flex flex-wrap gap-2 overflow-x-auto pb-1"
              role="list"
              aria-label="Supported exams"
            >
              {examPills.map((pill) => (
                <span
                  key={pill}
                  role="listitem"
                  className="px-2.5 py-1 rounded-full text-xs shrink-0"
                  style={{
                    fontFamily: "var(--font-inter)",
                    color: "#8898B0",
                    border: "1px solid #E4E9F0",
                    background: "white",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: interactive demo */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="w-full"
          >
            <InteractiveDemo onOpenApp={onOpenApp} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
