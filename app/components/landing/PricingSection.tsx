"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

interface PricingSectionProps {
  onOpenApp: () => void
}

function CheckFree({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 mt-0.5">
        <circle cx="8" cy="8" r="8" fill="#059669" fillOpacity="0.12" />
        <path d="M5 8l2.2 2.2L11 6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#475569" }}>
        {children}
      </span>
    </li>
  )
}

function CheckPremium({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 mt-0.5">
        <circle cx="8" cy="8" r="8" fill="#FDC800" fillOpacity="0.25" />
        <path d="M5 8l2.2 2.2L11 6" stroke="#FDC800" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm" style={{ fontFamily: "var(--font-inter)", color: "#cbd5e1" }}>
        {children}
      </span>
    </li>
  )
}

export default function PricingSection({ onOpenApp }: PricingSectionProps) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="pricing" className="py-20 sm:py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            PRICING
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
          >
            Simple, honest pricing
          </h2>
          <p
            className="mt-4 text-base"
            style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
          >
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {/* Free card */}
          <motion.div
            initial={prefersReducedMotion ? "visible" : "hidden"}
            animate={inView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.4 }}
            className="bg-white rounded-2xl border border-slate-200 p-7 flex flex-col gap-6"
          >
            <div>
              <p
                className="font-bold text-xl mb-2"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
              >
                Free
              </p>
              <p
                className="text-4xl font-black"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
              >
                $0
              </p>
              <p
                className="text-sm mt-1"
                style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
              >
                Forever. No card needed.
              </p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              <CheckFree>10 AI questions per day</CheckFree>
              <CheckFree>Chat mode (AI Tutor)</CheckFree>
              <CheckFree>Practice mode</CheckFree>
              <CheckFree>No credit card</CheckFree>
            </ul>

            <button
              onClick={onOpenApp}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:bg-slate-900 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900"
              style={{
                fontFamily: "var(--font-jakarta)",
                border: "2px solid #0B1533",
                color: "#0B1533",
                background: "white",
              }}
              aria-label="Start free — no sign-up needed"
            >
              Start free →
            </button>
          </motion.div>

          {/* Premium card */}
          <motion.div
            initial={prefersReducedMotion ? "visible" : "hidden"}
            animate={inView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border-2 p-7 flex flex-col gap-6 relative overflow-hidden"
            style={{ background: "#000936", borderColor: "#FDC800" }}
          >
            <div
              className="absolute top-5 right-5 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{
                fontFamily: "var(--font-jakarta)",
                background: "#FDC800",
                color: "#000936",
              }}
            >
              Most popular
            </div>

            <div>
              <p
                className="font-bold text-xl mb-2 text-white"
                style={{ fontFamily: "var(--font-jakarta)" }}
              >
                Premium
              </p>
              <div className="flex items-end gap-1">
                <p
                  className="text-4xl font-black"
                  style={{ fontFamily: "var(--font-jakarta)", color: "#FDC800" }}
                >
                  $9.99
                </p>
                <span
                  className="text-sm mb-1"
                  style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
                >
                  /month AUD
                </span>
              </div>
              <p
                className="text-sm mt-1"
                style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
              >
                7-day free trial
              </p>
            </div>

            <ul className="flex flex-col gap-3 flex-1">
              <CheckPremium>Unlimited AI questions</CheckPremium>
              <CheckPremium>All 4 modes (including Exam + Adventure)</CheckPremium>
              <CheckPremium>Up to 5 child profiles</CheckPremium>
              <CheckPremium>Progress dashboard + streaks</CheckPremium>
              <CheckPremium>Chapter tests and topic mastery</CheckPremium>
              <CheckPremium>Priority support</CheckPremium>
            </ul>

            <div className="flex flex-col gap-3">
              <a
                href="/sign-up"
                className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-400"
                style={{
                  fontFamily: "var(--font-jakarta)",
                  background: "#FDC800",
                  color: "#000936",
                }}
                aria-label="Start 7-day free trial"
              >
                Start 7-day free trial →
              </a>
              <p
                className="text-xs text-center leading-relaxed"
                style={{ fontFamily: "var(--font-inter)", color: "#64748B" }}
              >
                Card required. Nothing charged for 7 days. Cancel any time before day
                7 — one tap, no calls.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Reassurance row */}
        <p
          className="text-center text-xs mt-8"
          style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
        >
          Cancel anytime &middot; Australian owned &middot; Apple Pay &amp; Google Pay
          accepted
        </p>
      </div>
    </section>
  )
}
