"use client"

import { SignInButton, SignUpButton } from "@clerk/nextjs"

const GUEST_DAILY_LIMIT = 20

type Reason = "limit" | "feature"

type Props = {
  reason: Reason
  featureName?: string
  onClose: () => void
}

function timeUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const ms = midnight.getTime() - now.getTime()
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m`
  return `${m} minute${m !== 1 ? "s" : ""}`
}

export default function GuestLimitModal({ reason, featureName, onClose }: Props) {
  const resetIn = timeUntilMidnight()

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 text-center" style={{ background: "#000936" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#FDC800" }}>
            {reason === "limit" ? "Daily limit reached" : "Premium feature"}
          </p>
          <h2 className="text-xl font-black text-white leading-snug">
            {reason === "limit"
              ? `You've used all ${GUEST_DAILY_LIMIT} free questions today`
              : `${featureName ?? "This feature"} requires an account`}
          </h2>
          {reason === "limit" && (
            <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>
              Your limit resets at midnight — in <strong className="text-white">{resetIn}</strong>.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="bg-white px-6 py-5 space-y-3">
          <p className="text-sm text-center leading-relaxed" style={{ color: "#475569" }}>
            {reason === "limit"
              ? "Create a free account and start your 7-day trial for unlimited questions, all modes, and child profiles."
              : "Sign up for a free 7-day trial to unlock every mode, unlimited questions, and child profiles."}
          </p>

          <SignUpButton mode="modal">
            <button
              className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 shadow-sm"
              style={{ background: "#000936", color: "#FDC800" }}
            >
              Start free 7-day trial →
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button
              className="w-full py-3 rounded-xl font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              style={{ color: "#475569" }}
            >
              I already have an account — sign in
            </button>
          </SignInButton>

          <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
            No charge for 7 days · Cancel any time before day 7
          </p>

          <button
            onClick={onClose}
            className="w-full text-xs py-1.5 transition-colors hover:text-slate-600"
            style={{ color: "#94a3b8" }}
          >
            {reason === "limit" ? "Maybe tomorrow" : "Dismiss"}
          </button>
        </div>
      </div>
    </div>
  )
}
