import Anthropic from '@anthropic-ai/sdk'
import { createRateLimiter, getIp } from '@/lib/ratelimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const checkRateLimit = createRateLimiter(10, 60_000) // 10 per minute

const CATEGORY_PROMPTS: Record<string, string> = {
  animals:     "amazing animals and nature — weird adaptations, record-holders, surprising facts about pets and wild creatures",
  space:       "outer space and astronomy — planets, astronauts, black holes, cool space missions, mind-blowing distances",
  sports:      "sports and games — world records, surprising rules, fun facts about famous athletes and competitions",
  popculture:  "movies, music, and popular culture kids love — animated films, video games, famous characters, chart-topping songs",
  records:     "world records and extreme facts — tallest, fastest, biggest, smallest, most surprising Guinness records",
  random:      "a fun mix of surprising topics — history, food, inventions, geography, animals, and weird science",
}

function extractJson(text: string): unknown {
  try { return JSON.parse(text) } catch { /* continue */ }
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (block) { try { return JSON.parse(block[1]) } catch { /* continue */ } }
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) { try { return JSON.parse(obj[0]) } catch { /* continue */ } }
  throw new Error("Could not parse trivia JSON")
}

export async function POST(request: Request) {
  if (!checkRateLimit(getIp(request))) {
    return Response.json({ error: 'Too many requests.' }, { status: 429 })
  }

  try {
    const { category } = await request.json()
    const topic = CATEGORY_PROMPTS[category as string] ?? CATEGORY_PROMPTS.random

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `Generate exactly 5 fun trivia questions about: ${topic}

Target audience: Australian school students aged 8–16 taking a short study break.
Questions should be surprising, delightful, and totally different from exam content.
Keep language simple, upbeat, and engaging. Avoid anything scary or upsetting.

Return ONLY valid JSON, no other text:
{
  "questions": [
    {
      "question": "the question text",
      "options": ["A. option", "B. option", "C. option", "D. option"],
      "answer": "A",
      "funFact": "A short surprising follow-up fact that makes the answer even more interesting (1–2 sentences)."
    }
  ]
}`,
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const parsed = extractJson(text) as { questions: unknown[] }
    return Response.json({ questions: parsed.questions })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Trivia error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
