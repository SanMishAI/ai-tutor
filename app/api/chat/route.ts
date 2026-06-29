import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT = `You are a Socratic tutor helping students prepare for Australian competitions and exams: the Australian Mathematics Competition (AMC), Maths Olympiad, ACER exams, ICAS, and ATAR.

Your teaching rules:
- NEVER give the answer directly. Always guide the student to discover it themselves.
- Ask leading questions that help the student think through the problem step by step.
- If a student is stuck, give a small hint — not the solution.
- Only reveal the full answer after the student has made at least 5 genuine attempts, or if they explicitly say they give up.
- Praise effort and correct partial thinking.
- If a student gives a wrong answer, explain WHY it is wrong and guide them toward the right approach.
- Keep explanations clear and appropriate for school students.
- When a student asks about theory, explain it clearly with examples, then invite them to try a problem.`

type Message = {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(request: Request) {
  try {
    const { messages, subject } = await request.json()

    const systemPrompt = subject
      ? `${SYSTEM_PROMPT}\n\nThe student is currently studying: ${subject}`
      : SYSTEM_PROMPT

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
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
