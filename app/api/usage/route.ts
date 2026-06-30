import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.CHILD_JWT_SECRET ?? "fallback-secret")
const TRIAL_DAILY_LIMIT = 5   // preview limit for non-trial, non-premium (guests who somehow reach app)

function today() {
  return new Date().toISOString().slice(0, 10)
}

async function getChildId(req: Request): Promise<string | null> {
  const auth = req.headers.get("x-child-token")
  if (!auth) return null
  try {
    const { payload } = await jwtVerify(auth, secret)
    return payload.childId as string
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  const childId = await getChildId(req)
  if (!childId) return NextResponse.json({ error: "No child session" }, { status: 401 })

  const profile = await db.childProfile.findUnique({ where: { id: childId } })
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const sub = await db.subscription.findUnique({ where: { parentId: profile.parentId } })
  const isPremium = sub?.status === "active" || sub?.status === "trialing" || sub?.status === "founder"

  const usage = await db.dailyUsage.findUnique({ where: { childId_date: { childId, date: today() } } })
  const count = usage?.count ?? 0
  const limit = isPremium ? (profile.dailyLimit ?? null) : TRIAL_DAILY_LIMIT

  return NextResponse.json({ count, limit, isPremium })
}

export async function POST(req: Request) {
  const childId = await getChildId(req)
  if (!childId) return NextResponse.json({ error: "No child session" }, { status: 401 })

  const profile = await db.childProfile.findUnique({ where: { id: childId } })
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const sub = await db.subscription.findUnique({ where: { parentId: profile.parentId } })
  const isPremium = sub?.status === "active" || sub?.status === "trialing" || sub?.status === "founder"
  const limit = isPremium ? (profile.dailyLimit ?? null) : TRIAL_DAILY_LIMIT

  const d = today()
  const usage = await db.dailyUsage.upsert({
    where: { childId_date: { childId, date: d } },
    create: { childId, date: d, count: 1 },
    update: { count: { increment: 1 } },
  })

  const exceeded = limit !== null && usage.count > limit
  return NextResponse.json({ ok: true, count: usage.count, limit, exceeded, isPremium })
}
