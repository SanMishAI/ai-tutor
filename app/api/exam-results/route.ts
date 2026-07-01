import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { upsertStreak } from "@/lib/streak"
import { getChildSession } from "@/lib/child-auth"

export async function GET(req: Request) {
  const child = await getChildSession(req)
  if (child) {
    const results = await db.examResult.findMany({
      where: { childId: child.childId },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(results)
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const results = await db.examResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(results)
}

export async function POST(req: Request) {
  const body = await req.json()

  const child = await getChildSession(req)
  if (child) {
    const result = await db.examResult.create({
      data: {
        userId: "child_" + child.childId,
        childId: child.childId,
        subject: body.subject,
        yearLevel: body.yearLevel,
        score: body.score,
        total: body.total,
        timeTaken: body.timeTaken ?? null,
        wrongAnswers: body.wrongAnswers,
      },
    })
    return NextResponse.json(result)
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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

  currentUser().then(u => {
    const name = u?.fullName ?? u?.username ?? u?.primaryEmailAddress?.emailAddress ?? "Learner"
    return upsertStreak(userId, name)
  }).catch(() => {})

  return NextResponse.json(result)
}
