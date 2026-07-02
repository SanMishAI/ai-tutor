"use client"

import { motion, useReducedMotion } from "framer-motion"
import { useRef } from "react"
import { useInView } from "framer-motion"

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="#0066CB" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" stroke="#0066CB" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1.5" fill="#0066CB" />
    </svg>
  )
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3C7 3 5 5 5 7.5C4 7.5 3 8.5 3 10C3 11.5 4 12.5 5 12.5C5 15 7 17 10 17C13 17 15 15 15 12.5C16 12.5 17 11.5 17 10C17 8.5 16 7.5 15 7.5C15 5 13 3 10 3Z" stroke="#0066CB" strokeWidth="1.5" fill="none" />
      <path d="M10 8v4M8 10h4" stroke="#0066CB" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="3" y="12" width="3" height="5" rx="0.5" fill="#0066CB" />
      <rect x="8.5" y="8" width="3" height="9" rx="0.5" fill="#0066CB" />
      <rect x="14" y="4" width="3" height="13" rx="0.5" fill="#0066CB" />
      <path d="M3 16L17 4" stroke="#0066CB" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  )
}

const steps = [
  {
    number: 1,
    title: "Pick your exam",
    icon: <TargetIcon />,
    description:
      "Choose from 8 Australian exams and your child's year level. The AI calibrates instantly.",
  },
  {
    number: 2,
    title: "Study the smart way",
    icon: <BrainIcon />,
    description:
      "Chat tutoring, guided practice, timed mock exams, or the adventure game — whatever fits today.",
  },
  {
    number: 3,
    title: "Watch progress build",
    icon: <ChartIcon />,
    description:
      "Streaks, mistake reviews, chapter tests, and a progress dashboard for your child.",
  },
]

export default function HowItWorks() {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="how-it-works" className="py-20 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            HOW IT WORKS
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold leading-tight"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
          >
            Three steps to real results
          </h2>
        </div>

        <div ref={ref} className="relative">
          {/* Dashed connector line — desktop only */}
          <div
            className="hidden sm:block absolute top-[44px] left-[calc(16.66%+20px)] right-[calc(16.66%+20px)] border-t-2 border-dashed border-slate-200"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-6 relative">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={prefersReducedMotion ? "visible" : "hidden"}
                animate={inView ? "visible" : "hidden"}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="flex flex-col items-center text-center"
              >
                {/* Number circle */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 relative z-10"
                  style={{ background: "#0066CB", fontFamily: "var(--font-jakarta)" }}
                >
                  {step.number}
                </div>

                {/* Content */}
                <div className="mt-5 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    {step.icon}
                    <h3
                      className="font-bold text-base"
                      style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
                    >
                      {step.title}
                    </h3>
                  </div>
                  <p
                    className="text-sm leading-relaxed max-w-xs"
                    style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
                  >
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
