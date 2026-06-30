import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const conversations = await db.conversation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(conversations)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const conversation = await db.conversation.upsert({
    where: { id: body.id },
    update: {
      title: body.title,
      messages: body.messages,
      updatedAt: new Date(),
    },
    create: {
      id: body.id,
      userId,
      title: body.title,
      subject: body.subject,
      yearLevel: body.yearLevel,
      mode: body.mode,
      messages: body.messages,
    },
  })
  return NextResponse.json(conversation)
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  await db.conversation.deleteMany({ where: { id, userId } })
  return NextResponse.json({ ok: true })
}
