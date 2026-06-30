import Anthropic from '@anthropic-ai/sdk'
import type { ExamQuestion } from '../../../types'
import { createRateLimiter, getIp } from '@/lib/ratelimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const checkRateLimit = createRateLimiter(5, 600, "exam_grade") // 5 per 600 s

const MAX_QUESTIONS = 20
const MAX_TEXT_CHARS = 5_000

function stripSvg(text: string): string {
  return text.replace(/<svg[\s\S]*?<\/svg>/gi, "[diagram]")
}

function extractJson(text: string): unknown {
  try { return JSON.parse(text) } catch { /* continue */ }
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (block) { try { return JSON.parse(block[1]) } catch { /* continue */ } }
  const obj = text.match(/\{[\s\S]*\}/)
  if (obj) { try { return JSON.parse(obj[0]) } catch { /* continue */ } }
  throw new Error("Could not parse JSON from AI response")
}

export async function POST(request: Request) {
  if (!await checkRateLimit(getIp(request))) {
    return Response.json({ error: 'Too many requests. Please slow down.' }, { status: 429, headers: { "Retry-After": "600" } })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { subject, questions, answers } = body as Record<string, unknown>

  if (!Array.isArray(questions)) {
    return Response.json({ error: "questions must be an array" }, { status: 400 })
  }

  try {
    const safeQuestions = (questions as ExamQuestion[]).slice(0, MAX_QUESTIONS)
    const safeAnswers   = answers && typeof answers === "object" ? answers as Record<number, string> : {}

    const questionsWithAnswers = safeQuestions.map((q: ExamQuestion) => ({
      id: q.id,
      text: stripSvg(q.text).slice(0, MAX_TEXT_CHARS),
      type: q.type,
      options: q.options?.map((o: string) => stripSvg(o).slice(0, MAX_TEXT_CHARS)),
      studentAnswer: String(safeAnswers[q.id] ?? "No answer provided").slice(0, 500),
    }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `Grade these ${subject} exam answers. Return ONLY valid JSON, no other text:

{
  "results": [
    {
      "id": 1,
      "correct": true,
      "correctAnswer": "letter only for MC (e.g. B), or the correct value for open-ended. Use LaTeX for any maths.",
      "explanation": "1-2 sentences: state the correct answer/method and why the student was right or wrong. Use LaTeX for ALL maths."
    }
  ]
}

Rules:
- Student answers for MC are letter-only (A, B, C, D, E). Compare to the option with that letter.
- [diagram] marks where an SVG appeared — treat as a visual element.
- Use LaTeX ($...$) for ALL mathematical expressions.
- Be precise and confident. State arithmetic results directly (e.g. $3 \\times 4 = 12$) — do NOT narrate step-by-step counting or show tentative re-checking.
- Explanations must be concise: 1-2 sentences maximum.

Questions and student answers:
${JSON.stringify(questionsWithAnswers, null, 2)}`
      }]
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const parsed = extractJson(text) as { results: Array<{ id: number; correct: boolean; correctAnswer: string; explanation: string }> }

    const results = parsed.results.map(r => ({
      ...r,
      question: questions.find((q: ExamQuestion) => q.id === r.id),
    }))

    return Response.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Exam grade error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
