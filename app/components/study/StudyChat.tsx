"use client"

import { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"

type Msg = { role: "user" | "assistant"; content: string }

function practiceComplete(messages: Msg[]): boolean {
  return messages.some(m => m.role === "assistant" && m.content.includes("Start Chapter Test"))
}

// Convert simple LaTeX expressions to readable English
function latexToSpeech(expr: string): string {
  const s = expr
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2")
    .replace(/\\sqrt\{([^}]+)\}/g, "square root of $1")
    .replace(/\^2\b/g, " squared")
    .replace(/\^3\b/g, " cubed")
    .replace(/\^\{([^}]+)\}/g, " to the power of $1")
    .replace(/\^(\d+)/g, " to the power of $1")
    .replace(/\\times/g, " times ")
    .replace(/\\div/g, " divided by ")
    .replace(/\\cdot/g, " times ")
    .replace(/\\leq/g, " less than or equal to ")
    .replace(/\\geq/g, " greater than or equal to ")
    .replace(/\\neq/g, " not equal to ")
    .replace(/\\approx/g, " approximately ")
    .replace(/\\pm/g, " plus or minus ")
    .replace(/\\pi\b/g, " pi ")
    .replace(/\\theta\b/g, " theta ")
    .replace(/\\alpha\b/g, " alpha ")
    .replace(/\\beta\b/g, " beta ")
    .replace(/\\infty/g, " infinity ")
    .replace(/\\left[([\[{]/g, "")
    .replace(/\\right[)\]}\|]/g, "")
    .replace(/[\\{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  // If still looks too LaTeX-y after cleanup, skip it
  return /[\\{}]/.test(s) ? "" : s
}

function stripForSpeech(text: string): string {
  return text
    // Remove SVG diagrams entirely
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    // Display math — try to say it, otherwise silence
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => {
      const spoken = latexToSpeech(expr)
      return spoken && spoken.length < 80 ? `. ${spoken}.` : ". "
    })
    // Inline math — try to say it, otherwise silence
    .replace(/\$([^$\n]{1,60})\$/g, (_, expr) => {
      const spoken = latexToSpeech(expr)
      // If it's just a number or simple expression, say it inline
      if (/^\d+(\.\d+)?$/.test(expr.trim())) return expr.trim()
      return spoken && spoken.length < 50 ? ` ${spoken} ` : " "
    })
    // Remove all remaining $ signs (unclosed/complex math)
    .replace(/\$/g, "")
    // Remove ALL emojis using Unicode property escape
    .replace(/\p{Extended_Pictographic}/gu, "")
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`[^`]+`/g, "")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    // Bullets/lists → natural pauses
    .replace(/^\s*[-*•]\s+/gm, ". ")
    // Paragraph breaks → sentence pause
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    // Collapse whitespace
    .replace(/\s{2,}/g, " ")
    .replace(/[.]{2,}/g, ".")
    .trim()
}

// Extract all complete sentences from text, returning the chunks to speak and remainder
function extractSpeakable(text: string): { chunks: string[]; remainder: string } {
  const chunks: string[] = []
  let start = 0
  for (let i = 0; i < text.length - 1; i++) {
    const c = text[i], n = text[i + 1]
    const isSentenceEnd = (c === "." || c === "!" || c === "?") && (n === " " || n === "\n")
    const isParaBreak = c === "\n" && n === "\n"
    if ((isSentenceEnd || isParaBreak) && i - start >= 15) {
      chunks.push(text.slice(start, i + 1))
      start = i + (isParaBreak ? 2 : 2)  // skip trailing space/newlines
      i = start - 1
    }
  }
  return { chunks, remainder: text.slice(start) }
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
  const messagesRef = useRef<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // voiceRef mirrors voiceEnabled — lets sendToAI (async) always read the latest value
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const voiceRef = useRef(true)

  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [ttsSupported, setTtsSupported] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const voiceObjRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition))

    if (window.speechSynthesis) {
      setTtsSupported(true)
      synthRef.current = window.speechSynthesis

      function pickVoice() {
        const voices = window.speechSynthesis.getVoices()
        // Prefer Google voices (Chrome, best quality), then Neural/Natural, then any English
        voiceObjRef.current =
          voices.find(v => v.name.toLowerCase().includes("google") && v.lang.startsWith("en")) ??
          voices.find(v => (v.name.includes("Neural") || v.name.includes("Natural")) && v.lang.startsWith("en")) ??
          voices.find(v => v.lang === "en-AU") ??
          voices.find(v => v.lang === "en-GB") ??
          voices.find(v => v.lang.startsWith("en")) ??
          null
      }
      pickVoice()
      window.speechSynthesis.onvoiceschanged = pickVoice
    }
  }, [])

  // Auto-start AI
  useEffect(() => {
    if (started.current) return
    started.current = true
    sendToAI([])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Speak a chunk of plain text (queued — multiple calls play in order)
  function speakChunk(text: string) {
    if (!voiceRef.current || !synthRef.current) return
    const clean = stripForSpeech(text).trim()
    if (!clean) return
    const utter = new SpeechSynthesisUtterance(clean)
    utter.rate = 0.87   // slightly slower than default — more comfortable for learning
    utter.pitch = 1
    utter.volume = 1
    if (voiceObjRef.current) utter.voice = voiceObjRef.current
    synthRef.current.speak(utter)   // queues behind any already-playing utterance
  }

  function stopSpeaking() { synthRef.current?.cancel() }

  function toggleVoice() {
    const next = !voiceRef.current
    voiceRef.current = next
    setVoiceEnabled(next)
    if (!next) stopSpeaking()
  }

  async function toggleListening() {
    setMicError(null)
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (!w.SpeechRecognition && !w.webkitSpeechRecognition) {
      setMicError("Speech recognition isn't supported here. Please use Chrome or Edge.")
      return
    }

    // Check if microphone was previously blocked (gives a clearer message upfront)
    try {
      const perm = await navigator.permissions.query({ name: "microphone" as PermissionName })
      if (perm.state === "denied") {
        setMicError("Microphone is blocked for this site. To fix in Chrome: click the icon at the very left of the address bar (it looks like a lock 🔒 or an info circle), then choose 'Site settings', find 'Microphone' and switch it to 'Allow'. Then reload the page.")
        return
      }
    } catch { /* permissions API not supported — continue anyway */ }

    // getUserMedia triggers the browser's native permission dialog on first use
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())  // permission granted — release the stream
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicError("Microphone blocked. In Chrome, click the icon at the far left of the address bar → 'Site settings' → set Microphone to 'Allow', then reload.")
      } else if (name === "NotFoundError") {
        setMicError("No microphone found. Please connect one and try again.")
      } else {
        setMicError("Could not access microphone. Check your browser settings.")
      }
      return
    }

    // Permission is now granted — start speech recognition
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = "en-AU"
    rec.interimResults = false
    rec.maxAlternatives = 1
    recognitionRef.current = rec

    rec.onstart = () => setIsListening(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join("")
      setInput(transcript)
    }
    rec.onend = () => setIsListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setIsListening(false)
      if (e.error === "aborted") return  // normal when user clicks stop
      if (e.error === "no-speech") setMicError("No speech detected — tap the mic and speak clearly.")
      else if (e.error === "network") setMicError("Network error during speech recognition. Check your connection.")
      else setMicError(`Mic error (${e.error}). Please try again.`)
    }

    try { rec.start() } catch {
      setMicError("Failed to start microphone. Please try again.")
    }
  }

  async function sendToAI(history: Msg[], userMsg?: Msg) {
    const newHistory = userMsg ? [...history, userMsg] : history
    setMessages(userMsg
      ? [...newHistory, { role: "assistant", content: "" }]
      : [{ role: "assistant", content: "" }]
    )
    setLoading(true)
    stopSpeaking()

    try {
      const res = await fetch("/api/chapter/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, yearLevel, chapter, messages: newHistory }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: `⚠️ ${err.error ?? "Something went wrong."}` }; return u })
        setLoading(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let full = ""
      let spokenIdx = 0  // chars already dispatched to TTS queue

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            // Speak any remaining text when stream ends
            if (voiceRef.current && spokenIdx < full.length) {
              speakChunk(full.slice(spokenIdx))
            }
            break
          }
          full += decoder.decode(value, { stream: true })
          setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: full }; return u })

          // Queue ALL complete sentences found so far — each as a separate utterance
          // so TTS starts on the first sentence immediately, not after the full response
          if (voiceRef.current) {
            const { chunks, remainder } = extractSpeakable(full.slice(spokenIdx))
            for (const chunk of chunks) speakChunk(chunk)
            spokenIdx = full.length - remainder.length
          }
        }
      }
    } catch {
      setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: "⚠️ Connection error. Please try again." }; return u })
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  function handleSend() {
    if (loading || !input.trim()) return
    const text = input.trim()
    setInput("")
    sendToAI(messagesRef.current, { role: "user", content: text })
  }

  const showTestButton = practiceComplete(messages)
  const practiceCount = messages.filter(m => m.role === "assistant" && m.content.includes("[PRACTICE Q")).length
  const phase = !messages.length ? "Loading…"
    : messages.some(m => m.role === "assistant" && m.content.includes("Start Chapter Test")) ? "✅ Ready for Test"
    : practiceCount > 0 ? `✏️ Practice (${practiceCount}/5)`
    : messages.some(m => m.role === "assistant" && (m.content.includes("worked example") || m.content.includes("3 worked"))) ? "💡 Examples"
    : "📖 Theory"

  return (
    <div className="flex flex-col h-full" style={{ minHeight: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50 shrink-0">
        <p className="text-xs font-semibold truncate max-w-[140px]" style={{ color: "#475569" }}>{chapter}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#000936", color: "#FDC800" }}>{phase}</span>
          {ttsSupported && (
            <button
              onClick={toggleVoice}
              title={voiceEnabled ? "Voice ON — click to mute" : "Voice OFF — click to enable"}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all"
              style={voiceEnabled
                ? { background: "#000936", borderColor: "#000936", color: "#FDC800" }
                : { background: "white", borderColor: "#e2e8f0", color: "#94a3b8" }}
            >
              {voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && <span className="text-xl mr-2 mt-0.5 shrink-0 self-start">🤖</span>}
            <div
              className="max-w-[85%] px-4 py-3 rounded-2xl text-sm"
              style={m.role === "user"
                ? { background: "#000936", color: "white", borderBottomRightRadius: 4 }
                : { background: "white", border: "1px solid #e2e8f0", borderBottomLeftRadius: 4 }}
            >
              {m.role === "assistant"
                ? m.content
                  ? <MD>{m.content}</MD>
                  : <span className="inline-flex gap-1">
                      {[0, 150, 300].map(d => <span key={d} className="animate-bounce" style={{ animationDelay: `${d}ms` }}>●</span>)}
                    </span>
                : <p>{m.content}</p>}
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
        {micError && (
          <div className="mb-2 px-3 py-2 rounded-xl text-xs font-medium flex items-start gap-2" style={{ background: "#fef2f2", color: "#dc2626" }}>
            <span className="flex-1">{micError}</span>
            <button onClick={() => setMicError(null)} className="font-bold shrink-0">✕</button>
          </div>
        )}
        {showTestButton && (
          <p className="text-xs text-center mb-2 font-medium" style={{ color: "#94a3b8" }}>
            Practice done! Ask anything or tap the button above to start the test.
          </p>
        )}
        <div className="flex gap-2">
          {speechSupported && (
            <button
              onClick={toggleListening}
              disabled={loading}
              title={isListening ? "Stop recording" : "Speak your answer"}
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all disabled:opacity-40"
              style={isListening
                ? { background: "#dc2626", borderColor: "#dc2626", color: "white" }
                : { background: "white", borderColor: "#e2e8f0", color: "#64748b" }}
            >
              {isListening
                ? <span className="text-sm font-bold animate-pulse">⏹</span>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
              }
            </button>
          )}
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={isListening ? "🔴 Listening… speak now" : loading ? "AI is thinking…" : "Type or speak your answer…"}
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
            🔴 Recording — speak clearly, then tap ⏹ to stop
          </p>
        )}
      </div>
    </div>
  )
}
