"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface MobileBottomBarProps {
  onOpenApp: () => void
}

export default function MobileBottomBar({ onOpenApp }: MobileBottomBarProps) {
  const [visible, setVisible] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const pricingRef = useRef<Element | null>(null)
  const [pricingInView, setPricingInView] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 200)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    const pricingEl = document.querySelector("#pricing")
    if (!pricingEl) return
    pricingRef.current = pricingEl

    const observer = new IntersectionObserver(
      ([entry]) => setPricingInView(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(pricingEl)
    return () => observer.disconnect()
  }, [])

  const show = visible && !pricingInView

  return (
    <div className="sm:hidden" aria-hidden={!show}>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={prefersReducedMotion ? false : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-xl px-4 py-3"
          >
            <button
              onClick={onOpenApp}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              style={{
                fontFamily: "var(--font-jakarta)",
                background: "#0066CB",
                color: "white",
              }}
              aria-label="Try SelectEd free — no sign-up needed"
            >
              Try it free → no sign-up
            </button>
            <p
              className="text-center text-xs mt-1.5"
              style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
            >
              10 free questions a day &middot; no credit card
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
