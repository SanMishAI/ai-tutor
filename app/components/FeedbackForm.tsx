"use client"

import { useState } from "react"

const MOODS = [
  { id: "love",    emoji: "😍", label: "Love it!" },
  { id: "like",    emoji: "😊", label: "Like it" },
  { id: "okay",    emoji: "😐", label: "It's okay" },
  { id: "confused",emoji: "😕", label: "Confused" },
  { id: "idea",    emoji: "💡", label: "Got ideas?" },
]

export default function FeedbackForm() {
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState("")

  async function submit() {
    if (!mood) return
    setState("sending")
    setError("")
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, message }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setState("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setState("idle")
    }
  }

  function reset() {
    setMood(null)
    setMessage("")
    setState("idle")
    setError("")
  }

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">💬</span>
          <div>
            <p className="font-black text-white text-base" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>Share Feedback</p>
            <p className="text-slate-400 text-xs mt-0.5">Tell us what you think — we read every message</p>
          </div>
        </div>
        <span className="text-slate-500 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-6 pb-6">

          {state === "done" ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <span className="text-5xl">🎉</span>
              <div>
                <p className="text-white font-black text-xl" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>Thank you!</p>
                <p className="text-slate-400 text-sm mt-1">Your feedback helps us make SelectEd better for everyone 🚀</p>
              </div>
              <button
                onClick={reset}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div>
              <p className="text-slate-400 text-sm mb-4">How are you finding SelectEd?</p>

              {/* Mood picker */}
              <div className="flex gap-2 flex-wrap mb-5">
                {MOODS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl border transition-all hover:scale-110 active:scale-95"
                    style={{
                      borderColor: mood === m.id ? "#818cf8" : "rgba(255,255,255,0.1)",
                      background: mood === m.id ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.05)",
                    }}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-xs font-medium" style={{ color: mood === m.id ? "#818cf8" : "#64748b" }}>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Optional message */}
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={
                  mood === "confused" ? "What's confusing? We'll fix it! 🛠️" :
                  mood === "idea"     ? "What's your idea? We love suggestions! 💡" :
                  mood === "love"     ? "What do you love most? 💜" :
                  "Tell us more… (optional)"
                }
                rows={3}
                maxLength={500}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#e2e8f0" }}
              />
              <p className="text-right text-xs text-slate-600 mt-1">{message.length}/500</p>

              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

              <button
                onClick={submit}
                disabled={!mood || state === "sending"}
                className="mt-4 w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ff44aa)" }}
              >
                {state === "sending" ? "Sending…" : "Send Feedback 🚀"}
              </button>

              {!mood && (
                <p className="text-center text-xs text-slate-600 mt-2">Pick a mood first ↑</p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
