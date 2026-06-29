import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `You are a patient ${subject} tutor reviewing a student's exam mistakes.

For each wrong answer, write a step-by-step walkthrough that:
1. Clarifies what the question was really asking
2. Shows the correct method step by step (use LaTeX for maths: $x^2 + 3x = 0$)
3. Explains briefly why the student's approach was wrong
4. Ends with a short memorable tip

Return ONLY valid JSON, no other text:
{
  "reviews": [
    { "id": 1, "walkthrough": "Full walkthrough here..." }
  ]
}

Wrong answers to review:
${JSON.stringify(wrongQuestions, null, 2)}`
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
