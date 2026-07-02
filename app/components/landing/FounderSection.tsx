"use client"

import { useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

export default function FounderSection() {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-2xl mx-auto px-5 sm:px-8">
        <motion.div
          ref={ref}
          initial={prefersReducedMotion ? "visible" : "hidden"}
          animate={inView ? "visible" : "hidden"}
          variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-8"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            THE STORY BEHIND SELECTED
          </p>

          <p
            className="text-xl sm:text-2xl font-bold italic mb-10 leading-snug"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
          >
            &ldquo;I built the tool I wish existed when my son needed it.&rdquo;
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-8 text-left">
            {/* Photo */}
            <div className="shrink-0">
              <img
                src="/san.jpeg"
                alt="San Mishra, founder of SelectEd"
                width={120}
                height={120}
                className="rounded-full object-cover"
                style={{
                  width: 120,
                  height: 120,
                  outline: "3px solid #FDC800",
                  outlineOffset: 3,
                }}
              />
            </div>

            {/* Text */}
            <div>
              <p
                className="text-sm sm:text-base leading-relaxed mb-5"
                style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
              >
                When my son was preparing for selective school exams, I searched for a
                single, well-designed platform — something that covered all the key
                Australian exams, adapted to his level, and didn&apos;t cost a fortune.
                What I found were fragmented worksheets and expensive tutoring centres.
                So I built SelectEd. Every decision in this product is made with that
                11-year-old in mind.
              </p>
              <p
                className="font-semibold text-sm mb-1"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
              >
                San Mishra
              </p>
              <p
                className="text-xs mb-3"
                style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
              >
                Founder, SelectEd &middot; Melbourne
              </p>
              <a
                href="/about"
                className="text-sm font-semibold transition-colors hover:opacity-70"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
              >
                Read the full story →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
