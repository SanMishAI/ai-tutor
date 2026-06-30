import { auth, currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { upsertStreak } from "@/lib/streak"

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const result = await db.practiceResult.create({
    data: {
      userId,
      subject: body.subject,
      yearLevel: body.yearLevel,
      question: body.question,
      correct: body.correct,
    },
  })

  // Update streak — fire-and-forget, never fails the response
  currentUser().then(u => {
    const name = u?.fullName ?? u?.username ?? u?.primaryEmailAddress?.emailAddress ?? "Learner"
    return upsertStreak(userId, name)
  }).catch(() => {})

  return NextResponse.json(result)
}
