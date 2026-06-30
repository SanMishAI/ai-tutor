import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { upsertStreak } from "@/lib/streak"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const results = await db.examResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(results)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const result = await db.examResult.create({
    data: {
      userId,
      subject: body.subject,
      yearLevel: body.yearLevel,
      score: body.score,
      total: body.total,
      timeTaken: body.timeTaken ?? null,
      wrongAnswers: body.wrongAnswers,
    },
  })

  // Update streak — fire-and-forget, never fails the response
  currentUser().then(u => {
    const name = u?.fullName ?? u?.username ?? u?.primaryEmailAddress?.emailAddress ?? "Learner"
    return upsertStreak(userId, name)
  }).catch(() => {})

  return NextResponse.json(result)
}
