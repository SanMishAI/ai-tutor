"use client"

import { useState } from "react"

const EXAMS = [
  { subject: "Australian Mathematics Competition (AMC)", emoji: "🏆", label: "AMC",      color: "#b45309", bg: "#fef3c7", desc: "Competition maths" },
  { subject: "Maths Olympiad",                           emoji: "🎯", label: "Olympiad",  color: "#065f46", bg: "#d1fae5", desc: "Proof & reasoning" },
  { subject: "ACER Exam",                                emoji: "📐", label: "ACER",      color: "#1e40af", bg: "#dbeafe", desc: "Selective entry" },
  { subject: "ICAS",                                     emoji: "🔬", label: "ICAS",      color: "#6d28d9", bg: "#ede9fe", desc: "Academic comp." },
  { subject: "ATAR",                                     emoji: "🎓", label: "ATAR",      color: "#9d174d", bg: "#fce7f3", desc: "Senior secondary" },
  { subject: "NAPLAN",                                   emoji: "📊", label: "NAPLAN",    color: "#c2410c", bg: "#ffedd5", desc: "National testing" },
  { subject: "Bebras",                                   emoji: "💻", label: "Bebras",    color: "#0e7490", bg: "#cffafe", desc: "Computational thinking" },
  { subject: "Kangourou sans frontières (KSF)",          emoji: "🦘", label: "KSF",       color: "#166534", bg: "#dcfce7", desc: "International maths" },
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
  { id: "exam",     emoji: "⏱️", label: "Timed exam",        desc: "Sit a full mock exam with the clock on" },
]

type Props = {
  onStart: (subject: string, yearLevel: string, mode: "chat" | "practice" | "exam" | "adventure") => void
  onBack?: () => void
}

type Step = "pick-exam" | "pick-year"

export default function WelcomeScreen({ onStart, onBack }: Props) {
  const [step, setStep] = useState<Step>("pick-exam")
  const [exam, setExam] = useState<typeof EXAMS[0] | null>(null)
  const [year, setYear] = useState("")

  function selectExam(e: typeof EXAMS[0]) {
    setExam(e)
    setYear(YEAR_LEVELS[e.subject][0])
    setStep("pick-year")
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 sm:py-16"
      style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}>

      {/* ── STEP 1: Pick exam ── */}
      {step === "pick-exam" && (
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          {onBack && (
            <div className="self-start">
              <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-slate-900"
                style={{ color: "#64748b" }}
              >
                ← Back to home
              </button>
            </div>
          )}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-1 shadow-sm"
              style={{ background: "#000936" }}>
              <img src="/selected-logo.svg" alt="" style={{ width: 36, height: 36 }} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "#0f172a", fontFamily: '"Arial Black", system-ui' }}>
              Choose your exam
            </h1>
            <p className="text-sm max-w-xs" style={{ color: "#64748b" }}>
              Pick the exam you&apos;re training for and let&apos;s get you ready.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {EXAMS.map(e => (
              <button
                key={e.subject}
                onClick={() => selectExam(e)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-slate-200 bg-white transition-all hover:scale-[1.03] hover:shadow-md active:scale-[0.98] shadow-sm"
              >
                <span className="text-3xl">{e.emoji}</span>
                <span className="font-black text-sm" style={{ color: e.color, fontFamily: '"Arial Black", system-ui' }}>{e.label}</span>
                <span className="text-xs text-center leading-tight" style={{ color: "#94a3b8" }}>{e.desc}</span>
              </button>
            ))}
          </div>

          <p className="text-xs font-medium" style={{ color: "#64748b" }}>You can always change this inside the app</p>
        </div>
      )}

      {/* ── STEP 2: Pick year + mode ── */}
      {step === "pick-year" && exam && (
        <div className="w-full max-w-md flex flex-col items-center gap-7">

          {/* Exam badge */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-slate-200"
              style={{ background: exam.bg }}>
              {exam.emoji}
            </div>
            <h1 className="text-3xl font-black" style={{ color: exam.color, fontFamily: '"Arial Black", system-ui' }}>
              {exam.label}
            </h1>
            <p className="text-sm" style={{ color: "#64748b" }}>{exam.desc}</p>
          </div>

          {/* Year level */}
          <div className="w-full">
            <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>
              Your year level
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {YEAR_LEVELS[exam.subject].map(y => (
                <button
                  key={y}
                  onClick={() => setYear(y)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95"
                  style={year === y ? {
                    background: exam.bg,
                    borderColor: exam.color,
                    color: exam.color,
                  } : {
                    background: "white",
                    borderColor: "#e2e8f0",
                    color: "#64748b",
                  }}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Mode picker */}
          <div className="w-full">
            <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>
              How do you want to start?
            </p>
            <div className="flex flex-col gap-2.5">

              {/* Adventure Mode */}
              <button
                onClick={() => onStart(exam.subject, year, "adventure")}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-left transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] border-2 shadow-sm"
                style={{ background: "#f0fdf4", borderColor: "#16a34a" }}
              >
                <span className="text-2xl shrink-0">⛏️</span>
                <div>
                  <p className="font-black text-xs tracking-wide uppercase" style={{ color: "#15803d", fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
                    Adventure Mode
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#166534" }}>Mine through chapters, level up your knowledge</p>
                </div>
                <span className="ml-auto text-lg" style={{ color: "#16a34a" }}>→</span>
              </button>

              {/* Standard modes */}
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => onStart(exam.subject, year, m.id)}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white text-left transition-all hover:scale-[1.01] hover:shadow-md active:scale-[0.99] shadow-sm"
                >
                  <span className="text-2xl shrink-0">{m.emoji}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{m.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{m.desc}</p>
                  </div>
                  <span className="ml-auto" style={{ color: "#cbd5e1" }}>→</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep("pick-exam")}
            className="text-xs transition-colors hover:text-slate-600"
            style={{ color: "#94a3b8" }}
          >
            ← Change exam
          </button>
        </div>
      )}
    </div>
  )
}
