import { createRateLimiter, getIp } from "@/lib/ratelimit"

const checkRateLimit = createRateLimiter(60, 60, "tts")

const OPENAI_TTS_URL = "https://api.openai.com/v1/audio/speech"

export async function POST(req: Request) {
  if (!await checkRateLimit(getIp(req))) {
    return Response.json({ error: "Too many requests" }, { status: 429 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "TTS not configured" }, { status: 503 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { text } = body as { text?: string }
  if (!text?.trim()) return Response.json({ error: "text required" }, { status: 400 })

  const res = await fetch(OPENAI_TTS_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: "nova",      // warm, clear, great for teaching
      input: text.slice(0, 4096),
      speed: 0.88,        // comfortable learning pace
      response_format: "mp3",
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return Response.json({ error: `OpenAI TTS error: ${res.status}`, detail }, { status: 502 })
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  })
}
