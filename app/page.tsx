"use client"

import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import Sidebar from "./components/Sidebar"
import ExamView from "./components/ExamView"
import type { Message, Conversation } from "./types"

const SUBJECTS = [
  "Australian Mathematics Competition (AMC)",
  "Maths Olympiad",
  "ACER Exam",
  "ICAS",
  "ATAR",
  "NAPLAN",
]

const YEAR_LEVELS: Record<string, string[]> = {
  "Australian Mathematics Competition (AMC)": [
    "Year 3–6 (Primary)", "Year 7–8 (Junior)", "Year 9–10 (Intermediate)", "Year 11–12 (Senior)",
  ],
  "Maths Olympiad": [
    "Year 4–6 (Primary)", "Year 7–8 (Junior)", "Year 9–10 (Intermediate)",
  ],
  "ACER Exam": [
    "Year 3", "Year 4", "Year 5", "Year 6", "Year 7", "Year 8", "Year 9",
  ],
  "ICAS": [
    "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
    "Year 7", "Year 8", "Year 9", "Year 10", "Year 11", "Year 12",
  ],
  "ATAR": ["Year 11", "Year 12"],
  "NAPLAN": ["Year 3", "Year 5", "Year 7", "Year 9"],
}

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

function Wordmark() {
  return (
    <div className="flex flex-col leading-none select-none">
      <div
        className="font-black italic tracking-tight"
        style={{
          fontSize: "clamp(22px, 5.5vw, 34px)",
          fontFamily: '"Arial Black", Impact, system-ui',
          background: "linear-gradient(90deg, #00e5ff 0%, #4499ff 55%, #0055ff 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1.05,
        }}
      >
        Select
        <span
          style={{
            background: "linear-gradient(90deg, #ff44aa, #cc00ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Ed
        </span>
      </div>
      <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: "#16a34a" }}>Sharpen</span>
        <span style={{ color: "#9ca3af" }}>·</span>
        <span style={{ color: "#0284c7" }}>Sit</span>
        <span style={{ color: "#9ca3af" }}>·</span>
        <span style={{ color: "#d97706" }}>Succeed.</span>
      </div>
    </div>
  )
}

