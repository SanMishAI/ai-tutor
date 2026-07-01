"use client"

import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"

type Msg = { role: "user" | "assistant"; content: string }

// Detect when the AI has finished all 5 practice questions
function practiceComplete(messages: Msg[]): boolean {
  return messages.some(
    m => m.role === "assistant" && m.content.includes("Start Chapter Test")
  )
}

function MD({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

export default function StudyChat({
  exam,
  yearLevel,
  chapter,
  onStartTest,
}: {
  exam: string
  yearLevel: string
  chapter: string
  onStartTest: () => void
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)

  // Auto-start the AI as soon as the chapter is selected
  useEffect(() => {
    if (started.current) return
    started.current = true
    sendMessage([], true)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streaming])

  async function sendMessage(history: Msg[], isInit = false) {
    const userMsg: Msg | null = isInit ? null : { role: "user", content: input.trim() }
    if (!isInit && !input.trim()) return

    const newHistory = userMsg ? [...history, userMsg] : history
    if (!isInit) {
      setMessages(newHistory)
      setInput("")
    }

    setLoading(true)
    setStreaming(true)

    // Add placeholder assistant message for streaming
    setMessages(prev => [...(isInit ? [] : prev.slice(0, -0)), ...(userMsg ? [userMsg] : []), { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/chapter/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam,
          yearLevel,
          chapter,
          messages: userMsg ? newHistory : [],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: "assistant", content: `⚠️ ${err.error ?? "Something went wrong. Please try again."}` }
          return updated
        })
        setLoading(false)
        setStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantText += decoder.decode(value, { stream: true })
          const snapshot = assistantText
          setMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: "assistant", content: snapshot }
            return updated
          })
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: "assistant", content: "⚠️ Connection error. Please try again." }
        return updated
      })
    }

    setLoading(false)
    setStreaming(false)
    inputRef.current?.focus()
  }

  function handleSend() {
    if (loading || !input.trim()) return
    sendMessage(messages)
  }

  const showTestButton = practiceComplete(messages)
  const practiceCount = messages.filter(m => m.role === "assistant" && m.content.includes("[PRACTICE Q")).length

  // Phase label from message history
  const phase = !messages.length ? "Loading…"
    : messages.some(m => m.role === "assistant" && m.content.includes("Start Chapter Test")) ? "✅ Ready for Test"
    : messages.some(m => m.role === "assistant" && m.content.includes("[PRACTICE Q")) ? `✏️ Practice (${practiceCount}/5)`
    : messages.some(m => m.role === "assistant" && m.content.includes("worked example")) ? "💡 Examples"
    : "📖 Theory"

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Phase indicator */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
        <p className="text-xs font-semibold" style={{ color: "#475569" }}>{chapter}</p>
        <p className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#000936", color: "#FDC800" }}>{phase}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <span className="text-xl mr-2 mt-0.5 shrink-0 self-start">🤖</span>
            )}
            <div
              className="max-w-[85%] px-4 py-3 rounded-2xl text-sm"
              style={m.role === "user" ? {
                background: "#000936",
                color: "white",
                borderBottomRightRadius: 4,
              } : {
                background: "white",
                border: "1px solid #e2e8f0",
                borderBottomLeftRadius: 4,
              }}
            >
              {m.role === "assistant"
                ? m.content
                  ? <MD>{m.content}</MD>
                  : <span className="animate-pulse text-slate-400">●●●</span>
                : <p>{m.content}</p>
              }
            </div>
          </div>
        ))}

        {/* Test button appears when practice is complete */}
        {showTestButton && (
          <div className="flex justify-center py-2">
            <button
              onClick={onStartTest}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all hover:opacity-90 animate-bounce"
              style={{ background: "#000936", color: "#FDC800" }}
            >
              🎯 Start Chapter Test
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
        {showTestButton && (
          <p className="text-xs text-center mb-2 font-medium" style={{ color: "#94a3b8" }}>
            Practice complete! Click the button above or keep asking questions.
          </p>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={loading ? "AI is typing…" : "Type your answer or ask a question…"}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50"
            style={{ border: "1.5px solid #e2e8f0", background: "white", color: "#334155" }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "#000936", color: "#FDC800" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
