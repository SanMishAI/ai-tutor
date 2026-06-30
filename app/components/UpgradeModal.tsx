"use client"

import { useState } from "react"

type Reason = "limit" | "feature"

type Props = {
  reason: Reason
  featureName?: string
  onClose: () => void
}

const TRIAL_FEATURES = [
  "Unlimited questions for 7 days",
  "All modes: Chat, Practice, Exam & Adventure",
  "Up to 5 child profiles",
  "Full progress history & streaks",
  "Leaderboard access",
  "Parent dashboard with usage analytics",
  "Email progress reports",
  "Early access to new exam modules",
]

export default function UpgradeModal({ reason, featureName, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleUpgrade() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-5 text-center" style={{ background: "#000936" }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#FDC800" }}>SelectEd</p>
          <h2 className="text-2xl font-black text-white leading-tight">
            {reason === "limit"
              ? "Limit reached 🎯"
              : `${featureName ?? "This feature"} needs a subscription`}
          </h2>
          <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>
            {reason === "limit"
              ? "Start your 7-day free trial for unlimited access — then just $9.99/month."
              : "Start a free 7-day trial to unlock this and every other feature."}
          </p>
          <div className="mt-4 flex items-baseline justify-center gap-2">
            <div>
              <span className="text-lg font-bold text-white line-through opacity-50">$9.99</span>
              <span className="text-xs ml-1" style={{ color: "#94a3b8" }}>/mo</span>
            </div>
            <div className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "#FDC800", color: "#000936" }}>
              FREE for 7 days
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white px-6 py-4">
          <ul className="space-y-2">
            {TRIAL_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: "#475569" }}>
                <span style={{ color: "#059669" }} className="shrink-0">✓</span>{f}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-white px-6 pb-5 pt-2 space-y-2.5">
          {error && <p className="text-xs text-center" style={{ color: "#dc2626" }}>{error}</p>}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
            style={{ background: "#000936", color: "#FDC800" }}
          >
            {loading ? "Redirecting…" : "Start free trial · Apple / Google Pay →"}
          </button>
          <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
            No charge for 7 days · Cancel any time before day 7 · Secure checkout
          </p>
          <button onClick={onClose} className="w-full text-xs py-2 transition-colors hover:text-slate-600" style={{ color: "#94a3b8" }}>
            Maybe later
          </button>
        </div>

      </div>
    </div>
  )
}
