"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"

type Msg = { role: "user" | "assistant"; content: string }

function practiceComplete(messages: Msg[]): boolean {
  return messages.some(m => m.role === "assistant" && m.content.includes("Start Chapter Test"))
}

// Strip markdown/LaTeX for speech synthesis
function stripForSpeech(text: string): string {
  return text
    .replace(/\$\$[\s\S]*?\$\$/g, ", mathematical expression, ")
    .replace(/\$[^$\n]+\$/g, ", mathematical expression, ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/📌\s*/g, "")
    .replace(/[🙋💡🎉✅❌🎯📖✏️🔍]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`[^`]+`/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .replace(/[•\-\*]\s/g, ". ")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim()
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
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition))
    setTtsSupported(!!window.speechSynthesis)
    synthRef.current = window.speechSynthesis ?? null
  }, [])

  // Auto-start the AI
  useEffect(() => {
    if (started.current) return
    started.current = true
    sendToAI([])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function speak(text: string) {
    if (!voiceEnabled || !synthRef.current || !ttsSupported) return
    synthRef.current.cancel()
    const clean = stripForSpeech(text)
    if (!clean.trim()) return
    const utter = new SpeechSynthesisUtterance(clean)
    utter.rate = 0.95
    utter.pitch = 1
    utter.volume = 1
    // Prefer a natural English voice
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Neural") || v.name.includes("Natural") || v.name.includes("Google"))) ?? voices.find(v => v.lang.startsWith("en"))
    if (preferred) utter.voice = preferred
    synthRef.current.speak(utter)
  }

  function stopSpeaking() {
    synthRef.current?.cancel()
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    rec.lang = "en-AU"
    rec.interimResults = false
    rec.maxAlternatives = 1
    recognitionRef.current = rec
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(prev => prev ? prev + " " + transcript : transcript)
    }
    rec.onend = () => setIsListening(false)
    rec.onerror = () => setIsListening(false)
    rec.start()
    setIsListening(true)
  }

  async function sendToAI(history: Msg[], userMsg?: Msg) {
    const newHistory = userMsg ? [...history, userMsg] : history
    setMessages(userMsg ? [...newHistory, { role: "assistant", content: "" }] : [{ role: "assistant", content: "" }])
    setLoading(true)
    setStreaming(true)
    stopSpeaking()

    try {
      const res = await fetch("/api/chapter/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, yearLevel, chapter, messages: newHistory }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        setMessages(prev => {
          const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `⚠️ ${err.error ?? "Something went wrong. Please try again."}` }; return u
        })
        setLoading(false); setStreaming(false); return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let assistantText = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          assistantText += decoder.decode(value, { stream: true })
          const snap = assistantText
          setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: snap }; return u })
        }
      }

      // Speak after streaming completes
      if (voiceEnabled) speak(assistantText)
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: "⚠️ Connection error. Please try again." }; return u })
    }

    setLoading(false)
    setStreaming(false)
    inputRef.current?.focus()
  }

  function handleSend() {
    if (loading || !input.trim()) return
    const userMsg: Msg = { role: "user", content: input.trim() }
    setInput("")
    sendToAI(messages, userMsg)
  }

  const showTestButton = practiceComplete(messages)
  const practiceCount = messages.filter(m => m.role === "assistant" && m.content.includes("[PRACTICE Q")).length

  const phase = !messages.length ? "Loading…"
    : messages.some(m => m.role === "assistant" && m.content.includes("Start Chapter Test")) ? "✅ Ready for Test"
    : messages.filter(m => m.role === "assistant" && m.content.includes("[PRACTICE Q")).length > 0
      ? `✏️ Practice (${practiceCount}/5)`
    : messages.some(m => m.role === "assistant" && (m.content.includes("worked example") || m.content.includes("3 worked"))) ? "💡 Examples"
    : "📖 Theory"

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header: phase + voice controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
        <p className="text-xs font-semibold truncate max-w-[140px]" style={{ color: "#475569" }}>{chapter}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#000936", color: "#FDC800" }}>{phase}</span>

          {/* Voice controls */}
          {ttsSupported && (
            <button
              onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) stopSpeaking() }}
              title={voiceEnabled ? "Turn off AI voice" : "Turn on AI voice"}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border transition-all"
              style={voiceEnabled
                ? { background: "#000936", borderColor: "#000936", color: "#FDC800" }
                : { background: "white", borderColor: "#e2e8f0", color: "#94a3b8" }}
            >
              {voiceEnabled ? "🔊" : "🔇"}
            </button>
          )}
        </div>
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
                background: "#000936", color: "white", borderBottomRightRadius: 4,
              } : {
                background: "white", border: "1px solid #e2e8f0", borderBottomLeftRadius: 4,
              }}
            >
              {m.role === "assistant"
                ? m.content
                  ? <MD>{m.content}</MD>
                  : <span className="inline-flex gap-1"><span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span><span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span><span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span></span>
                : <p>{m.content}</p>
              }
            </div>
          </div>
        ))}

        {showTestButton && (
          <div className="flex justify-center py-2">
            <button
              onClick={onStartTest}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-105"
              style={{ background: "#000936", color: "#FDC800" }}
            >
              🎯 Start Chapter Test
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0">
        {showTestButton && (
          <p className="text-xs text-center mb-2 font-medium" style={{ color: "#94a3b8" }}>
            Practice done! Ask anything or click the button above to start the test.
          </p>
        )}
        <div className="flex gap-2">
          {/* Mic button */}
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={loading}
              title={isListening ? "Stop recording" : "Speak your answer"}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all"
              style={isListening
                ? { background: "#dc2626", borderColor: "#dc2626", color: "white" }
                : { background: "white", borderColor: "#e2e8f0", color: "#94a3b8" }}
            >
              {isListening ? (
                <span className="text-sm animate-pulse">⏹</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
          )}

          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={isListening ? "Listening… speak now" : loading ? "AI is thinking…" : "Type or speak your answer…"}
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
        {isListening && (
          <p className="text-xs text-center mt-1.5 font-medium animate-pulse" style={{ color: "#dc2626" }}>
            🔴 Recording — speak now, then tap ⏹ to stop
          </p>
        )}
      </div>
    </div>
  )
}
