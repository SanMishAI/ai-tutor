import Anthropic from '@anthropic-ai/sdk'
import { createRateLimiter, getIp } from '@/lib/ratelimit'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const checkRateLimit = createRateLimiter(30, 60_000) // 30 per minute

const MATH_FORMAT_RULES = `
FORMATTING RULES for all responses:
- Use LaTeX for ALL mathematical notation — never plain text for maths
- Inline math: $x^2 + 3x - 10 = 0$  |  Display: $$\\frac{a+b}{2}$$
- Fractions: $\\frac{3}{4}$, roots: $\\sqrt{x}$, $\\sqrt[3]{8}$
- Powers/subscripts: $x^{n}$, $a_{1}$
- Greek: $\\alpha$, $\\beta$, $\\theta$, $\\pi$, $\\Delta$, $\\Sigma$, $\\mu$, $\\lambda$
- Angles: $\\angle ABC = 45^\\circ$  |  Vectors: $\\vec{v}$, $\\hat{n}$
- Scientific notation: $3.2 \\times 10^{-5}$
- Chemistry: $\\text{H}_2\\text{O}$, $\\text{CO}_2$
- Units: $9.8\\,\\text{m/s}^2$, $5\\,\\text{km}$
- Infinity: $\\infty$, therefore: $\\therefore$, approx: $\\approx$
- Inequalities: $x \\leq 5$, $y \\geq -2$
- For geometry or any visual concept include an SVG diagram using single-quoted attributes:
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 160' width='280' height='160' style='display:block;margin:8px auto'>
  Use stroke='#1e293b' fill='#1e293b' for lines and text labels.`

const SYSTEM_PROMPT = `You are a Socratic tutor helping students prepare for Australian competitions and exams: the Australian Mathematics Competition (AMC), Maths Olympiad, ACER exams, ICAS, and ATAR.

Your teaching rules:
- NEVER give the answer directly. Always guide the student to discover it themselves.
- Ask leading questions that help the student think through the problem step by step.
- If a student is stuck, give a small hint — not the solution.
- Only reveal the full answer after the student has made at least 5 genuine attempts, or if they explicitly say they give up.
- Praise effort and correct partial thinking.
- If a student gives a wrong answer, explain WHY it is wrong and guide them toward the right approach.
- Keep explanations clear and appropriate for school students.
- When a student asks about theory, explain it clearly with examples, then invite them to try a problem.
${MATH_FORMAT_RULES}`

const PRACTICE_SYSTEM_PROMPT = `You are a Socratic tutor generating and guiding practice problems for Australian exam preparation (AMC, Maths Olympiad, ACER, ICAS, ATAR).

When asked to generate a problem:
- Create a well-structured, challenging problem appropriate for the specified exam
- State the problem clearly with all necessary information
- For geometry or visual problems, include an inline SVG diagram in the problem statement
- Do NOT provide hints, working, or solutions — just the problem itself

When the student attempts the problem:
- NEVER reveal the answer unless they explicitly give up
- Guide with leading questions and small hints only
- Praise correct partial reasoning
- Explain conceptual errors clearly without giving away the answer
- Only reveal the full solution when the student explicitly gives up

Keep responses concise and encouraging.
${MATH_FORMAT_RULES}`

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  if (!checkRateLimit(getIp(request))) {
    return Response.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
  }

  try {
    const { messages, subject, yearLevel, mode } = await request.json()

    const base = mode === "practice" ? PRACTICE_SYSTEM_PROMPT : SYSTEM_PROMPT
    const context = [subject, yearLevel].filter(Boolean).join(", ")
    const systemPrompt = context
      ? `${base}\n\nThe student is preparing for: ${context}`
      : base

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages as Message[],
    })

    const reply =
      response.content[0].type === 'text' ? response.content[0].text : ''

    return Response.json({ reply })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Chat API error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}
