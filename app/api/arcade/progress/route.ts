import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { upsertStreak } from "@/lib/streak"

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ progress: {}, totalXP: 0 })

  const { searchParams } = new URL(req.url)
  const exam = searchParams.get("exam")
  if (!exam) return NextResponse.json({ error: "Missing exam" }, { status: 400 })

  const [examRecords, allRecords] = await Promise.all([
    db.arcadeProgress.findMany({ where: { userId, exam } }),
    db.arcadeProgress.findMany({ where: { userId }, select: { xp: true } }),
  ])

  // Format: chapter → stage → { stars, xp }
  const progress: Record<string, Record<number, { stars: number; xp: number }>> = {}
  for (const r of examRecords) {
    if (!progress[r.chapter]) progress[r.chapter] = {}
    progress[r.chapter][r.stage] = { stars: r.stars, xp: r.xp }
  }

  const totalXP = allRecords.reduce((s, r) => s + r.xp, 0)
  return NextResponse.json({ progress, totalXP })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { exam, chapter, stage, stars, xp } = await req.json()
  if (!exam || !chapter || !stage) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const existing = await db.arcadeProgress.findUnique({
    where: { userId_exam_chapter_stage: { userId, exam, chapter, stage } },
  })

  // Only update if this attempt is better or equal
  if (!existing || stars >= existing.stars) {
    await db.arcadeProgress.upsert({
      where: { userId_exam_chapter_stage: { userId, exam, chapter, stage } },
      create: { userId, exam, chapter, stage, stars: stars ?? 0, xp: xp ?? 0 },
      update: { stars: stars ?? 0, xp: xp ?? 0 },
    })
  }

  // Update streak — fire-and-forget
  currentUser().then(u => {
    const name = u?.fullName ?? u?.username ?? u?.primaryEmailAddress?.emailAddress ?? "Learner"
    return upsertStreak(userId, name)
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
