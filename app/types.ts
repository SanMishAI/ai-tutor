export type Message = {
  role: "user" | "assistant"
  content: string
}

export type Conversation = {
  id: string
  title: string
  subject: string
  yearLevel: string
  messages: Message[]
  mode: "chat" | "practice"
  createdAt: string
}

export type ExamQuestion = {
  id: number
  text: string
  type: "multiple_choice" | "open_ended"
  options?: string[]
}

export type GradedResult = {
  id: number
  question: ExamQuestion
  correct: boolean
  correctAnswer: string
  yourAnswer: string
  explanation: string
}
