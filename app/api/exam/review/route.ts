import Anthropic from '@anthropic-ai/sdk'
import { createRateLimiter, getIp } from '@/lib/ratelimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const checkRateLimit = createRateLimiter(3, 600, "exam_rev") // 3 per 600 s

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
  const { subject, wrongQuestions } = body as Record<string, unknown>

  if (!Array.isArray(wrongQuestions)) {
    return Response.json({ error: "wrongQuestions must be an array" }, { status: 400 })
  }

  try {
    type Q = { id: number; text: string; type: string; options?: string[]; studentAnswer: string; correctAnswer: string }
    const capped: Q[] = (wrongQuestions as Q[]).slice(0, MAX_QUESTIONS)

    const sanitised = capped.map((q) => ({
      ...q,
      text: stripSvg(q.text).slice(0, MAX_TEXT_CHARS),
      options: q.options?.map((o: string) => stripSvg(o).slice(0, MAX_TEXT_CHARS)),
      studentAnswer: String(q.studentAnswer ?? "").slice(0, 500),
      correctAnswer: String(q.correctAnswer ?? "").slice(0, 500),
    }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{
        role: "user",
        content: `You are a confident, clear ${subject} tutor writing post-exam walkthroughs for a student's wrong answers.

For each wrong answer write a walkthrough in Markdown following this structure:
1. **What was asked** — one sentence restating the question's goal.
2. **Correct method** — numbered steps showing the approach. Each step states a method and its result directly. Use LaTeX for ALL maths:
   - Inline: $x^2 + 3x = 0$
   - Display: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$
   - Fractions: $\\frac{3}{4}$, roots: $\\sqrt{x}$, Greek: $\\theta$, $\\pi$, $\\Delta$
   - State arithmetic results confidently (e.g. $7 \\times 8 = 56$). Do NOT narrate counting steps or show tentative re-checking. Compute once and state clearly.
   - For geometry: add an SVG diagram with single-quoted attributes (stroke='#1e293b', width='260', height='160') where a visual helps.
3. **Where it went wrong** — one sentence identifying the student's specific error.
4. **Remember** — one short bold tip.

Tone: direct and clear, not apologetic. Never say "wait" or "let me re-check" mid-walkthrough.

Return ONLY valid JSON, no other text:
{
  "reviews": [
    { "id": 1, "walkthrough": "Full Markdown walkthrough with LaTeX and optional SVG..." }
  ]
}

Wrong answers to review:
${JSON.stringify(sanitised, null, 2)}`
      }]
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const parsed = extractJson(text) as { reviews: Array<{ id: number; walkthrough: string }> }
    return Response.json({ reviews: parsed.reviews })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Exam review error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
