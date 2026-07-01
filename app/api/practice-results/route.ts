import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { upsertStreak } from "@/lib/streak"
import { getChildSession } from "@/lib/child-auth"

export async function POST(req: Request) {
  const body = await req.json()

  const child = await getChildSession(req)
  if (child) {
    const result = await db.practiceResult.create({
      data: {
        userId: "child_" + child.childId,
        childId: child.childId,
        subject: body.subject,
        yearLevel: body.yearLevel,
        question: body.question ?? "",
        correct: body.correct,
      },
    })
    return NextResponse.json(result)
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const result = await db.practiceResult.create({
    data: {
      userId,
      subject: body.subject,
      yearLevel: body.yearLevel,
      question: body.question ?? "",
      correct: body.correct,
    },
  })

  currentUser().then(u => {
    const name = u?.fullName ?? u?.username ?? u?.primaryEmailAddress?.emailAddress ?? "Learner"
    return upsertStreak(userId, name)
  }).catch(() => {})

  return NextResponse.json(result)
}
