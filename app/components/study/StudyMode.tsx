"use client"

import { useState, useEffect } from "react"
import { CHAPTERS } from "@/lib/chapters"
import ChapterPicker from "./ChapterPicker"
import TheoryPhase from "./TheoryPhase"
import ExamplesPhase from "./ExamplesPhase"
import PracticePhase from "./PracticePhase"
import TestPhase from "./TestPhase"
import ChapterResults from "./ChapterResults"

export type Phase = "pick" | "theory" | "examples" | "practice" | "test" | "results"

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

  useEffect(() => {
    fetchProgress()
  }, [exam])

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
    setPhase("theory")
    setTestResult(null)
    saveProgress(ch, 1)
  }

  function advanceTo(next: Phase, ch: string) {
    const phaseNum = next === "theory" ? 1 : next === "examples" ? 2 : next === "practice" ? 3 : next === "test" ? 4 : 4
    setPhase(next)
    saveProgress(ch, phaseNum)
  }

  function finishTest(result: TestResult) {
    setTestResult(result)
    setPhase("results")
    if (chapter) saveProgress(chapter, 4, true, result.score, result.total)
  }

  function restart() {
    setChapter(null)
    setPhase("pick")
    setTestResult(null)
  }

  const PHASE_ORDER: Phase[] = ["theory", "examples", "practice", "test"]
  const phaseIndex = PHASE_ORDER.indexOf(phase)

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white shrink-0">
        <button onClick={onExit} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all" style={{ color: "#64748b" }}>
          ← Exit Study
        </button>
        {chapter && (
          <>
            <span className="text-xs text-slate-400">|</span>
            <button onClick={restart} className="text-xs font-semibold hover:underline" style={{ color: "#000936" }}>
              {exam}
            </button>
            <span className="text-slate-300">›</span>
            <span className="text-xs font-semibold truncate max-w-[160px]" style={{ color: "#0f172a" }}>{chapter}</span>
          </>
        )}
        {chapter && phase !== "pick" && phase !== "results" && (
          <div className="ml-auto flex items-center gap-1">
            {PHASE_ORDER.map((p, i) => (
              <span
                key={p}
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{
                  background: i === phaseIndex ? "#000936" : i < phaseIndex ? "#dcfce7" : "#f1f5f9",
                  color: i === phaseIndex ? "#FDC800" : i < phaseIndex ? "#16a34a" : "#94a3b8",
                }}
              >
                {p === "theory" ? "📖 Theory" : p === "examples" ? "💡 Examples" : p === "practice" ? "✏️ Practice" : "🎯 Test"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {phase === "pick" && (
          <ChapterPicker
            exam={exam}
            chapters={chapters}
            progressMap={progressMap}
            onSelect={selectChapter}
          />
        )}
        {phase === "theory" && chapter && (
          <TheoryPhase
            exam={exam}
            yearLevel={yearLevel}
            chapter={chapter}
            onNext={() => advanceTo("examples", chapter)}
          />
        )}
        {phase === "examples" && chapter && (
          <ExamplesPhase
            exam={exam}
            yearLevel={yearLevel}
            chapter={chapter}
            onNext={() => advanceTo("practice", chapter)}
            onBack={() => advanceTo("theory", chapter)}
          />
        )}
        {phase === "practice" && chapter && (
          <PracticePhase
            exam={exam}
            yearLevel={yearLevel}
            chapter={chapter}
            childToken={childToken}
            onNext={() => advanceTo("test", chapter)}
            onBack={() => advanceTo("examples", chapter)}
          />
        )}
        {phase === "test" && chapter && (
          <TestPhase
            exam={exam}
            yearLevel={yearLevel}
            chapter={chapter}
            onFinish={finishTest}
            onBack={() => advanceTo("practice", chapter)}
          />
        )}
        {phase === "results" && chapter && testResult && (
          <ChapterResults
            chapter={chapter}
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