function Logo({ size = 56, style: extraStyle }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size, ...extraStyle }} viewBox="0 0 1024 1024" className="select-none shrink-0">
      <defs>
        <radialGradient id="lgBg" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#1a1060" /><stop offset="100%" stopColor="#0a0b1a" />
        </radialGradient>
        <radialGradient id="lgOrb" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#00e5ff" />
          <stop offset="65%" stopColor="#8833ff" />
          <stop offset="100%" stopColor="#2a1060" stopOpacity="0.7" />
        </radialGradient>
        <linearGradient id="lgSel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00e5ff" /><stop offset="55%" stopColor="#4499ff" /><stop offset="100%" stopColor="#0055ff" />
        </linearGradient>
        <linearGradient id="lgEd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ff44aa" /><stop offset="100%" stopColor="#cc00ff" />
        </linearGradient>
        <linearGradient id="lgArc" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00e5ff" /><stop offset="50%" stopColor="#8844ff" /><stop offset="100%" stopColor="#ff44aa" />
        </linearGradient>
        <filter id="lgNB" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lgNG" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lgTG" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="lgSG" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* background */}
      <rect width="1024" height="1024" fill="url(#lgBg)"/>
      <circle cx="320" cy="340" r="3" fill="#00e5ff" opacity="0.6"/>
      <circle cx="280" cy="480" r="2.5" fill="#8844ff" opacity="0.5"/>
      <circle cx="450" cy="280" r="2" fill="#00ff80" opacity="0.5"/>
      <circle cx="660" cy="265" r="2.5" fill="#ffd700" opacity="0.6"/>
      <circle cx="380" cy="520" r="2" fill="#00e5ff" opacity="0.4"/>
      <circle cx="700" cy="340" r="2" fill="#ff44aa" opacity="0.4"/>

      {/* orbit trail */}
      <path d="M80 560 Q200 380 350 420 Q500 460 560 380" stroke="url(#lgArc)" strokeWidth="2.5" fill="none" opacity="0.4"/>
      <circle cx="145" cy="508" r="7" fill="#00e5ff" opacity="0.55" filter="url(#lgNB)"/>
      <circle cx="110" cy="535" r="5" fill="#00e5ff" opacity="0.4" filter="url(#lgNB)"/>
      <circle cx="82" cy="557" r="3.5" fill="#8844ff" opacity="0.5"/>

      {/* orb */}
      <circle cx="270" cy="415" r="100" fill="#00e5ff" opacity="0.06"/>
      <ellipse cx="270" cy="438" rx="100" ry="42" stroke="#8833ff" strokeWidth="2.5" fill="none" opacity="0.65" filter="url(#lgNB)"/>
      <circle cx="270" cy="415" r="70" fill="url(#lgOrb)"/>
      <ellipse cx="246" cy="390" rx="22" ry="14" fill="white" opacity="0.75"/>
      <ellipse cx="238" cy="385" rx="8" ry="5" fill="white" opacity="0.9"/>

      {/* stair 1 */}
      <rect x="380" y="470" width="150" height="105" fill="#18105a" stroke="#2244bb" strokeWidth="1.5"/>
      <polygon points="380,470 530,470 575,445 425,445" fill="#1d1568" stroke="#00ff80" strokeWidth="2"/>
      <line x1="380" y1="470" x2="530" y2="470" stroke="#00ff80" strokeWidth="3" opacity="0.85" filter="url(#lgNG)"/>
      <polygon points="530,470 575,445 575,575 530,575" fill="#130d4a" stroke="#2244bb" strokeWidth="1"/>

      {/* stair 2 */}
      <rect x="530" y="370" width="150" height="205" fill="#18105a" stroke="#2244bb" strokeWidth="1.5"/>
      <polygon points="530,370 680,370 725,345 575,345" fill="#1d1568" stroke="#00ff80" strokeWidth="2"/>
      <line x1="530" y1="370" x2="680" y2="370" stroke="#00ff80" strokeWidth="3" opacity="0.85" filter="url(#lgNG)"/>
      <polygon points="680,370 725,345 725,575 680,575" fill="#130d4a" stroke="#2244bb" strokeWidth="1"/>

      {/* stair 3 */}
      <rect x="680" y="280" width="150" height="295" fill="#1a1060" stroke="#8844ff" strokeWidth="1.5"/>
      <polygon points="680,280 830,280 875,255 725,255" fill="#221878" stroke="#00ff80" strokeWidth="2"/>
      <line x1="680" y1="280" x2="830" y2="280" stroke="#00ff80" strokeWidth="3" opacity="0.85" filter="url(#lgNG)"/>
      <polygon points="830,280 875,255 875,575 830,575" fill="#14104a" stroke="#8844ff" strokeWidth="1"/>

      {/* pencil on stair 2 */}
      <g transform="translate(610,355) rotate(-30)">
        <rect x="-9" y="-40" width="18" height="62" rx="3" fill="#00ff80" opacity="0.9" filter="url(#lgNG)"/>
        <polygon points="-9,22 9,22 0,42" fill="#a3ff00"/>
        <rect x="-9" y="-48" width="18" height="10" rx="2" fill="#ffcc00"/>
      </g>

      {/* chair icon stair 3 */}
      <g transform="translate(760,420)" opacity="0.55">
        <rect x="-22" y="-36" width="44" height="24" rx="3" fill="none" stroke="#00e5ff" strokeWidth="2.5"/>
        <rect x="-22" y="-14" width="44" height="6" rx="2" fill="#00e5ff"/>
        <line x1="-14" y1="-8" x2="-14" y2="22" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1="14" y1="-8" x2="14" y2="22" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round"/>
      </g>

      {/* star stair 3 */}
      <g transform="translate(748,263)" filter="url(#lgSG)">
        <polygon points="0,-26 7.6,-10.4 24,-10.4 11.2,3.6 16.4,20 0,9.6 -16.4,20 -11.2,3.6 -24,-10.4 -7.6,-10.4" fill="#ffd700" stroke="#ffaa00" strokeWidth="1.5"/>
      </g>

      {/* student shadow */}
      <ellipse cx="590" cy="492" rx="70" ry="14" fill="#6622cc" opacity="0.28"/>

      {/* backpack */}
      <rect x="555" y="278" width="52" height="68" rx="8" fill="#9933cc"/>
      <rect x="558" y="293" width="12" height="44" rx="4" fill="#bb55ee" opacity="0.7"/>
      <rect x="573" y="293" width="12" height="44" rx="4" fill="#bb55ee" opacity="0.7"/>
      <path d="M558 345 Q548 368 554 385" stroke="#bb55ee" strokeWidth="5" fill="none" strokeLinecap="round"/>

      {/* body */}
      <path d="M556 315 Q545 360 550 395 Q565 408 588 402 Q608 392 606 355 Q602 318 582 310 Z" fill="#2244cc"/>
      <path d="M575 312 Q600 320 604 355 Q600 392 588 402" fill="#3355dd" opacity="0.5"/>

      {/* right arm forward */}
      <path d="M600 332 Q618 320 628 315" stroke="#d4926a" strokeWidth="14" fill="none" strokeLinecap="round"/>
      <rect x="618" y="305" width="20" height="10" rx="4" fill="#8833ff"/>
      <ellipse cx="628" cy="315" rx="10" ry="9" fill="#d4926a"/>

      {/* left arm back */}
      <path d="M560 340 Q540 355 528 362" stroke="#d4926a" strokeWidth="13" fill="none" strokeLinecap="round"/>

      {/* shorts */}
      <path d="M552 393 Q547 428 544 455 L568 458 L574 430 L580 458 L604 455 Q602 425 600 400 Z" fill="#2244cc"/>

      {/* right leg back */}
      <path d="M548 452 Q540 472 536 498" stroke="#d4926a" strokeWidth="14" fill="none" strokeLinecap="round"/>
      <path d="M524 495 Q518 512 536 518 Q554 522 562 513 L545 498 Z" fill="#0055ff"/>
      <path d="M527 510 Q540 518 560 512" stroke="white" strokeWidth="2" fill="none" opacity="0.55"/>

      {/* left leg forward */}
      <path d="M574 455 Q580 472 588 490" stroke="#d4926a" strokeWidth="14" fill="none" strokeLinecap="round"/>
      <path d="M588 490 Q594 505 592 518" stroke="#d4926a" strokeWidth="13" fill="none" strokeLinecap="round"/>
      <path d="M578 515 Q572 532 592 537 Q610 540 618 530 L600 518 Z" fill="#0066ff"/>
      <path d="M574 530 Q591 538 617 530" stroke="#00ff80" strokeWidth="3" fill="none" filter="url(#lgNG)"/>

      {/* neck */}
      <rect x="567" y="297" width="18" height="18" rx="5" fill="#d4926a"/>

      {/* head */}
      <circle cx="578" cy="268" r="40" fill="#d4926a"/>

      {/* hair under cap */}
      <path d="M542 262 Q548 235 578 230 Q608 228 614 255" fill="#222222"/>

      {/* cap */}
      <path d="M542 262 Q548 230 578 225 Q608 228 614 258 Q610 268 578 272 Q546 270 542 262 Z" fill="#2244cc"/>
      <path d="M536 264 Q548 258 578 260 Q608 262 618 268 Q608 276 578 274 Q548 272 536 264 Z" fill="#1a38aa"/>
      <circle cx="578" cy="228" r="5.5" fill="#3355cc"/>

      {/* ear */}
      <ellipse cx="540" cy="276" rx="9" ry="11" fill="#d4926a"/>
      <ellipse cx="541" cy="276" rx="5" ry="7" fill="#c4825a"/>

      {/* eyes */}
      <ellipse cx="563" cy="273" rx="7" ry="8" fill="white"/>
      <circle cx="565" cy="275" r="4.5" fill="#222"/>
      <circle cx="567" cy="273" r="1.8" fill="white"/>
      <ellipse cx="586" cy="271" rx="6" ry="7" fill="white"/>
      <circle cx="588" cy="273" r="4" fill="#222"/>
      <circle cx="590" cy="271" r="1.5" fill="white"/>

      {/* eyebrows */}
      <path d="M556 263 Q563 259 569 261" stroke="#222" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
      <path d="M581 260 Q588 257 594 259" stroke="#222" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* nose + smile */}
      <circle cx="577" cy="282" r="3" fill="#c4825a"/>
      <path d="M566 291 Q577 300 588 293" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

      {/* flag pole */}
      <line x1="848" y1="155" x2="848" y2="310" stroke="#dddddd" strokeWidth="5" strokeLinecap="round"/>
      {/* flag */}
      <rect x="848" y="153" width="130" height="88" fill="white" rx="2"/>
      <rect x="848" y="153" width="22" height="22" fill="#111"/>
      <rect x="892" y="153" width="22" height="22" fill="#111"/>
      <rect x="936" y="153" width="22" height="22" fill="#111"/>
      <rect x="870" y="175" width="22" height="22" fill="#111"/>
      <rect x="914" y="175" width="22" height="22" fill="#111"/>
      <rect x="848" y="197" width="22" height="22" fill="#111"/>
      <rect x="892" y="197" width="22" height="22" fill="#111"/>
      <rect x="936" y="197" width="22" height="22" fill="#111"/>
      <rect x="870" y="219" width="22" height="22" fill="#111"/>
      <rect x="914" y="219" width="22" height="22" fill="#111"/>

      {/* stars near flag */}
      <g transform="translate(808,162)" filter="url(#lgSG)">
        <polygon points="0,-30 8.7,-11.5 28,-11.5 13,3 19,23 0,11 -19,23 -13,3 -28,-11.5 -8.7,-11.5" fill="#ffd700" stroke="#ffcc00" strokeWidth="1.5"/>
      </g>
      <g transform="translate(838,130)" filter="url(#lgSG)">
        <polygon points="0,-18 5.2,-6.9 16.8,-6.9 7.8,1.8 11.4,13.8 0,6.6 -11.4,13.8 -7.8,1.8 -16.8,-6.9 -5.2,-6.9" fill="#ffd700"/>
      </g>
      <circle cx="780" cy="178" r="5" fill="#ffd700" opacity="0.7" filter="url(#lgSG)"/>
      <circle cx="770" cy="158" r="3" fill="#ffd700" opacity="0.5"/>

      {/* bottom arc */}
      <path d="M130 650 Q512 750 894 650" stroke="url(#lgArc)" strokeWidth="3.5" fill="none" filter="url(#lgNB)" opacity="0.75"/>
      <path d="M145 656 Q512 742 878 656" stroke="url(#lgArc)" strokeWidth="1.5" fill="none" opacity="0.35"/>

      {/* SelectEd glow layer */}
      <text x="512" y="795" textAnchor="middle" fontFamily='"Arial Black",Impact,system-ui' fontSize="148" fontWeight="900" fontStyle="italic" opacity="0.5" filter="url(#lgTG)">
        <tspan fill="#00e5ff">Select</tspan><tspan fill="#ff44aa">Ed</tspan>
      </text>
      {/* SelectEd main */}
      <text x="512" y="795" textAnchor="middle" fontFamily='"Arial Black",Impact,system-ui' fontSize="148" fontWeight="900" fontStyle="italic">
        <tspan fill="url(#lgSel)">Select</tspan><tspan fill="url(#lgEd)">Ed</tspan>
      </text>

      {/* tagline */}
      <text x="512" y="858" textAnchor="middle" fontFamily='"Segoe UI",Arial,system-ui' fontSize="34" fontWeight="600" letterSpacing="1">
        <tspan fill="#00ff80">Sharpen</tspan>
        <tspan fill="#888888" dx="6"> · </tspan>
        <tspan fill="#00aaff">Sit</tspan>
        <tspan fill="#888888" dx="6"> · </tspan>
        <tspan fill="#ffaa00">Succeed.</tspan>
      </text>
    </svg>
  )
}

