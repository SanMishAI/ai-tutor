"use client"

import { useState, useEffect } from "react"
import { CHAPTERS } from "@/lib/chapters"
import ChapterPicker from "./ChapterPicker"
import StudyChat from "./StudyChat"
import TestPhase from "./TestPhase"
import ChapterResults from "./ChapterResults"

export type Phase = "pick" | "chat" | "test" | "results"

export type TestResult = {
  score: number
  total: number
  answers: { question: string; selected: string; correct: string; explanation: string; isCorrect: boolean }[]
}

type ChapterProgressRow = { chapter: string; phase: number; completed: boolean; testScore?: number | null; testTotal?: number | null }

export default function StudyMode({
  exam,
  yearLevel,
  onExit,
  childToken,
}: {
  exam: string
  yearLevel: string
  onExit: () => void
  childToken?: string | null
}) {
  const [chapter, setChapter] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>("pick")
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [progressMap, setProgressMap] = useState<Record<string, ChapterProgressRow>>({})

  const chapters = CHAPTERS[exam] ?? []

  useEffect(() => { fetchProgress() }, [exam])

  async function fetchProgress() {
    const headers: Record<string, string> = {}
    if (childToken) headers["x-child-token"] = childToken
    try {
      const r = await fetch(`/api/chapter/progress?exam=${encodeURIComponent(exam)}`, { headers })
      if (r.ok) {
        const rows: ChapterProgressRow[] = await r.json()
        const m: Record<string, ChapterProgressRow> = {}
        rows.forEach(row => { m[row.chapter] = row })
        setProgressMap(m)
      }
    } catch {}
  }

  async function saveProgress(ch: string, ph: number, completed = false, score?: number, total?: number) {
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (childToken) headers["x-child-token"] = childToken
    await fetch("/api/chapter/progress", {
      method: "POST",
      headers,
      body: JSON.stringify({ exam, chapter: ch, phase: ph, completed, testScore: score ?? null, testTotal: total ?? null }),
    })
    fetchProgress()
  }

  function selectChapter(ch: string) {
    setChapter(ch)
    setPhase("chat")
    saveProgress(ch, 1)
  }

  function startTest() {
    if (chapter) saveProgress(chapter, 4)
    setPhase("test")
  }

  function finishTest(result: TestResult) {
    setTestResult(result)
    setPhase("results")
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
    const passed = pct >= 80
    if (chapter) saveProgress(chapter, 4, passed, result.score, result.total)
  }

  function restart() {
    setChapter(null)
    setPhase("pick")
    setTestResult(null)
  }

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        {phase !== "pick" ? (
          <button onClick={restart} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all" style={{ color: "#64748b" }}>
            ← Chapters
          </button>
        ) : (
          <button onClick={onExit} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all" style={{ color: "#64748b" }}>
            ← Exit Study
          </button>
        )}
        {chapter && phase !== "pick" && (
          <>
            <span className="text-slate-300">›</span>
            <span className="text-xs font-semibold truncate max-w-[200px]" style={{ color: "#0f172a" }}>{chapter}</span>
          </>
        )}
        {phase === "test" && (
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#000936", color: "#FDC800" }}>🎯 Test</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
        {phase === "pick" && (
          <ChapterPicker
            exam={exam}
            chapters={chapters}
            progressMap={progressMap}
            onSelect={selectChapter}
          />
        )}

        {phase === "chat" && chapter && (
          <StudyChat
            exam={exam}
            yearLevel={yearLevel}
            chapter={chapter}
            onStartTest={startTest}
          />
        )}

        {phase === "test" && chapter && (
          <TestPhase
            exam={exam}
            yearLevel={yearLevel}
            chapter={chapter}
            onFinish={finishTest}
            onBack={() => setPhase("chat")}
          />
        )}

        {phase === "results" && chapter && testResult && (
          <ChapterResults
            chapter={chapter}
            chapterIndex={chapters.indexOf(chapter)}
            result={testResult}
            onRetry={() => { setPhase("test"); setTestResult(null) }}
            onNextChapter={restart}
            onExit={onExit}
          />
        )}
      </div>
    </div>
  )
}
