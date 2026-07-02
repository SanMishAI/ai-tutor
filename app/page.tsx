"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import LandingPage from "./components/landing/LandingPage"
import Sidebar from "./components/Sidebar"
import ExamView from "./components/ExamView"
import BreakZone from "./components/BreakZone"
import FeedbackForm from "./components/FeedbackForm"
import WelcomeScreen from "./components/WelcomeScreen"
import StreakBadge from "./components/StreakBadge"
import ArcadeMode from "./components/arcade/ArcadeMode"
import StudyMode from "./components/study/StudyMode"
import ChildLoginScreen from "./components/ChildLoginScreen"
import StudentDashboard from "./components/StudentDashboard"
import UpgradeModal from "./components/UpgradeModal"
import GuestLimitModal from "./components/GuestLimitModal"
import type { Message, Conversation } from "./types"

type ChildSession = { token: string; id: string; name: string; avatarEmoji: string }
const CHILD_SESSION_KEY = "selected_child_session"

function loadChildSession(): ChildSession | null {
  if (typeof window === "undefined") return null
  try { return JSON.parse(localStorage.getItem(CHILD_SESSION_KEY) ?? "null") } catch { return null }
}
function saveChildSession(s: ChildSession) {
  localStorage.setItem(CHILD_SESSION_KEY, JSON.stringify(s))
}
function clearChildSession() {
  localStorage.removeItem(CHILD_SESSION_KEY)
}

const SUBJECTS = [
  "Australian Mathematics Competition (AMC)",
  "Maths Olympiad",
  "ACER Exam",
  "ICAS",
  "ATAR",
  "NAPLAN",
  "Bebras",
  "Kangourou sans frontières (KSF)",
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
  "Bebras": [
    "Year 3–4", "Year 5–6", "Year 7–8", "Year 9–10", "Year 11–12",
  ],
  "Kangourou sans frontières (KSF)": [
    "Year 3–4 (Känguru)", "Year 5–6 (Cadet)", "Year 7–8 (Junior)", "Year 9–10 (Student)", "Year 11–12 (Senior)",
  ],
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
          background: "linear-gradient(90deg, #56DBFF 0%, #0066CB 60%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1.05,
        }}
      >
        Select
        <span
          style={{
            background: "linear-gradient(90deg, #FDC800, #E34C00)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Ed
        </span>
      </div>
      <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 13, fontWeight: 600 }}>
        <span style={{ color: "#FDC800" }}>Sharpen</span>
        <span style={{ color: "#9ca3af" }}>·</span>
        <span style={{ color: "#1DA4F3" }}>Sit</span>
        <span style={{ color: "#9ca3af" }}>·</span>
        <span style={{ color: "#E34C00" }}>Succeed.</span>
      </div>
    </div>
  )
}

// Wordmark for light backgrounds (navy + orange, not gradient on sky-blue)
function WordmarkLight({ small = false }: { small?: boolean }) {
  return (
    <div className="flex flex-col leading-none select-none">
      <div className="font-black italic tracking-tight"
        style={{ fontSize: small ? 19 : 24, fontFamily: '"Arial Black", system-ui', lineHeight: 1.05 }}>
        <span style={{ color: "#000936" }}>Select</span><span style={{ color: "#E34C00" }}>Ed</span>
      </div>
      <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: small ? 9 : 10, fontWeight: 600 }}>
        <span style={{ color: "#0066CB" }}>Sharpen</span>
        <span style={{ color: "#CBD5E1" }}>·</span>
        <span style={{ color: "#000936" }}>Sit</span>
        <span style={{ color: "#CBD5E1" }}>·</span>
        <span style={{ color: "#E34C00" }}>Succeed.</span>
      </div>
    </div>
  )
}

