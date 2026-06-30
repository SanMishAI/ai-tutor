import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET() {
  const testimonials = await db.testimonial.findMany({
    where: { approved: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, location: true, quote: true, rating: true },
  })
  return NextResponse.json(testimonials)
}

export async function POST(req: Request) {
  const { name, location, quote, rating } = await req.json()
  if (!name?.trim() || !quote?.trim() || quote.trim().length < 20)
    return NextResponse.json({ error: "Name and a quote of at least 20 characters are required." }, { status: 400 })
  if (rating < 1 || rating > 5)
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 })

  await db.testimonial.create({
    data: {
      name: name.trim(),
      location: location?.trim() || null,
      quote: quote.trim(),
      rating: Number(rating),
      approved: false,
    },
  })
  return NextResponse.json({ ok: true })
}
