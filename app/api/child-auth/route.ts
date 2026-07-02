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
// Accepts either {childId, pin} (legacy) or {name, pin, parentId} (student self-login)
export async function POST(req: Request) {
  const body = await req.json()
  const { childId, pin, name, parentId } = body as Record<string, string>
  if (!pin) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  type Profile = Awaited<ReturnType<typeof db.childProfile.findUnique>>
  let profile: Profile | null = null
  let pinVerified = false

  if (childId) {
    profile = await db.childProfile.findUnique({ where: { id: childId } })
  } else if (name && parentId) {
    const matches = await db.childProfile.findMany({
      where: { parentId, name: { equals: name.trim(), mode: "insensitive" } },
    })
    if (matches.length === 0) return NextResponse.json({ error: "No student profile found with that name. Ask a parent to check your details." }, { status: 404 })
    profile = matches[0]
  } else if (name) {
    // No parentId on device — search globally, verify PIN against each match
    const matches = await db.childProfile.findMany({
      where: { name: { equals: name.trim(), mode: "insensitive" } },
      take: 10,
    })
    if (matches.length === 0) return NextResponse.json({ error: "No student profile found with that name." }, { status: 404 })
    for (const m of matches) {
      if (await bcrypt.compare(String(pin), m.pinHash)) { profile = m; pinVerified = true; break }
    }
    if (!profile) return NextResponse.json({ error: "Incorrect PIN. Please try again." }, { status: 401 })
  } else {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 })

  if (!pinVerified) {
    const valid = await bcrypt.compare(String(pin), profile.pinHash)
    if (!valid) return NextResponse.json({ error: "Incorrect PIN. Please try again." }, { status: 401 })
  }

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
