export type Level = {
  name: string
  emoji: string
  min: number
  color: string
}

export const LEVELS: Level[] = [
  { name: "Starter",   emoji: "⭐",  min: 0,    color: "#94a3b8" },
  { name: "Scholar",   emoji: "📚",  min: 200,  color: "#3b82f6" },
  { name: "Explorer",  emoji: "🧭",  min: 500,  color: "#8b5cf6" },
  { name: "Expert",    emoji: "🎯",  min: 1000, color: "#f59e0b" },
  { name: "Champion",  emoji: "🏆",  min: 2000, color: "#E34C00" },
  { name: "Legend",    emoji: "👑",  min: 4000, color: "#FDC800" },
]

export function getLevel(points: number): Level & { next: Level | null; progressToNext: number } {
  let current = LEVELS[0]
  for (const l of LEVELS) {
    if (points >= l.min) current = l
  }
  const idx = LEVELS.indexOf(current)
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null
  const progressToNext = next
    ? Math.round(((points - current.min) / (next.min - current.min)) * 100)
    : 100
  return { ...current, next, progressToNext }
}

// Chapter index is 0-based; later chapters are worth more
export function chapterPoints(chapterIndex: number, testScore: number, testTotal: number): number {
  const base = (chapterIndex + 1) * 100
  const pct = testTotal > 0 ? testScore / testTotal : 0
  const bonus = pct === 1 ? 50 : pct >= 0.9 ? 25 : 0
  return base + bonus
}

export function totalPoints(
  chapters: string[],
  progressMap: Record<string, { completed: boolean; testScore?: number | null; testTotal?: number | null }>
): number {
  return chapters.reduce((sum, ch, i) => {
    const p = progressMap[ch]
    if (!p?.completed || p.testScore == null || !p.testTotal) return sum
    return sum + chapterPoints(i, p.testScore, p.testTotal)
  }, 0)
}
