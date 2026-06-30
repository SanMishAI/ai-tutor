import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes("REPLACE")) throw new Error("Stripe not configured")
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" })
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let stripe: Stripe
  try { stripe = getStripe() } catch {
    return NextResponse.json({ error: "Payments not yet configured." }, { status: 503 })
  }

  const sub = await db.subscription.findUnique({ where: { parentId: userId } })
  if (!sub?.stripeCustomerId) return NextResponse.json({ error: "No subscription found" }, { status: 404 })

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://selected-ed.vercel.app"
  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/parent`,
  })

  return NextResponse.json({ url: session.url })
}
