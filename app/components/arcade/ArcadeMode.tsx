"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { CoalOreBlock, IronOreBlock, DiamondOreBlock, GoldBlock, BedrockBlock } from "./blocks"

const WORLDS: Record<string, { shortName: string; color: string; chapters: string[] }> = {
  "Australian Mathematics Competition (AMC)": { shortName: "AMC World", color: "#4CAF50", chapters: ["Number Theory", "Algebra", "Geometry", "Combinatorics", "Probability"] },
  "Maths Olympiad":                           { shortName: "Olympiad World", color: "#FF9800", chapters: ["Number Theory", "Algebra", "Euclidean Geometry", "Combinatorics", "Inequalities"] },
  "ACER Exam":                                { shortName: "ACER World", color: "#2196F3", chapters: ["Reading Comprehension", "Mathematics", "Science Reasoning", "Verbal Reasoning", "Quantitative Reasoning"] },
  "ICAS":                                     { shortName: "ICAS World", color: "#9C27B0", chapters: ["English Reading", "English Language", "Mathematics", "Science", "Digital Technologies"] },
  "ATAR":                                     { shortName: "ATAR World", color: "#F44336", chapters: ["Mathematics Methods", "Sciences", "English", "Humanities", "Specialist Topics"] },
  "NAPLAN":                                   { shortName: "NAPLAN World", color: "#00BCD4", chapters: ["Reading", "Writing", "Grammar & Punctuation", "Spelling", "Numeracy"] },
  "Bebras":                                   { shortName: "Bebras World", color: "#607D8B", chapters: ["Algorithms", "Data Structures", "Abstraction & Patterns", "Logic & Reasoning", "Computational Thinking"] },
  "Kangourou sans frontières (KSF)":          { shortName: "KSF World", color: "#FF5722", chapters: ["Arithmetic", "Geometry", "Combinatorics", "Algebra & Patterns", "Logic & Puzzles"] },
}

const STAGE_LABEL = ["", "⛏️ Easy", "🪨 Medium", "💎 Hard"]
const STAGE_XP    = [0, 10, 15, 20]

type QuestionData = {
  question: string
  options: string[]
  correct: string
  hint: string
  funFact: string
}

type StageData = { stars: number; xp: number }
type WorldProgress = Record<string, Record<number, StageData>>
type Screen = "worldmap" | "mining" | "stage_complete" | "game_over"

type Props = {
  exam: string
  yearLevel: string
  onSwitchToPractice: (exam: string, yr: string) => void
  onSwitchToExam: (exam: string, yr: string) => void
  onExit: () => void
}

const PS2: React.CSSProperties = { fontFamily: "'Press Start 2P', monospace" }

