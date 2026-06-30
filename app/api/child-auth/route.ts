import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { SignJWT } from "jose"

const secret = new TextEncoder().encode(process.env.CHILD_JWT_SECRET ?? "fallback-secret")

// GET — list profiles for a parent (by parentId query param, public name+emoji only)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parentId = searchParams.get("parentId")
  if (!parentId) return NextResponse.json({ error: "parentId required" }, { status: 400 })

  const profiles = await db.childProfile.findMany({
    where: { parentId },
    select: { id: true, name: true, avatarEmoji: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json(profiles)
}

// POST — verify PIN and issue child session JWT
export async function POST(req: Request) {
  const { childId, pin } = await req.json()
  if (!childId || !pin) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const profile = await db.childProfile.findUnique({ where: { id: childId } })
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  const valid = await bcrypt.compare(String(pin), profile.pinHash)
  if (!valid) return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 })

  const token = await new SignJWT({
    childId: profile.id,
    parentId: profile.parentId,
    name: profile.name,
    avatarEmoji: profile.avatarEmoji,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret)

  return NextResponse.json({
    token,
    child: { id: profile.id, name: profile.name, avatarEmoji: profile.avatarEmoji },
  })
}
