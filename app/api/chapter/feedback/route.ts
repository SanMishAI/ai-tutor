import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"
import { createRateLimiter, getIp } from "@/lib/ratelimit"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const checkRateLimit = createRateLimiter(20, 60, "chapter_feedback")

export async function POST(req: Request) {
  const ip = getIp(req)
  const limited = await checkRateLimit(ip)
  if (limited) return NextResponse.json({ error: "Too many requests" }, { status: 429 })

  const { question, studentAnswer, correctAnswer, explanation } = await req.json()

  const isCorrect = studentAnswer?.trim().toUpperCase() === correctAnswer?.trim().toUpperCase()

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{
      role: "user",
      content: `A student answered a practice question.

Question: ${question}
Correct answer: ${correctAnswer}
Student's answer: ${studentAnswer}
Result: ${isCorrect ? "CORRECT" : "INCORRECT"}
Explanation: ${explanation ?? ""}

Write 2-3 sentences of feedback:
- If correct: briefly confirm why it's right and reinforce the key concept
- If incorrect: Socratically guide them toward understanding (don't just say "the answer is X" — help them see WHY)
- Keep it encouraging and direct. Use LaTeX for any maths.`,
    }],
  })

  const feedback = msg.content[0].type === "text" ? msg.content[0].text : ""
  return NextResponse.json({ correct: isCorrect, feedback })
}
