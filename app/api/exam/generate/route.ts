import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
    const { subject, yearLevel } = await request.json()
    const format = EXAM_FORMATS[subject] ?? "10 open-ended questions appropriate for Australian high school level."

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: `Generate exactly 10 exam questions for: ${subject}${yearLevel ? ` (${yearLevel})` : ""}

Format requirements: ${format}

Difficulty and content must be appropriate for ${yearLevel ?? "the exam level"}.

Return ONLY valid JSON in this exact structure, no other text before or after:
{
  "questions": [
    {
      "id": 1,
      "text": "question text (use LaTeX for maths e.g. $x^2 + 3x = 10$)",
      "type": "multiple_choice",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"]
    },
    {
      "id": 2,
      "text": "question text",
      "type": "open_ended"
    }
  ]
}

Make questions varied in difficulty and accurate for ${subject}.`
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
