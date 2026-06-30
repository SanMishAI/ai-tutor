import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

const DIFFICULTY = ["", "basic foundational concepts, single-step", "moderate complexity, multi-step reasoning", "advanced competition-level difficulty"]

// Subtopic variety hints so each question in a stage covers a different angle
const SUBTOPIC_ANGLE = [
  "Focus on a definition, rule, or core concept.",
  "Focus on a calculation or procedural application.",
  "Focus on a word problem or real-world application.",
  "Focus on pattern recognition, relationships, or comparisons.",
  "Focus on an edge case, exception, or counter-intuitive result.",
]

export async function POST(req: Request) {
  const { exam, yearLevel, chapter, stage, questionIndex, askedQuestions } = await req.json()

  if (!exam || !chapter || !stage) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const idx = questionIndex ?? 0
  const prevList: string[] = Array.isArray(askedQuestions) ? askedQuestions : []

  const avoidBlock = prevList.length > 0
    ? `\nPreviously asked in this stage session — DO NOT repeat or closely resemble any of these:\n${prevList.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
    : ""

  const prompt = `Generate exactly ONE multiple-choice question for a Minecraft-themed educational game.

Exam: ${exam}
Year level: ${yearLevel}
Chapter/Topic: ${chapter}
Difficulty: ${stage}/3 (${DIFFICULTY[stage] ?? "moderate"})
Question number: ${idx + 1} of 5
Angle for this question: ${SUBTOPIC_ANGLE[idx] ?? SUBTOPIC_ANGLE[0]}
${avoidBlock}
Requirements:
- Test ${chapter} knowledge appropriate for ${exam} at ${yearLevel} level
- Exactly 4 options labeled A, B, C, D — only one is correct
- Hint: one concise tip (max 15 words)
- FunFact: one interesting fact about the answer (max 20 words), start with the answer value so it reads as confirmation
- Question must be self-contained and unambiguous
- For stage 1 (easy): accessible for beginners at this year level
- For stage 2 (medium): requires multi-step thinking or deeper understanding
- For stage 3 (hard): competition-level; challenging even for strong students
- Each question MUST cover a distinct concept — do not reuse the same type of problem as any previously asked question above

Respond with ONLY this JSON (no markdown, no backticks, no explanation):
{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":"A","hint":"...","funFact":"..."}`

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    })

    const text = msg.content[0].type === "text" ? msg.content[0].text : ""
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return NextResponse.json({ error: "Parse error" }, { status: 500 })

    const data = JSON.parse(match[0])
    if (!data.question || !data.options || !data.correct) {
      return NextResponse.json({ error: "Invalid question data" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Generation failed" }, { status: 500 })
  }
}
