type Point = { label: string; pct: number; subject: string }

export default function LineChart({ data }: { data: Point[] }) {
  if (data.length === 0) return <p className="text-xs text-center py-4" style={{ color: "#94a3b8" }}>No exam results yet</p>
  const W = 280; const H = 80; const PAD = 16
  const xs = data.map((_, i) => PAD + (i / Math.max(data.length - 1, 1)) * (W - PAD * 2))
  const ys = data.map(d => H - (d.pct / 100) * (H - PAD) - 4)
  const pathD = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ")
  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} width="100%" style={{ overflow: "visible" }}>
      {/* Grid lines */}
      {[0, 50, 100].map(v => (
        <g key={v}>
          <line x1={PAD} y1={H - (v / 100) * (H - PAD) - 4} x2={W - PAD} y2={H - (v / 100) * (H - PAD) - 4}
            stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
          <text x={PAD - 4} y={H - (v / 100) * (H - PAD) - 1} textAnchor="end" fontSize={8} fill="#94a3b8" fontFamily="system-ui">{v}%</text>
        </g>
      ))}
      {/* Line */}
      <path d={pathD} fill="none" stroke="#000936" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {xs.map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={ys[i]} r={4} fill="#000936" />
          <circle cx={x} cy={ys[i]} r={2.5} fill="white" />
          <text x={x} y={H + 16} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="system-ui">{data[i].label}</text>
        </g>
      ))}
    </svg>
  )
}
