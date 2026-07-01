"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"

type Question = { question: string; type: string; options: string[]; answer: string; explanation: string }

const PRACTICE_COUNT = 5

function MD({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{children}</ReactMarkdown>
    </div>
  )
}

export default function PracticePhase({
  exam,
  yearLevel,
  chapter,
  childToken,
  onNext,
  onBack,
}: {
  exam: string
  yearLevel: string
  chapter: string
  childToken?: string | null
  onNext: () => void
  onBack: () => void
}) {
  const [index, setIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ correct: boolean; feedback: string } | null>(null)
  const [loadingFeedback, setLoadingFeedback] = useState(false)
  const [asked, setAsked] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)

  // Load first question automatically
  useState(() => { loadQuestion(0, []) })

  async function loadQuestion(i: number, prevAsked: string[]) {
    setLoading(true)
    setSelected(null)
    setFeedback(null)
    try {
      const r = await fetch("/api/chapter/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, yearLevel, chapter, questionIndex: i, askedQuestions: prevAsked }),
      })
      const d = await r.json()
      setQuestion(d)
    } catch {}
    setLoading(false)
  }

  async function submitAnswer(option: string) {
    if (!question || selected || loadingFeedback) return
    setSelected(option)
    setLoadingFeedback(true)
    try {
      const letter = option.split(".")[0].trim()
      const r = await fetch("/api/chapter/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.question, studentAnswer: letter, correctAnswer: question.answer, explanation: question.explanation }),
      })
      const d = await r.json()
      setFeedback(d)
      if (d.correct) setScore(s => s + 1)
    } catch {}
    setLoadingFeedback(false)
  }

  async function next() {
    if (index + 1 >= PRACTICE_COUNT) {
      setDone(true)
      return
    }
    const newAsked = [...asked, question?.question ?? ""]
    setAsked(newAsked)
    setIndex(i => i + 1)
    await loadQuestion(index + 1, newAsked)
  }

  if (done) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="text-6xl mb-4">{score >= 4 ? "🌟" : score >= 3 ? "👍" : "💪"}</div>
        <h2 className="text-xl font-black mb-2" style={{ color: "#000936" }}>Practice Complete!</h2>
        <p className="text-sm mb-1" style={{ color: "#64748b" }}>You got <strong>{score}/{PRACTICE_COUNT}</strong> correct.</p>
        <p className="text-sm mb-8" style={{ color: "#64748b" }}>
          {score === PRACTICE_COUNT ? "Perfect score! Ready for the test." : score >= 3 ? "Great work! Let's test your understanding." : "Keep it up — the test will solidify these concepts."}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50" style={{ color: "#64748b" }}>
            ← Back
          </button>
          <button onClick={onNext} className="px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:opacity-90" style={{ background: "#000936", color: "#FDC800" }}>
            Take the Test →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✏️</span>
          <div>
            <h2 className="text-lg font-black" style={{ color: "#000936" }}>Practice</h2>
            <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{chapter}</p>
          </div>
        </div>
        <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "#f1f5f9", color: "#64748b" }}>
          {index + 1} / {PRACTICE_COUNT}
        </span>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 rounded-2xl bg-slate-100" />
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-slate-100" />)}
        </div>
      )}

      {!loading && question && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border border-slate-200 bg-white">
            <MD>{question.question}</MD>
          </div>

          <div className="space-y-2">
            {question.options.map((opt) => {
              const letter = opt.split(".")[0].trim()
              const isSelected = selected === opt
              const isCorrect = letter === question.answer
              let bg = "white", border = "#e2e8f0", color = "#334155"
              if (selected) {
                if (isCorrect) { bg = "#f0fdf4"; border = "#16a34a"; color = "#15803d" }
                else if (isSelected) { bg = "#fef2f2"; border = "#ef4444"; color = "#dc2626" }
              } else if (isSelected) { bg = "#eff6ff"; border = "#3b82f6"; color = "#1d4ed8" }

              return (
                <button
                  key={opt}
                  onClick={() => submitAnswer(opt)}
                  disabled={!!selected}
                  className="w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition-all"
                  style={{ background: bg, borderColor: border, color }}
                >
                  <MD>{opt}</MD>
                </button>
              )
            })}
          </div>

          {loadingFeedback && (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#94a3b8" }}>
              <span className="animate-spin text-base">⏳</span> Checking…
            </div>
          )}

          {feedback && (
            <div className="p-4 rounded-2xl" style={{ background: feedback.correct ? "#f0fdf4" : "#fef2f2" }}>
              <p className="text-xs font-bold mb-1" style={{ color: feedback.correct ? "#16a34a" : "#dc2626" }}>
                {feedback.correct ? "✓ Correct!" : "✗ Not quite"}
              </p>
              <MD>{feedback.feedback}</MD>
            </div>
          )}

          {feedback && (
            <div className="flex justify-end">
              <button
                onClick={next}
                className="px-5 py-2 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: "#000936", color: "#FDC800" }}
              >
                {index + 1 >= PRACTICE_COUNT ? "View Results →" : "Next Question →"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button onClick={onBack} className="text-xs font-semibold" style={{ color: "#94a3b8" }}>← Back to Examples</button>
      </div>
    </div>
  )
}
