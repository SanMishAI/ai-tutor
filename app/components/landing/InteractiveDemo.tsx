"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

type DemoState = "question" | "typing" | "followup" | "done"

const QUESTION =
  "A shop sells apples for $1.50 and oranges for $2.00. Sam buys 10 fruits and pays $17.00 in total. How many apples did Sam buy?"

const RESPONSES = [
  { id: "A", label: "I'm not sure where to start 🤔" },
  { id: "B", label: "Is it 6 apples?" },
  { id: "C", label: "I need a hint" },
]

const AI_REPLIES: Record<string, string> = {
  A: "Good thinking to pause. Let's break it down step by step. If Sam bought 10 fruits total and a are apples, how many must be oranges?",
  C: "Good thinking to pause. Let's break it down step by step. If Sam bought 10 fruits total and a are apples, how many must be oranges?",
  B: "Close! Let's check — if Sam had 6 apples (6 × $1.50 = $9.00) and 4 oranges (4 × $2.00 = $8.00), that totals $17.00. You're right! ✅ Now can you write the equation that got you there?",
}

interface InteractiveDemoProps {
  onOpenApp: () => void
}

function RobotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="12" height="8" rx="2" fill="#EEF5FF" stroke="#0066CB" strokeWidth="1.2" />
      <rect x="6" y="2" width="6" height="6" rx="1.5" fill="#EEF5FF" stroke="#0066CB" strokeWidth="1.2" />
      <circle cx="6.5" cy="10.5" r="1.2" fill="#0066CB" />
      <circle cx="11.5" cy="10.5" r="1.2" fill="#0066CB" />
      <path d="M6.5 13.5h5" stroke="#0066CB" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="9" y1="2" x2="9" y2="0.5" stroke="#0066CB" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="9" cy="0.5" r="0.8" fill="#0066CB" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center h-5" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-blue-400"
          style={{
            animation: `dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            display: "inline-block",
          }}
        />
      ))}
    </div>
  )
}

export default function InteractiveDemo({ onOpenApp }: InteractiveDemoProps) {
  const [demoState, setDemoState] = useState<DemoState>("question")
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null)
  const [displayedText, setDisplayedText] = useState("")
  const [followupInput, setFollowupInput] = useState("")
  const prefersReducedMotion = useReducedMotion()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const animDuration = prefersReducedMotion ? 0 : 0.2

  // Stream the AI reply character by character
  useEffect(() => {
    if (demoState !== "typing" || !selectedResponse) return

    const fullText = AI_REPLIES[selectedResponse] ?? AI_REPLIES["A"]
    setDisplayedText("")
    let idx = 0

    if (prefersReducedMotion) {
      setDisplayedText(fullText)
      setDemoState("followup")
      return
    }

    intervalRef.current = setInterval(() => {
      idx++
      setDisplayedText(fullText.slice(0, idx))
      if (idx >= fullText.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setTimeout(() => setDemoState("followup"), 400)
      }
    }, 18)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [demoState, selectedResponse, prefersReducedMotion])

  // Focus input when followup state
  useEffect(() => {
    if (demoState === "followup") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [demoState])

  function handleResponseClick(id: string) {
    setSelectedResponse(id)
    setDemoState("typing")
  }

  function handleFollowupSend() {
    if (!followupInput.trim()) return
    setDemoState("done")
  }

  return (
    <div className="rounded-2xl border border-slate-200 shadow-xl bg-white max-w-sm mx-auto overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
        <RobotIcon />
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
        >
          AI Tutor
        </span>
        {demoState === "typing" && (
          <span className="ml-1">
            <span
              className="inline-block w-2 h-2 rounded-full bg-blue-400"
              style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }}
              aria-label="Typing"
            />
          </span>
        )}
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{
            background: "#ECFDF5",
            color: "#059669",
            fontFamily: "var(--font-inter)",
          }}
        >
          Preview
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* Question block */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: animDuration || 0.4 }}
          className="rounded-xl p-4"
          style={{ background: "#F8FAFC" }}
        >
          <p
            className="text-xs font-semibold mb-2"
            style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
          >
            Question
          </p>
          <p
            className="text-sm leading-relaxed"
            style={{ fontFamily: "var(--font-inter)", color: "#0B1533" }}
          >
            {QUESTION}
          </p>
        </motion.div>

        {/* State-driven content */}
        <AnimatePresence mode="wait">
          {demoState === "question" && (
            <motion.div
              key="responses"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animDuration || 0.2 }}
              className="flex flex-col gap-2"
              role="group"
              aria-label="Choose your response"
            >
              {RESPONSES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleResponseClick(r.id)}
                  className="border border-slate-200 rounded-xl p-3 text-sm text-left transition-all hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                  style={{ fontFamily: "var(--font-inter)", color: "#0B1533" }}
                >
                  <span
                    className="font-semibold mr-2"
                    style={{ color: "#0066CB" }}
                  >
                    {r.id}.
                  </span>
                  {r.label}
                </button>
              ))}
            </motion.div>
          )}

          {demoState === "typing" && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animDuration || 0.2 }}
              className="flex gap-2 items-start"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "#EEF5FF" }}
              >
                <RobotIcon />
              </div>
              <div
                className="rounded-xl px-3.5 py-2.5 bg-white border border-slate-100"
                style={{ minWidth: 80 }}
              >
                {displayedText ? (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-inter)", color: "#0B1533" }}
                  >
                    {displayedText}
                    <span className="animate-pulse">▋</span>
                  </p>
                ) : (
                  <TypingDots />
                )}
              </div>
            </motion.div>
          )}

          {demoState === "followup" && (
            <motion.div
              key="followup"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animDuration || 0.3 }}
              className="flex flex-col gap-3"
            >
              {/* AI message */}
              <div className="flex gap-2 items-start">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: "#EEF5FF" }}
                >
                  <RobotIcon />
                </div>
                <div className="rounded-xl px-3.5 py-2.5 bg-white border border-slate-100">
                  <p
                    className="text-sm leading-relaxed"
                    style={{ fontFamily: "var(--font-inter)", color: "#0B1533" }}
                  >
                    {displayedText}
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={followupInput}
                  onChange={(e) => setFollowupInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleFollowupSend()}
                  placeholder="Type your answer or ask me anything…"
                  className="flex-1 text-sm rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-[44px]"
                  style={{ fontFamily: "var(--font-inter)", color: "#0B1533" }}
                  aria-label="Your reply to the AI tutor"
                />
                <button
                  onClick={handleFollowupSend}
                  className="px-3 py-2.5 rounded-xl transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ background: "#0066CB" }}
                  aria-label="Send reply"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M2 8h12M10 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {demoState === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: animDuration || 0.3 }}
              className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-center"
            >
              <p
                className="text-xs leading-relaxed mb-3"
                style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
              >
                This is a preview of SelectEd&apos;s AI tutor — powered by Claude. The
                real tutor adapts to every answer your child gives.
              </p>
              <button
                onClick={onOpenApp}
                className="text-sm font-semibold transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0066CB" }}
              >
                Try the full tutor free →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
