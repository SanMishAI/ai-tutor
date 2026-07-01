"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"

export default function TheoryPhase({
  exam,
  yearLevel,
  chapter,
  onNext,
}: {
  exam: string
  yearLevel: string
  chapter: string
  onNext: () => void
}) {
  const [markdown, setMarkdown] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setMarkdown("")
    setError(false)
    fetch("/api/chapter/theory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam, yearLevel, chapter }),
    })
      .then(r => r.json())
      .then(d => { setMarkdown(d.markdown ?? ""); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [exam, yearLevel, chapter])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">📖</span>
        <div>
          <h2 className="text-lg font-black" style={{ color: "#000936" }}>Theory</h2>
          <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>{chapter}</p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 rounded bg-slate-100" style={{ width: `${70 + (i % 3) * 10}%` }} />)}
          <div className="mt-4 space-y-2">
            {[...Array(4)].map((_, i) => <div key={i} className="h-3 rounded bg-slate-100" style={{ width: `${60 + (i % 4) * 8}%` }} />)}
          </div>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="text-sm font-bold" style={{ color: "#0f172a" }}>Failed to load theory</p>
          <button onClick={() => { setError(false); setLoading(true); fetch("/api/chapter/theory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exam, yearLevel, chapter }) }).then(r => r.json()).then(d => { setMarkdown(d.markdown ?? ""); setLoading(false) }).catch(() => setError(true)) }} className="mt-3 text-sm font-semibold underline" style={{ color: "#000936" }}>Try again</button>
        </div>
      )}

      {!loading && !error && (
        <div
          className="prose prose-slate max-w-none text-sm leading-relaxed"
          style={{ "--tw-prose-body": "#334155", "--tw-prose-headings": "#000936" } as React.CSSProperties}
        >
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
            {markdown}
          </ReactMarkdown>
        </div>
      )}

      {!loading && !error && markdown && (
        <div className="mt-8 flex justify-end">
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 shadow-md"
            style={{ background: "#000936", color: "#FDC800" }}
          >
            Continue to Examples →
          </button>
        </div>
      )}
    </div>
  )
}
