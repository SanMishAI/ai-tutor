import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isFounderUser } from "@/lib/founder"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ status: "none", isPremium: false, isFounder: false })

  if (await isFounderUser()) {
    return NextResponse.json({ status: "founder", isPremium: true, isFounder: true, trialDaysLeft: null, trialEndsAt: null })
  }

  const sub = await db.subscription.findUnique({ where: { parentId: userId } })
  const isPremium = sub?.status === "active" || sub?.status === "trialing"

  let trialDaysLeft: number | null = null
  let trialEndsAt: string | null = null
  let cancelBy: string | null = null

  if (sub?.status === "trialing" && sub.currentPeriodEnd) {
    const end = new Date(sub.currentPeriodEnd)
    const msLeft = end.getTime() - Date.now()
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / 86400000))
    trialEndsAt = end.toISOString()
    // Cancel 24h before trial end to avoid charge
    cancelBy = new Date(end.getTime() - 86400000).toISOString()
  }

  return NextResponse.json({
    status: sub?.status ?? "none",
    isPremium,
    isFounder: false,
    trialDaysLeft,
    trialEndsAt,
    cancelBy,
    currentPeriodEnd: sub?.currentPeriodEnd,
  })
}
