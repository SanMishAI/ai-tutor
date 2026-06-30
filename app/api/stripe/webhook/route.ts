import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key || key.includes("REPLACE")) throw new Error("Stripe not configured")
  return new Stripe(key, { apiVersion: "2026-06-24.dahlia" })
}

function stripeStatusToDb(status: string): string {
  if (status === "active") return "active"
  if (status === "trialing") return "trialing"
  if (status === "canceled") return "canceled"
  if (status === "past_due") return "past_due"
  return status
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET ?? "")
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const getParentId = (obj: { metadata?: Stripe.Metadata | null }) =>
    obj.metadata?.parentId as string | undefined

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const parentId = getParentId(session)
      if (!parentId || !session.subscription) break
      // Fetch the actual subscription to get trial_end
      const stripe = getStripe()
      const stripeSub = await stripe.subscriptions.retrieve(session.subscription as string)
      const trialEnd = stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null
      await db.subscription.upsert({
        where: { parentId },
        create: {
          parentId,
          stripeCustomerId: session.customer as string,
          stripeSubId: session.subscription as string,
          status: stripeStatusToDb(stripeSub.status),
          currentPeriodEnd: trialEnd ?? new Date((stripeSub as unknown as { current_period_end: number }).current_period_end * 1000),
        },
        update: {
          stripeSubId: session.subscription as string,
          status: stripeStatusToDb(stripeSub.status),
          currentPeriodEnd: trialEnd ?? new Date((stripeSub as unknown as { current_period_end: number }).current_period_end * 1000),
        },
      })
      break
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const parentId = getParentId(sub)
      if (!parentId) break
      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null
      await db.subscription.updateMany({
        where: { parentId },
        data: {
          status: stripeStatusToDb(sub.status),
          currentPeriodEnd: trialEnd ?? new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
        },
      })
      break
    }

    case "customer.subscription.trial_will_end": {
      // Fires 3 days before trial ends — we just ensure status is still trialing
      const sub = event.data.object as Stripe.Subscription
      const parentId = getParentId(sub)
      if (!parentId) break
      await db.subscription.updateMany({
        where: { parentId },
        data: { status: "trialing" },
      })
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      await db.subscription.updateMany({
        where: { stripeCustomerId: customerId },
        data: { status: "past_due" },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}
