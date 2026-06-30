import Anthropic from '@anthropic-ai/sdk'
import type { ExamQuestion } from '../../../types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  try {
    const { subject, questions, answers } = await request.json()

    const questionsWithAnswers = questions.map((q: ExamQuestion) => ({
      id: q.id,
      text: stripSvg(q.text),
      type: q.type,
      options: q.options?.map((o: string) => stripSvg(o)),
      studentAnswer: answers[q.id] || "No answer provided",
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
      "correctAnswer": "letter only for MC (e.g. B), or the correct answer for open-ended. Use LaTeX for any math.",
      "explanation": "1-2 sentence explanation using LaTeX for all maths e.g. Area $= \\frac{1}{2} \\times 6 \\times 4 = 12\\,\\text{cm}^2$"
    }
  ]
}

Notes:
- Student answers are letter-only (A, B, C, D, E) for multiple choice. Match to the option with that letter.
- Question text may reference [diagram] where an SVG diagram appeared — treat as a visual element.
- Use LaTeX ($...$) for ALL mathematical expressions in correctAnswer and explanation.

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
