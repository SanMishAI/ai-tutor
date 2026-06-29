"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import Sidebar from "./components/Sidebar"
import type { Message, Conversation } from "./types"

const SUBJECTS = [
  "Australian Mathematics Competition (AMC)",
  "Maths Olympiad",
  "ACER Exam",
  "ICAS",
  "ATAR",
]

const STORAGE_KEY = "tutormate_conversations"
const MAX_ATTEMPTS = 5

function makeId() {
  return Date.now().toString()
}

function makeTitle(msg: string) {
  return msg.length > 38 ? msg.slice(0, 38) + "…" : msg
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
  } catch {
    return []
  }
}

function Logo() {
  return (
    <div className="relative flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-2xl shadow-inner select-none">
      <span className="text-2xl">🤖</span>
      <span className="absolute -top-2 -right-1 text-lg">🎓</span>
    </div>
  )
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"chat" | "practice">("chat")
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [attemptCount, setAttemptCount] = useState(0)
  const [practiceActive, setPracticeActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeConv = conversations.find(c => c.id === activeId)
  const messages = activeConv?.messages ?? []

  useEffect(() => {
    setConversations(loadConversations())
  }, [])

  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    }
  }, [conversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [loading])

  function startNewChat() {
    setActiveId(null)
    setInput("")
    setAttemptCount(0)
    setPracticeActive(false)
  }

  function selectConversation(id: string) {
    const conv = conversations.find(c => c.id === id)
    if (!conv) return
    setActiveId(id)
    setMode(conv.mode)
    setSubject(conv.subject)
    setAttemptCount(0)
    setPracticeActive(false)
    setInput("")
  }

  function deleteConversation(id: string) {
    const updated = conversations.filter(c => c.id !== id)
    setConversations(updated)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    if (activeId === id) {
      setActiveId(null)
      setAttemptCount(0)
      setPracticeActive(false)
    }
  }

  function saveMessages(msgs: Message[], convId: string, title?: string) {
    setConversations(prev => {
      const exists = prev.find(c => c.id === convId)
      if (exists) {
        return prev.map(c => c.id === convId ? { ...c, messages: msgs } : c)
      }
      const newConv: Conversation = {
        id: convId,
        title: title ?? "New conversation",
        subject,
        messages: msgs,
        mode,
        createdAt: new Date().toISOString(),
      }
      return [...prev, newConv]
    })
  }

  async function callApi(msgs: Message[]) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, subject, mode }),
    })
    const data = await response.json()
    return data.error ? `Sorry, something went wrong: ${data.error}` : data.reply
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input }
    const updated = [...messages, userMessage]
    const convId = activeId ?? makeId()
    const title = messages.length === 0 ? makeTitle(input) : undefined

    setInput("")
    setLoading(true)
    if (!activeId) setActiveId(convId)
    if (mode === "practice" && practiceActive) setAttemptCount(c => c + 1)

    saveMessages(updated, convId, title)
    const reply = await callApi(updated)
    saveMessages([...updated, { role: "assistant", content: reply }], convId)
    setLoading(false)
  }

  async function getPracticeProblem() {
    if (loading) return
    setAttemptCount(0)
    setPracticeActive(true)

    const prompt = `Generate a challenging ${subject} practice problem. Present the problem clearly without hints or solutions.`
    const userMessage: Message = { role: "user", content: prompt }
    const updated = [...messages, userMessage]
    const convId = activeId ?? makeId()
    const abbrev = subject.match(/\(([^)]+)\)/)?.[1] ?? subject.split(" ")[0]

    setLoading(true)
    if (!activeId) setActiveId(convId)
    saveMessages(updated, convId, `Practice: ${abbrev}`)

    const reply = await callApi(updated)
    saveMessages([...updated, { role: "assistant", content: reply }], convId)
    setLoading(false)
  }

  async function revealAnswer() {
    if (loading || !activeId) return

    const userMessage: Message = { role: "user", content: "I give up. Please reveal the full solution and answer." }
    const updated = [...messages, userMessage]

    setLoading(true)
    saveMessages(updated, activeId)
    const reply = await callApi(updated)
    saveMessages([...updated, { role: "assistant", content: reply }], activeId)
    setPracticeActive(false)
    setAttemptCount(0)
    setLoading(false)
  }

  function handleModeChange(newMode: "chat" | "practice") {
    setMode(newMode)
    setAttemptCount(0)
    setPracticeActive(false)
  }

  const showRevealButton = mode === "practice" && practiceActive && attemptCount >= MAX_ATTEMPTS

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-lg"
            title="Toggle sidebar"
          >
            ☰
          </button>
          <div>
            <h1 className="text-xl font-bold text-indigo-700 dark:text-indigo-400 tracking-tight leading-none">TutorMate</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Your AI study companion</p>
          </div>
        </div>
        <Logo />
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        <Sidebar
          open={sidebarOpen}
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={startNewChat}
          onDelete={deleteConversation}
        />

        {/* Main */}
        <main className="flex flex-1 flex-col overflow-hidden p-4 gap-3">

          {/* Controls */}
          <div className="flex gap-3 items-end shrink-0">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Exam / Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mode</label>
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                {(["chat", "practice"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      mode === m
                        ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {m === "chat" ? "💬 Chat" : "📝 Practice"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat window */}
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-3">
                <span className="text-5xl">{mode === "practice" ? "📝" : "🧮"}</span>
                <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs">
                  {mode === "practice"
                    ? `Click "Get Practice Problem" to receive a question for ${subject.split(" ")[0]}.`
                    : "Ask a question or say \"explain this topic\" to get started."}
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && <span className="mr-2 mt-1 text-lg shrink-0">🤖</span>}
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm whitespace-pre-wrap"
                    : "bg-indigo-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-sm prose prose-sm dark:prose-invert max-w-none"
                }`}>
                  {msg.role === "user" ? msg.content : (
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
                {msg.role === "user" && <span className="ml-2 mt-1 text-lg shrink-0">🧑‍🎓</span>}
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

          {/* Practice controls */}
          {mode === "practice" && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={getPracticeProblem}
                disabled={loading}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                {practiceActive ? "🔄 New Problem" : "🎯 Get Practice Problem"}
              </button>
              {practiceActive && (
                <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                  attemptCount >= MAX_ATTEMPTS
                    ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300"
                    : "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                }`}>
                  Attempt {Math.min(attemptCount, MAX_ATTEMPTS)} of {MAX_ATTEMPTS}
                </span>
              )}
              {showRevealButton && (
                <button
                  onClick={revealAnswer}
                  disabled={loading}
                  className="bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
                >
                  👁 Reveal Answer
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={mode === "practice" && practiceActive
                ? "Type your answer or ask for a hint…"
                : "Ask a question…"}
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
    </div>
  )
}
