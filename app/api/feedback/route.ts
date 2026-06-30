import { db } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    const { mood, message } = await request.json()

    if (!mood) return Response.json({ error: 'Mood is required' }, { status: 400 })

    await db.feedback.create({
      data: {
        userId: userId ?? undefined,
        mood,
        message: message?.trim() || undefined,
      },
    })

    return Response.json({ ok: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('Feedback error:', msg)
    return Response.json({ error: msg }, { status: 500 })
  }
}
