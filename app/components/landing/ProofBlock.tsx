"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

const chatMessages = [
  { role: "student", text: "I got 5x + 3 = 18, so x = 3" },
  {
    role: "ai",
    text: "Great start! You set up the equation correctly. Just double-check your last step — if x = 3, then 5(3) + 3 = 18. Does that hold?",
  },
  { role: "student", text: "Oh wait, 15 + 3 = 18. So x = 3 is right!" },
  {
    role: "ai",
    text: "Exactly! ✅ You caught it yourself. That's the skill that matters in the exam room.",
  },
]

const callouts = [
  {
    title: "Socratic method",
    description:
      "We ask guiding questions, not answers. Your child does the thinking.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="8" stroke="#0066CB" strokeWidth="1.5" />
        <path d="M10 6v1M10 9.5c0-1 1.5-1 1.5-2.5a1.5 1.5 0 00-3 0M10 13v.5" stroke="#0066CB" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Exam-calibrated",
    description:
      "Every question matches the real style and difficulty of the exam they're sitting.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M4 5h12M4 9h8M4 13h10M4 17h6" stroke="#0066CB" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Adapts to mistakes",
    description:
      "Wrong answer? The AI diagnoses the misconception and explains it a different way.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M3 10c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7" stroke="#0066CB" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 10l2-2M3 10l2 2" stroke="#0066CB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 7v3l2 2" stroke="#0066CB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
]

function RobotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="12" height="8" rx="2" fill="#EEF5FF" stroke="#0066CB" strokeWidth="1.2" />
      <rect x="6" y="2" width="6" height="6" rx="1.5" fill="#EEF5FF" stroke="#0066CB" strokeWidth="1.2" />
      <circle cx="6.5" cy="10.5" r="1.2" fill="#0066CB" />
      <circle cx="11.5" cy="10.5" r="1.2" fill="#0066CB" />
      <path d="M6.5 13.5h5" stroke="#0066CB" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="2" x2="9" y2="0.5" stroke="#0066CB" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9" cy="0.5" r="0.8" fill="#0066CB" />
    </svg>
  )
}

export default function ProofBlock() {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="py-20 sm:py-24 bg-slate-50">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            THE SOCRATIC METHOD
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
          >
            How it teaches — not just what
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: chat card */}
          <motion.div
            initial={prefersReducedMotion ? "visible" : "hidden"}
            animate={inView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <RobotIcon />
                <span
                  className="text-sm font-semibold"
                  style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
                >
                  SelectEd AI Tutor
                </span>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "#ECFDF5", color: "#059669", fontFamily: "var(--font-inter)" }}
                >
                  Live session
                </span>
              </div>

              <div className="flex flex-col gap-4">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 ${msg.role === "student" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                      style={
                        msg.role === "ai"
                          ? { background: "#EEF5FF", color: "#0066CB" }
                          : { background: "#F1F5F9", color: "#5A6B8C" }
                      }
                    >
                      {msg.role === "ai" ? "AI" : "S"}
                    </div>
                    <div
                      className="rounded-xl px-3.5 py-2.5 text-sm leading-relaxed max-w-[85%]"
                      style={
                        msg.role === "ai"
                          ? {
                              background: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              color: "#0B1533",
                              fontFamily: "var(--font-inter)",
                            }
                          : {
                              background: "#EEF5FF",
                              color: "#0B1533",
                              fontFamily: "var(--font-inter)",
                            }
                      }
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-5 pt-4 border-t border-slate-100 flex items-start gap-2.5"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 mt-0.5">
                  <circle cx="8" cy="8" r="6" fill="#0066CB" fillOpacity="0.12" />
                  <path d="M5.5 8l2 2 3-3" stroke="#0066CB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p
                  className="text-xs"
                  style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
                >
                  AI guides, never tells — your child builds real confidence
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: callout boxes */}
          <motion.div
            initial={prefersReducedMotion ? "visible" : "hidden"}
            animate={inView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, x: 20 }, visible: { opacity: 1, x: 0 } }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {callouts.map((c) => (
              <div
                key={c.title}
                className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#EEF5FF" }}
                >
                  {c.icon}
                </div>
                <div>
                  <h3
                    className="font-semibold text-sm mb-1"
                    style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
                  >
                    {c.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
                  >
                    {c.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
