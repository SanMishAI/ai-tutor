import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

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
  return NextResponse.json(result)
}
