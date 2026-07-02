"use client"

import { useEffect, useState } from "react"

type DashboardData = {
  completedChapters: number
  totalChapters: number
  totalScore: number
  totalPossible: number
  byExam: Record<string, { total: number; completed: number }>
  recent: Array<{
    exam: string
    chapter: string
    completed: boolean
    testScore: number | null
    testTotal: number | null
    updatedAt: string
  }>
}

type Props = {
  childName: string
  avatarEmoji: string
  token: string
  onStartStudying: () => void
  onLogout: () => void
}

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100)
}

export default function StudentDashboard({ childName, avatarEmoji, token, onStartStudying, onLogout }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/student/dashboard", { headers: { "x-child-token": token } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const accuracy = data ? pct(data.totalScore, data.totalPossible) : 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#f8fafc" }}>
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/selected-logo.svg" alt="SelectEd" style={{ width: 28, height: 28 }} />
          <span className="font-black text-sm tracking-tight" style={{ color: "#000936" }}>SelectEd</span>
        </div>
        <button
          onClick={onLogout}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          style={{ color: "#94a3b8" }}
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Welcome */}
        <div className="text-center space-y-1">
          <div className="text-5xl mb-3">{avatarEmoji}</div>
          <h1 className="text-2xl font-black" style={{ color: "#0f172a" }}>
            Welcome back, {childName}!
          </h1>
          <p className="text-sm" style={{ color: "#64748b" }}>
            {data?.totalChapters === 0
              ? "Ready to start your first chapter?"
              : `Keep it up — you're making great progress.`}
          </p>
        </div>

        {/* Stats */}
        {!loading && data && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-4 text-center shadow-sm" style={{ background: "#000936" }}>
              <p className="text-3xl font-black" style={{ color: "#FDC800" }}>{data.completedChapters}</p>
              <p className="text-xs mt-1 font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                Chapters<br />Done
              </p>
            </div>
            <div className="rounded-2xl p-4 text-center shadow-sm" style={{ background: "#000936" }}>
              <p className="text-3xl font-black" style={{ color: "#FDC800" }}>{data.totalScore}</p>
              <p className="text-xs mt-1 font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                Test<br />Points
              </p>
            </div>
            <div className="rounded-2xl p-4 text-center shadow-sm" style={{ background: "#000936" }}>
              <p className="text-3xl font-black" style={{ color: data.totalPossible === 0 ? "#94a3b8" : accuracy >= 70 ? "#4ade80" : accuracy >= 50 ? "#FDC800" : "#f87171" }}>
                {data.totalPossible === 0 ? "—" : `${accuracy}%`}
              </p>
              <p className="text-xs mt-1 font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
                Test<br />Accuracy
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-2xl p-4 h-20 animate-pulse" style={{ background: "#e2e8f0" }} />
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onStartStudying}
          className="w-full py-4 rounded-2xl font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          style={{ background: "#000936", color: "#FDC800" }}
        >
          {data?.totalChapters === 0 ? "🚀 Start Studying" : "📖 Continue Studying →"}
        </button>

        {/* Per-exam progress */}
        {data && Object.keys(data.byExam).length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black tracking-wide uppercase" style={{ color: "#64748b" }}>
              Progress by exam
            </h2>
            {Object.entries(data.byExam).map(([exam, stats]) => (
              <div key={exam} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm" style={{ color: "#0f172a" }}>{exam}</span>
                  <span className="text-xs font-semibold" style={{ color: "#64748b" }}>
                    {stats.completed}/{stats.total} chapters
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#e2e8f0" }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${pct(stats.completed, stats.total)}%`,
                      background: "linear-gradient(90deg, #000936, #0066CB)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent activity */}
        {data && data.recent.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black tracking-wide uppercase" style={{ color: "#64748b" }}>
              Recent activity
            </h2>
            <div className="space-y-2">
              {data.recent.map((r, i) => (
                <div key={i} className="bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100 flex items-center gap-3">
                  <span className="text-lg">{r.completed ? "✅" : "📖"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#0f172a" }}>{r.chapter}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{r.exam}</p>
                  </div>
                  {r.completed && r.testScore != null && r.testTotal != null && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "#f1f5f9", color: "#475569" }}>
                      {r.testScore}/{r.testTotal}
                    </span>
                  )}
                  {!r.completed && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "#fef9c3", color: "#a16207" }}>
                      In progress
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* First-time empty state */}
        {data && data.totalChapters === 0 && (
          <div className="text-center py-4 space-y-2">
            <p className="text-4xl">🎯</p>
            <p className="text-sm font-semibold" style={{ color: "#64748b" }}>
              No chapters started yet. Hit &ldquo;Start Studying&rdquo; to begin!
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
