"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface Mode {
  id: string
  label: string
  title: string
  description: string
  benefits: string[]
  color: string
  bg: string
  premium: boolean
}

const modes: Mode[] = [
  {
    id: "chat",
    label: "💬 Chat",
    title: "AI Chat Tutor",
    description:
      "Notebook-style conversation with your AI tutor. Ask anything, get guided — never just told the answer.",
    benefits: ["Open-ended questions", "Hint system", "Any topic anytime"],
    color: "#0066CB",
    bg: "#EEF5FF",
    premium: false,
  },
  {
    id: "practice",
    label: "📝 Practice",
    title: "Guided Practice",
    description:
      "Hand-picked problems for your exact exam. The AI coaches you through each one.",
    benefits: ["Exam-calibrated difficulty", "Step-by-step guidance", "Unlimited retries"],
    color: "#059669",
    bg: "#ECFDF5",
    premium: false,
  },
  {
    id: "exam",
    label: "⏱️ Exam",
    title: "Mock Exams",
    description:
      "Full timed mock exams matching real test conditions. Instant feedback on every question.",
    benefits: ["Real exam format", "Timed conditions", "Detailed results"],
    color: "#E34C00",
    bg: "#FFF7ED",
    premium: true,
  },
  {
    id: "adventure",
    label: "⛏️ Adventure",
    title: "Adventure Mode",
    description:
      "A Minecraft-style world where maths is the key to progress. Perfect for reluctant learners.",
    benefits: ["Gamified maths", "Stars and XP", "Works alongside study"],
    color: "#16A34A",
    bg: "#F0FDF4",
    premium: true,
  },
]

function CheckMark({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="shrink-0 mt-0.5">
      <circle cx="7" cy="7" r="7" fill={color} fillOpacity="0.15" />
      <path d="M4.5 7l1.8 1.8 3.2-3.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ModePreviewCard({ mode }: { mode: Mode }) {
  return (
    <div
      className="rounded-xl p-6 flex flex-col gap-3 h-full min-h-[160px] items-center justify-center relative overflow-hidden"
      style={{ background: mode.bg, border: `1.5px solid ${mode.color}30` }}
    >
      {mode.premium && (
        <span
          className="absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: mode.color, color: "white" }}
        >
          Premium
        </span>
      )}
      <p
        className="text-4xl font-black text-center leading-none"
        style={{ fontFamily: "var(--font-jakarta)", color: mode.color, opacity: 0.25 }}
      >
        {mode.label.split(" ")[0]}
      </p>
      <p
        className="text-base font-bold text-center"
        style={{ fontFamily: "var(--font-jakarta)", color: mode.color }}
      >
        {mode.title}
      </p>
    </div>
  )
}

export default function ModesTabs() {
  const [activeTab, setActiveTab] = useState(0)
  const prefersReducedMotion = useReducedMotion()
  const active = modes[activeTab]

  return (
    <section className="py-20 sm:py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-12">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            STUDY MODES
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
          >
            Four ways to learn
          </h2>
        </div>

        {/* Tab bar */}
        <div
          className="flex gap-1 rounded-xl p-1 mb-10 overflow-x-auto"
          style={{ background: "#E2E8F0" }}
          role="tablist"
        >
          {modes.map((mode, i) => (
            <button
              key={mode.id}
              role="tab"
              aria-selected={activeTab === i}
              aria-controls={`tab-panel-${mode.id}`}
              onClick={() => setActiveTab(i)}
              className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap min-h-[44px]"
              style={{
                fontFamily: "var(--font-jakarta)",
                background: activeTab === i ? "white" : "transparent",
                color: activeTab === i ? "#0B1533" : "#5A6B8C",
                boxShadow: activeTab === i ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              id={`tab-panel-${active.id}`}
              role="tabpanel"
              initial={prefersReducedMotion ? false : { opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-start"
            >
              {/* Left: description */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  {active.premium && (
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: active.color, color: "white" }}
                    >
                      Premium
                    </span>
                  )}
                </div>
                <h3
                  className="text-xl font-bold"
                  style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
                >
                  {active.title}
                </h3>
                <p
                  className="text-base leading-relaxed"
                  style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
                >
                  {active.description}
                </p>
                <ul className="flex flex-col gap-3">
                  {active.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <CheckMark color={active.color} />
                      <span
                        className="text-sm"
                        style={{ fontFamily: "var(--font-inter)", color: "#0B1533" }}
                      >
                        {benefit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: preview card */}
              <ModePreviewCard mode={active} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
