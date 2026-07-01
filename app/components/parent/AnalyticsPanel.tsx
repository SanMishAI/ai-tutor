"use client"

import { useEffect, useState } from "react"
import BarChart from "./charts/BarChart"
import LineChart from "./charts/LineChart"
import DonutChart from "./charts/DonutChart"
import { downloadChildReport } from "./downloadChildReport"

type DailyUsage = { date: string; label: string; count: number }
type Exam = { id: string; subject: string; score: number; total: number; pct: number; timeTaken: number | null; createdAt: string }
type PracticeSubject = { subject: string; correct: number; total: number; pct: number }
type ChildAnalytics = {
  child: { id: string; name: string; avatarEmoji: string }
  dailyUsage: DailyUsage[]
  todayUsage: number
  totalQuestionsAllTime: number
  exams: Exam[]
  practiceBySubject: PracticeSubject[]
  overallAccuracy: number | null
  totalPracticeQuestions: number
  totalExams: number
}

export default function AnalyticsPanel({ childId, childName }: { childId: string; childName: string }) {
  const [data, setData] = useState<ChildAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/parent/analytics`)
      .then(r => r.json())
      .then(json => {
        const found = json.analytics?.find((a: ChildAnalytics) => a.child.id === childId)
        setData(found ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [childId])

  async function handleDownload() {
    if (!data) return
    setDownloading(true)
    try { await downloadChildReport(data) } finally { setDownloading(false) }
  }

  if (loading) return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
      <div className="h-4 w-32 rounded bg-slate-100 mb-4" />
      <div className="h-24 rounded bg-slate-100" />
    </div>
  )

  if (!data) return null

  const lineData = data.exams.slice(0, 10).reverse().map((e, i) => ({
    label: `#${i + 1}`,
    pct: e.pct,
    subject: e.subject,
  }))

  const donutData = (() => {
    const map: Record<string, number> = {}
    data.practiceBySubject.forEach(p => { map[p.subject] = (map[p.subject] ?? 0) + p.total })
    data.exams.forEach(e => { map[e.subject] = (map[e.subject] ?? 0) + 1 })
    return Object.entries(map).map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count)
  })()

  const totalWeek = data.dailyUsage.reduce((s, d) => s + d.count, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm" style={{ color: "#0f172a" }}>
          {data.child.avatarEmoji} {childName} — Analytics
        </h3>
        <button
          onClick={handleDownload}
          disabled={downloading || (data.totalExams === 0 && data.totalPracticeQuestions === 0)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-slate-50 disabled:opacity-40"
          style={{ borderColor: "#e2e8f0", color: "#475569" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading ? "Generating…" : "Download PDF"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Questions today", value: data.todayUsage, color: "#000936" },
          { label: "This week", value: totalWeek, color: "#0066CB" },
          { label: "Practice accuracy", value: data.overallAccuracy !== null ? `${data.overallAccuracy}%` : "—", color: "#10b981" },
          { label: "Exams taken", value: data.totalExams, color: "#E34C00" },
        ].map(s => (
          <div key={s.label} className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs mt-0.5 font-medium" style={{ color: "#64748b" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Daily bar chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold mb-3" style={{ color: "#0f172a" }}>Questions per day (last 7 days)</p>
          {totalWeek === 0
            ? <p className="text-xs text-center py-6" style={{ color: "#94a3b8" }}>No activity yet this week</p>
            : <BarChart data={data.dailyUsage} />}
        </div>

        {/* Subject donut */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold mb-3" style={{ color: "#0f172a" }}>Subject breakdown</p>
          <DonutChart data={donutData} />
        </div>
      </div>

      {/* Exam score history */}
      {data.exams.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold mb-3" style={{ color: "#0f172a" }}>Exam score history</p>
          <LineChart data={lineData} />
          <div className="mt-4 space-y-2">
            {data.exams.slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center gap-3 text-xs">
                <span className="w-16 font-medium truncate" style={{ color: "#64748b" }}>
                  {new Date(e.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                </span>
                <span className="flex-1 truncate" style={{ color: "#0f172a" }}>{e.subject}</span>
                <span className="font-bold" style={{ color: e.pct >= 70 ? "#10b981" : e.pct >= 50 ? "#f59e0b" : "#ef4444" }}>
                  {e.score}/{e.total} ({e.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practice accuracy */}
      {data.practiceBySubject.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold mb-3" style={{ color: "#0f172a" }}>Practice accuracy by subject</p>
          <div className="space-y-2.5">
            {data.practiceBySubject.map(p => (
              <div key={p.subject}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: "#475569" }}>{p.subject}</span>
                  <span className="text-xs font-bold" style={{ color: p.pct >= 70 ? "#10b981" : p.pct >= 50 ? "#f59e0b" : "#ef4444" }}>
                    {p.pct}% ({p.correct}/{p.total})
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${p.pct}%`,
                    background: p.pct >= 70 ? "#10b981" : p.pct >= 50 ? "#f59e0b" : "#ef4444"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.totalExams === 0 && data.totalPracticeQuestions === 0 && totalWeek === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm font-bold" style={{ color: "#0f172a" }}>No activity yet</p>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Analytics will appear once {childName} starts studying.</p>
        </div>
      )}
    </div>
  )
}
