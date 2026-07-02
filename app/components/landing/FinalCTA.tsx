"use client"

import { SignInButton } from "@clerk/nextjs"

interface FinalCTAProps {
  onOpenApp: () => void
}

export default function FinalCTA({ onOpenApp }: FinalCTAProps) {
  return (
    <section className="py-24" style={{ background: "#0f172a" }}>
      <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
        <h2
          className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight"
          style={{ fontFamily: "var(--font-jakarta)" }}
        >
          Start your child&apos;s exam prep today.
        </h2>
        <p
          className="text-base mb-10"
          style={{
            fontFamily: "var(--font-inter)",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          10 free questions every day. No credit card. Cancel the trial anytime.
        </p>
        <button
          onClick={onOpenApp}
          className="px-8 py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
          style={{
            fontFamily: "var(--font-jakarta)",
            background: "#FDC800",
            color: "#000936",
          }}
          aria-label="Try SelectEd free — no sign-up"
        >
          Try it free →
        </button>

        <div className="mt-6 flex items-center justify-center gap-2">
          <span
            className="text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "rgba(255,255,255,0.35)" }}
          >
            or
          </span>
          <SignInButton mode="modal">
            <button
              className="text-sm font-semibold transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
              style={{ fontFamily: "var(--font-jakarta)", color: "rgba(255,255,255,0.55)" }}
            >
              Sign in →
            </button>
          </SignInButton>
        </div>
      </div>
    </section>
  )
}
