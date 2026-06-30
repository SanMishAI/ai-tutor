import Anthropic from '@anthropic-ai/sdk'

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
    const { subject, wrongQuestions } = await request.json()

    const sanitised = wrongQuestions.map((q: { id: number; text: string; type: string; options?: string[]; studentAnswer: string; correctAnswer: string }) => ({
      ...q,
      text: stripSvg(q.text),
      options: q.options?.map((o: string) => stripSvg(o)),
    }))

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{
        role: "user",
        content: `You are a patient ${subject} tutor reviewing a student's exam mistakes.

For each wrong answer write a step-by-step walkthrough in Markdown that:
1. Restates what the question was asking (1 sentence)
2. Shows the correct method step by step — use LaTeX for ALL maths:
   - Inline: $x^2 + 3x = 0$
   - Display: $$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
   - Fractions: $\\frac{3}{4}$, square roots: $\\sqrt{x}$, Greek: $\\theta$, $\\pi$, $\\Delta$
   - For geometry: describe the shape and key measurements clearly in text; add an SVG diagram
     using single-quoted attributes if a visual would help (stroke='#1e293b', width='260', height='160')
3. Explains in one sentence why the student's approach was wrong
4. Ends with a short memorable tip in bold

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
