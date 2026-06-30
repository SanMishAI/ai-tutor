import Anthropic from '@anthropic-ai/sdk'
import { createRateLimiter, getIp } from '@/lib/ratelimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const checkRateLimit = createRateLimiter(3, 600, "exam_gen") // 3 per 600 s

const RICH_CONTENT_RULES = `
FORMATTING RULES — apply to every question, option, and explanation:

MATH & SYMBOLS (use LaTeX for all mathematical notation):
- Inline math: $x^2 + 3x - 10 = 0$
- Display math: $$\\frac{a+b}{c} = d$$
- Fractions: $\\frac{3}{4}$ — never write 3/4 in maths contexts
- Square roots: $\\sqrt{x}$, cube roots: $\\sqrt[3]{8}$
- Powers & subscripts: $x^{n}$, $a_{1}$
- Greek letters: $\\alpha$, $\\beta$, $\\theta$, $\\pi$, $\\Delta$, $\\Sigma$, $\\mu$, $\\lambda$
- Vectors: $\\vec{v}$, unit vectors: $\\hat{n}$
- Angles: $\\angle ABC = 45^\\circ$
- Scientific notation: $3.2 \\times 10^{-5}$
- Chemistry: $\\text{H}_2\\text{O}$, $\\text{CO}_2$
- Physics units: $9.8\\,\\text{m/s}^2$
- Infinity: $\\infty$, therefore: $\\therefore$, approx: $\\approx$
- Inequalities: $x \\leq 5$, $y \\geq -2$
- Integral: $\\int_0^1 x^2\\,dx$, sum: $\\sum_{i=1}^{n} i$

SVG DIAGRAMS — embed inline SVG for geometry, graphs, coordinate planes, number lines,
shapes, or any visual content. Use single quotes in ALL SVG attributes to avoid JSON issues:
- Opening tag: <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200' width='300' height='200' style='display:block;margin:8px auto'>
- Colours: stroke='#1e293b' fill='#1e293b' for all lines/text (dark, visible on white)
- Filled shapes: fill='#e2e8f0' for light interior, fill='none' for outlines only
- Lines: <line x1='50' y1='100' x2='250' y2='100' stroke='#1e293b' stroke-width='2'/>
- Labels: <text x='150' y='30' font-family='sans-serif' font-size='13' fill='#1e293b' text-anchor='middle'>label</text>
- Arrow marker: <defs><marker id='arr' markerWidth='8' markerHeight='8' refX='6' refY='3' orient='auto'><path d='M0,0 L0,6 L8,3 z' fill='#1e293b'/></marker></defs>
- Right-angle box: <rect x='px' y='py' width='8' height='8' fill='none' stroke='#1e293b' stroke-width='1.5'/>
- Dimension lines: dashed <line stroke-dasharray='4,3'/>
- For IMAGE-BASED answer options: include SVG after the letter — "A. <svg ...>...</svg>"
- GEOMETRY questions MUST include a diagram. Use SVG for any visual the student needs to see.
`

const EXAM_FORMATS: Record<string, string> = {
  "Australian Mathematics Competition (AMC)":
    "7 multiple choice questions with exactly 5 options each (A, B, C, D, E) and 3 open-ended short answer questions. Style: competition mathematics, ranging from straightforward to challenging.",
  "Maths Olympiad":
    "10 open-ended questions requiring mathematical reasoning and proof. Style: olympiad-level, students must show working and reasoning.",
  "ACER Exam":
    "10 multiple choice questions with exactly 4 options each (A, B, C, D). Style: reasoning, reading comprehension, and quantitative thinking.",
  "ICAS":
    "10 multiple choice questions with exactly 4 options each (A, B, C, D). Style: curriculum-aligned, covers core academic subjects.",
  "ATAR":
    "5 multiple choice questions with exactly 4 options each (A, B, C, D) and 5 open-ended short answer questions. Style: HSC/WACE exam format.",
  "NAPLAN":
    "5 multiple choice questions with exactly 4 options each (A, B, C, D) covering numeracy and literacy, and 5 short answer questions covering reading comprehension, language conventions, and numeracy. Style: Australian Years 7-9 NAPLAN level.",
  "Bebras":
    "10 multiple choice computational thinking tasks with exactly 4 options each (A, B, C, D). Each task presents a concrete self-contained scenario (a story, table, grid, or sequence) and tests one concept from: algorithms and step-by-step logic, data representation, pattern recognition, decomposition, or logical deduction. No prior computing knowledge required — pure reasoning only.",
  "Kangourou sans frontières (KSF)":
    "10 multiple choice questions with exactly 5 options each (A, B, C, D, E). Style: elegant and accessible competition mathematics — arithmetic, geometry, algebra, combinatorics, and number theory. Questions are self-contained, require no calculator, and often have surprising or elegant solutions. Difficulty increases across the 10 questions.",
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
    return Response.json({ error: 'Too many requests. Please wait before generating another exam.' }, { status: 429, headers: { "Retry-After": "600" } })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const { subject, yearLevel } = body as Record<string, unknown>

  if (typeof subject !== "string" || !subject.trim()) {
    return Response.json({ error: "subject is required" }, { status: 400 })
  }
  const safeSubject   = subject.slice(0, 200)
  const safeYearLevel = typeof yearLevel === "string" ? yearLevel.slice(0, 50) : undefined

  try {
    const format = EXAM_FORMATS[safeSubject] ?? "10 open-ended questions appropriate for Australian high school level."

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{
        role: "user",
        content: `Generate exactly 10 exam questions for: ${safeSubject}${safeYearLevel ? ` (${safeYearLevel})` : ""}

Format requirements: ${format}

Difficulty and content must be appropriate for ${safeYearLevel ?? "the exam level"}.

${RICH_CONTENT_RULES}

Return ONLY valid JSON in this exact structure, no other text before or after:
{
  "questions": [
    {
      "id": 1,
      "text": "question text with LaTeX math and/or SVG diagram as needed",
      "type": "multiple_choice",
      "options": ["A. option (may contain LaTeX or SVG)", "B. option2", "C. option3", "D. option4"]
    },
    {
      "id": 2,
      "text": "question text",
      "type": "open_ended"
    }
  ]
}

Actively USE diagrams and LaTeX notation throughout. For geometry include SVG diagrams.
For any fractions, roots, powers, or symbols always use LaTeX.`
      }]
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""
    const parsed = extractJson(text) as { questions: unknown[] }
    return Response.json({ questions: parsed.questions })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Exam generate error:", message)
    return Response.json({ error: message }, { status: 500 })
  }
}
