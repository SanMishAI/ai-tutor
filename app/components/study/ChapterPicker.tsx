"use client"

type ProgressRow = { phase: number; completed: boolean; testScore?: number | null; testTotal?: number | null }

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Exam header */}
      <div className="mb-6">
        <h2 className="text-xl font-black mb-1" style={{ color: "#000936" }}>📚 {exam}</h2>
        <p className="text-sm" style={{ color: "#64748b" }}>Choose a chapter to begin your 4-phase study session.</p>
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

          return (
            <button
              key={ch}
              onClick={() => onSelect(ch)}
              className="flex items-center gap-4 p-4 rounded-2xl border text-left w-full transition-all hover:shadow-md group"
              style={{
                border: isCompleted ? "2px solid #86efac" : inProgress ? "2px solid #FDC800" : "1.5px solid #e2e8f0",
                background: isCompleted ? "#f0fdf4" : inProgress ? "#fefce8" : "white",
              }}
            >
              {/* Number badge */}
              <span
                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                style={{
                  background: isCompleted ? "#16a34a" : inProgress ? "#ca8a04" : "#000936",
                  color: isCompleted ? "white" : inProgress ? "white" : "#FDC800",
                }}
              >
                {isCompleted ? "✓" : i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>{ch}</p>
                {isCompleted && scorePct !== null && (
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "#16a34a" }}>
                    Test: {score}/{total} ({scorePct}%) — ✓ Completed
                  </p>
                )}
                {inProgress && (
                  <p className="text-xs mt-0.5 font-medium" style={{ color: "#ca8a04" }}>
                    {prog.phase === 1 ? "Theory" : prog.phase === 2 ? "Examples" : prog.phase === 3 ? "Practice" : "Test"} in progress
                  </p>
                )}
                {!prog && (
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>Theory → Examples → Practice → Test</p>
                )}
              </div>

              <span className="text-lg group-hover:translate-x-1 transition-transform shrink-0">
                {isCompleted ? "🔄" : "→"}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
