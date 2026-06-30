import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.startsWith("sk_live_REPLACE") || key.startsWith("sk_test_REPLACE"))
    throw new Error("Stripe not configured")
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" })
}

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let stripe: Stripe
  try { stripe = getStripe() } catch {
    return NextResponse.json({ error: "Payments not yet configured. Please try again soon." }, { status: 503 })
  }

  let sub = await db.subscription.findUnique({ where: { parentId: userId } })
  let customerId = sub?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { parentId: userId } })
    customerId = customer.id
    await db.subscription.upsert({
      where: { parentId: userId },
      create: { parentId: userId, stripeCustomerId: customerId, status: "none" },
      update: { stripeCustomerId: customerId },
    })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "https://selected-ed.vercel.app"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    payment_method_types: ["card"],
    // Collect payment method upfront — required for auto-charge after trial
    payment_method_collection: "always",
    success_url: `${origin}/parent?upgraded=1`,
    cancel_url: `${origin}/parent`,
    metadata: { parentId: userId },
    subscription_data: {
      trial_period_days: 7,
      metadata: { parentId: userId },
      trial_settings: {
        end_behavior: {
          // Cancel subscription if no payment method collected — belt + suspenders
          missing_payment_method: "cancel",
        },
      },
    },
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    // Custom messaging shown on Stripe Checkout
    custom_text: {
      submit: {
        message: "You won't be charged today. Your 7-day free trial starts now — cancel any time before day 7 ends to avoid the $9.99/month charge.",
      },
    },
    consent_collection: {
      terms_of_service: "none",
    },
  })

  return NextResponse.json({ url: session.url })
}
