"use client"

import { useState } from "react"

const EXAMS = [
  { subject: "Australian Mathematics Competition (AMC)", emoji: "🏆", label: "AMC",      color: "#fbbf24", desc: "Competition maths" },
  { subject: "Maths Olympiad",                           emoji: "🎯", label: "Olympiad",  color: "#34d399", desc: "Proof & reasoning" },
  { subject: "ACER Exam",                                emoji: "📐", label: "ACER",      color: "#60a5fa", desc: "Selective entry" },
  { subject: "ICAS",                                     emoji: "🔬", label: "ICAS",      color: "#a78bfa", desc: "Academic comp." },
  { subject: "ATAR",                                     emoji: "🎓", label: "ATAR",      color: "#f472b6", desc: "Senior secondary" },
  { subject: "NAPLAN",                                   emoji: "📊", label: "NAPLAN",    color: "#fb923c", desc: "National testing" },
  { subject: "Bebras",                                   emoji: "💻", label: "Bebras",    color: "#22d3ee", desc: "Computational thinking" },
  { subject: "Kangourou sans frontières (KSF)",          emoji: "🦘", label: "KSF",       color: "#86efac", desc: "International maths" },
]

const YEAR_LEVELS: Record<string, string[]> = {
  "Australian Mathematics Competition (AMC)": ["Year 3–6 (Primary)", "Year 7–8 (Junior)", "Year 9–10 (Intermediate)", "Year 11–12 (Senior)"],
  "Maths Olympiad":                           ["Year 4–6 (Primary)", "Year 7–8 (Junior)", "Year 9–10 (Intermediate)"],
  "ACER Exam":                                ["Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9"],
  "ICAS":                                     ["Year 2", "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12"],
  "ATAR":                                     ["Year 11", "Year 12"],
  "NAPLAN":                                   ["Year 3", "Year 5", "Year 7", "Year 9"],
  "Bebras":                                   ["Year 3–4", "Year 5–6", "Year 7–8", "Year 9–10", "Year 11–12"],
  "Kangourou sans frontières (KSF)":          ["Year 3–4 (Känguru)", "Year 5–6 (Cadet)", "Year 7–8 (Junior)", "Year 9–10 (Student)", "Year 11–12 (Senior)"],
}

const MODES: { id: "chat" | "practice" | "exam"; emoji: string; label: string; desc: string }[] = [
  { id: "chat",     emoji: "💬", label: "Chat with tutor",   desc: "Ask anything, get guided step-by-step" },
  { id: "practice", emoji: "📝", label: "Practice problems", desc: "Work through questions at your own pace" },
  { id: "exam",     emoji: "📋", label: "Timed exam",        desc: "Sit a full mock exam with the clock on" },
]

type Props = {
  onStart: (subject: string, yearLevel: string, mode: "chat" | "practice" | "exam" | "adventure") => void
}

type Step = "pick-exam" | "pick-year"

export default function WelcomeScreen({ onStart }: Props) {
  const [step, setStep]     = useState<Step>("pick-exam")
  const [exam, setExam]     = useState<typeof EXAMS[0] | null>(null)
  const [year, setYear]     = useState("")

  function selectExam(e: typeof EXAMS[0]) {
    setExam(e)
    setYear(YEAR_LEVELS[e.subject][0])
    setStep("pick-year")
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12 sm:py-16"
      style={{ backgroundColor: "#0a0b1a", color: "#f1f5f9" }}
    >
      {/* Glow blobs */}
      <div className="fixed w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#7c3aed", top: "5%", left: "5%" }} />
      <div className="fixed w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#00e5ff", bottom: "10%", right: "8%" }} />

      {/* ── STEP 1: Pick exam ── */}
      {step === "pick-exam" && (
        <div className="w-full max-w-2xl flex flex-col items-center gap-8 relative z-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">🚀</span>
            <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>
              Choose your mission
            </h1>
            <p className="text-slate-400 text-sm max-w-xs">
              Pick the exam you&apos;re training for and let&apos;s get you ready.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {EXAMS.map(e => (
              <button
                key={e.subject}
                onClick={() => selectExam(e)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/10 transition-all hover:scale-105 active:scale-95 hover:border-white/30"
                style={{ background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={el => (el.currentTarget.style.boxShadow = `0 0 18px ${e.color}44`)}
                onMouseLeave={el => (el.currentTarget.style.boxShadow = "none")}
              >
                <span className="text-3xl">{e.emoji}</span>
                <span className="font-black text-sm" style={{ color: e.color, fontFamily: '"Arial Black", Impact, system-ui' }}>{e.label}</span>
                <span className="text-xs text-slate-500 text-center leading-tight">{e.desc}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-600">You can always change this inside the app</p>
        </div>
      )}

      {/* ── STEP 2: Pick year + mode ── */}
      {step === "pick-year" && exam && (
        <div className="w-full max-w-md flex flex-col items-center gap-8 relative z-10">

          {/* Selected exam badge */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-5xl">{exam.emoji}</span>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: '"Arial Black", Impact, system-ui', color: exam.color }}>
              {exam.label}
            </h1>
            <p className="text-slate-400 text-sm">{exam.desc}</p>
          </div>

          {/* Year level */}
          <div className="w-full">
            <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase text-center mb-3">Your year level</p>
            <div className="flex flex-wrap justify-center gap-2">
              {YEAR_LEVELS[exam.subject].map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95"
                  style={{
                    borderColor: year === y ? exam.color : "rgba(255,255,255,0.15)",
                    background:  year === y ? `${exam.color}22` : "rgba(255,255,255,0.05)",
                    color:       year === y ? exam.color : "#94a3b8",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Mode picker */}
          <div className="w-full">
            <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase text-center mb-3">How do you want to start?</p>
            <div className="flex flex-col gap-3">

              {/* ── Adventure Mode (first & featured) ── */}
              <button
                onClick={() => onStart(exam.subject, year, "adventure")}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #1a2e10 0%, #0f1a08 100%)",
                  border: "2px solid #4a7c28",
                  boxShadow: "0 4px 0 #1a2e10, 0 6px 20px rgba(74,124,40,0.3)",
                }}
                onMouseEnter={el => (el.currentTarget.style.boxShadow = "0 4px 0 #1a2e10, 0 6px 28px rgba(74,124,40,0.55)")}
                onMouseLeave={el => (el.currentTarget.style.boxShadow = "0 4px 0 #1a2e10, 0 6px 20px rgba(74,124,40,0.3)")}
              >
                <span className="text-2xl shrink-0">⛏️</span>
                <div>
                  <p className="font-black text-sm" style={{ color: "#86efac", fontFamily: "'Press Start 2P', monospace", fontSize: 11, letterSpacing: "0.02em" }}>ADVENTURE MODE</p>
                  <p className="text-green-700 text-xs mt-1">Mine through chapters, level up your knowledge</p>
                </div>
                <span className="ml-auto text-green-700">→</span>
              </button>

              {/* Standard modes */}
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => onStart(exam.subject, year, m.id)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-white/10 text-left transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-white/30"
                  style={{ background: "rgba(255,255,255,0.05)" }}
                  onMouseEnter={el => (el.currentTarget.style.boxShadow = `0 0 20px ${exam.color}33`)}
                  onMouseLeave={el => (el.currentTarget.style.boxShadow = "none")}
                >
                  <span className="text-2xl shrink-0">{m.emoji}</span>
                  <div>
                    <p className="text-white font-bold text-sm">{m.label}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{m.desc}</p>
                  </div>
                  <span className="ml-auto text-slate-600">→</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("pick-exam")}
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            ← Change exam
          </button>
        </div>
      )}
    </div>
  )
}
