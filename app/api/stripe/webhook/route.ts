import { NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: "2026-06-24.dahlia" })

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature") ?? ""

  let event: Stripe.Event
  try {
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
      if (parentId && session.subscription) {
        await db.subscription.upsert({
          where: { parentId },
          create: { parentId, stripeCustomerId: session.customer as string, stripeSubId: session.subscription as string, status: "active" },
          update: { stripeSubId: session.subscription as string, status: "active" },
        })
      }
      break
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const parentId = getParentId(sub)
      if (parentId) {
        await db.subscription.updateMany({
          where: { parentId },
          data: {
            status: sub.status === "active" ? "active" : sub.status === "canceled" ? "canceled" : "past_due",
            currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
          },
        })
      }
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
