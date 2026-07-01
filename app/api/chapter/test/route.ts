import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { createRateLimiter, getIp } from "@/lib/ratelimit"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const checkRateLimit = createRateLimiter(5, 60, "chapter_test")

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
      content: `Create a 5-question end-of-chapter test on "${chapter}" for ${exam} at ${yearLevel || "appropriate"} level.

This is a TEST — no hints or explanations yet. Questions should:
- Test genuine understanding of "${chapter}", not just memorisation
- Match the difficulty and style of real ${exam} questions
- Range from straightforward (Q1-2) to challenging (Q4-5)
- Use LaTeX for all maths. SVG diagrams (single quotes) for geometry/graphs.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "text": "Question text",
      "type": "multiple_choice",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "B",
      "explanation": "Why B is correct and the others are wrong"
    }
  ]
}`,
    }],
  })

  const raw = msg.content[0].type === "text" ? msg.content[0].text : ""
  const data = extractJson(raw)
  if (!data?.questions) return NextResponse.json({ error: "Generation failed" }, { status: 500 })

  // Strip answers before sending to client — graded client-side against this
  const clientQuestions = data.questions.map(({ answer: _a, explanation: _e, ...q }: { id: number; text: string; type: string; options: string[]; answer: string; explanation: string }) => q)
  return NextResponse.json({ questions: clientQuestions, _answers: data.questions.map((q: { answer: string; explanation: string }) => ({ answer: q.answer, explanation: q.explanation })) })
}
