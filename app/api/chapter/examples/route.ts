import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { createRateLimiter, getIp } from "@/lib/ratelimit"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const checkRateLimit = createRateLimiter(10, 60, "chapter_examples")

function extractJson(text: string) {
  const match = text.match(/```json\s*([\s\S]*?)```/) ?? text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  try { return JSON.parse(match?.[1] ?? text) } catch { return null }
}

export async function POST(req: Request) {
  const ip = getIp(req)
  const limited = await checkRateLimit(ip)
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const { exam, yearLevel, chapter } = await req.json()
  if (!exam || !chapter) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Generate 3 fully worked examples for the topic "${chapter}" in ${exam} at ${yearLevel || "appropriate"} level.

Examples must:
- Progress from easier (Example 1) to harder (Example 3)
- Show complete step-by-step working, not just the final answer
- Represent the style and difficulty of actual ${exam} questions
- Use LaTeX for all maths (inline $x$ or display $$formula$$)
- Include SVG diagrams (single quotes in attributes) where geometry or graphs are involved

Return ONLY valid JSON (no markdown wrapper):
{
  "examples": [
    {
      "title": "Example 1 — [short topic description]",
      "problem": "Full problem statement here",
      "solution": "Step 1: ...\nStep 2: ...\n**Answer:** ..."
    },
    ...
  ]
}`,
    }],
  })

  const raw = msg.content[0].type === "text" ? msg.content[0].text : ""
  const data = extractJson(raw)
  if (!data?.examples) return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  return NextResponse.json(data)
}