export default function Home() {
  const [splashDone, setSplashDone] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"chat" | "practice" | "exam">("chat")
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [yearLevel, setYearLevel] = useState(YEAR_LEVELS[SUBJECTS[0]][0])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [practiceActive, setPracticeActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const activeConv = conversations.find(c => c.id === activeId)
  const messages = activeConv?.messages ?? []

  useEffect(() => {
    setConversations(loadConversations())

    // Track the sm breakpoint (640px) so the sidebar follows orientation changes.
    // Crossing below 640px forces it closed; crossing above reopens it.
    const smMq = window.matchMedia("(min-width: 640px)")
    setSidebarOpen(smMq.matches)
    const smHandler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches)
    smMq.addEventListener("change", smHandler)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    setIsDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener("change", handler)

    return () => {
      smMq.removeEventListener("change", smHandler)
      mq.removeEventListener("change", handler)
    }
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
        mode: mode === "exam" ? "chat" : mode,
        createdAt: new Date().toISOString(),
      }
      return [...prev, newConv]
    })
  }

  function handleSubjectChange(newSubject: string) {
    setSubject(newSubject)
    setYearLevel(YEAR_LEVELS[newSubject][0])
  }

  async function callApi(msgs: Message[]) {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, subject, yearLevel, mode }),
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

  function handleModeChange(newMode: "chat" | "practice" | "exam") {
    setMode(newMode)
    setAttemptCount(0)
    setPracticeActive(false)
  }

  const showRevealButton = mode === "practice" && practiceActive && attemptCount >= MAX_ATTEMPTS

  if (!splashDone) {
    return (
      <div
        className="relative h-[100dvh] flex flex-col items-center justify-center gap-6 sm:gap-8 overflow-hidden"
        style={{ backgroundColor: "#0a0b1a" }}
      >
        {/* background glow blobs */}
        <div className="absolute w-48 h-48 sm:w-96 sm:h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#7c3aed", top: "10%", left: "10%" }} />
        <div className="absolute w-40 h-40 sm:w-80 sm:h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#0ea5e9", bottom: "15%", right: "12%" }} />

        <Logo size={320} style={{ width: "min(70vw, 320px)", height: "auto" }} />

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setSplashDone(true)}
            className="px-10 py-4 rounded-full text-white font-bold text-xl tracking-wide transition-all hover:scale-105 active:scale-95 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #00e5ff 0%, #7c3aed 50%, #ff44aa 100%)",
              boxShadow: "0 0 32px #7c3aed88",
            }}
          >
            Start Learning →
          </button>
          <p className="text-sm" style={{ color: "#4a5568" }}>
            AI-powered prep for AMC · Maths Olympiad · ACER · ICAS · ATAR · NAPLAN
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">

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
          <button onClick={() => setSplashDone(false)} className="text-left hover:opacity-80 transition-opacity">
            <Wordmark />
          </button>
        </div>
        <Logo size={56} />
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Mobile backdrop — cursor-pointer required for iOS Safari touch events */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 sm:hidden cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          open={sidebarOpen}
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={startNewChat}
          onDelete={deleteConversation}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main */}
        <main className="flex flex-1 flex-col overflow-hidden p-2 sm:p-4 gap-3">

          {/* Controls */}
          <div className="flex gap-3 items-end shrink-0 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Exam / Subject</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[100px]">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Year Level</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {YEAR_LEVELS[subject].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Mode</label>
              <div className="flex border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                {(["chat", "practice", "exam"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      mode === m
                        ? "bg-indigo-600 dark:bg-indigo-500 text-white"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {m === "chat" ? "💬 Chat" : m === "practice" ? "📝 Practice" : "⏱️ Exam"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Exam mode */}
          {mode === "exam" && <ExamView subject={subject} yearLevel={yearLevel} />}

          {/* Chat / Practice window */}
          {mode !== "exam" && (
            <div
              className="flex-1 overflow-y-auto rounded-2xl shadow-sm"
              style={mode === "chat" ? {
                backgroundColor: isDark ? "#0d1117" : "#fefce8",
                backgroundImage: [
                  isDark
                    ? "linear-gradient(90deg, transparent 72px, #3d1530 72px, #3d1530 74px, transparent 74px)"
                    : "linear-gradient(90deg, transparent 72px, #fca5a5 72px, #fca5a5 74px, transparent 74px)",
                  isDark
                    ? "repeating-linear-gradient(transparent 0px, transparent 31px, #1a2744 31px, #1a2744 32px)"
                    : "repeating-linear-gradient(transparent 0px, transparent 31px, #bfdbfe 31px, #bfdbfe 32px)",
                ].join(", "),
                backgroundAttachment: "local",
                padding: "12px 0 12px 0",
              } : { padding: "16px" }}
            >
              {/* NOTEBOOK CHAT MODE */}
              {mode === "chat" && (
                <div style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ paddingLeft: 80 }}>
                      <p style={{ color: isDark ? "#475569" : "#94a3b8", fontSize: 22 }}>Open your notebook and ask anything…</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      style={{
                        paddingLeft: 80,
                        paddingRight: 24,
                        paddingTop: 6,
                        paddingBottom: 6,
                      }}
                    >
                      <span style={{
                        fontSize: 11,
                        fontFamily: "system-ui",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        color: msg.role === "user"
                          ? (isDark ? "#818cf8" : "#6366f1")
                          : (isDark ? "#f59e0b" : "#b45309"),
                        textTransform: "uppercase",
                      }}>
                        {msg.role === "user" ? "You" : "Tutor"}
                      </span>
                      <div style={{
                        fontSize: 20,
                        lineHeight: "32px",
                        color: msg.role === "user"
                          ? (isDark ? "#93c5fd" : "#1e3a5f")
                          : (isDark ? "#fde68a" : "#431407"),
                      }}
                        className={msg.role === "assistant" ? "prose prose-sm max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1 [&_*]:!text-inherit" : ""}
                      >
                        {msg.role === "user" ? (
                          <span>{msg.content}</span>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ paddingLeft: 80, paddingTop: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: "system-ui", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: isDark ? "#f59e0b" : "#b45309" }}>Tutor</span>
                      <div style={{ fontSize: 22, color: isDark ? "#fde68a" : "#b45309" }}>
                        <span className="animate-pulse">✏️</span>
                        <span className="animate-pulse" style={{ marginLeft: 4 }}>|</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}

              {/* PRACTICE / NON-NOTEBOOK MODE */}
              {mode === "practice" && (
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-3">
                      <span className="text-5xl">📝</span>
                      <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs">
                        Click &quot;Get Practice Problem&quot; to receive a question for {subject.split(" ")[0]}.
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
              )}
            </div>
          )}

          {/* Practice controls */}
          {mode !== "exam" && mode === "practice" && (
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
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
          {mode !== "exam" && <div className="flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={mode === "practice" && practiceActive
                ? "Type your answer or ask for a hint…"
                : "Write your question here…"}
              className="flex-1 border rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              style={mode === "chat" ? {
                fontFamily: "var(--font-caveat), Caveat, cursive",
                fontSize: 20,
                backgroundColor: isDark ? "#0d1117" : "#fefce8",
                borderColor: isDark ? "#1a2744" : "#bfdbfe",
                color: isDark ? "#93c5fd" : "#1e3a5f",
              } : {
                fontSize: 14,
                backgroundColor: isDark ? undefined : "white",
                borderColor: isDark ? undefined : "#e5e7eb",
                color: isDark ? undefined : "#1f2937",
              }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
            >
              Send
            </button>
          </div>}

        </main>
      </div>
    </div>
  )
}
