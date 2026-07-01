type Slice = { subject: string; count: number }

const COLORS = ["#000936","#0066CB","#E34C00","#FDC800","#6366f1","#10b981","#f59e0b","#ec4899"]

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
}

export default function DonutChart({ data }: { data: Slice[] }) {
  if (data.length === 0) return <p className="text-xs text-center py-4" style={{ color: "#94a3b8" }}>No activity yet</p>
  const total = data.reduce((s, d) => s + d.count, 0)
  const cx = 70; const cy = 70; const r = 55; const inner = 30
  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const sweep = (d.count / total) * 2 * Math.PI
    const start = angle; angle += sweep
    return { ...d, start, sweep, color: COLORS[i % COLORS.length] }
  })
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 140 140" width={140} height={140} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => {
          if (s.sweep < 0.01) return null
          const p1 = polarToXY(cx, cy, r, s.start)
          const p2 = polarToXY(cx, cy, r, s.start + s.sweep)
          const i1 = polarToXY(cx, cy, inner, s.start)
          const i2 = polarToXY(cx, cy, inner, s.start + s.sweep)
          const large = s.sweep > Math.PI ? 1 : 0
          return (
            <path key={i}
              d={`M ${i1.x} ${i1.y} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} L ${i2.x} ${i2.y} A ${inner} ${inner} 0 ${large} 0 ${i1.x} ${i1.y} Z`}
              fill={s.color} />
          )
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={14} fontWeight="700" fill="#0f172a" fontFamily="system-ui">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fill="#94a3b8" fontFamily="system-ui">questions</text>
      </svg>
      <div className="space-y-1 flex-1 min-w-0">
        {slices.slice(0, 5).map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-xs truncate" style={{ color: "#475569" }}>{s.subject}</span>
            <span className="text-xs font-bold ml-auto" style={{ color: "#0f172a" }}>{s.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
