"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import type { TestResult } from "./StudyMode"

type TestQuestion = { id: number; text: string; type: string; options: string[] }
type Answer = { answer: string; explanation: string }

function MD({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{children}</ReactMarkdown>
    </div>
  )
}

export default function TestPhase({
  exam,
  yearLevel,
  chapter,
  onFinish,
  onBack,
}: {
  exam: string
  yearLevel: string
  chapter: string
  onFinish: (result: TestResult) => void
  onBack: () => void
}) {
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<(string | null)[]>([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(false)
    try {
      const r = await fetch("/api/chapter/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, yearLevel, chapter }),
      })
      const d = await r.json()
      setQuestions(d.questions ?? [])
      setAnswers(d._answers ?? [])
      setSelected(new Array(d.questions?.length ?? 0).fill(null))
    } catch { setError(true) }
    setLoading(false)
  }

  function select(qi: number, option: string) {
    if (submitted) return
    setSelected(s => s.map((v, i) => i === qi ? option : v))
  }

  function submit() {
    if (selected.some(s => s === null)) return
    setSubmitted(true)
  }

  function finish() {
    const results = questions.map((q, i) => {
      const studentLetter = (selected[i] ?? "").split(".")[0].trim()
      const correctLetter = answers[i]?.answer ?? ""
      return {
        question: q.text,
        selected: selected[i] ?? "",
        correct: answers[i]?.answer ?? "",
        explanation: answers[i]?.explanation ?? "",
        isCorrect: studentLetter === correctLetter,
      }
    })
    const score = results.filter(r => r.isCorrect).length
    onFinish({ score, total: questions.length, answers: results })
  }

  const allAnswered = selected.every(s => s !== null)
  const score = submitted ? questions.filter((_, i) => (selected[i] ?? "").split(".")[0].trim() === answers[i]?.answer).length : 0

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🎯</span>
        <div>
          <h2 className="text-lg font-black" style={{ color: "#000936" }}>End-of-Chapter Test</h2>
          <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{chapter} — 5 questions</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-slate-200 rounded-2xl p-4">
              <div className="h-4 w-full rounded bg-slate-100 mb-3" />
              {[...Array(4)].map((_, j) => <div key={j} className="h-10 rounded-xl bg-slate-100 mb-2" />)}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⚠️</p>
          <button onClick={load} className="text-sm font-semibold underline" style={{ color: "#000936" }}>Try again</button>
        </div>
      )}

      {!loading && !error && (
        <>
          {submitted && (
            <div className="p-4 rounded-2xl mb-6 text-center" style={{ background: score >= 4 ? "#f0fdf4" : score >= 3 ? "#fefce8" : "#fef2f2" }}>
              <p className="text-2xl font-black" style={{ color: score >= 4 ? "#16a34a" : score >= 3 ? "#ca8a04" : "#dc2626" }}>
                {score}/{questions.length}
              </p>
              <p className="text-sm font-medium mt-1" style={{ color: "#64748b" }}>
                {score === questions.length ? "Perfect! Outstanding work." : score >= 4 ? "Excellent! Almost perfect." : score >= 3 ? "Good work! Review the ones you missed." : "Keep studying — you'll get there!"}
              </p>
            </div>
          )}

          <div className="space-y-6">
            {questions.map((q, qi) => {
              const correctLetter = answers[qi]?.answer ?? ""
              return (
                <div key={q.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100" style={{ background: "#f8fafc" }}>
                    <span className="text-xs font-bold" style={{ color: "#94a3b8" }}>Question {qi + 1}</span>
                  </div>
                  <div className="p-4">
                    <MD>{q.text}</MD>
                    <div className="mt-3 space-y-2">
                      {q.options.map((opt) => {
                        const letter = opt.split(".")[0].trim()
                        const isSelected = selected[qi] === opt
                        const isCorrect = letter === correctLetter
                        let bg = "white", border = "#e2e8f0", color = "#334155"
                        if (submitted) {
                          if (isCorrect) { bg = "#f0fdf4"; border = "#16a34a"; color = "#15803d" }
                          else if (isSelected) { bg = "#fef2f2"; border = "#ef4444"; color = "#dc2626" }
                        } else if (isSelected) { bg = "#eff6ff"; border = "#3b82f6"; color = "#1d4ed8" }

                        return (
                          <button
                            key={opt}
                            onClick={() => select(qi, opt)}
                            disabled={submitted}
                            className="w-full text-left p-3 rounded-xl border-2 text-sm font-medium transition-all"
                            style={{ background: bg, borderColor: border, color }}
                          >
                            <MD>{opt}</MD>
                          </button>
                        )
                      })}
                    </div>
                    {submitted && answers[qi]?.explanation && (
                      <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "#f8fafc", color: "#475569" }}>
                        <span className="font-bold">Explanation: </span>
                        <MD>{answers[qi].explanation}</MD>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-8 flex justify-between">
            {!submitted && (
              <button onClick={onBack} className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50" style={{ color: "#64748b" }}>
                ← Back
              </button>
            )}
            {!submitted ? (
              <button
                onClick={submit}
                disabled={!allAnswered}
                className="ml-auto px-6 py-3 rounded-2xl font-bold text-sm shadow-md disabled:opacity-40 hover:opacity-90 transition-all"
                style={{ background: "#000936", color: "#FDC800" }}
              >
                Submit Test →
              </button>
            ) : (
              <button
                onClick={finish}
                className="ml-auto px-6 py-3 rounded-2xl font-bold text-sm shadow-md hover:opacity-90 transition-all"
                style={{ background: "#16a34a", color: "white" }}
              >
                See Full Results →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
