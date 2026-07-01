import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { createRateLimiter, getIp } from "@/lib/ratelimit"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const checkRateLimit = createRateLimiter(15, 60, "chapter_practice")

function extractJson(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  try { return JSON.parse(match?.[1] ?? text) } catch { return null }
}

export async function POST(req: Request) {
  const ip = getIp(req)
  const limited = await checkRateLimit(ip)
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const { exam, yearLevel, chapter, questionIndex = 0, askedQuestions = [] } = await req.json()
  if (!exam || !chapter) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const avoidNote = askedQuestions.length > 0
    ? `Avoid repeating these topics already covered: ${askedQuestions.join(", ")}.`
    : ""

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Generate practice question #${questionIndex + 1} on "${chapter}" for ${exam} at ${yearLevel || "appropriate"} level.

${avoidNote}

The question should be at ${questionIndex === 0 ? "moderate" : questionIndex >= 3 ? "challenging" : "moderate-to-hard"} difficulty.

Return ONLY valid JSON:
{
  "question": "Question text here (LaTeX for maths, SVG for diagrams with single quotes)",
  "type": "multiple_choice",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "answer": "A",
  "explanation": "Brief explanation of why A is correct and why other options are wrong"
}

Use LaTeX for all maths. Include an SVG diagram (single quotes) if the question involves geometry or graphs.`,
    }],
  })

  const raw = msg.content[0].type === "text" ? msg.content[0].text : ""
  const data = extractJson(raw)
  if (!data?.question) return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  return NextResponse.json(data)
}
