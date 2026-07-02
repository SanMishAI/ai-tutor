"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

interface Exam {
  abbr: string
  full: string
  years: string
  descriptor: string
  color: string
}

const exams: Exam[] = [
  {
    abbr: "AMC",
    full: "Australian Mathematics Competition",
    years: "Year 3–12",
    descriptor: "Australia's top maths competition",
    color: "#b45309",
  },
  {
    abbr: "OLY",
    full: "Maths Olympiad",
    years: "Year 4–12",
    descriptor: "Problem-solving at the highest level",
    color: "#0066CB",
  },
  {
    abbr: "ACER",
    full: "ACER Selective Entry",
    years: "Year 3–12",
    descriptor: "Selective school admissions",
    color: "#059669",
  },
  {
    abbr: "ICAS",
    full: "International Competitions & Assessments",
    years: "Year 2–12",
    descriptor: "Academic competitions across 6 subjects",
    color: "#7c3aed",
  },
  {
    abbr: "ATAR",
    full: "Australian Tertiary Admission Rank",
    years: "Year 11–12",
    descriptor: "University entrance preparation",
    color: "#dc2626",
  },
  {
    abbr: "NAPLAN",
    full: "National Assessment Program",
    years: "Year 3, 5, 7, 9",
    descriptor: "National literacy and numeracy",
    color: "#d97706",
  },
  {
    abbr: "BEB",
    full: "Bebras Computing Challenge",
    years: "Year 3–12",
    descriptor: "Computational thinking",
    color: "#0891b2",
  },
  {
    abbr: "KSF",
    full: "Kangourou sans frontières",
    years: "Year 3–12",
    descriptor: "Kangaroo maths competition",
    color: "#be185d",
  },
]

export default function ExamGrid() {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section id="exams" className="py-20 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            EXAM COVERAGE
          </p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
          >
            8 Australian exams, one platform
          </h2>
          <p
            className="mt-4 text-base max-w-xl mx-auto"
            style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
          >
            Questions, difficulty, and topics calibrated for each exam and year level.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {exams.map((exam, i) => (
            <motion.div
              key={exam.abbr}
              initial={prefersReducedMotion ? "visible" : "hidden"}
              animate={inView ? "visible" : "hidden"}
              variants={{
                hidden: { opacity: 0, scale: 0.95 },
                visible: { opacity: 1, scale: 1 },
              }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-2xl bg-white border border-slate-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-default"
            >
              {/* Monogram circle */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-black text-white text-xs mb-3"
                style={{
                  background: exam.color,
                  fontFamily: "var(--font-jakarta)",
                  letterSpacing: "-0.5px",
                }}
              >
                {exam.abbr}
              </div>

              <p
                className="font-semibold text-sm leading-snug mb-1"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
              >
                {exam.full}
              </p>
              <p
                className="text-xs mb-2"
                style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
              >
                {exam.years}
              </p>
              <p
                className="text-xs leading-snug"
                style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
              >
                {exam.descriptor}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
