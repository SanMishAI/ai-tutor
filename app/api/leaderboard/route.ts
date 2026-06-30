import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const leaders = await db.userStreak.findMany({
    where: { showOnLeaderboard: true, currentStreak: { gt: 0 } },
    orderBy: [{ currentStreak: "desc" }, { longestStreak: "desc" }],
    take: 20,
    select: {
      userId: true,
      displayName: true,
      currentStreak: true,
      longestStreak: true,
      freezesAvailable: true,
    },
  })
  return NextResponse.json({ leaders })
}
