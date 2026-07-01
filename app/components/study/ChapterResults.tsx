"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import type { TestResult } from "./StudyMode"

function MD({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{children}</ReactMarkdown>
    </div>
  )
}

export default function ChapterResults({
  chapter,
  result,
  onRetry,
  onNextChapter,
  onExit,
}: {
  chapter: string
  result: TestResult
  onRetry: () => void
  onNextChapter: () => void
  onExit: () => void
}) {
  const pct = Math.round((result.score / result.total) * 100)
  const passed = pct >= 60
  const color = pct >= 80 ? "#16a34a" : pct >= 60 ? "#ca8a04" : "#dc2626"

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8 p-6 rounded-3xl border-2" style={{ borderColor: color + "40", background: color + "0a" }}>
        <p className="text-6xl mb-3">{pct >= 80 ? "🌟" : pct >= 60 ? "👍" : "💪"}</p>
        <h2 className="text-2xl font-black mb-1" style={{ color: "#000936" }}>{chapter}</h2>
        <p className="text-4xl font-black mb-1" style={{ color }}>{pct}%</p>
        <p className="text-sm font-medium" style={{ color: "#64748b" }}>
          {result.score} of {result.total} questions correct
        </p>
        <p className="text-sm mt-2 font-semibold" style={{ color }}>
          {pct >= 80 ? "Excellent understanding!" : pct >= 60 ? "Good — passed the chapter!" : "Need more practice on this topic"}
        </p>
      </div>

      {/* Question review */}
      <h3 className="text-sm font-bold mb-4" style={{ color: "#0f172a" }}>Question Review</h3>
      <div className="space-y-4 mb-8">
        {result.answers.map((a, i) => (
          <div key={i} className="border rounded-2xl overflow-hidden" style={{ borderColor: a.isCorrect ? "#86efac" : "#fca5a5" }}>
            <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ background: a.isCorrect ? "#f0fdf4" : "#fef2f2", borderColor: a.isCorrect ? "#86efac" : "#fca5a5" }}>
              <span className="font-bold text-sm" style={{ color: a.isCorrect ? "#16a34a" : "#dc2626" }}>
                {a.isCorrect ? "✓" : "✗"} Q{i + 1}
              </span>
              {!a.isCorrect && (
                <span className="text-xs ml-2" style={{ color: "#dc2626" }}>
                  Correct: {a.correct}
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>Question</div>
              <MD>{a.question}</MD>
              {!a.isCorrect && a.explanation && (
                <div className="mt-3 p-3 rounded-xl text-xs" style={{ background: "#fef9c3", color: "#713f12" }}>
                  <span className="font-bold">Why: </span>{a.explanation}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {!passed && (
          <button
            onClick={onRetry}
            className="flex-1 px-4 py-3 rounded-2xl font-bold text-sm border-2 hover:bg-slate-50 transition-all"
            style={{ borderColor: "#000936", color: "#000936" }}
          >
            Retry Test
          </button>
        )}
        <button
          onClick={onNextChapter}
          className="flex-1 px-4 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90"
          style={{ background: "#000936", color: "#FDC800" }}
        >
          {passed ? "Next Chapter →" : "Back to Chapters"}
        </button>
        <button
          onClick={onExit}
          className="px-4 py-3 rounded-2xl font-semibold text-sm border border-slate-200 hover:bg-slate-50"
          style={{ color: "#64748b" }}
        >
          Exit
        </button>
      </div>
    </div>
  )
}
