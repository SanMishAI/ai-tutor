type Bar = { label: string; count: number }

export default function BarChart({ data, color = "#000936" }: { data: Bar[]; color?: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 280; const H = 100; const BAR_W = 28; const GAP = 12
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} width="100%" style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const barH = Math.max((d.count / max) * H, d.count > 0 ? 4 : 0)
        const x = i * (BAR_W + GAP)
        return (
          <g key={i}>
            <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={4} fill={color} opacity={d.count === 0 ? 0.12 : 0.85} />
            {d.count > 0 && (
              <text x={x + BAR_W / 2} y={H - barH - 4} textAnchor="middle" fontSize={10} fontFamily="system-ui" fill={color} fontWeight="600">{d.count}</text>
            )}
            <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fontSize={10} fontFamily="system-ui" fill="#94a3b8">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