export default function ArcadeMode({ exam, yearLevel, onSwitchToPractice, onSwitchToExam, onExit }: Props) {
  const world = WORLDS[exam] ?? WORLDS["Australian Mathematics Competition (AMC)"]
  const { isSignedIn } = useUser()

  // World / progress
  const [progress, setProgress]     = useState<WorldProgress>({})
  const [totalXP, setTotalXP]       = useState(0)
  const [progLoading, setProgLoading] = useState(true)

  // Navigation
  const [screen, setScreen]             = useState<Screen>("worldmap")
  const [activeChapter, setActiveChapter] = useState<string | null>(null)
  const [activeStage, setActiveStage]   = useState<1 | 2 | 3 | null>(null)

  // Mining session
  const [question, setQuestion]         = useState<QuestionData | null>(null)
  const [qLoading, setQLoading]         = useState(false)
  const [qError, setQError]             = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [hearts, setHearts]             = useState(3)
  const [wrongOnQ, setWrongOnQ]         = useState(0)   // wrong answers on THIS question (drives cracks)
  const [stageXP, setStageXP]           = useState(0)
  const [selected, setSelected]         = useState<string | null>(null)
  const [answerState, setAnswerState]   = useState<"idle" | "correct" | "wrong">("idle")
  const [showHint, setShowHint]         = useState(false)

  // Load Press Start 2P font once
  useEffect(() => {
    const id = "press-start-2p"
    if (!document.getElementById(id)) {
      const link = document.createElement("link")
      link.id = id; link.rel = "stylesheet"
      link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
      document.head.appendChild(link)
    }
  }, [])

  // Load progress from API
  useEffect(() => {
    if (!isSignedIn) { setProgLoading(false); return }
    fetch(`/api/arcade/progress?exam=${encodeURIComponent(exam)}`)
      .then(r => r.json())
      .then(d => { setProgress(d.progress ?? {}); setTotalXP(d.totalXP ?? 0) })
      .catch(() => {})
      .finally(() => setProgLoading(false))
  }, [exam, isSignedIn])

  async function loadQuestion(chapter: string, stage: number, idx: number) {
    setQLoading(true); setQError(false)
    setQuestion(null); setSelected(null); setAnswerState("idle"); setShowHint(false); setWrongOnQ(0)
    try {
      const r = await fetch("/api/arcade/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, yearLevel, chapter, stage, questionIndex: idx }),
      })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.question) throw new Error()
      setQuestion(d)
    } catch {
      setQError(true)
    }
    setQLoading(false)
  }

  function enterStage(chapter: string, stage: 1 | 2 | 3) {
    setActiveChapter(chapter); setActiveStage(stage)
    setHearts(3); setStageXP(0); setQuestionIndex(0)
    setScreen("mining")
    loadQuestion(chapter, stage, 0)
  }

  function selectAnswer(opt: string) {
    if (answerState !== "idle" || !question) return
    const letter = opt.charAt(0).toUpperCase()
    setSelected(opt)
    if (letter === question.correct) {
      setStageXP(x => x + STAGE_XP[activeStage ?? 1])
      setAnswerState("correct")
    } else {
      const newHearts = hearts - 1
      setWrongOnQ(w => w + 1)
      setHearts(newHearts)
      setAnswerState("wrong")
      setShowHint(true)
      if (newHearts <= 0) setTimeout(() => setScreen("game_over"), 1000)
    }
  }

  function nextQuestion() {
    const next = questionIndex + 1
    if (next >= 5) { finishStage(); return }
    setQuestionIndex(next)
    loadQuestion(activeChapter!, activeStage!, next)
  }

  function skipQuestion() {
    const next = questionIndex + 1
    if (next >= 5) { finishStage(); return }
    setQuestionIndex(next)
    loadQuestion(activeChapter!, activeStage!, next)
  }

  function finishStage() {
    saveProgress()
    setScreen("stage_complete")
  }

  async function saveProgress() {
    if (!isSignedIn || !activeChapter || !activeStage) return
    const stars = Math.max(1, Math.min(3, hearts))
    try {
      await fetch("/api/arcade/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, chapter: activeChapter, stage: activeStage, stars, xp: stageXP }),
      })
      const r = await fetch(`/api/arcade/progress?exam=${encodeURIComponent(exam)}`)
      const d = await r.json()
      setProgress(d.progress ?? {}); setTotalXP(d.totalXP ?? 0)
    } catch {}
  }

  function isChapterUnlocked(ci: number) {
    if (ci === 0) return true
    return (progress[world.chapters[ci - 1]]?.[1]?.stars ?? 0) > 0
  }
  function isStageUnlocked(chapter: string, stage: 1 | 2 | 3, ci: number) {
    if (!isChapterUnlocked(ci)) return false
    if (stage === 1) return true
    return (progress[chapter]?.[stage - 1]?.stars ?? 0) > 0
  }

  function pickaxe() {
    if (totalXP >= 2000) return "💎 Diamond Pickaxe"
    if (totalXP >= 1000) return "🪙 Gold Pickaxe"
    if (totalXP >= 500)  return "⚙️ Iron Pickaxe"
    if (totalXP >= 100)  return "🪨 Stone Pickaxe"
    return "🪵 Wooden Pickaxe"
  }

  // ─── WORLD MAP ────────────────────────────────────────────────────────────
  if (screen === "worldmap") {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: "#0f1117", color: "#f1f5f9" }}>
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0" style={{ background: "#0a0d13" }}>
          <div>
            <p style={{ ...PS2, fontSize: 9, color: world.color }}>{world.shortName.toUpperCase()}</p>
            <p className="text-slate-500 mt-1" style={{ fontFamily: "system-ui", fontSize: 11 }}>{yearLevel}</p>
          </div>
          <div className="text-right">
            <p style={{ ...PS2, fontSize: 9, color: "#FACC15" }}>{pickaxe()}</p>
            <p className="text-slate-600 mt-1" style={{ fontFamily: "system-ui", fontSize: 11 }}>XP: {totalXP}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="px-4 py-2 flex gap-4 text-slate-500 text-xs border-b border-white/5 shrink-0" style={{ fontFamily: "system-ui" }}>
          <span>⛏️ Easy</span><span>🪨 Medium</span><span>💎 Hard</span>
          <span className="ml-auto">★ stars earned</span>
        </div>

        {/* Chapters */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
          {progLoading ? (
            <p className="text-center text-slate-600 mt-8" style={{ ...PS2, fontSize: 10 }}>Loading world...</p>
          ) : world.chapters.map((ch, ci) => {
            const unlocked = isChapterUnlocked(ci)
            return (
              <div key={ch}
                className="flex items-center gap-3 p-3 rounded-xl border border-white/5"
                style={{ background: "rgba(255,255,255,0.03)", opacity: unlocked ? 1 : 0.45 }}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold truncate" style={{ fontFamily: "system-ui", fontSize: 14, color: unlocked ? "#f1f5f9" : "#475569" }}>{ch}</p>
                  <p className="text-slate-600 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 11 }}>
                    {[1,2,3].map(s => {
                      const st = progress[ch]?.[s]?.stars ?? 0
                      return st > 0 ? "★".repeat(st) : null
                    }).filter(Boolean).join(" · ") || (unlocked ? "Not started" : "🔒 Locked")}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {([1,2,3] as const).map(stage => {
                    const su = isStageUnlocked(ch, stage, ci)
                    const sp = progress[ch]?.[stage]
                    const stars = sp?.stars ?? 0
                    const Block = stage === 1 ? CoalOreBlock : stage === 2 ? IronOreBlock : DiamondOreBlock
                    return (
                      <button key={stage}
                        onClick={() => su && enterStage(ch, stage)}
                        disabled={!su}
                        className="flex flex-col items-center gap-0.5 disabled:cursor-not-allowed group"
                      >
                        <div style={{ filter: su ? "none" : "grayscale(1) brightness(0.4)", transition: "transform 0.1s" }}
                          className="group-hover:scale-110 group-active:scale-95 transition-transform">
                          {!su ? <BedrockBlock size={46} /> : stars > 0 ? <GoldBlock size={46} /> : <Block size={46} />}
                        </div>
                        <span style={{ fontSize: 8, color: "#FACC15", height: 10, lineHeight: "10px" }}>
                          {stars > 0 ? "★".repeat(stars) : ""}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {!isSignedIn && (
            <p className="text-center text-slate-600 mt-4 text-xs" style={{ fontFamily: "system-ui" }}>Sign in to save progress across sessions</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center shrink-0" style={{ background: "#0a0d13" }}>
          <button onClick={onExit} className="text-xs text-slate-500 hover:text-slate-300 transition-colors" style={{ fontFamily: "system-ui" }}>
            ← Exit Adventure
          </button>
          <p className="text-slate-700" style={{ ...PS2, fontSize: 8 }}>SELECTED ADVENTURE</p>
        </div>
      </div>
    )
  }

  // ─── MINING SCREEN ────────────────────────────────────────────────────────
  if (screen === "mining") {
    const stage = activeStage ?? 1
    const Block = stage === 1 ? CoalOreBlock : stage === 2 ? IronOreBlock : DiamondOreBlock

    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: "#0f1117", color: "#f1f5f9" }}>
        {/* HUD */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0" style={{ background: "#0a0d13" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen("worldmap")} className="text-slate-500 hover:text-slate-300 transition-colors text-lg">←</button>
            <div className="flex gap-1">
              {[1,2,3].map(i => <span key={i} style={{ fontSize: 15, opacity: i <= hearts ? 1 : 0.15 }}>❤️</span>)}
            </div>
          </div>
          <div className="text-center">
            <p style={{ ...PS2, fontSize: 8, color: world.color }}>{activeChapter}</p>
            <p className="text-slate-500 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 10 }}>{STAGE_LABEL[stage]} · Q{questionIndex + 1}/5</p>
          </div>
          <p style={{ ...PS2, fontSize: 9, color: "#FACC15" }}>+{stageXP} XP</p>
        </div>

        {/* XP progress bar */}
        <div className="h-2 shrink-0" style={{ background: "#1a1d27" }}>
          <div className="h-full transition-all duration-300" style={{ width: `${(questionIndex / 5) * 100}%`, background: `linear-gradient(90deg, ${world.color}, #8BC34A)` }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center gap-4 min-h-0">

          {/* Block sprite */}
          <div style={{
            filter: answerState === "correct" ? `drop-shadow(0 0 18px #4ade80) brightness(1.4)` :
                    answerState === "wrong"   ? `drop-shadow(0 0 10px #ef4444) brightness(0.75)` : "none",
            transition: "filter 0.15s",
            transform: answerState === "correct" ? "scale(1.08)" : "scale(1)",
          }}>
            <Block size={96} cracks={wrongOnQ} />
          </div>

          {qLoading && <p className="text-slate-600 animate-pulse mt-4" style={{ ...PS2, fontSize: 10 }}>Mining question...</p>}

          {qError && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <p className="text-red-400 text-sm" style={{ fontFamily: "system-ui" }}>Failed to load question</p>
              <button onClick={() => loadQuestion(activeChapter!, activeStage!, questionIndex)}
                className="px-4 py-2 rounded-xl text-xs" style={{ ...PS2, background: "#374151", color: "#d1d5db", fontSize: 9 }}>
                RETRY ↺
              </button>
            </div>
          )}

          {!qLoading && !qError && question && (
            <>
              {/* Question card */}
              <div className="w-full max-w-sm rounded-xl p-4 text-center" style={{
                background: "rgba(255,255,255,0.04)",
                border: answerState === "correct" ? "1px solid #4ade80" :
                        answerState === "wrong"   ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
                transition: "border-color 0.15s",
              }}>
                <p className="text-white leading-relaxed" style={{ fontFamily: "system-ui", fontSize: 15 }}>{question.question}</p>
              </div>

              {/* Options */}
              <div className="w-full max-w-sm grid grid-cols-2 gap-2">
                {question.options.map((opt, i) => {
                  const letter = opt.charAt(0)
                  const isCorrect = letter === question.correct
                  const isSelected = selected === opt
                  let bg = "rgba(255,255,255,0.05)"
                  let border = "rgba(255,255,255,0.1)"
                  if (answerState !== "idle") {
                    if (isCorrect) { bg = "rgba(74,222,128,0.12)"; border = "#4ade80" }
                    else if (isSelected) { bg = "rgba(239,68,68,0.12)"; border = "#ef4444" }
                  }
                  return (
                    <button key={i} onClick={() => selectAnswer(opt)} disabled={answerState !== "idle"}
                      className="rounded-xl px-3 py-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-default"
                      style={{ background: bg, border: `1px solid ${border}`, fontFamily: "system-ui", fontSize: 14, transition: "all 0.15s" }}>
                      <span style={{ color: "#FACC15", fontWeight: 700 }}>{letter}. </span>
                      <span className="text-white">{opt.slice(3)}</span>
                    </button>
                  )
                })}
              </div>

              {/* Correct feedback */}
              {answerState === "correct" && (
                <div className="w-full max-w-sm rounded-xl p-4 space-y-2" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid #4ade80" }}>
                  <p className="font-bold text-green-400" style={{ fontFamily: "system-ui" }}>✓ Correct! +{STAGE_XP[stage]} XP</p>
                  {question.funFact && <p className="text-green-300 text-sm" style={{ fontFamily: "system-ui" }}>💡 {question.funFact}</p>}
                  <button onClick={nextQuestion}
                    className="w-full rounded-lg py-2 font-bold transition-opacity hover:opacity-90"
                    style={{ ...PS2, fontSize: 9, background: "#4ade80", color: "#0f172a" }}>
                    {questionIndex < 4 ? "NEXT BLOCK ⛏️" : "STAGE CLEAR! →"}
                  </button>
                </div>
              )}

              {/* Wrong feedback */}
              {answerState === "wrong" && hearts > 0 && (
                <div className="w-full max-w-sm rounded-xl p-4 space-y-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid #ef4444" }}>
                  <p className="font-bold text-red-400" style={{ fontFamily: "system-ui" }}>✗ Not quite! {hearts} ❤️ left</p>
                  {showHint && <p className="text-red-300 text-sm" style={{ fontFamily: "system-ui" }}>💡 Hint: {question.hint}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setAnswerState("idle"); setSelected(null) }}
                      className="flex-1 rounded-lg py-2 font-bold"
                      style={{ ...PS2, fontSize: 8, background: "#ef4444", color: "white" }}>
                      TRY AGAIN
                    </button>
                    {wrongOnQ >= 2 && (
                      <button onClick={skipQuestion}
                        className="flex-1 rounded-lg py-2 font-bold"
                        style={{ ...PS2, fontSize: 8, background: "#374151", color: "#9ca3af" }}>
                        SKIP →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // ─── STAGE COMPLETE ───────────────────────────────────────────────────────
  if (screen === "stage_complete") {
    const stage = activeStage ?? 1
    const stars = Math.max(1, Math.min(3, hearts))
    const nextStage = stage < 3 ? (stage + 1) as 1|2|3 : null
    const ci = world.chapters.indexOf(activeChapter ?? "")
    const nextChapter = ci < world.chapters.length - 1 ? world.chapters[ci + 1] : null

    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto px-6 py-8 gap-6" style={{ background: "#0f1117", color: "#f1f5f9" }}>
        <div className="text-center space-y-3">
          <p className="text-4xl">⛏️</p>
          <p style={{ ...PS2, fontSize: 14, color: "#FACC15" }}>STAGE CLEAR!</p>
          <p className="text-slate-400" style={{ fontFamily: "system-ui", fontSize: 14 }}>{activeChapter} · {STAGE_LABEL[stage]}</p>
          <div className="flex justify-center gap-1 text-2xl">
            {[1,2,3].map(i => <span key={i} style={{ opacity: i <= stars ? 1 : 0.18 }}>⭐</span>)}
          </div>
          <p style={{ ...PS2, fontSize: 11, color: "#4ade80" }}>+{stageXP} XP earned</p>
        </div>

        <div className="w-full max-w-xs space-y-3">
          {nextStage && (
            <button onClick={() => enterStage(activeChapter!, nextStage)}
              className="w-full rounded-xl py-4 px-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "rgba(253,200,0,0.08)", border: "2px solid #FDC800" }}>
              <p style={{ ...PS2, fontSize: 10, color: "#FDC800" }}>CONTINUE MINING →</p>
              <p className="text-slate-500 mt-1" style={{ fontFamily: "system-ui", fontSize: 12 }}>{STAGE_LABEL[nextStage]}</p>
            </button>
          )}

          {!nextStage && nextChapter && (
            <button onClick={() => setScreen("worldmap")}
              className="w-full rounded-xl py-4 px-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{ background: "rgba(253,200,0,0.08)", border: "2px solid #FDC800" }}>
              <p style={{ ...PS2, fontSize: 10, color: "#FDC800" }}>NEXT CHAPTER →</p>
              <p className="text-slate-500 mt-1" style={{ fontFamily: "system-ui", fontSize: 12 }}>{nextChapter} unlocked!</p>
            </button>
          )}

          <button onClick={() => setScreen("worldmap")}
            className="w-full rounded-xl py-3 px-4 text-left transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ ...PS2, fontSize: 10, color: "#94a3b8" }}>🗺️ WORLD MAP</p>
          </button>

          <button onClick={() => onSwitchToPractice(exam, yearLevel)}
            className="w-full rounded-xl py-3 px-4 text-left transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ ...PS2, fontSize: 10, color: "#94a3b8" }}>📝 PRACTICE MODE</p>
            <p className="text-slate-600 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 11 }}>Open-ended practice for {exam.split("(")[0].trim().slice(0, 28)}</p>
          </button>

          <button onClick={() => onSwitchToExam(exam, yearLevel)}
            className="w-full rounded-xl py-3 px-4 text-left transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ ...PS2, fontSize: 10, color: "#94a3b8" }}>📋 TAKE AN EXAM</p>
            <p className="text-slate-600 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 11 }}>Sit a full timed mock exam</p>
          </button>
        </div>
      </div>
    )
  }

  // ─── GAME OVER ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto px-6 py-8 gap-6" style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <div className="text-center space-y-3">
        <p className="text-5xl">💀</p>
        <p style={{ ...PS2, fontSize: 14, color: "#ef4444" }}>GAME OVER</p>
        <p className="text-slate-400" style={{ fontFamily: "system-ui", fontSize: 14 }}>You ran out of hearts</p>
        <p className="text-slate-600" style={{ fontFamily: "system-ui", fontSize: 12 }}>{activeChapter} · {STAGE_LABEL[activeStage ?? 1]}</p>
      </div>
      <div className="w-full max-w-xs space-y-3">
        <button onClick={() => enterStage(activeChapter!, activeStage!)}
          className="w-full rounded-xl py-4 text-center transition-all hover:scale-[1.01]"
          style={{ background: "rgba(239,68,68,0.12)", border: "2px solid #ef4444" }}>
          <p style={{ ...PS2, fontSize: 10, color: "#ef4444" }}>TRY AGAIN ♻️</p>
        </button>
        <button onClick={() => setScreen("worldmap")}
          className="w-full rounded-xl py-3 text-center transition-all hover:scale-[1.01]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ ...PS2, fontSize: 10, color: "#94a3b8" }}>🗺️ WORLD MAP</p>
        </button>
      </div>
    </div>
  )
}
