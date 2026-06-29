"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import type { ExamQuestion, GradedResult } from "../types"

type ExamState = "setup" | "generating" | "in_progress" | "submitting" | "results"

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
]

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0")
  const s = (seconds % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

function MD({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
      {children}
    </ReactMarkdown>
  )
}

export default function ExamView({ subject, yearLevel }: { subject: string; yearLevel: string }) {
  const [examState, setExamState] = useState<ExamState>("setup")
  const [duration, setDuration] = useState(30)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showWarning, setShowWarning] = useState(false)
  const [results, setResults] = useState<GradedResult[]>([])
  const [error, setError] = useState("")
  const submitRef = useRef<(() => Promise<void>) | null>(null)
  const [showReview, setShowReview] = useState(false)
  const [reviewData, setReviewData] = useState<Record<number, string>>({})
  const [reviewLoading, setReviewLoading] = useState(false)

  const submitExam = useCallback(async () => {
    setExamState("submitting")
    try {
      const res = await fetch("/api/exam/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, questions, answers }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResults(data.results)
      setExamState("results")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to grade exam")
      setExamState("in_progress")
    }
  }, [subject, questions, answers])

  submitRef.current = submitExam

  async function fetchReview(resultList: GradedResult[]) {
    const wrongQuestions = resultList
      .filter(r => !r.correct)
      .map(r => ({
        id: r.id,
        text: r.question?.text ?? "",
        type: r.question?.type,
        options: r.question?.options,
        studentAnswer: answers[r.id] || "No answer provided",
        correctAnswer: r.correctAnswer,
      }))
    if (wrongQuestions.length === 0) { setShowReview(true); return }
    setReviewLoading(true)
    setShowReview(true)
    try {
      const res = await fetch("/api/exam/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, wrongQuestions }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const map: Record<number, string> = {}
      data.reviews.forEach((r: { id: number; walkthrough: string }) => { map[r.id] = r.walkthrough })
      setReviewData(map)
    } catch (e) {
      console.error("Review fetch error:", e)
    }
    setReviewLoading(false)
  }

  // Countdown timer
  useEffect(() => {
    if (examState !== "in_progress") return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimeout(() => submitRef.current?.(), 0)
          return 0
        }
        if (prev === 121) setShowWarning(true)
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [examState])

  async function startExam() {
    setError("")
    setExamState("generating")
    try {
      const res = await fetch("/api/exam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, yearLevel }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setQuestions(data.questions)
      setAnswers({})
      setCurrentQ(0)
      setTimeLeft(duration * 60)
      setShowWarning(false)
      setExamState("in_progress")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate exam")
      setExamState("setup")
    }
  }

  const answeredCount = Object.keys(answers).length
  const score = results.filter(r => r.correct).length

  // ── SETUP ──────────────────────────────────────────────────────
  if (examState === "setup") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-6 py-8">
        <div className="text-center">
          <span className="text-5xl">⏱️</span>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-3">Mock Exam</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subject}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{yearLevel} · 10 questions · Format matched to exam type</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-4 py-2 rounded-xl">{error}</p>
        )}

        <div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">Select duration</p>
          <div className="flex gap-2">
            {DURATIONS.map(d => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  duration === d.value
                    ? "bg-indigo-600 dark:bg-indigo-500 text-white border-transparent"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-300"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startExam}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold shadow-sm transition-colors"
        >
          Start Exam
        </button>
      </div>
    )
  }

  // ── GENERATING ─────────────────────────────────────────────────
  if (examState === "generating") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <span className="text-4xl animate-bounce">🤖</span>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Generating your exam…</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">This may take a few seconds</p>
      </div>
    )
  }

  // ── SUBMITTING ─────────────────────────────────────────────────
  if (examState === "submitting") {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4">
        <span className="text-4xl animate-bounce">📝</span>
        <p className="text-gray-600 dark:text-gray-400 font-medium">Grading your answers…</p>
      </div>
    )
  }

  // ── RESULTS — REVIEW VIEW ──────────────────────────────────────
  if (examState === "results" && showReview) {
    const wrongResults = results.filter(r => !r.correct)
    return (
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setShowReview(false)} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Results
          </button>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {wrongResults.length} mistake{wrongResults.length !== 1 ? "s" : ""} to review
          </p>
        </div>

        {reviewLoading && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50 dark:bg-indigo-950 rounded-2xl border border-indigo-100 dark:border-indigo-900">
            <span className="text-2xl animate-bounce">🤖</span>
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Preparing your personalised review…</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">The tutor is writing step-by-step walkthroughs for each mistake.</p>
            </div>
          </div>
        )}

        {wrongResults.map((r) => {
          const qNum = results.indexOf(r) + 1
          return (
            <div key={r.id} className="bg-white dark:bg-gray-900 border border-red-100 dark:border-red-900 rounded-2xl p-5 space-y-4">
              <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider">Question {qNum}</p>
              <div className="text-sm text-gray-800 dark:text-gray-100 prose prose-sm dark:prose-invert max-w-none">
                <MD>{r.question?.text ?? ""}</MD>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-red-50 dark:bg-red-950 rounded-xl p-3">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Your answer ✗</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{answers[r.id] || "No answer"}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950 rounded-xl p-3">
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Correct answer ✓</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{r.correctAnswer}</p>
                </div>
              </div>
              {reviewData[r.id] ? (
                <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-xl p-4">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-3 uppercase tracking-wide">Step-by-step walkthrough</p>
                  <div className="text-sm text-gray-700 dark:text-gray-200 prose prose-sm dark:prose-invert max-w-none">
                    <MD>{reviewData[r.id]}</MD>
                  </div>
                </div>
              ) : !reviewLoading && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                  <div className="text-sm text-gray-500 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none">
                    <MD>{r.explanation}</MD>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {wrongResults.length === 0 && (
          <div className="text-center py-8">
            <p className="text-4xl mb-3">🎉</p>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Perfect score — nothing to review!</p>
          </div>
        )}

        <button
          onClick={() => { setExamState("setup"); setResults([]); setShowReview(false); setReviewData({}) }}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          Try Another Exam
        </button>
      </div>
    )
  }

  // ── RESULTS — SUMMARY VIEW ─────────────────────────────────────
  if (examState === "results") {
    const wrongCount = results.filter(r => !r.correct).length
    return (
      <div className="flex-1 overflow-y-auto space-y-4">
        <div className={`rounded-2xl p-5 text-center ${
          score >= 8 ? "bg-green-50 dark:bg-green-950" :
          score >= 5 ? "bg-amber-50 dark:bg-amber-950" :
          "bg-red-50 dark:bg-red-950"
        }`}>
          <p className="text-4xl font-bold text-gray-800 dark:text-gray-100">{score} / 10</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subject}</p>
          <p className={`text-lg font-semibold mt-2 ${
            score >= 8 ? "text-green-700 dark:text-green-300" :
            score >= 5 ? "text-amber-700 dark:text-amber-300" :
            "text-red-700 dark:text-red-300"
          }`}>
            {score >= 8 ? "Excellent! 🎉" : score >= 5 ? "Good effort! 💪" : "Keep practising! 📚"}
          </p>
          {wrongCount > 0 && (
            <button
              onClick={() => fetchReview(results)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              📖 Review {wrongCount} Mistake{wrongCount !== 1 ? "s" : ""} with AI Tutor
            </button>
          )}
        </div>

        {results.map((r, i) => (
          <div key={i} className={`rounded-2xl p-4 border ${
            r.correct
              ? "bg-green-50 dark:bg-green-950 border-green-100 dark:border-green-900"
              : "bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-900"
          }`}>
            <div className="flex items-start gap-2">
              <span className="text-lg shrink-0">{r.correct ? "✅" : "❌"}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Question {i + 1}</p>
                <div className="text-sm text-gray-800 dark:text-gray-100 prose prose-sm dark:prose-invert max-w-none">
                  <MD>{r.question?.text ?? ""}</MD>
                </div>
                <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Your answer:</span> {answers[r.id] || "No answer"}
                </p>
                {!r.correct && (
                  <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">Correct answer:</span> {r.correctAnswer}
                  </p>
                )}
                {!r.correct && (
                  <div className="text-xs mt-2 text-gray-500 dark:text-gray-400 prose prose-xs dark:prose-invert max-w-none">
                    <MD>{r.explanation}</MD>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          {wrongCount > 0 && (
            <button
              onClick={() => fetchReview(results)}
              className="flex-1 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              📖 Review Mistakes
            </button>
          )}
          <button
            onClick={() => { setExamState("setup"); setResults([]) }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            Try Another Exam
          </button>
        </div>
      </div>
    )
  }

  // ── IN PROGRESS ────────────────────────────────────────────────
  const q = questions[currentQ]
  if (!q) return null

  return (
    <div className="flex flex-col flex-1 overflow-hidden gap-3">

      {/* Timer bar */}
      <div className={`flex items-center justify-between gap-2 px-3 sm:px-4 py-2 rounded-xl shrink-0 border ${
        timeLeft <= 120
          ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
      }`}>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {answeredCount} / 10 answered
        </span>
        <span className={`text-lg font-bold tabular-nums ${
          timeLeft <= 120 ? "text-red-600 dark:text-red-400" : "text-gray-800 dark:text-gray-200"
        }`}>
          ⏱️ {formatTime(timeLeft)}
        </span>
        <button
          onClick={() => submitExam()}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          Submit
        </button>
      </div>

      {/* 2-minute warning */}
      {showWarning && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2 shrink-0">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">⚠️ 2 minutes remaining!</p>
          <button onClick={() => setShowWarning(false)} className="text-amber-500 text-xs">✕</button>
        </div>
      )}

      {/* Question navigator */}
      <div className="flex gap-1.5 flex-wrap shrink-0">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentQ(i)}
            className={`w-10 h-10 sm:w-8 sm:h-8 rounded-lg text-xs font-semibold transition-colors ${
              i === currentQ
                ? "bg-indigo-600 dark:bg-indigo-500 text-white ring-2 ring-indigo-300 dark:ring-indigo-400"
                : answers[questions[i].id] !== undefined
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question card */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-4">
        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
          Question {currentQ + 1} of {questions.length} · {q.type === "multiple_choice" ? "Multiple Choice" : "Open Ended"}
        </p>

        <div className="text-sm text-gray-800 dark:text-gray-100 prose prose-sm dark:prose-invert max-w-none">
          <MD>{q.text}</MD>
        </div>

        {q.type === "multiple_choice" && q.options ? (
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label key={oi} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                answers[q.id] === opt
                  ? "bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800"
              }`}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={answers[q.id] === opt}
                  onChange={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                  className="mt-0.5 accent-indigo-600"
                />
                <span className="text-sm text-gray-800 dark:text-gray-200">{opt}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={answers[q.id] ?? ""}
            onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
            placeholder="Type your answer here…"
            rows={4}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setCurrentQ(c => Math.max(0, c - 1))}
          disabled={currentQ === 0}
          className="flex-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentQ(c => Math.min(questions.length - 1, c + 1))}
          disabled={currentQ === questions.length - 1}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-colors"
        >
          Next →
        </button>
      </div>

    </div>
  )
}