function AuthButton() {
  const { isSignedIn } = useUser()
  if (isSignedIn) {
    return <UserButton />
  }
  return (
    <SignInButton mode="modal">
      <button className="text-sm font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90"
        style={{ background: "#000936", color: "#FDC800" }}>
        Sign in
      </button>
    </SignInButton>
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
  const [mounted, setMounted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [introSeen, setIntroSeen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"chat" | "practice" | "exam" | "adventure" | "study" | "break">("study")
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [yearLevel, setYearLevel] = useState(YEAR_LEVELS[SUBJECTS[0]][0])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [practiceActive, setPracticeActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isSignedIn, user } = useUser()
  const isFounder = user?.primaryEmailAddress?.emailAddress === process.env.NEXT_PUBLIC_FOUNDER_EMAIL

  const [showStartChoice, setShowStartChoice] = useState(false)
  const [showMathCaptcha, setShowMathCaptcha] = useState(false)
  const [mathQ, setMathQ] = useState<[number, number]>([4, 7])
  const [mathA, setMathA] = useState("")
  const [mathErr, setMathErr] = useState("")
  const router = useRouter()

  // Child session
  const [childSession, setChildSession] = useState<ChildSession | null>(null)
  const [showChildLogin, setShowChildLogin] = useState(false)
  const [showStudentDashboard, setShowStudentDashboard] = useState(false)
  const prevSignedInRef = useRef<boolean | undefined>(undefined)

  // Usage tracking
  const GUEST_DAILY_LIMIT = 10
  const GUEST_USAGE_KEY = "selected_guest_usage"
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState<number | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState<{ reason: "limit" | "feature"; featureName?: string } | null>(null)
  const [guestCount, setGuestCount] = useState(0)
  const [guestLimitModal, setGuestLimitModal] = useState<{ reason: "limit" | "feature"; featureName?: string } | null>(null)

  useEffect(() => {
    const s = loadChildSession()
    if (s) setChildSession(s)
  }, [])

  // Skip landing page for returning users — must set mounted AFTER state so render is synchronous
  useEffect(() => {
    const seen = localStorage.getItem("selected_intro_seen") === "1"
    if (seen) {
      setSplashDone(true)
      setIntroSeen(true)
    }
    setMounted(true)
  }, [])

  // Load today's guest question count from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(GUEST_USAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw)
      const today = new Date().toISOString().slice(0, 10)
      if (data.date === today) setGuestCount(data.count)
    } catch { /* ignore */ }
  }, [])

  // Store parentId in localStorage when a parent is signed in (so children can log in on this device)
  useEffect(() => {
    if (user?.id) localStorage.setItem("selected_parent_id", user.id)
  }, [user?.id])

  useEffect(() => {
    if (!childSession) return
    fetch("/api/usage", { headers: { "x-child-token": childSession.token } })
      .then(r => r.json())
      .then(d => { setUsageCount(d.count ?? 0); setUsageLimit(d.limit ?? null); setIsPremium(d.isPremium ?? false) })
      .catch(() => {})
  }, [childSession])

  function handleChildLogin(token: string, child: { id: string; name: string; avatarEmoji: string }) {
    const session = { token, ...child }
    saveChildSession(session)
    setChildSession(session)
    setShowChildLogin(false)
    setShowStudentDashboard(true)
    // splashDone stays false until student taps "Start Studying" on dashboard
  }

  function handleChildLogout() {
    clearChildSession()
    setChildSession(null)
    setShowStudentDashboard(false)
    setSplashDone(false)
    setIntroSeen(false)
    localStorage.removeItem("selected_intro_seen")
  }

  function openMathCaptcha() {
    const a = Math.ceil(Math.random() * 9)
    const b = Math.ceil(Math.random() * 9)
    setMathQ([a, b]); setMathA(""); setMathErr("")
    setShowStartChoice(false)
    setShowMathCaptcha(true)
  }

  function verifyMath() {
    if (parseInt(mathA) !== mathQ[0] + mathQ[1]) {
      setMathErr("Incorrect — try again")
      const a = Math.ceil(Math.random() * 9)
      const b = Math.ceil(Math.random() * 9)
      setMathQ([a, b]); setMathA("")
      return
    }
    setShowMathCaptcha(false)
    router.push("/sign-up")
  }

  async function trackUsage(): Promise<boolean> {
    // Founder: always allowed
    if (isFounder) return true

    // Child session: server-side tracking
    if (childSession) {
      if (isPremium) return true
      if (usageLimit !== null && usageCount >= usageLimit) {
        setUpgradeModal({ reason: "limit" })
        return false
      }
      try {
        const res = await fetch("/api/usage", { method: "POST", headers: { "x-child-token": childSession.token } })
        const d = await res.json()
        setUsageCount(d.count ?? usageCount + 1)
        if (d.exceeded) { setUpgradeModal({ reason: "limit" }); return false }
      } catch { /* non-blocking */ }
      return true
    }

    // Signed-in parent (no child session): allow through
    if (isSignedIn) return true

    // Guest: localStorage 20/day limit
    const today = new Date().toISOString().slice(0, 10)
    let data = { count: 0, date: today }
    try {
      const raw = localStorage.getItem(GUEST_USAGE_KEY)
      if (raw) data = JSON.parse(raw)
    } catch { /* ignore */ }
    const todayCount = data.date === today ? data.count : 0
    if (todayCount >= GUEST_DAILY_LIMIT) {
      setGuestLimitModal({ reason: "limit" })
      return false
    }
    const newCount = todayCount + 1
    localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify({ count: newCount, date: today }))
    setGuestCount(newCount)
    return true
  }

  function checkPremiumFeature(featureName: string): boolean {
    if (isFounder || isPremium) return true
    // Guest or child without premium: gate premium features
    if (!childSession && !isSignedIn) {
      setGuestLimitModal({ reason: "feature", featureName })
      return false
    }
    if (childSession) {
      setUpgradeModal({ reason: "feature", featureName })
      return false
    }
    return true
  }

  const activeConv = conversations.find(c => c.id === activeId)
  const messages = activeConv?.messages ?? []

  // Auth state → app state sync
  useEffect(() => {
    if (isSignedIn === undefined) return

    if (isSignedIn) {
      // Parent is signed in: enter the app and scrub the localStorage flag NOW,
      // so that when Clerk redirects on sign-out the flag is already gone on reload.
      setSplashDone(true)
      setIntroSeen(true)
      localStorage.removeItem("selected_intro_seen")
      // Load conversations from cloud
      fetch("/api/conversations")
        .then(r => r.json())
        .then((data: Conversation[]) => { if (Array.isArray(data)) setConversations(data) })
        .catch(() => setConversations(loadConversations()))
    } else {
      setConversations(loadConversations())
      // If a parent was previously signed in (in-place sign-out, no redirect), reset to landing page
      if (prevSignedInRef.current === true && !childSession) {
        setSplashDone(false)
        setIntroSeen(false)
      }
    }
    prevSignedInRef.current = isSignedIn
  }, [isSignedIn, childSession])

  // Persist to localStorage when guest
  useEffect(() => {
    if (!isSignedIn && conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    }
  }, [conversations, isSignedIn])

  useEffect(() => {
    // Track the sm breakpoint (640px) so the sidebar follows orientation changes.
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
    if (isSignedIn) {
      fetch("/api/conversations", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    }
    if (activeId === id) {
      setActiveId(null)
      setAttemptCount(0)
      setPracticeActive(false)
    }
  }

  function saveMessages(msgs: Message[], convId: string, title?: string) {
    setConversations(prev => {
      const exists = prev.find(c => c.id === convId)
      let updated: Conversation[]
      if (exists) {
        updated = prev.map(c => c.id === convId ? { ...c, messages: msgs } : c)
      } else {
        const newConv: Conversation = {
          id: convId,
          title: title ?? "New conversation",
          subject,
          yearLevel,
          messages: msgs,
          mode: (mode === "exam" || mode === "adventure" || mode === "study" || mode === "break") ? "chat" : mode,
          createdAt: new Date().toISOString(),
        }
        updated = [...prev, newConv]
      }
      const conv = updated.find(c => c.id === convId)!
      if (isSignedIn) {
        fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(conv),
        })
      }
      return updated
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
    const allowed = await trackUsage()
    if (!allowed) return

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
    const allowed = await trackUsage()
    if (!allowed) return
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

  function handleModeChange(newMode: "chat" | "practice" | "exam" | "adventure" | "study" | "break") {
    if ((newMode === "exam" || newMode === "adventure" || newMode === "study") && !checkPremiumFeature(newMode === "exam" ? "Exam Mode" : newMode === "adventure" ? "Adventure Mode" : "Study Mode")) return
    setMode(newMode)
    setAttemptCount(0)
    setPracticeActive(false)
  }

  const showRevealButton = mode === "practice" && practiceActive && attemptCount >= MAX_ATTEMPTS

  // Child login screen
  if (showChildLogin && !childSession) {
    const storedParentId = typeof window !== "undefined" ? localStorage.getItem("selected_parent_id") ?? "" : ""
    return (
      <ChildLoginScreen
        parentId={storedParentId}
        onLogin={handleChildLogin}
        onBack={() => setShowChildLogin(false)}
      />
    )
  }

  // Student dashboard (shown right after child login, before entering the app)
  if (showStudentDashboard && childSession) {
    return (
      <StudentDashboard
        childName={childSession.name}
        avatarEmoji={childSession.avatarEmoji}
        token={childSession.token}
        onStartStudying={() => {
          setShowStudentDashboard(false)
          setSplashDone(true)
          setIntroSeen(true)
          localStorage.setItem("selected_intro_seen", "1")
        }}
        onLogout={handleChildLogout}
      />
    )
  }

  if (splashDone && !introSeen) {
    return (
      <WelcomeScreen
        onStart={(sub, yr, m) => {
          setSubject(sub)
          setYearLevel(yr)
          setMode(m as "chat" | "practice" | "exam" | "adventure" | "study")
          setIntroSeen(true)
          localStorage.setItem("selected_intro_seen", "1")
        }}
        onBack={() => setSplashDone(false)}
      />
    )
  }

  if (!splashDone) {
    if (!mounted) return <div className="min-h-screen" style={{ background: "#000936" }} />
    return (
      <LandingPage
        onOpenApp={() => setSplashDone(true)}
        onStudentLogin={() => setShowChildLogin(true)}
        isSignedIn={isSignedIn === true}
      />
    )
  }

  return (
    <div className="h-[100dvh] flex flex-col" style={{ background: "#f8fafc" }}>
      {upgradeModal && (
        <UpgradeModal reason={upgradeModal.reason} featureName={upgradeModal.featureName} onClose={() => setUpgradeModal(null)} />
      )}
      {guestLimitModal && (
        <GuestLimitModal reason={guestLimitModal.reason} featureName={guestLimitModal.featureName} onClose={() => setGuestLimitModal(null)} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          {!childSession && (
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors text-lg"
              title="Toggle sidebar"
            >
              ☰
            </button>
          )}
          <button onClick={() => { if (!childSession) setSplashDone(false) }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/selected-logo.svg" alt="SelectEd" style={{ width: 30, height: 30, objectFit: "contain" }} />
            <WordmarkLight small />
          </button>
        </div>
        <div className="flex items-center gap-3">
          {childSession ? (
            <>
              {usageLimit !== null && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{
                    background: usageCount >= usageLimit ? "#fef2f2" : "#f1f5f9",
                    color: usageCount >= usageLimit ? "#b91c1c" : "#64748b",
                  }}>
                  {usageCount}/{usageLimit} today
                </span>
              )}
              <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                {childSession.avatarEmoji} {childSession.name}
              </span>
              <button onClick={handleChildLogout}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                style={{ color: "#94a3b8" }}>
                Exit
              </button>
            </>
          ) : (
            <>
              <StreakBadge />
              {/* Guest usage counter — visible only when not signed in */}
              {!isSignedIn && guestCount > 0 && (
                <button
                  onClick={() => guestCount >= GUEST_DAILY_LIMIT ? setGuestLimitModal({ reason: "limit" }) : undefined}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors"
                  style={{
                    borderColor: guestCount >= GUEST_DAILY_LIMIT ? "#fca5a5" : "#e2e8f0",
                    background: guestCount >= GUEST_DAILY_LIMIT ? "#fef2f2" : "#f8fafc",
                    color: guestCount >= GUEST_DAILY_LIMIT ? "#dc2626" : "#64748b",
                    cursor: guestCount >= GUEST_DAILY_LIMIT ? "pointer" : "default",
                  }}>
                  <span>{guestCount}/{GUEST_DAILY_LIMIT}</span>
                  <span style={{ color: "#94a3b8" }}>questions today</span>
                </button>
              )}
              <AuthButton />
            </>
          )}
        </div>
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

        {!childSession && (
          <Sidebar
            open={sidebarOpen}
            conversations={conversations}
            activeId={activeId}
            onSelect={selectConversation}
            onNew={startNewChat}
            onDelete={deleteConversation}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main */}
        <main className="flex flex-1 flex-col overflow-hidden p-2 sm:p-4 gap-3">

          {/* Controls */}
          <div className="flex gap-3 items-end shrink-0 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>Exam / Subject</label>
              <select
                value={subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full p-2 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                style={{ border: "1px solid #e2e8f0", background: "white", color: "#334155" }}
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[100px]">
              <label className="block text-xs font-semibold mb-1" style={{ color: "#94a3b8" }}>Year Level</label>
              <select
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
                className="w-full p-2 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2"
                style={{ border: "1px solid #e2e8f0", background: "white", color: "#334155" }}
              >
                {YEAR_LEVELS[subject].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Mode</label>
              <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {(["chat", "practice", "exam", "adventure", "study", "break"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className="flex-1 px-2 py-2 text-xs font-semibold transition-all whitespace-nowrap"
                    style={mode === m ? {
                      background: m === "adventure" ? "#14532d" : m === "study" ? "#1e40af" : m === "break" ? "#4c1d95" : "#000936",
                      color: m === "adventure" ? "#86efac" : m === "study" ? "#bfdbfe" : m === "break" ? "#ddd6fe" : "#FDC800",
                    } : {
                      background: "white",
                      color: "#64748b",
                    }}
                  >
                    {m === "chat" ? "💬 Chat" : m === "practice" ? "📝 Practice" : m === "exam" ? "⏱️ Exam" : m === "adventure" ? "⛏️ Adventure" : m === "study" ? "📖 Study" : "🎮 Break"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Brain Break trivia */}
          {mode === "break" && (
            <div className="flex-1 overflow-y-auto p-4 rounded-2xl" style={{ background: "#0f0c29" }}>
              <BreakZone forceOpen />
            </div>
          )}

          {/* Adventure mode */}
          {mode === "adventure" && (
            <ArcadeMode
              exam={subject}
              yearLevel={yearLevel}
              onSwitchToPractice={(ex, yr) => { setSubject(ex); setYearLevel(yr); handleModeChange("practice") }}
              onSwitchToExam={(ex, yr) => { setSubject(ex); setYearLevel(yr); handleModeChange("exam") }}
              onExit={() => handleModeChange("chat")}
            />
          )}

          {/* Study mode */}
          {mode === "study" && (
            <StudyMode
              exam={subject}
              yearLevel={yearLevel}
              onExit={() => handleModeChange("chat")}
              childToken={childSession?.token ?? null}
            />
          )}

          {/* Exam mode */}
          {mode === "exam" && (
            <ExamView
              subject={subject}
              yearLevel={yearLevel}
              onFinish={isSignedIn ? (payload) => {
                fetch("/api/exam-results", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject, yearLevel, ...payload }),
                })
              } : undefined}
            />
          )}

          {/* Chat / Practice window */}
          {mode !== "exam" && mode !== "adventure" && mode !== "break" && mode !== "study" && (
            <div
              className="flex-1 overflow-y-auto rounded-2xl shadow-sm"
              style={mode === "chat" ? {
                backgroundColor: "#fefce8",
                backgroundImage: [
                  "linear-gradient(90deg, transparent 72px, #fca5a5 72px, #fca5a5 74px, transparent 74px)",
                  "repeating-linear-gradient(transparent 0px, transparent 31px, #bfdbfe 31px, #bfdbfe 32px)",
                ].join(", "),
                backgroundAttachment: "local",
                padding: "12px 0 12px 0",
              } : { padding: "16px", background: "transparent" }}
            >
              {/* NOTEBOOK CHAT MODE */}
              {mode === "chat" && (
                <div style={{ fontFamily: "var(--font-caveat), Caveat, cursive" }}>
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 gap-2" style={{ paddingLeft: 80 }}>
                      <p style={{ color: "#94a3b8", fontSize: 22 }}>Open your notebook and ask anything…</p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} style={{ paddingLeft: 80, paddingRight: 24, paddingTop: 6, paddingBottom: 6 }}>
                      <span style={{
                        fontSize: 11,
                        fontFamily: "system-ui",
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                        color: msg.role === "user" ? "#6366f1" : "#b45309",
                        textTransform: "uppercase",
                      }}>
                        {msg.role === "user" ? "You" : "Tutor"}
                      </span>
                      <div style={{
                        fontSize: 20,
                        lineHeight: "32px",
                        color: msg.role === "user" ? "#1e3a5f" : "#431407",
                        "--tw-prose-body":     "#431407",
                        "--tw-prose-headings": "#431407",
                        "--tw-prose-bold":     "#431407",
                        "--tw-prose-counters": "#431407",
                        "--tw-prose-bullets":  "#431407",
                        "--tw-prose-quotes":   "#431407",
                        "--tw-prose-code":     "#431407",
                        "--tw-prose-links":    "#3b82f6",
                      } as React.CSSProperties}
                        className={msg.role === "assistant" ? "prose prose-sm max-w-none [&_p]:my-0 [&_ul]:my-1 [&_ol]:my-1 [&_*]:!text-inherit" : ""}
                      >
                        {msg.role === "user" ? (
                          <span>{msg.content}</span>
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div style={{ paddingLeft: 80, paddingTop: 6 }}>
                      <span style={{ fontSize: 11, fontFamily: "system-ui", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", color: "#b45309" }}>Tutor</span>
                      <div style={{ fontSize: 22, color: "#b45309" }}>
                        <span className="animate-pulse">✏️</span>
                        <span className="animate-pulse" style={{ marginLeft: 4 }}>|</span>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>
              )}

              {/* PRACTICE MODE */}
              {mode === "practice" && (
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-16 gap-3">
                      <span className="text-5xl">📝</span>
                      <p className="text-sm max-w-xs" style={{ color: "#94a3b8" }}>
                        Click &quot;Get Practice Problem&quot; to receive a question for {subject.match(/\(([^)]+)\)/)?.[1] ?? subject.split(" ")[0]}.
                      </p>
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role === "assistant" && <span className="mr-2 mt-1 text-lg shrink-0">🤖</span>}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                          msg.role === "user"
                            ? "whitespace-pre-wrap rounded-br-sm"
                            : "rounded-bl-sm prose prose-sm max-w-none"
                        }`}
                        style={msg.role === "user" ? {
                          background: "#000936",
                          color: "#FDC800",
                        } : {
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                        }}
                      >
                        {msg.role === "user" ? msg.content : (
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeRaw, rehypeKatex]}>
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
                      <div className="rounded-2xl rounded-bl-sm px-4 py-3 text-sm shadow-sm"
                        style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#94a3b8" }}>
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
                className="px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "#000936", color: "#FDC800" }}
              >
                {practiceActive ? "🔄 New Problem" : "🎯 Get Practice Problem"}
              </button>
              {practiceActive && (
                <span className="text-sm font-semibold px-3 py-1.5 rounded-full"
                  style={attemptCount >= MAX_ATTEMPTS ? {
                    background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca"
                  } : {
                    background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0"
                  }}>
                  Attempt {Math.min(attemptCount, MAX_ATTEMPTS)} of {MAX_ATTEMPTS}
                </span>
              )}
              {showRevealButton && (
                <button
                  onClick={revealAnswer}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: "#dc2626", color: "white" }}
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
              className="flex-1 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50"
              style={mode === "chat" ? {
                fontFamily: "var(--font-caveat), Caveat, cursive",
                fontSize: 20,
                backgroundColor: "#fefce8",
                border: "1px solid #bfdbfe",
                color: "#1e3a5f",
              } : {
                fontSize: 14,
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                color: "#334155",
              }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="px-5 py-3 rounded-xl text-sm font-bold shadow-sm disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: "#000936", color: "#FDC800" }}
            >
              Send
            </button>
          </div>}

        </main>
      </div>
    </div>
  )
}
