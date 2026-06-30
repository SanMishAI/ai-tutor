import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

const FREE_CHILD_LIMIT = 1
const PREMIUM_CHILD_LIMIT = 5

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const profiles = await db.childProfile.findMany({
    where: { parentId: userId },
    select: { id: true, name: true, avatarEmoji: true, dailyLimit: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(profiles)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, pin, avatarEmoji, dailyLimit } = await req.json()
  if (!name || !pin || pin.length < 4)
    return NextResponse.json({ error: "Name and a 4+ digit PIN are required." }, { status: 400 })

  const sub = await db.subscription.findUnique({ where: { parentId: userId } })
  const isPremium = sub?.status === "active"
  const limit = isPremium ? PREMIUM_CHILD_LIMIT : FREE_CHILD_LIMIT
  const existing = await db.childProfile.count({ where: { parentId: userId } })
  if (existing >= limit)
    return NextResponse.json({
      error: isPremium
        ? `Premium accounts can have up to ${limit} child profiles.`
        : "Free accounts support 1 child profile. Upgrade to Premium for up to 5.",
      upgradeRequired: !isPremium,
    }, { status: 403 })

  const pinHash = await bcrypt.hash(pin, 10)
  const profile = await db.childProfile.create({
    data: { parentId: userId, name: name.trim(), pinHash, avatarEmoji: avatarEmoji ?? "🧑‍🎓", dailyLimit: dailyLimit ?? null },
    select: { id: true, name: true, avatarEmoji: true, dailyLimit: true, createdAt: true },
  })
  return NextResponse.json(profile)
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, dailyLimit, name, avatarEmoji } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const profile = await db.childProfile.findFirst({ where: { id, parentId: userId } })
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await db.childProfile.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(avatarEmoji !== undefined && { avatarEmoji }),
      ...(dailyLimit !== undefined && { dailyLimit }),
    },
    select: { id: true, name: true, avatarEmoji: true, dailyLimit: true },
  })
  return NextResponse.json(updated)
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  const profile = await db.childProfile.findFirst({ where: { id, parentId: userId } })
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await db.childProfile.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
