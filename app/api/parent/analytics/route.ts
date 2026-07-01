import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const children = await db.childProfile.findMany({
    where: { parentId: userId },
    select: { id: true, name: true, avatarEmoji: true },
  })

  const childIds = children.map(c => c.id)

  // Last 7 days labels
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })

  // DailyUsage per child for last 7 days
  const usageRows = await db.dailyUsage.findMany({
    where: { childId: { in: childIds }, date: { in: days } },
  })

  // ExamResults per child (last 20)
  const examResults = await db.examResult.findMany({
    where: { childId: { in: childIds } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { childId: true, subject: true, score: true, total: true, timeTaken: true, wrongAnswers: true, createdAt: true, id: true },
  })

  // PracticeResults per child for accuracy stats
  const practiceResults = await db.practiceResult.findMany({
    where: { childId: { in: childIds } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { childId: true, subject: true, correct: true, createdAt: true },
  })

  const analytics = children.map(child => {
    // Daily usage chart data
    const dailyUsage = days.map(date => ({
      date,
      label: new Date(date + "T00:00:00").toLocaleDateString("en-AU", { weekday: "short" }),
      count: usageRows.find(r => r.childId === child.id && r.date === date)?.count ?? 0,
    }))

    const totalQuestionsAllTime = usageRows
      .filter(r => r.childId === child.id)
      .reduce((sum, r) => sum + r.count, 0)

    const todayUsage = usageRows.find(r => r.childId === child.id && r.date === today.toISOString().slice(0, 10))?.count ?? 0

    // Exam score history
    const childExams = examResults
      .filter(r => r.childId === child.id)
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        subject: r.subject,
        score: r.score,
        total: r.total,
        pct: Math.round((r.score / r.total) * 100),
        timeTaken: r.timeTaken,
        wrongAnswers: r.wrongAnswers,
        createdAt: r.createdAt,
      }))

    // Practice accuracy by subject
    const childPractice = practiceResults.filter(r => r.childId === child.id)
    const subjectMap: Record<string, { correct: number; total: number }> = {}
    for (const r of childPractice) {
      if (!subjectMap[r.subject]) subjectMap[r.subject] = { correct: 0, total: 0 }
      subjectMap[r.subject].total++
      if (r.correct) subjectMap[r.subject].correct++
    }
    const practiceBySubject = Object.entries(subjectMap).map(([subject, { correct, total }]) => ({
      subject,
      correct,
      total,
      pct: Math.round((correct / total) * 100),
    })).sort((a, b) => b.total - a.total)

    const overallAccuracy = childPractice.length > 0
      ? Math.round((childPractice.filter(r => r.correct).length / childPractice.length) * 100)
      : null

    return {
      child,
      dailyUsage,
      todayUsage,
      totalQuestionsAllTime,
      exams: childExams,
      practiceBySubject,
      overallAccuracy,
      totalPracticeQuestions: childPractice.length,
      totalExams: childExams.length,
    }
  })

  return NextResponse.json({ analytics, days })
}
