import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2026-06-24.dahlia" })

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get or create Stripe customer
  let sub = await db.subscription.findUnique({ where: { parentId: userId } })
  let customerId = sub?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { parentId: userId } })
    customerId = customer.id
    sub = await db.subscription.upsert({
      where: { parentId: userId },
      create: { parentId: userId, stripeCustomerId: customerId, status: "free" },
      update: { stripeCustomerId: customerId },
    })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://selected-ed.vercel.app"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    // Apple Pay and Google Pay are enabled automatically in Stripe Checkout
    // when the customer's device/browser supports them
    payment_method_types: ["card"],
    payment_method_options: {
      card: { request_three_d_secure: "automatic" },
    },
    success_url: `${origin}/parent?upgraded=1`,
    cancel_url: `${origin}/parent`,
    metadata: { parentId: userId },
    subscription_data: { metadata: { parentId: userId } },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  })

  return NextResponse.json({ url: session.url })
}
