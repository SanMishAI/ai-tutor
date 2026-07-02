"use client"

import { useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

const faqs = [
  {
    q: "Is SelectEd really free to try?",
    a: "Yes. Guests get 10 AI questions per day with no sign-up. Create a free account and you keep that limit forever — no card needed.",
  },
  {
    q: "What's included in Premium?",
    a: "Unlimited questions, all four study modes (including timed Mock Exams and the Adventure game), up to 5 child profiles, and a progress dashboard showing streaks, test scores, and chapter completion.",
  },
  {
    q: "How is SelectEd different from just asking ChatGPT?",
    a: "SelectEd uses the Socratic method — it asks your child guiding questions instead of giving them the answer. It's calibrated to specific Australian exams and year levels, tracks progress, and adapts to your child's mistakes. ChatGPT gives answers; SelectEd builds understanding.",
  },
  {
    q: "Can I set it up for multiple children?",
    a: "Premium plans support up to 5 child profiles, each with their own PIN, progress tracking, and daily usage limits.",
  },
  {
    q: "Which exams does it cover?",
    a: "AMC, Maths Olympiad, ACER selective school prep, ICAS (all subjects), ATAR, NAPLAN, Bebras, and Kangaroo School Foundation — with more being added.",
  },
  {
    q: "What if my child gets the wrong answer?",
    a: "The AI diagnoses the specific misconception and explains it a different way. It never just marks it wrong and moves on.",
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            FAQ
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
          >
            Common questions
          </h2>
        </div>

        <div className="flex flex-col">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`border-b border-slate-200 ${i === 0 ? "border-t" : ""}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                aria-controls={`faq-answer-${i}`}
                className="w-full flex items-center justify-between gap-4 px-0 py-5 text-left min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 rounded"
              >
                <span
                  className="font-semibold text-sm sm:text-base leading-snug"
                  style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
                >
                  {faq.q}
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="shrink-0 text-xl leading-none"
                  style={{ color: "#8898B0" }}
                  aria-hidden="true"
                >
                  +
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    id={`faq-answer-${i}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : { duration: 0.25, ease: "easeInOut" }
                    }
                    style={{ overflow: "hidden" }}
                  >
                    <div className="pb-5">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
