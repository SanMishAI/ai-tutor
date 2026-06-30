import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ status: "free", isPremium: false })

  const sub = await db.subscription.findUnique({ where: { parentId: userId } })
  const isPremium = sub?.status === "active"
  return NextResponse.json({ status: sub?.status ?? "free", isPremium, currentPeriodEnd: sub?.currentPeriodEnd })
}
