export type Message = {
  role: "user" | "assistant"
  content: string
}

export type Conversation = {
  id: string
  title: string
  subject: string
  messages: Message[]
  mode: "chat" | "practice"
  createdAt: string
}
