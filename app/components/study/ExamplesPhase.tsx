"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"

type Example = { title: string; problem: string; solution: string }

export default function ExamplesPhase({
  exam,
  yearLevel,
  chapter,
  onNext,
  onBack,
}: {
  exam: string
  yearLevel: string
  chapter: string
  onNext: () => void
  onBack: () => void
}) {
  const [examples, setExamples] = useState<Example[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [revealed, setRevealed] = useState<number[]>([])

  useEffect(() => {
    setLoading(true)
    setExamples([])
    setRevealed([])
    setError(false)
    fetch("/api/chapter/examples", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam, yearLevel, chapter }),
    })
      .then(r => r.json())
      .then(d => { setExamples(d.examples ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [exam, yearLevel, chapter])

  function MD({ children }: { children: string }) {
    return (
      <div className="prose prose-slate max-w-none text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>{children}</ReactMarkdown>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">💡</span>
        <div>
          <h2 className="text-lg font-black" style={{ color: "#000936" }}>Worked Examples</h2>
          <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{chapter}</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-slate-200 rounded-2xl p-4">
              <div className="h-4 w-48 rounded bg-slate-100 mb-3" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => <div key={j} className="h-3 rounded bg-slate-100" style={{ width: `${65 + j * 10}%` }} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-sm font-bold" style={{ color: "#0f172a" }}>Failed to load examples</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {examples.map((ex, i) => (
            <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-200" style={{ background: "#f8fafc" }}>
                <p className="text-sm font-bold" style={{ color: "#000936" }}>{ex.title}</p>
              </div>
              {/* Problem */}
              <div className="p-4 border-b border-slate-100">
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#94a3b8" }}>Problem</p>
                <MD>{ex.problem}</MD>
              </div>
              {/* Solution */}
              {revealed.includes(i) ? (
                <div className="p-4" style={{ background: "#f0fdf4" }}>
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "#16a34a" }}>Solution</p>
                  <MD>{ex.solution}</MD>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <button
                    onClick={() => setRevealed(r => [...r, i])}
                    className="text-sm font-bold px-4 py-2 rounded-xl border-2 transition-all hover:bg-slate-50"
                    style={{ borderColor: "#000936", color: "#000936" }}
                  >
                    Show Solution
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && !error && examples.length > 0 && (
        <div className="mt-8 flex justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition-all"
            style={{ color: "#64748b" }}
          >
            ← Back to Theory
          </button>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 shadow-md"
            style={{ background: "#000936", color: "#FDC800" }}
          >
            Continue to Practice →
          </button>
        </div>
      )}
    </div>
  )
}
