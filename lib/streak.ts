import { db } from "@/lib/db"

export type StreakState = {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  freezesAvailable: number
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000)
}

export function computeNextStreak(
  state: StreakState,
  today: string = todayUTC()
): StreakState {
  const { currentStreak, longestStreak, lastActivityDate, freezesAvailable } = state

  if (!lastActivityDate) {
    return { currentStreak: 1, longestStreak: Math.max(1, longestStreak), lastActivityDate: today, freezesAvailable }
  }

  if (lastActivityDate >= today) return state // already recorded today

  const gap = daysBetween(lastActivityDate, today)

  if (gap === 1) {
    const next = currentStreak + 1
    const earnedFreeze = next % 30 === 0 ? 1 : 0
    return {
      currentStreak: next,
      longestStreak: Math.max(next, longestStreak),
      lastActivityDate: today,
      freezesAvailable: Math.min(2, freezesAvailable + earnedFreeze),
    }
  }

  if (gap === 2 && freezesAvailable > 0) {
    // Missed exactly one day — auto-use a freeze
    const next = currentStreak + 1
    const earnedFreeze = next % 30 === 0 ? 1 : 0
    return {
      currentStreak: next,
      longestStreak: Math.max(next, longestStreak),
      lastActivityDate: today,
      freezesAvailable: Math.min(2, freezesAvailable - 1 + earnedFreeze),
    }
  }

  // Streak broken
  return { currentStreak: 1, longestStreak, lastActivityDate: today, freezesAvailable }
}

export async function upsertStreak(userId: string, displayName: string): Promise<void> {
  const existing = await db.userStreak.findUnique({ where: { userId } })

  const state: StreakState = existing
    ? {
        currentStreak: existing.currentStreak,
        longestStreak: existing.longestStreak,
        lastActivityDate: existing.lastActivityDate,
        freezesAvailable: existing.freezesAvailable,
      }
    : { currentStreak: 0, longestStreak: 0, lastActivityDate: null, freezesAvailable: 0 }

  const next = computeNextStreak(state)

  await db.userStreak.upsert({
    where: { userId },
    create: { userId, displayName, ...next },
    update: { displayName, ...next },
  })
}
