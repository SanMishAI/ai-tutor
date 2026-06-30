"use client"

import { useState, useEffect, useRef } from "react"
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

const RANKS = [
  { min: 0,    max: 99,   title: "🪵 Novice",   color: "#92400e" },
  { min: 100,  max: 499,  title: "🪨 Explorer",  color: "#64748b" },
  { min: 500,  max: 999,  title: "⚙️ Scholar",   color: "#b45309" },
  { min: 1000, max: 1999, title: "🪙 Expert",    color: "#d97706" },
  { min: 2000, max: 4999, title: "💎 Champion",  color: "#0891b2" },
  { min: 5000, max: Infinity, title: "👑 Legend", color: "#7c3aed" },
]

function getRank(xp: number) {
  return RANKS.find(r => xp >= r.min && xp <= r.max) ?? RANKS[0]
}

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

  const [progress, setProgress]       = useState<WorldProgress>({})
  const [totalXP, setTotalXP]         = useState(0)
  const [progLoading, setProgLoading] = useState(true)

  const [screen, setScreen]               = useState<Screen>("worldmap")
  const [activeChapter, setActiveChapter] = useState<string | null>(null)
  const [activeStage, setActiveStage]     = useState<1 | 2 | 3 | null>(null)

  const [question, setQuestion]         = useState<QuestionData | null>(null)
  const [qLoading, setQLoading]         = useState(false)
  const [qError, setQError]             = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [hearts, setHearts]             = useState(3)
  const [wrongOnQ, setWrongOnQ]         = useState(0)
  const [stageXP, setStageXP]           = useState(0)
  const [selected, setSelected]         = useState<string | null>(null)
  const [answerState, setAnswerState]   = useState<"idle" | "correct" | "wrong">("idle")
  const [showHint, setShowHint]         = useState(false)
  const [askedQuestions, setAskedQuestions] = useState<string[]>([])

  // Game-feel state
  const [combo, setCombo]         = useState(0)
  const [maxCombo, setMaxCombo]   = useState(0)
  const [comboAnim, setComboAnim] = useState(false)
  const [shaking, setShaking]     = useState(false)
  const [xpFlash, setXpFlash]     = useState(false)
  const [starsAnim, setStarsAnim] = useState<boolean[]>([false, false, false])

  // suppress unused import warning — useRef is used for future extensions
  const _ref = useRef<null>(null); void _ref

  useEffect(() => {
    const id = "press-start-2p"
    if (!document.getElementById(id)) {
      const link = document.createElement("link")
      link.id = id; link.rel = "stylesheet"
      link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    if (!isSignedIn) { setProgLoading(false); return }
    fetch(`/api/arcade/progress?exam=${encodeURIComponent(exam)}`)
      .then(r => r.json())
      .then(d => { setProgress(d.progress ?? {}); setTotalXP(d.totalXP ?? 0) })
      .catch(() => {})
      .finally(() => setProgLoading(false))
  }, [exam, isSignedIn])

  async function loadQuestion(chapter: string, stage: number, idx: number, prevAsked: string[]) {
    setQLoading(true); setQError(false)
    setQuestion(null); setSelected(null); setAnswerState("idle"); setShowHint(false); setWrongOnQ(0); setShaking(false)
    try {
      const r = await fetch("/api/arcade/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, yearLevel, chapter, stage, questionIndex: idx, askedQuestions: prevAsked }),
      })
      if (!r.ok) throw new Error()
      const d = await r.json()
      if (!d.question) throw new Error()
      setQuestion(d)
      setAskedQuestions(prev => [...prev, d.question])
    } catch { setQError(true) }
    setQLoading(false)
  }

  function enterStage(chapter: string, stage: 1 | 2 | 3) {
    setActiveChapter(chapter); setActiveStage(stage)
    setHearts(3); setStageXP(0); setQuestionIndex(0); setCombo(0); setMaxCombo(0)
    setStarsAnim([false, false, false])
    setAskedQuestions([])
    setScreen("mining")
    loadQuestion(chapter, stage, 0, [])
  }

  function comboMultiplier(c: number) {
    if (c >= 5) return 3
    if (c >= 3) return 2
    return 1
  }

  function selectAnswer(opt: string) {
    if (answerState !== "idle" || !question) return
    const letter = opt.charAt(0).toUpperCase()
    setSelected(opt)
    if (letter === question.correct) {
      const newCombo = combo + 1
      const mult = comboMultiplier(newCombo)
      const xpEarned = STAGE_XP[activeStage ?? 1] * mult
      setStageXP(x => x + xpEarned)
      setCombo(newCombo)
      setMaxCombo(m => Math.max(m, newCombo))
      setComboAnim(true); setTimeout(() => setComboAnim(false), 700)
      setXpFlash(true); setTimeout(() => setXpFlash(false), 600)
      setAnswerState("correct")
    } else {
      const newHearts = hearts - 1
      setWrongOnQ(w => w + 1)
      setHearts(newHearts)
      setAnswerState("wrong")
      setShowHint(true)
      setCombo(0)
      setShaking(true); setTimeout(() => setShaking(false), 500)
      if (newHearts <= 0) setTimeout(() => setScreen("game_over"), 900)
    }
  }

  function nextQuestion() {
    const next = questionIndex + 1
    if (next >= 5) { finishStage(); return }
    setQuestionIndex(next)
    loadQuestion(activeChapter!, activeStage!, next, askedQuestions)
  }

  function skipQuestion() {
    const next = questionIndex + 1
    setCombo(0)
    if (next >= 5) { finishStage(); return }
    setQuestionIndex(next)
    loadQuestion(activeChapter!, activeStage!, next, askedQuestions)
  }

  function finishStage() {
    saveProgress()
    const finalStars = Math.max(1, Math.min(3, hearts))
    setStarsAnim([false, false, false])
    setTimeout(() => setStarsAnim([true, false, false]), 200)
    if (finalStars >= 2) setTimeout(() => setStarsAnim([true, true, false]), 500)
    if (finalStars >= 3) setTimeout(() => setStarsAnim([true, true, true]), 800)
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

  const rank = getRank(totalXP)
  const nextRank = RANKS.find(r => r.min > totalXP)
  const xpToNextRank = nextRank ? nextRank.min - totalXP : 0
  const rankProgress = nextRank ? ((totalXP - rank.min) / (nextRank.min - rank.min)) * 100 : 100

  // ─── WORLD MAP ────────────────────────────────────────────────────────────
  if (screen === "worldmap") {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden"
        style={{ background: "linear-gradient(180deg, #0a0d13 0%, #0f1117 100%)", color: "#f1f5f9" }}>
        <style>{`
          @keyframes rank-glow { 0%,100% { box-shadow: 0 0 8px ${rank.color}55; } 50% { box-shadow: 0 0 22px ${rank.color}99; } }
          @keyframes chapter-unlock { 0% { transform: scale(0.93); opacity:0.5; } 100% { transform: scale(1); opacity:1; } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* Header with rank */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 shrink-0" style={{ background: "#0a0d13" }}>
          <div>
            <p style={{ ...PS2, fontSize: 8, color: world.color }}>{world.shortName.toUpperCase()}</p>
            <p className="text-slate-500 mt-1" style={{ fontFamily: "system-ui", fontSize: 10 }}>{yearLevel}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p style={{
              ...PS2, fontSize: 7, color: rank.color,
              animation: "rank-glow 2.5s ease-in-out infinite",
              border: `1px solid ${rank.color}55`,
              padding: "3px 7px", borderRadius: 6,
            }}>
              {rank.title}
            </p>
            <div className="flex items-center gap-1.5">
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, rankProgress)}%`, background: rank.color }} />
              </div>
              <p style={{ fontFamily: "system-ui", fontSize: 9, color: "#64748b" }}>{totalXP} XP</p>
            </div>
            {nextRank && <p style={{ fontFamily: "system-ui", fontSize: 8, color: "#475569" }}>{xpToNextRank} XP to {nextRank.title}</p>}
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
            <div className="flex justify-center mt-8">
              <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/50" style={{ animation: "spin 0.8s linear infinite" }} />
            </div>
          ) : world.chapters.map((ch, ci) => {
            const unlocked = isChapterUnlocked(ci)
            const chapterComplete = [1,2,3].every(s => (progress[ch]?.[s]?.stars ?? 0) > 0)
            return (
              <div key={ch}
                className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                style={{
                  background: chapterComplete ? "rgba(253,200,0,0.07)" : "rgba(255,255,255,0.03)",
                  borderColor: chapterComplete ? "rgba(253,200,0,0.28)" : "rgba(255,255,255,0.06)",
                  opacity: unlocked ? 1 : 0.4,
                }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold truncate" style={{ fontFamily: "system-ui", fontSize: 13, color: unlocked ? "#f1f5f9" : "#475569" }}>
                      {ci + 1}. {ch}
                    </p>
                    {chapterComplete && <span style={{ fontSize: 11 }}>✅</span>}
                  </div>
                  <p className="text-slate-600 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 10 }}>
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
                        title={STAGE_LABEL[stage]}>
                        <div style={{ filter: su ? "none" : "grayscale(1) brightness(0.3)" }}
                          className="group-hover:scale-110 group-active:scale-95 transition-transform">
                          {!su ? <BedrockBlock size={44} /> : stars > 0 ? <GoldBlock size={44} /> : <Block size={44} />}
                        </div>
                        <span style={{ fontSize: 7, color: "#FACC15", height: 9, lineHeight: "9px" }}>
                          {stars > 0 ? "★".repeat(stars) : su ? "·" : ""}
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
          <p style={{ ...PS2, fontSize: 7, color: "#1e293b" }}>SELECTED ADVENTURE</p>
        </div>
      </div>
    )
  }

  // ─── MINING SCREEN ────────────────────────────────────────────────────────
  if (screen === "mining") {
    const stage = activeStage ?? 1
    const Block = stage === 1 ? CoalOreBlock : stage === 2 ? IronOreBlock : DiamondOreBlock
    const mult = comboMultiplier(combo)

    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: "#0f1117", color: "#f1f5f9" }}>
        <style>{`
          @keyframes shake-x { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-9px); } 40% { transform: translateX(9px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }
          @keyframes combo-pop { 0% { transform: scale(0.5) translateY(6px); opacity:0; } 60% { transform: scale(1.22) translateY(-2px); opacity:1; } 100% { transform: scale(1) translateY(0); opacity:1; } }
          @keyframes xp-flash { 0%,100% { color: #FACC15; } 50% { color: #fff; text-shadow: 0 0 14px #FACC15; } }
          @keyframes correct-bounce { 0%,100% { transform: scale(1); } 35% { transform: scale(1.1); } 65% { transform: scale(0.97); } }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>

        {/* HUD */}
        <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/10 shrink-0" style={{ background: "#0a0d13" }}>
          <div className="flex items-center gap-2.5">
            <button onClick={() => setScreen("worldmap")} className="text-slate-500 hover:text-slate-300 transition-colors text-base">←</button>
            <div className="flex gap-1">
              {[1,2,3].map(i => (
                <span key={i} style={{ fontSize: 13, opacity: i <= hearts ? 1 : 0.12 }}>❤️</span>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p style={{ ...PS2, fontSize: 7, color: world.color }}>{activeChapter}</p>
            <p className="text-slate-500 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 9 }}>{STAGE_LABEL[stage]} · Q{questionIndex + 1}/5</p>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <p style={{ ...PS2, fontSize: 8, color: "#FACC15", animation: xpFlash ? "xp-flash 0.6s ease-in-out" : "none" }}>
              +{stageXP} XP
            </p>
            {combo >= 2 && (
              <p style={{
                ...PS2, fontSize: 7,
                color: combo >= 5 ? "#F97316" : combo >= 3 ? "#FBBF24" : "#a78bfa",
                animation: comboAnim ? "combo-pop 0.7s ease-out" : "none",
              }}>
                {combo}×{mult >= 3 ? "🔥🔥🔥" : mult >= 2 ? "🔥🔥" : "🔥"} COMBO
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 shrink-0" style={{ background: "#1a1d27" }}>
          <div className="h-full transition-all duration-500" style={{
            width: `${(questionIndex / 5) * 100}%`,
            background: `linear-gradient(90deg, ${world.color}, #8BC34A)`,
          }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center gap-4 min-h-0">

          {/* Block sprite with animations */}
          <div style={{
            filter: answerState === "correct" ? `drop-shadow(0 0 22px #4ade80) brightness(1.5)` :
                    answerState === "wrong"   ? `drop-shadow(0 0 12px #ef4444) brightness(0.7)` : "none",
            transition: "filter 0.15s",
            animation: shaking ? "shake-x 0.5s ease-out" :
                       answerState === "correct" ? "correct-bounce 0.4s ease-out" : "none",
          }}>
            <Block size={90} cracks={wrongOnQ} />
          </div>

          {qLoading && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <div className="w-7 h-7 border-2 border-white/10 border-t-white/50 rounded-full" style={{ animation: "spin 0.8s linear infinite" }} />
              <p className="text-slate-600" style={{ ...PS2, fontSize: 8 }}>Mining question...</p>
            </div>
          )}

          {qError && (
            <div className="flex flex-col items-center gap-3 mt-4">
              <p className="text-red-400 text-sm" style={{ fontFamily: "system-ui" }}>Failed to load question</p>
              <button onClick={() => loadQuestion(activeChapter!, activeStage!, questionIndex, askedQuestions)}
                className="px-4 py-2 rounded-xl" style={{ ...PS2, background: "#374151", color: "#d1d5db", fontSize: 8 }}>
                RETRY ↺
              </button>
            </div>
          )}

          {!qLoading && !qError && question && (
            <>
              {/* Question card */}
              <div className="w-full max-w-sm rounded-xl p-4 text-center transition-all" style={{
                background: "rgba(255,255,255,0.04)",
                border: answerState === "correct" ? "1.5px solid #4ade80" :
                        answerState === "wrong"   ? "1.5px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
              }}>
                <p className="text-white leading-relaxed" style={{ fontFamily: "system-ui", fontSize: 14 }}>{question.question}</p>
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
                    if (isCorrect) { bg = "rgba(74,222,128,0.14)"; border = "#4ade80" }
                    else if (isSelected) { bg = "rgba(239,68,68,0.14)"; border = "#ef4444" }
                  }
                  return (
                    <button key={i} onClick={() => selectAnswer(opt)} disabled={answerState !== "idle"}
                      className="rounded-xl px-3 py-3 text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-default"
                      style={{ background: bg, border: `1.5px solid ${border}`, fontFamily: "system-ui", fontSize: 13 }}>
                      <span style={{ color: "#FACC15", fontWeight: 700 }}>{letter}. </span>
                      <span className="text-white">{opt.slice(3)}</span>
                    </button>
                  )
                })}
              </div>

              {/* Correct feedback */}
              {answerState === "correct" && (
                <div className="w-full max-w-sm rounded-xl p-4 space-y-2" style={{ background: "rgba(74,222,128,0.08)", border: "1.5px solid #4ade80" }}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-green-400" style={{ fontFamily: "system-ui" }}>✓ Correct!</p>
                    <p style={{ ...PS2, fontSize: 7, color: "#FACC15" }}>
                      +{STAGE_XP[stage] * mult} XP{mult > 1 ? ` ×${mult}🔥` : ""}
                    </p>
                  </div>
                  {question.funFact && <p className="text-green-300 text-sm" style={{ fontFamily: "system-ui" }}>💡 {question.funFact}</p>}
                  <button onClick={nextQuestion}
                    className="w-full rounded-lg py-2.5 font-bold transition-opacity hover:opacity-90"
                    style={{ ...PS2, fontSize: 8, background: "#4ade80", color: "#0f172a" }}>
                    {questionIndex < 4 ? "NEXT BLOCK ⛏️" : "STAGE CLEAR! →"}
                  </button>
                </div>
              )}

              {/* Wrong feedback */}
              {answerState === "wrong" && hearts > 0 && (
                <div className="w-full max-w-sm rounded-xl p-4 space-y-2" style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid #ef4444" }}>
                  <p className="font-bold text-red-400" style={{ fontFamily: "system-ui" }}>✗ Not quite! {hearts} ❤️ left</p>
                  {showHint && <p className="text-red-300 text-sm" style={{ fontFamily: "system-ui" }}>💡 Hint: {question.hint}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => { setAnswerState("idle"); setSelected(null) }}
                      className="flex-1 rounded-lg py-2.5 font-bold"
                      style={{ ...PS2, fontSize: 7, background: "#ef4444", color: "white" }}>
                      TRY AGAIN
                    </button>
                    {wrongOnQ >= 2 && (
                      <button onClick={skipQuestion}
                        className="flex-1 rounded-lg py-2.5 font-bold"
                        style={{ ...PS2, fontSize: 7, background: "#374151", color: "#9ca3af" }}>
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
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto px-6 py-8 gap-5" style={{ background: "#0f1117", color: "#f1f5f9" }}>
        <style>{`
          @keyframes star-pop { 0% { transform: scale(0) rotate(-20deg); opacity:0; } 65% { transform: scale(1.35) rotate(5deg); } 100% { transform: scale(1) rotate(0deg); opacity:1; } }
          @keyframes clear-in { 0% { transform: scale(0.7); opacity:0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity:1; } }
          @keyframes xp-slide { 0% { transform: translateY(10px); opacity:0; } 100% { transform: translateY(0); opacity:1; } }
        `}</style>

        <div className="text-center space-y-3" style={{ animation: "clear-in 0.4s ease-out" }}>
          <p className="text-4xl">⛏️</p>
          <p style={{ ...PS2, fontSize: 13, color: "#FACC15" }}>STAGE CLEAR!</p>
          <p className="text-slate-400" style={{ fontFamily: "system-ui", fontSize: 13 }}>{activeChapter} · {STAGE_LABEL[stage]}</p>
          <div className="flex justify-center gap-2" style={{ fontSize: 32 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{
                opacity: starsAnim[i] ? 1 : 0.1,
                transform: starsAnim[i] ? "scale(1)" : "scale(0.5)",
                animation: starsAnim[i] ? `star-pop 0.4s ease-out` : "none",
                display: "inline-block",
              }}>⭐</span>
            ))}
          </div>
          <div style={{ animation: "xp-slide 0.4s 0.6s ease-out both" }}>
            <p style={{ ...PS2, fontSize: 10, color: "#4ade80" }}>+{stageXP} XP earned</p>
            {maxCombo >= 3 && <p className="mt-1" style={{ fontFamily: "system-ui", fontSize: 12, color: "#FACC15" }}>🔥 Best combo: {maxCombo}×</p>}
          </div>
        </div>

        <div className="w-full max-w-xs space-y-2.5">
          {nextStage && (
            <button onClick={() => enterStage(activeChapter!, nextStage)}
              className="w-full rounded-xl py-4 px-4 text-left transition-all hover:scale-[1.02] active:scale-[0.99]"
              style={{ background: "rgba(253,200,0,0.1)", border: "2px solid #FDC800" }}>
              <p style={{ ...PS2, fontSize: 9, color: "#FDC800" }}>CONTINUE MINING →</p>
              <p className="text-slate-500 mt-1" style={{ fontFamily: "system-ui", fontSize: 11 }}>{STAGE_LABEL[nextStage]}</p>
            </button>
          )}

          {!nextStage && nextChapter && (
            <button onClick={() => setScreen("worldmap")}
              className="w-full rounded-xl py-4 px-4 text-left transition-all hover:scale-[1.02]"
              style={{ background: "rgba(253,200,0,0.1)", border: "2px solid #FDC800" }}>
              <p style={{ ...PS2, fontSize: 9, color: "#FDC800" }}>NEXT CHAPTER →</p>
              <p className="text-slate-500 mt-1" style={{ fontFamily: "system-ui", fontSize: 11 }}>{nextChapter} unlocked!</p>
            </button>
          )}

          <button onClick={() => setScreen("worldmap")}
            className="w-full rounded-xl py-3 px-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 17 }}>🗺️</span>
            <p style={{ ...PS2, fontSize: 8, color: "#94a3b8" }}>WORLD MAP</p>
          </button>

          <button onClick={() => onSwitchToPractice(exam, yearLevel)}
            className="w-full rounded-xl py-3 px-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 17 }}>📝</span>
            <div>
              <p style={{ ...PS2, fontSize: 8, color: "#94a3b8" }}>PRACTICE MODE</p>
              <p className="text-slate-600 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 10 }}>{exam.split("(")[0].trim().slice(0, 26)}</p>
            </div>
          </button>

          <button onClick={() => onSwitchToExam(exam, yearLevel)}
            className="w-full rounded-xl py-3 px-4 flex items-center gap-3 transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontSize: 17 }}>📋</span>
            <div>
              <p style={{ ...PS2, fontSize: 8, color: "#94a3b8" }}>TAKE AN EXAM</p>
              <p className="text-slate-600 mt-0.5" style={{ fontFamily: "system-ui", fontSize: 10 }}>Full timed mock exam</p>
            </div>
          </button>
        </div>
      </div>
    )
  }

  // ─── GAME OVER ────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto px-6 py-8 gap-6"
      style={{ background: "#0f1117", color: "#f1f5f9" }}>
      <style>{`
        @keyframes skull-bounce { 0%,100% { transform: translateY(0) rotate(0deg); } 30% { transform: translateY(-14px) rotate(-6deg); } 70% { transform: translateY(-7px) rotate(5deg); } }
        @keyframes game-over-in { 0% { transform: scale(0.65); opacity:0; } 65% { transform: scale(1.06); } 100% { transform: scale(1); opacity:1; } }
        @keyframes red-pulse { 0%,100% { background: #0f1117; } 50% { background: rgba(239,68,68,0.06); } }
      `}</style>
      <div className="absolute inset-0 pointer-events-none" style={{ animation: "red-pulse 1.2s ease-in-out 3" }} />
      <div className="text-center space-y-3 relative" style={{ animation: "game-over-in 0.5s ease-out" }}>
        <p className="text-6xl" style={{ animation: "skull-bounce 1.4s ease-in-out infinite" }}>💀</p>
        <p style={{ ...PS2, fontSize: 15, color: "#ef4444" }}>GAME OVER</p>
        <p className="text-slate-400" style={{ fontFamily: "system-ui", fontSize: 13 }}>You ran out of hearts</p>
        <p className="text-slate-600" style={{ fontFamily: "system-ui", fontSize: 11 }}>{activeChapter} · {STAGE_LABEL[activeStage ?? 1]}</p>
        {maxCombo >= 2 && (
          <p style={{ fontFamily: "system-ui", fontSize: 11, color: "#FACC15" }}>🔥 Best combo this run: {maxCombo}×</p>
        )}
      </div>
      <div className="w-full max-w-xs space-y-3 relative">
        <button onClick={() => enterStage(activeChapter!, activeStage!)}
          className="w-full rounded-xl py-4 text-center transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "rgba(239,68,68,0.14)", border: "2px solid #ef4444" }}>
          <p style={{ ...PS2, fontSize: 9, color: "#ef4444" }}>TRY AGAIN ♻️</p>
        </button>
        <button onClick={() => setScreen("worldmap")}
          className="w-full rounded-xl py-3 text-center transition-all hover:scale-[1.01]"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p style={{ ...PS2, fontSize: 9, color: "#94a3b8" }}>🗺️ WORLD MAP</p>
        </button>
      </div>
    </div>
  )
}
