import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getChildSession } from "@/lib/child-auth"

async function resolveUserId(req: Request): Promise<{ userId: string; childId: string | null } | null> {
  const child = await getChildSession(req)
  if (child) return { userId: "child_" + child.childId, childId: child.childId }
  const { userId } = await auth()
  if (!userId) return null
  return { userId, childId: null }
}

export async function GET(req: Request) {
  const session = await resolveUserId(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const exam = searchParams.get("exam")
  if (!exam) return NextResponse.json({ error: "exam required" }, { status: 400 })

  const rows = await db.chapterProgress.findMany({
    where: { userId: session.userId, exam },
  })
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const session = await resolveUserId(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { exam, chapter, phase, completed, testScore, testTotal } = await req.json()
  if (!exam || !chapter) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const row = await db.chapterProgress.upsert({
    where: { userId_exam_chapter: { userId: session.userId, exam, chapter } },
    create: { userId: session.userId, childId: session.childId, exam, chapter, phase: phase ?? 1, completed: completed ?? false, testScore: testScore ?? null, testTotal: testTotal ?? null },
    update: {
      phase: phase ?? undefined,
      completed: completed ?? undefined,
      testScore: testScore ?? undefined,
      testTotal: testTotal ?? undefined,
    },
  })
  return NextResponse.json(row)
}
