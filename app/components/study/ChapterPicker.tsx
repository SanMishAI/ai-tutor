"use client"

import { getLevel, totalPoints, chapterPoints } from "@/lib/studyPoints"

type ProgressRow = { phase: number; completed: boolean; testScore?: number | null; testTotal?: number | null }

const PASS_PCT = 80

function isUnlocked(chapters: string[], progressMap: Record<string, ProgressRow>, index: number): boolean {
  if (index === 0) return true
  const prev = progressMap[chapters[index - 1]]
  if (!prev?.completed || prev.testScore == null || !prev.testTotal) return false
  return Math.round((prev.testScore / prev.testTotal) * 100) >= PASS_PCT
}

export default function ChapterPicker({
  exam,
  chapters,
  progressMap,
  onSelect,
}: {
  exam: string
  chapters: string[]
  progressMap: Record<string, ProgressRow>
  onSelect: (chapter: string) => void
}) {
  const done = chapters.filter(c => progressMap[c]?.completed).length
  const pct = chapters.length > 0 ? Math.round((done / chapters.length) * 100) : 0
  const pts = totalPoints(chapters, progressMap)
  const level = getLevel(pts)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Exam header + level */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black mb-1" style={{ color: "#000936" }}>📚 {exam}</h2>
            <p className="text-sm" style={{ color: "#64748b" }}>Complete each chapter test at 80%+ to unlock the next one.</p>
          </div>
          {/* Level badge */}
          <div className="shrink-0 text-center px-4 py-2 rounded-2xl border-2" style={{ borderColor: level.color + "40", background: level.color + "12" }}>
            <p className="text-xl">{level.emoji}</p>
            <p className="text-xs font-black mt-0.5" style={{ color: level.color }}>{level.name}</p>
            <p className="text-xs font-bold" style={{ color: "#64748b" }}>{pts} pts</p>
          </div>
        </div>

        {/* Level progress bar */}
        {level.next && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: "#94a3b8" }}>
              <span>{level.name}</span>
              <span>{level.next.name} at {level.next.min} pts</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: level.color + "22" }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${level.progressToNext}%`, background: level.color }} />
            </div>
          </div>
        )}

        {/* Chapter completion */}
        {done > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1" style={{ color: "#64748b" }}>
              <span>{done} of {chapters.length} chapters completed</span>
              <span className="font-bold">{pct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#000936" }} />
            </div>
          </div>
        )}
      </div>

      {/* Chapter grid */}
      <div className="grid gap-3">
        {chapters.map((ch, i) => {
          const prog = progressMap[ch]
          const isCompleted = prog?.completed
          const inProgress = prog && !isCompleted
          const score = prog?.testScore
          const total = prog?.testTotal
          const scorePct = score != null && total ? Math.round((score / total) * 100) : null
          const unlocked = isUnlocked(chapters, progressMap, i)
          const pts_earned = isCompleted && score != null && total ? chapterPoints(i, score, total) : null

          return (
            <button
              key={ch}
              onClick={() => unlocked ? onSelect(ch) : undefined}
              disabled={!unlocked}
              className="flex items-center gap-4 p-4 rounded-2xl border text-left w-full transition-all group"
              style={{
                border: isCompleted ? "2px solid #86efac" : inProgress ? "2px solid #FDC800" : unlocked ? "1.5px solid #e2e8f0" : "1.5px solid #e2e8f0",
                background: isCompleted ? "#f0fdf4" : inProgress ? "#fefce8" : unlocked ? "white" : "#f8fafc",
                opacity: unlocked ? 1 : 0.55,
                cursor: unlocked ? "pointer" : "not-allowed",
                boxShadow: unlocked && !isCompleted && !inProgress ? undefined : undefined,
              }}
            >
              {/* Number / lock badge */}
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                style={{
                  background: isCompleted ? "#16a34a" : inProgress ? "#ca8a04" : unlocked ? "#000936" : "#cbd5e1",
                  color: isCompleted ? "white" : inProgress ? "white" : unlocked ? "#FDC800" : "white",
                }}
              >
                {isCompleted ? "✓" : !unlocked ? "🔒" : i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{ch}</p>
                {isCompleted && scorePct !== null && (
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "#16a34a" }}>
                    {score}/{total} ({scorePct}%) ✓ {pts_earned != null && `· +${pts_earned} pts`}
                  </p>
                )}
                {inProgress && (
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "#ca8a04" }}>
                    {prog.phase === 1 ? "Theory" : prog.phase === 2 ? "Examples" : prog.phase === 3 ? "Practice" : "Test"} in progress
                  </p>
                )}
                {!prog && unlocked && (
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Theory → Examples → Practice → Test</p>
                )}
                {!unlocked && (
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                    Complete chapter {i} at 80%+ to unlock
                  </p>
                )}
              </div>

              {unlocked && (
                <span className="text-lg group-hover:translate-x-1 transition-transform shrink-0">
                  {isCompleted ? "🔄" : "→"}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
