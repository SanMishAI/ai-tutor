"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"

const SUBJECTS = [
  "Australian Mathematics Competition (AMC)",
  "Maths Olympiad",
  "ACER Exam",
  "ICAS",
  "ATAR",
]

type Message = {
  role: "user" | "assistant"
  content: string
}

function Logo() {
  return (
    <div className="relative flex items-center justify-center w-14 h-14 bg-indigo-100 dark:bg-indigo-900 rounded-2xl shadow-inner select-none">
      <span className="text-3xl">🤖</span>
      <span className="absolute -top-2 -right-1 text-xl">🎓</span>
    </div>
  )
}

export default function Home() {
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setLoading(true)

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updatedMessages, subject }),
    })

    const data = await response.json()
    const reply = data.error
      ? `Sorry, something went wrong: ${data.error}`
      : data.reply
    setMessages([...updatedMessages, { role: "assistant", content: reply }])
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 tracking-tight">TutorMate</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Your AI study companion</p>
        </div>
        <Logo />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 py-6">

        {/* Subject selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">Exam / Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Chat window */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4 mb-4 space-y-4 min-h-[400px]">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-3">
              <span className="text-5xl">🧮</span>
              <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs">
                Ask a question, request a practice problem, or say &ldquo;explain this topic&rdquo; to get started.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <span className="mr-2 mt-1 text-lg shrink-0">🤖</span>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap"
                  : "bg-indigo-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm prose prose-sm dark:prose-invert max-w-none"
              }`}>
                {msg.role === "user" ? msg.content : (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
              {msg.role === "user" && (
                <span className="ml-2 mt-1 text-lg shrink-0">🧑‍🎓</span>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start items-center gap-2">
              <span className="text-lg">🤖</span>
              <div className="bg-indigo-50 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-gray-400 dark:text-gray-500 shadow-sm">
                Thinking<span className="animate-pulse">...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask a question or request a practice problem..."
            className="flex-1 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
          >
            Send
          </button>
        </div>

      </main>
    </div>
  )
}
