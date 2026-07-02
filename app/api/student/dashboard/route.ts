import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.CHILD_JWT_SECRET ?? "fallback-secret")

export async function GET(req: Request) {
  const token = req.headers.get("x-child-token")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let childId: string
  try {
    const { payload } = await jwtVerify(token, secret)
    childId = String(payload.childId)
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const progress = await db.chapterProgress.findMany({
    where: { childId },
    orderBy: { updatedAt: "desc" },
  })

  const completed = progress.filter(p => p.completed)
  const totalScore = completed.reduce((sum, p) => sum + (p.testScore ?? 0), 0)
  const totalPossible = completed.reduce((sum, p) => sum + (p.testTotal ?? 0), 0)

  // Group by exam
  const byExam: Record<string, { total: number; completed: number }> = {}
  for (const p of progress) {
    if (!byExam[p.exam]) byExam[p.exam] = { total: 0, completed: 0 }
    byExam[p.exam].total++
    if (p.completed) byExam[p.exam].completed++
  }

  return NextResponse.json({
    completedChapters: completed.length,
    totalChapters: progress.length,
    totalScore,
    totalPossible,
    byExam,
    recent: progress.slice(0, 6).map(p => ({
      exam: p.exam,
      chapter: p.chapter,
      completed: p.completed,
      testScore: p.testScore,
      testTotal: p.testTotal,
      updatedAt: p.updatedAt,
    })),
  })
}
