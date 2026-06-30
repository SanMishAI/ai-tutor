"use client"

import { useState } from "react"

type Reason = "limit" | "feature"

type Props = {
  reason: Reason
  featureName?: string
  onClose: () => void
}

const PREMIUM_FEATURES = [
  "Unlimited questions every day",
  "Exam mode & Adventure Mode unlocked",
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
          <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: "#FDC800" }}>SelectEd Premium</p>
          <h2 className="text-2xl font-black text-white leading-tight">
            {reason === "limit"
              ? "Daily limit reached 🎯"
              : `${featureName ?? "This feature"} is Premium`}
          </h2>
          <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>
            {reason === "limit"
              ? "Your child has used all 20 free questions today. Upgrade for unlimited access."
              : "Upgrade to Premium to unlock this and all other advanced features."}
          </p>
          <div className="mt-4">
            <span className="text-4xl font-black text-white">$9.99</span>
            <span className="text-sm" style={{ color: "#64748b" }}>/month</span>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white px-6 py-4">
          <ul className="space-y-2">
            {PREMIUM_FEATURES.map(f => (
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
            {loading ? "Redirecting…" : "Upgrade with Apple Pay / Google Pay →"}
          </button>
          <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
            Secure checkout · Cancel anytime · No card details entered here
          </p>
          <button onClick={onClose} className="w-full text-xs py-2 transition-colors hover:text-slate-600" style={{ color: "#94a3b8" }}>
            Maybe later
          </button>
        </div>

      </div>
    </div>
  )
}
