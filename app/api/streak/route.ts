import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

const EMPTY = { currentStreak: 0, longestStreak: 0, lastActivityDate: null, freezesAvailable: 0, showOnLeaderboard: true }

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const streak = await db.userStreak.findUnique({ where: { userId } })
  return NextResponse.json(streak ?? { ...EMPTY, userId })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { showOnLeaderboard } = await req.json()

  const updated = await db.userStreak.upsert({
    where: { userId },
    create: { userId, displayName: "Learner", ...EMPTY, showOnLeaderboard },
    update: { showOnLeaderboard },
  })
  return NextResponse.json(updated)
}
