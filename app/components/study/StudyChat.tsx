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

// ─── Text cleaning for speech ───────────────────────────────────────────────

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
    .replace(/\\left[([{]/g, "")
    .replace(/\\right[)\]}|]/g, "")
    .replace(/[\\{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return /[\\{}]/.test(s) ? "" : s
}

function stripForSpeech(text: string): string {
  return text
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => {
      const s = latexToSpeech(expr)
      return s && s.length < 80 ? `. ${s}.` : ". "
    })
    .replace(/\$([^$\n]{1,60})\$/g, (_, expr) => {
      if (/^\d+(\.\d+)?$/.test(expr.trim())) return expr.trim()
      const s = latexToSpeech(expr)
      return s && s.length < 50 ? ` ${s} ` : " "
    })
    .replace(/\$/g, "")
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`[^`]+`/g, "")
    .replace(/_{1,2}([^_]+)_{1,2}/g, "$1")
    .replace(/^\s*[-*•]\s+/gm, ". ")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, ", ")
    .replace(/\s{2,}/g, " ")
    .replace(/[.]{2,}/g, ".")
    .trim()
}

// Extract all complete sentences from unspoken text
function extractSpeakable(text: string): { chunks: string[]; remainder: string } {
  const chunks: string[] = []
  let start = 0
  for (let i = 0; i < text.length - 1; i++) {
    const c = text[i], n = text[i + 1]
    const sentEnd = (c === "." || c === "!" || c === "?") && (n === " " || n === "\n")
    const paraBreak = c === "\n" && n === "\n"
    if ((sentEnd || paraBreak) && i - start >= 15) {
      chunks.push(text.slice(start, i + 1))
      start = i + 2
      i = start - 1
    }
  }
  return { chunks, remainder: text.slice(start) }
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function MD({ children }: { children: string }) {
  return (
    <div className="prose prose-slate max-w-none text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function StudyChat({
  exam, yearLevel, chapter, onStartTest,
}: {
  exam: string; yearLevel: string; chapter: string; onStartTest: () => void
}) {
  const [messages, setMessages] = useState<Msg[]>([])
  const messagesRef = useRef<Msg[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const voiceRef = useRef(true)

  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const started = useRef(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)

  // ── TTS queue (OpenAI API, falls back to Web Speech) ──
  const ttsQueueRef = useRef<string[]>([])
  const ttsRunningRef = useRef(false)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const fetchAbortRef = useRef<AbortController | null>(null)
  // Web Speech fallback
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const wsVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition))

    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis
      const pickVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        wsVoiceRef.current =
          voices.find(v => v.name.toLowerCase().includes("google") && v.lang.startsWith("en")) ??
          voices.find(v => (v.name.includes("Neural") || v.name.includes("Natural")) && v.lang.startsWith("en")) ??
          voices.find(v => v.lang.startsWith("en")) ?? null
      }
      pickVoice()
      window.speechSynthesis.onvoiceschanged = pickVoice
    }
  }, [])

  // Auto-start AI session
  useEffect(() => {
    if (started.current) return
    started.current = true
    sendToAI([])
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── TTS: fetch from OpenAI API and play, with Web Speech fallback ──

  function stopSpeaking() {
    ttsQueueRef.current = []
    fetchAbortRef.current?.abort()
    fetchAbortRef.current = null
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.src = ""
      currentAudioRef.current = null
    }
    synthRef.current?.cancel()
    // Don't reset ttsRunningRef here — let drainTtsQueue manage it
  }

  function enqueueSpeech(text: string) {
    if (!voiceRef.current) return
    const clean = stripForSpeech(text).trim()
    if (!clean || clean.length < 3) return
    ttsQueueRef.current.push(clean)
    if (!ttsRunningRef.current) drainTtsQueue()
  }

  async function drainTtsQueue() {
    ttsRunningRef.current = true
    while (ttsQueueRef.current.length > 0 && voiceRef.current) {
      const text = ttsQueueRef.current.shift()!
      await speakOneChunk(text)
    }
    ttsRunningRef.current = false
  }

  async function speakOneChunk(text: string) {
    // Try OpenAI TTS first
    const abort = new AbortController()
    fetchAbortRef.current = abort
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
        signal: abort.signal,
      })

      if (res.ok) {
        const blob = await res.blob()
        if (!voiceRef.current) return
        const url = URL.createObjectURL(blob)
        await new Promise<void>(resolve => {
          const audio = new Audio(url)
          currentAudioRef.current = audio
          const done = () => {
            try { URL.revokeObjectURL(url) } catch {}
            currentAudioRef.current = null
            resolve()
          }
          audio.onended = done
          audio.onerror = done
          audio.play().catch(done)
        })
        return
      }
      // API unavailable (503 = no key configured) — fall through to Web Speech
    } catch (e: unknown) {
      if ((e as { name?: string })?.name === "AbortError") return
      // Network error — fall through to Web Speech
    }

    // Web Speech fallback
    if (synthRef.current && voiceRef.current) {
      await new Promise<void>(resolve => {
        const utter = new SpeechSynthesisUtterance(text)
        utter.rate = 0.82
        utter.pitch = 1
        if (wsVoiceRef.current) utter.voice = wsVoiceRef.current
        utter.onend = () => resolve()
        utter.onerror = () => resolve()
        synthRef.current!.speak(utter)
      })
    }
  }

  function toggleVoice() {
    const next = !voiceRef.current
    voiceRef.current = next
    setVoiceEnabled(next)
    if (!next) stopSpeaking()
  }

  // ── Microphone (STT) ──

  async function toggleListening() {
    setMicError(null)
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (!w.SpeechRecognition && !w.webkitSpeechRecognition) {
      setMicError("Speech recognition isn't supported here — please use Chrome or Edge.")
      return
    }

    // Check if already denied — avoids silent failure
    try {
      const perm = await navigator.permissions.query({ name: "microphone" as PermissionName })
      if (perm.state === "denied") {
        setMicError("Microphone is blocked for this site. In Chrome: click the small icon at the far-left of the address bar (looks like 🔒 or ⓘ), choose 'Site settings', then set Microphone to 'Allow' and reload.")
        return
      }
    } catch { /* permissions API not supported — continue */ }

    // This triggers the browser's native 'Allow microphone' popup on first use
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name ?? ""
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicError("Microphone access denied. In Chrome: click the icon at the far-left of the address bar → 'Site settings' → Microphone → Allow → reload the page.")
      } else if (name === "NotFoundError") {
        setMicError("No microphone found. Please connect one and try again.")
      } else {
        setMicError("Could not access microphone. Check your browser settings.")
      }
      return
    }

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
      const t = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join("")
      setInput(t)
    }
    rec.onend = () => setIsListening(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onerror = (e: any) => {
      setIsListening(false)
      if (e.error === "aborted") return
      if (e.error === "no-speech") setMicError("No speech detected — tap the mic and speak clearly.")
      else if (e.error === "network") setMicError("Network error during speech recognition.")
      else setMicError(`Mic error: ${e.error}. Please try again.`)
    }
    try { rec.start() } catch { setMicError("Could not start microphone. Please try again.") }
  }

  // ── AI streaming ──

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
      let spokenIdx = 0

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            if (voiceRef.current && spokenIdx < full.length) enqueueSpeech(full.slice(spokenIdx))
            break
          }
          full += decoder.decode(value, { stream: true })
          setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "assistant", content: full }; return u })
          // Queue each complete sentence as it arrives
          if (voiceRef.current) {
            const { chunks, remainder } = extractSpeakable(full.slice(spokenIdx))
            for (const chunk of chunks) enqueueSpeech(chunk)
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
            <button onClick={onStartTest} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-105" style={{ background: "#000936", color: "#FDC800" }}>
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
