"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { SignInButton } from "@clerk/nextjs"

interface LandingNavProps {
  onOpenApp: () => void
  onStudentLogin: () => void
  isSignedIn: boolean
}

function HamburgerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M3 6h16M3 11h16M3 16h16" stroke="#0B1533" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M5 5l12 12M17 5L5 17" stroke="#0B1533" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#exams", label: "Exams" },
  { href: "#pricing", label: "Pricing" },
]

export default function LandingNav({ onOpenApp, onStudentLogin, isSignedIn }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close drawer on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [drawerOpen])

  function handleNavLinkClick() {
    setDrawerOpen(false)
  }

  return (
    <>
      <nav
        className="sticky top-0 z-50 bg-white transition-shadow duration-200"
        style={{
          boxShadow: scrolled ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
        }}
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
            aria-label="SelectEd home"
          >
            <img
              src="/selected-logo.svg"
              alt=""
              width={28}
              height={28}
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
            <div className="leading-none">
              <span
                className="font-black text-lg"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
              >
                Select
              </span>
              <span
                className="font-black text-lg"
                style={{ fontFamily: "var(--font-jakarta)", color: "#E34C00" }}
              >
                Ed
              </span>
            </div>
          </a>

          {/* Center nav links — desktop */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded px-1"
                style={{ fontFamily: "var(--font-jakarta)", color: "#5A6B8C" }}
              >
                {label}
              </a>
            ))}
          </div>

          {/* Right: Sign in + CTA */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <SignInButton mode="modal">
                <button
                  className="text-sm font-medium transition-colors hover:text-slate-900 px-3 py-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px]"
                  style={{ fontFamily: "var(--font-jakarta)", color: "#5A6B8C" }}
                >
                  Sign in
                </button>
              </SignInButton>
            </div>

            <button
              onClick={onOpenApp}
              className="hidden md:flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 min-h-[44px]"
              style={{ fontFamily: "var(--font-jakarta)", background: "#0066CB" }}
              aria-label="Try SelectEd free"
            >
              Try it free →
            </button>

            {/* Mobile: Try it free */}
            <button
              onClick={onOpenApp}
              className="md:hidden px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 min-h-[44px]"
              style={{ fontFamily: "var(--font-jakarta)", background: "#0066CB" }}
              aria-label="Try SelectEd free"
            >
              Try it free
            </button>

            {/* Mobile: Hamburger */}
            <button
              onClick={() => setDrawerOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
              aria-controls="mobile-drawer"
            >
              {drawerOpen ? <CloseIcon /> : <HamburgerIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              id="mobile-drawer"
              role="dialog"
              aria-label="Navigation menu"
              initial={prefersReducedMotion ? false : { opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25, ease: "easeOut" }}
              className="fixed top-16 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-xl md:hidden"
            >
              <div className="px-5 py-6 flex flex-col gap-1">
                {navLinks.map(({ href, label }) => (
                  <a
                    key={href}
                    href={href}
                    onClick={handleNavLinkClick}
                    className="py-3 px-2 rounded-lg text-base font-medium transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px] flex items-center"
                    style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
                  >
                    {label}
                  </a>
                ))}

                <div className="my-2 border-t border-slate-100" />

                <button
                  onClick={() => {
                    handleNavLinkClick()
                    onStudentLogin()
                  }}
                  className="py-3 px-2 rounded-lg text-base font-medium text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px]"
                  style={{ fontFamily: "var(--font-jakarta)", color: "#5A6B8C" }}
                >
                  I&apos;m a student →
                </button>

                <div className="mt-2">
                  <SignInButton mode="modal">
                    <button
                      onClick={handleNavLinkClick}
                      className="w-full py-3 px-4 rounded-xl text-sm font-semibold border border-slate-200 transition-all hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px]"
                      style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
                    >
                      Sign in
                    </button>
                  </SignInButton>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
