"use client"

import { useState } from "react"

type TriviaQuestion = {
  question: string
  options: string[]
  answer: string
  funFact: string
}

const CATEGORIES = [
  { id: "animals",    emoji: "🐾", label: "Animals",      color: "#34d399" },
  { id: "space",      emoji: "🚀", label: "Space",         color: "#818cf8" },
  { id: "sports",     emoji: "⚽", label: "Sports",        color: "#fbbf24" },
  { id: "popculture", emoji: "🎬", label: "Pop Culture",   color: "#f472b6" },
  { id: "records",    emoji: "🌍", label: "World Records", color: "#f97316" },
  { id: "random",     emoji: "🎲", label: "Surprise Me!",  color: "#a78bfa" },
]

function scoreMessage(score: number, total: number) {
  const pct = score / total
  if (pct === 1)   return { emoji: "🏆", text: "Perfect score! You're a trivia legend!" }
  if (pct >= 0.8)  return { emoji: "🌟", text: "Amazing! You really know your stuff!" }
  if (pct >= 0.6)  return { emoji: "😎", text: "Great job! You crushed it!" }
  if (pct >= 0.4)  return { emoji: "💪", text: "Good effort! You're learning cool things!" }
  return { emoji: "🤔", text: "Tough one! But now you know more than before!" }
}

export default function BreakZone() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<"choose" | "loading" | "playing" | "answered" | "done">("choose")
  const [questions, setQuestions] = useState<TriviaQuestion[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [error, setError] = useState("")

  async function startQuiz(categoryId: string) {
    setPhase("loading")
    setError("")
    setScore(0)
    setCurrentQ(0)
    setSelected(null)
    try {
      const res = await fetch("/api/trivia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: categoryId }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuestions(data.questions)
      setPhase("playing")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setPhase("choose")
    }
  }

  function pickAnswer(letter: string) {
    if (phase !== "playing") return
    setSelected(letter)
    if (letter === questions[currentQ].answer) setScore(s => s + 1)
    setPhase("answered")
  }

  function nextQuestion() {
    if (currentQ + 1 >= questions.length) {
      setPhase("done")
    } else {
      setCurrentQ(q => q + 1)
      setSelected(null)
      setPhase("playing")
    }
  }

  function reset() {
    setPhase("choose")
    setQuestions([])
    setCurrentQ(0)
    setSelected(null)
    setScore(0)
    setError("")
  }

  const q = questions[currentQ]
  const isCorrect = selected === q?.answer
  const { emoji: scoreEmoji, text: scoreText } = phase === "done" ? scoreMessage(score, questions.length) : { emoji: "", text: "" }

  return (
    <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎮</span>
          <div>
            <p className="font-black text-white text-base" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>Brain Break</p>
            <p className="text-slate-400 text-xs mt-0.5">5 quick trivia questions to recharge your brain</p>
          </div>
        </div>
        <span className="text-slate-500 text-lg">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="px-6 pb-6">

          {/* CHOOSE CATEGORY */}
          {phase === "choose" && (
            <div>
              <p className="text-slate-400 text-sm mb-4">Pick a category to get started:</p>
              {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => startQuiz(cat.id)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/10 hover:border-white/30 transition-all hover:scale-105 active:scale-95"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <span className="text-3xl">{cat.emoji}</span>
                    <span className="text-xs font-semibold" style={{ color: cat.color }}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* LOADING */}
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="text-4xl animate-bounce">🤖</span>
              <p className="text-white font-semibold">Brewing your quiz…</p>
              <p className="text-slate-500 text-xs">This takes just a few seconds</p>
            </div>
          )}

          {/* PLAYING or ANSWERED */}
          {(phase === "playing" || phase === "answered") && q && (
            <div>
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-500">Question {currentQ + 1} of {questions.length}</span>
                <span className="text-xs font-semibold text-indigo-400">Score: {score}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5 mb-5">
                <div
                  className="h-1.5 rounded-full transition-all"
                  style={{ width: `${((currentQ) / questions.length) * 100}%`, background: "linear-gradient(90deg, #00e5ff, #7c3aed)" }}
                />
              </div>

              <p className="text-white font-semibold text-base mb-4 leading-snug">{q.question}</p>

              <div className="space-y-2.5">
                {q.options.map(opt => {
                  const letter = opt.match(/^([A-D])\./)?.[1] ?? ""
                  const isThis = selected === letter
                  const isCorrectOpt = letter === q.answer
                  let bg = "rgba(255,255,255,0.05)"
                  let border = "rgba(255,255,255,0.1)"
                  let textCol = "#cbd5e1"
                  if (phase === "answered") {
                    if (isCorrectOpt) { bg = "rgba(52,211,153,0.15)"; border = "#34d399"; textCol = "#34d399" }
                    else if (isThis)  { bg = "rgba(248,113,113,0.15)"; border = "#f87171"; textCol = "#f87171" }
                  } else if (isThis)  { bg = "rgba(129,140,248,0.2)"; border = "#818cf8" }
                  return (
                    <button
                      key={opt}
                      onClick={() => pickAnswer(letter)}
                      disabled={phase === "answered"}
                      className="w-full text-left px-4 py-3 rounded-xl border text-sm transition-all hover:scale-[1.01] disabled:cursor-default"
                      style={{ background: bg, borderColor: border, color: textCol }}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>

              {/* Post-answer feedback */}
              {phase === "answered" && (
                <div
                  className="mt-4 rounded-xl p-4"
                  style={{ background: isCorrect ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)" }}
                >
                  <p className="font-bold text-sm mb-1" style={{ color: isCorrect ? "#34d399" : "#f87171" }}>
                    {isCorrect ? "🎉 Correct!" : `💭 Oops! The answer was ${q.answer}.`}
                  </p>
                  <p className="text-slate-300 text-xs leading-relaxed">{q.funFact}</p>
                  <button
                    onClick={nextQuestion}
                    className="mt-3 px-5 py-2 rounded-lg text-white text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #4338ca)" }}
                  >
                    {currentQ + 1 >= questions.length ? "See Results →" : "Next Question →"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {phase === "done" && (
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <span className="text-6xl">{scoreEmoji}</span>
              <div>
                <p className="text-3xl font-black text-white" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>{score} / {questions.length}</p>
                <p className="text-slate-300 text-sm mt-1">{scoreText}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                  style={{ background: "linear-gradient(135deg, #00e5ff, #7c3aed)" }}
                >
                  🎮 Play Again
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
