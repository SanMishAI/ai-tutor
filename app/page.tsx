"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import { SignInButton, UserButton, useUser } from "@clerk/nextjs"
import Sidebar from "./components/Sidebar"
import ExamView from "./components/ExamView"
import BreakZone from "./components/BreakZone"
import FeedbackForm from "./components/FeedbackForm"
import WelcomeScreen from "./components/WelcomeScreen"
import StreakBadge from "./components/StreakBadge"
import ArcadeMode from "./components/arcade/ArcadeMode"
import ChildLoginScreen from "./components/ChildLoginScreen"
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
  const [splashDone, setSplashDone] = useState(false)
  const [introSeen, setIntroSeen] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"chat" | "practice" | "exam" | "adventure">("chat")
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [yearLevel, setYearLevel] = useState(YEAR_LEVELS[SUBJECTS[0]][0])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [attemptCount, setAttemptCount] = useState(0)
  const [practiceActive, setPracticeActive] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { isSignedIn, user } = useUser()
  const isFounder = user?.primaryEmailAddress?.emailAddress === process.env.NEXT_PUBLIC_FOUNDER_EMAIL

  // Testimonials
  type TestimonialEntry = { id: string; name: string; location: string | null; quote: string; rating: number }
  const [testimonials, setTestimonials] = useState<TestimonialEntry[]>([])
  const [showTestimonialForm, setShowTestimonialForm] = useState(false)
  const [tForm, setTForm] = useState({ name: "", location: "", quote: "", rating: 5 })
  const [tSubmitting, setTSubmitting] = useState(false)
  const [tDone, setTDone] = useState(false)
  const [tError, setTError] = useState("")
  const [captchaQ, setCaptchaQ] = useState<[number, number]>([3, 5])
  const [captchaA, setCaptchaA] = useState("")
  const [tHoneypot, setTHoneypot] = useState("")
  const [videoBgReady, setVideoBgReady] = useState(false)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [showStartChoice, setShowStartChoice] = useState(false)
  const [showMathCaptcha, setShowMathCaptcha] = useState(false)
  const [mathQ, setMathQ] = useState<[number, number]>([4, 7])
  const [mathA, setMathA] = useState("")
  const [mathErr, setMathErr] = useState("")
  const router = useRouter()

  // Child session
  const [childSession, setChildSession] = useState<ChildSession | null>(null)
  const [showChildLogin, setShowChildLogin] = useState(false)

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
    fetch("/api/testimonials").then(r => r.json()).then(d => { if (Array.isArray(d)) setTestimonials(d) }).catch(() => {})
  }, [])

  async function submitTestimonial() {
    if (tHoneypot) return
    if (parseInt(captchaA) !== captchaQ[0] + captchaQ[1]) {
      setTError(`Verification failed: ${captchaQ[0]} + ${captchaQ[1]} = ?`); return
    }
    setTSubmitting(true); setTError("")
    try {
      const res = await fetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tForm) })
      const d = await res.json()
      if (!res.ok) { setTError(d.error ?? "Something went wrong."); return }
      setTDone(true)
    } catch { setTError("Network error. Please try again.") }
    finally { setTSubmitting(false) }
  }

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
    setSplashDone(true)
    setIntroSeen(true)
  }

  function handleChildLogout() {
    clearChildSession()
    setChildSession(null)
    setSplashDone(false)
    setIntroSeen(false)
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

  // Load conversations — from cloud if signed in, otherwise localStorage
  useEffect(() => {
    if (isSignedIn === undefined) return
    if (isSignedIn) {
      fetch("/api/conversations")
        .then(r => r.json())
        .then((data: Conversation[]) => {
          if (Array.isArray(data)) setConversations(data)
        })
        .catch(() => setConversations(loadConversations()))
    } else {
      setConversations(loadConversations())
    }
  }, [isSignedIn])

  // Persist to localStorage when guest
  useEffect(() => {
    if (!isSignedIn && conversations.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
    }
  }, [conversations, isSignedIn])

  // Back-to-top visibility — window scrolls, not the inner div
  useEffect(() => {
    if (splashDone) { setShowBackToTop(false); return }
    const onScroll = () => setShowBackToTop(window.scrollY > window.innerHeight * 0.8)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [splashDone])

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
          mode: (mode === "exam" || mode === "adventure") ? "chat" : mode,
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

  function handleModeChange(newMode: "chat" | "practice" | "exam" | "adventure") {
    if ((newMode === "exam" || newMode === "adventure") && !checkPremiumFeature(newMode === "exam" ? "Exam Mode" : "Adventure Mode")) return
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

  if (splashDone && !introSeen) {
    return (
      <WelcomeScreen
        onStart={(sub, yr, m) => {
          setSubject(sub)
          setYearLevel(yr)
          setMode(m as "chat" | "practice" | "exam" | "adventure")
          setIntroSeen(true)
        }}
      />
    )
  }

  if (!splashDone) {
    return (
      <div className="min-h-screen overflow-y-auto" style={{ backgroundColor: "#ffffff", color: "#0f172a" }}>
        <style>{`
          @keyframes marquee-scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes float-symbol {
            0%   { transform: translateY(0) rotate(0deg);   opacity: 0; }
            12%  { opacity: 0.45; }
            88%  { opacity: 0.18; }
            100% { transform: translateY(-680px) rotate(22deg); opacity: 0; }
          }
          @keyframes pulse-orb {
            0%, 100% { transform: scale(1);    opacity: 0.16; }
            50%       { transform: scale(1.22); opacity: 0.28; }
          }
          @keyframes star-pop {
            0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
            60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
            100% { transform: scale(1) rotate(0deg);   opacity: 1; }
          }
          @keyframes shake-x {
            0%,100% { transform: translateX(0); }
            20%     { transform: translateX(-8px); }
            40%     { transform: translateX(8px); }
            60%     { transform: translateX(-5px); }
            80%     { transform: translateX(5px); }
          }
          @keyframes combo-pop {
            0%   { transform: scale(0.6) translateY(8px); opacity: 0; }
            60%  { transform: scale(1.15) translateY(-2px); opacity: 1; }
            100% { transform: scale(1) translateY(0);       opacity: 1; }
          }
          @keyframes xp-flash {
            0%,100% { color: #FACC15; }
            50%     { color: #fff; text-shadow: 0 0 12px #FACC15; }
          }
          @keyframes ai-orb-pulse {
            0%,100% { transform: scale(1); opacity: 0.85; }
            50%     { transform: scale(1.09); opacity: 1; }
          }
          @keyframes warm-glow {
            0%,100% { transform: scale(1); opacity: 0.88; }
            50%     { transform: scale(1.13); opacity: 1; }
          }
          @keyframes beam-pulse {
            0%,100% { opacity: 0.32; }
            50%     { opacity: 0.82; }
          }
          @keyframes particle-rise {
            0%   { transform: translateY(0) scale(1); opacity: 0; }
            15%  { opacity: 1; }
            75%  { opacity: 0.42; }
            100% { transform: translateY(-260px) scale(0.4); opacity: 0; }
          }
          @keyframes float-equation {
            0%   { transform: translateY(0) translateX(0); opacity: 0; }
            15%  { opacity: 0.65; }
            85%  { opacity: 0.18; }
            100% { transform: translateY(-280px) translateX(25px); opacity: 0; }
          }
        `}</style>

        {/* ── NAV ── */}
        <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/selected-logo.svg" alt="SelectEd" style={{ width: 36, height: 36, objectFit: "contain" }} />
              <WordmarkLight />
            </div>
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <a href="/about" className="font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-blue-50" style={{ color: "#0066CB" }}>Our story ↗</a>
              <a href="/pricing" className="font-bold px-3 py-1.5 rounded-lg transition-all hover:opacity-90 shadow-sm" style={{ background: "#FDC800", color: "#000936" }}>Pricing</a>
              {isSignedIn && <a href="/parent" className="font-medium hover:text-slate-900 transition-colors" style={{ color: "#64748b" }}>Parent dashboard</a>}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setShowChildLogin(true)}
                className="hidden sm:block text-sm font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                style={{ color: "#475569" }}>
                I&apos;m a student
              </button>
              {isSignedIn ? (
                <>
                  <UserButton />
                  <button onClick={() => setSplashDone(true)}
                    className="text-sm font-bold px-4 py-2 rounded-lg transition-all hover:opacity-90"
                    style={{ background: "#000936", color: "#FDC800" }}>
                    Open app →
                  </button>
                </>
              ) : (
                <>
                  <SignInButton mode="modal">
                    <button className="text-sm font-bold px-4 py-2 rounded-lg border-2 transition-all hover:bg-[#0066CB] hover:text-white hover:shadow-md"
                      style={{ borderColor: "#0066CB", color: "#0066CB", background: "rgba(0,102,203,0.04)" }}>
                      Sign in →
                    </button>
                  </SignInButton>
                  <button onClick={() => setShowStartChoice(true)}
                    className="text-sm font-bold px-4 py-2 rounded-lg transition-all hover:opacity-90 shadow-sm"
                    style={{ background: "#000936", color: "#FDC800" }}>
                    Get started →
                  </button>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* ── HERO ── cinematic dark + video background ── */}
        <div className="relative overflow-hidden" style={{ background: "#000936", minHeight: "88vh" }}>

          {/* Background video — plays /tutor-bg.mp4 when present; CSS scene shows otherwise */}
          <video
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay muted loop playsInline
            onCanPlay={() => setVideoBgReady(true)}
            style={{ zIndex: 0, opacity: videoBgReady ? 1 : 0, transition: "opacity 1.2s ease" }}
          >
            <source src="/tutor-bg.mp4" type="video/mp4" />
          </video>

          {/* Layered scene: overlay + animated CSS elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>

            {/* Dark overlay (thicker over CSS scene, lighter over video) */}
            <div className="absolute inset-0" style={{
              background: videoBgReady
                ? "linear-gradient(135deg, rgba(0,9,54,0.78) 0%, rgba(0,9,54,0.58) 55%, rgba(0,9,54,0.78) 100%)"
                : "linear-gradient(135deg, #000936 0%, #060e3f 30%, #0c1848 60%, #0d1135 100%)",
              transition: "background 1.2s ease",
            }} />

            {/* CSS-animated tutor scene — hidden once real video loads */}
            {!videoBgReady && (
              <>
                {/* AI Tutor Orb — glowing blue sphere upper-left */}
                <div className="absolute rounded-full" style={{
                  width: 340, height: 340,
                  background: "radial-gradient(circle, rgba(86,219,255,0.88) 0%, rgba(0,102,203,0.55) 38%, transparent 68%)",
                  filter: "blur(28px)",
                  top: "8%", left: "8%",
                  animation: "ai-orb-pulse 4.5s ease-in-out infinite",
                }} />
                <div className="absolute rounded-full" style={{
                  width: 520, height: 520,
                  background: "radial-gradient(circle, rgba(0,102,203,0.14) 0%, transparent 60%)",
                  filter: "blur(50px)",
                  top: "0%", left: "0%",
                  animation: "ai-orb-pulse 4.5s ease-in-out 1s infinite",
                }} />
                {/* Warm student glow — right quadrant */}
                <div className="absolute rounded-full" style={{
                  width: 380, height: 380,
                  background: "radial-gradient(circle, rgba(253,200,0,0.30) 0%, rgba(227,76,0,0.14) 50%, transparent 70%)",
                  filter: "blur(38px)",
                  top: "18%", right: "5%",
                  animation: "warm-glow 6s ease-in-out infinite",
                }} />
                {/* Connection beam between tutor and student */}
                <div className="absolute" style={{
                  height: 2,
                  background: "linear-gradient(90deg, rgba(86,219,255,0.6) 0%, rgba(253,200,0,0.45) 100%)",
                  filter: "blur(3px)",
                  top: "42%", left: "18%", right: "15%",
                  animation: "beam-pulse 3.5s ease-in-out infinite",
                }} />
                {/* Rising particles */}
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="absolute rounded-full" style={{
                    width: 2 + (i % 3),
                    height: 2 + (i % 3),
                    background: ["rgba(86,219,255,0.8)", "rgba(253,200,0,0.7)", "rgba(255,255,255,0.5)", "rgba(99,179,255,0.8)"][i % 4],
                    left: `${(i * 4.8 + 4) % 88}%`,
                    top: `${56 + (i % 5) * 8}%`,
                    animation: `particle-rise ${3.5 + (i % 5)}s ease-out ${(i * 0.32) % 4}s infinite`,
                  }} />
                ))}
                {/* Floating equations */}
                {["y = mx + b", "E = mc²", "P(A) = n(A)/n(S)", "∫₀¹ f(x) dx", "ax² + bx + c = 0"].map((eq, i) => (
                  <div key={eq} className="absolute font-mono select-none" style={{
                    fontSize: 11 + (i % 3) * 2,
                    color: i % 2 === 0 ? "rgba(86,219,255,0.42)" : "rgba(253,200,0,0.36)",
                    left: `${(i * 18 + 5) % 72}%`,
                    top: `${64 + (i % 4) * 6}%`,
                    animation: `float-equation ${8 + i * 1.4}s ease-in-out ${i * 0.65}s infinite`,
                    whiteSpace: "nowrap",
                  }}>
                    {eq}
                  </div>
                ))}
              </>
            )}

            {/* Floating math symbols — always visible, even over video */}
            {["π", "∑", "√", "∫", "α", "β", "×", "≠", "∞", "Δ", "θ", "λ", "÷", "²", "⁻¹", "≈"].map((sym, i) => (
              <div key={sym} className="absolute select-none font-black"
                style={{
                  left: `${(i * 6.25) % 94}%`,
                  bottom: `-20px`,
                  fontSize: `${14 + (i % 4) * 7}px`,
                  opacity: 0,
                  color: ["rgba(86,219,255,0.6)", "rgba(253,200,0,0.5)", "rgba(227,76,0,0.45)", "rgba(74,222,128,0.5)", "rgba(167,139,250,0.5)"][i % 5],
                  animation: `float-symbol ${7 + (i % 6)}s ease-in ${(i * 0.55) % 5}s infinite`,
                }}>
                {sym}
              </div>
            ))}
          </div>

          {/* Bottom white fade — blends hero into light page sections */}
          <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none" style={{
            background: "linear-gradient(to bottom, transparent, #ffffff)",
            zIndex: 3,
          }} />

          {/* Hero content */}
          <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24 lg:py-28" style={{ zIndex: 4 }}>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Left: text + CTAs */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border mb-7"
                  style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)" }}>
                  <span className="w-2 h-2 rounded-full bg-green-400" style={{ animation: "pulse 2s infinite" }} />
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Australia&apos;s AI-powered exam prep platform</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: "#ffffff" }}>
                  Give your child the edge in every major{" "}
                  <span style={{ color: "#56DBFF" }}>Australian exam.</span>
                </h1>
                <p className="text-lg sm:text-xl mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                  AI-powered tutoring across AMC, ICAS, NAPLAN, ATAR, Maths Olympiad, and more — personalised for your child&apos;s year level, at a fraction of the cost of a tutor.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <button onClick={() => setShowStartChoice(true)}
                    className="px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-[1.03] active:scale-[0.98] shadow-xl"
                    style={{ background: "#FDC800", color: "#000936" }}>
                    Start your 7-day free trial →
                  </button>
                  <button onClick={() => setShowChildLogin(true)}
                    className="px-8 py-4 rounded-xl font-semibold text-base transition-all"
                    style={{ border: "2px solid rgba(255,255,255,0.28)", color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.06)" }}>
                    I&apos;m a student →
                  </button>
                </div>
                <div className="flex flex-wrap gap-5 text-sm" style={{ color: "rgba(255,255,255,0.52)" }}>
                  {["7 days free, then $9.99/month AUD", "Cancel any time before day 7", "Built by an Australian parent"].map(t => (
                    <span key={t} className="flex items-center gap-1.5">
                      <span style={{ color: "#4ade80" }}>✓</span> {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right: frosted glass exam badge grid */}
              <div className="hidden lg:block">
                <div className="rounded-2xl p-6" style={{
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.13)",
                  boxShadow: "0 8px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
                }}>
                  <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Supports preparation for</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { abbr: "AMC",  icon: "🔢", label: "Maths Competition", years: "Yr 3–12",  color: "#56DBFF" },
                      { abbr: "OLY",  icon: "🏆", label: "Maths Olympiad",    years: "Yr 4–10",  color: "#a78bfa" },
                      { abbr: "ACER", icon: "📐", label: "Selective Entry",   years: "Yr 3–9",   color: "#f472b6" },
                      { abbr: "ICAS", icon: "🌟", label: "Intl Assessments",  years: "Yr 2–12",  color: "#4ade80" },
                      { abbr: "ATAR", icon: "🎓", label: "Tertiary Rank",     years: "Yr 11–12", color: "#FDC800" },
                      { abbr: "NAP",  icon: "📚", label: "NAPLAN",            years: "Yr 3–9",   color: "#fb923c" },
                      { abbr: "BEB",  icon: "💻", label: "Bebras Computing",  years: "Yr 3–12",  color: "#38bdf8" },
                      { abbr: "KSF",  icon: "🦘", label: "Kangourou",         years: "Yr 3–12",  color: "#c084fc" },
                    ].map(({ abbr, icon, label, years, color }) => (
                      <div key={abbr} className="flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition-transform hover:scale-105"
                        style={{ background: "rgba(255,255,255,0.05)", border: `1.5px solid ${color}30` }}>
                        <div className="w-11 h-11 rounded-full flex flex-col items-center justify-center font-black"
                          style={{ background: `linear-gradient(135deg, ${color}bb, ${color}77)`, boxShadow: `0 2px 12px ${color}44` }}>
                          <span style={{ fontSize: 11, letterSpacing: "-0.5px", lineHeight: 1.1, color: color === "#FDC800" ? "#000936" : "#fff" }}>{abbr}</span>
                        </div>
                        <span className="text-lg leading-none">{icon}</span>
                        <p className="font-semibold leading-snug" style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{label}</p>
                        <span className="font-bold rounded-full px-1.5 py-0.5" style={{ fontSize: 8, background: `${color}1a`, color }}>
                          {years}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs mt-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
                    SelectEd is an independent preparation platform. It is not affiliated with, endorsed by, or connected to the organisations that administer these assessments.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="border-y border-slate-100 bg-white py-8">
          <div className="max-w-4xl mx-auto px-5 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { n: "8", label: "Exams covered" },
              { n: "Year 2–12", label: "All year levels" },
              { n: "AI-powered", label: "Anthropic Claude" },
              { n: "7 days", label: "Free trial to start" },
            ].map(({ n, label }) => (
              <div key={label}>
                <p className="font-black text-2xl sm:text-3xl" style={{ color: "#000936" }}>{n}</p>
                <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ROLLING BANNER ── */}
        {(() => {
          const items = [
            "⭐⭐⭐⭐⭐  \"My son jumped from mid-band to Band 6 in ICAS Maths\" — Priya R., Sydney",
            "AMC  ·  Maths Olympiad  ·  ACER  ·  ICAS  ·  ATAR  ·  NAPLAN  ·  Bebras  ·  KSF",
            "⭐⭐⭐⭐⭐  \"The only thing that kept my daughter engaged through AMC prep\" — James T., Melbourne",
            "10 free questions every day  ·  No credit card needed  ·  Cancel any time",
            "⭐⭐⭐⭐⭐  \"A fraction of the cost of a private tutor\" — Amira K., Brisbane",
            "Socratic AI Tutor  ·  Gamified Adventure Mode  ·  Timed Mock Exams  ·  Year 2–12",
            "⭐⭐⭐⭐⭐  \"The AI tutor is genuinely patient — it never hands over the answer\"",
            "7-day free trial  ·  Then $9.99/month AUD  ·  Cancel any time before day 7",
          ]
          const doubled = [...items, ...items]
          return (
            <div style={{ background: "#000936", overflow: "hidden", padding: "11px 0", borderTop: "1px solid rgba(253,200,0,0.2)", borderBottom: "1px solid rgba(253,200,0,0.2)" }}>
              <div style={{ display: "flex", animation: "marquee-scroll 55s linear infinite", gap: 0, width: "max-content" }}>
                {doubled.map((item, i) => (
                  <span key={i} style={{ fontFamily: "system-ui", fontSize: 12.5, fontWeight: 500, color: i % 2 === 0 ? "#FDC800" : "#93c5fd", whiteSpace: "nowrap", paddingLeft: 36, paddingRight: 0 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )
        })()}

        {/* ── PROBLEM ── */}
        <div className="py-16 sm:py-20" style={{ background: "#f8fafc" }}>
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>The challenge</p>
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4" style={{ color: "#0f172a" }}>
              Exam prep shouldn&apos;t mean $100/hr tutors
            </h2>
            <p className="text-center text-base max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: "#64748b" }}>
              Most families face the same frustrating choice: expensive tutor centres, generic platforms built for overseas curricula, or buying a separate workbook for each competition.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { icon: "💸", title: "Tutoring is expensive", desc: "Private tutors cost $80–$150/hr. A full exam season adds up to thousands." },
                { icon: "🌐", title: "Generic tools don't fit", desc: "Most platforms are built for the US or UK — not AMC, ICAS, or NAPLAN." },
                { icon: "📚", title: "Everything is fragmented", desc: "8 different exams means 8 different resources. No single place covers them all." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm">
                  <span className="text-3xl mb-4 block">{icon}</span>
                  <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <div id="how-it-works" className="py-16 sm:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>How SelectEd works</p>
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4" style={{ color: "#0f172a" }}>Four ways your child learns</h2>
            <p className="text-center text-base max-w-xl mx-auto mb-12 leading-relaxed" style={{ color: "#64748b" }}>Pick the mode that fits how they feel like studying today.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: "💬", title: "AI Chat Tutor", badge: "Socratic method", desc: "Your child asks questions and the AI guides them through problems step-by-step — it never just hands over the answer. Builds real, lasting understanding.", color: "#0066CB", bg: "#EFF6FF" },
                { icon: "📝", title: "Practice Problems", badge: "Exam-style questions", desc: "Structured practice with up to 5 guided attempts before the full solution appears. Calibrated difficulty for each exam and year level.", color: "#059669", bg: "#ECFDF5" },
                { icon: "⏱️", title: "Mock Exams", badge: "Timed & graded", desc: "Sit a full timed exam, get instant results, then review every single mistake with an AI walkthrough. Builds real exam confidence.", color: "#E34C00", bg: "#FFF7ED" },
                { icon: "⛏️", title: "Adventure Mode", badge: "Gamified learning", desc: "A Minecraft-inspired world where chapters unlock progressively. Keeps reluctant learners engaged through play — they're learning without realising it.", color: "#16A34A", bg: "#F0FDF4" },
              ].map(({ icon, title, badge, desc, color, bg }) => (
                <div key={title} className="rounded-2xl p-6 border border-slate-200 shadow-sm bg-white flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl">{icon}</span>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: bg, color }}>{badge}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed flex-1">{desc}</p>
                  <button onClick={() => setShowStartChoice(true)} className="text-xs font-semibold text-left transition-colors hover:opacity-80" style={{ color }}>
                    Try it free →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── EXAMS ── */}
        <div className="py-16 sm:py-20" style={{ background: "#f8fafc" }}>
          <div className="max-w-4xl mx-auto px-5 sm:px-8">
            <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>Coverage</p>
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4" style={{ color: "#0f172a" }}>8 Australian exams, one platform</h2>
            <p className="text-center text-base max-w-xl mx-auto mb-12 leading-relaxed" style={{ color: "#64748b" }}>Questions, difficulty, and topics calibrated for each exam and year level — not generic AI output.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { short: "AMC",     abbr: "AMC",  icon: "🔢", full: "Australian Mathematics Competition", years: "Year 3–12",  color: "#0066CB", bg: "#EFF6FF" },
                { short: "Olympiad",abbr: "OLY",  icon: "🏆", full: "Maths Olympiad",                    years: "Year 4–10",  color: "#7C3AED", bg: "#F5F3FF" },
                { short: "ACER",    abbr: "ACER", icon: "📐", full: "ACER Selective Entry",               years: "Year 3–9",   color: "#DB2777", bg: "#FDF2F8" },
                { short: "ICAS",    abbr: "ICAS", icon: "🌟", full: "International Competitions",         years: "Year 2–12",  color: "#059669", bg: "#ECFDF5" },
                { short: "ATAR",    abbr: "ATAR", icon: "🎓", full: "Australian Tertiary Rank",           years: "Year 11–12", color: "#D97706", bg: "#FFFBEB" },
                { short: "NAPLAN",  abbr: "NAP",  icon: "📚", full: "National Assessment Program",        years: "Yr 3, 5, 7, 9", color: "#E34C00", bg: "#FFF7ED" },
                { short: "Bebras",  abbr: "BEB",  icon: "💻", full: "Bebras Computing Challenge",         years: "Year 3–12",  color: "#0891B2", bg: "#F0F9FF" },
                { short: "KSF",     abbr: "KSF",  icon: "🦘", full: "Kangourou sans frontières",          years: "Year 3–12",  color: "#9333EA", bg: "#FAF5FF" },
              ].map(({ short, abbr, icon, full, years, color, bg }) => (
                <div key={short} className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center font-black text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
                    <span style={{ fontSize: abbr.length > 3 ? 10 : 13, letterSpacing: "-0.5px" }}>{abbr}</span>
                  </div>
                  <span className="text-2xl">{icon}</span>
                  <p className="font-black text-sm leading-snug" style={{ color }}>{short}</p>
                  <p className="text-slate-500 text-xs leading-snug">{full}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>
                    {years}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOUNDER ── */}
        <div className="py-16 sm:py-20 bg-white">
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <div className="rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10 flex flex-col sm:flex-row gap-8 items-center">
              <div className="w-24 h-24 rounded-full overflow-hidden shrink-0" style={{ outline: "3px solid #FDC800", outlineOffset: 3 }}>
                <img src="/san.jpeg" alt="San Mishra" className="w-full h-full object-cover" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xl sm:text-2xl font-black leading-snug mb-3" style={{ color: "#0f172a" }}>
                  &ldquo;I built the tool I wished existed when my own son was preparing for selective school.&rdquo;
                </p>
                <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>San Mishra · Director, Global Consulting · Melbourne dad</p>
                <a href="/about" className="text-sm font-semibold hover:underline transition-colors" style={{ color: "#0066CB" }}>Read our story →</a>
              </div>
            </div>
          </div>
        </div>

        {/* ── TESTIMONIALS ── */}
        {(() => {
          const SEED: { name: string; location: string; quote: string; rating: number }[] = [
            { name: "Priya R.", location: "Sydney, NSW", quote: "My son jumped from mid-band to Band 6 in ICAS Maths after just three weeks on SelectEd. The AI tutor is genuinely patient — it never just hands over the answer.", rating: 5 },
            { name: "James T.", location: "Melbourne, VIC", quote: "We tried everything before this. SelectEd is the only thing that kept my daughter engaged through AMC prep. The Adventure Mode is genius.", rating: 5 },
            { name: "Amira K.", location: "Brisbane, QLD", quote: "A fraction of the cost of a private tutor, and honestly more effective because she can practise at her own pace, any time. Would recommend to any exam prep parent.", rating: 5 },
          ]
          const all = [...SEED, ...testimonials]
          return (
            <div className="py-16 sm:py-20 bg-white">
              <div className="max-w-5xl mx-auto px-5 sm:px-8">
                <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>Parent reviews</p>
                <h2 className="text-3xl sm:text-4xl font-black text-center mb-3" style={{ color: "#0f172a" }}>What Australian parents are saying</h2>
                <p className="text-center text-base max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: "#64748b" }}>Real feedback from families preparing for selective school and competition exams.</p>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
                  {all.map((t, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col gap-4">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, s) => (
                          <span key={s} style={{ color: s < t.rating ? "#FDC800" : "#e2e8f0", fontSize: 16 }}>★</span>
                        ))}
                      </div>
                      <p className="text-sm leading-relaxed flex-1" style={{ color: "#334155" }}>&ldquo;{t.quote}&rdquo;</p>
                      <div>
                        <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{t.name}</p>
                        {t.location && <p className="text-xs" style={{ color: "#94a3b8" }}>{t.location}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit CTA / Form */}
                {!showTestimonialForm && !tDone && (
                  <div className="text-center">
                    <button onClick={() => {
                      const a = Math.ceil(Math.random() * 9), b = Math.ceil(Math.random() * 9)
                      setCaptchaQ([a, b]); setCaptchaA(""); setTHoneypot(""); setShowTestimonialForm(true)
                    }}
                      className="px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all hover:bg-slate-50"
                      style={{ borderColor: "#000936", color: "#000936" }}>
                      Share your experience →
                    </button>
                  </div>
                )}

                {tDone && (
                  <div className="text-center rounded-2xl p-6 border border-green-200 bg-green-50">
                    <p className="font-bold text-green-800">Thank you! Your review has been submitted.</p>
                    <p className="text-sm text-green-600 mt-1">It&apos;ll appear here once it&apos;s been approved.</p>
                  </div>
                )}

                {showTestimonialForm && !tDone && (
                  <div className="max-w-lg mx-auto rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
                    <h3 className="font-black text-lg" style={{ color: "#0f172a" }}>Share your experience</h3>
                    {tError && <p className="text-sm rounded-lg px-3 py-2 bg-red-50 border border-red-200" style={{ color: "#dc2626" }}>{tError}</p>}
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Your name *</label>
                      <input value={tForm.name} onChange={e => setTForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Sarah M."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Location (optional)</label>
                      <input value={tForm.location} onChange={e => setTForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Melbourne, VIC"
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Rating *</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(s => (
                          <button key={s} onClick={() => setTForm(f => ({ ...f, rating: s }))}
                            style={{ fontSize: 28, color: s <= tForm.rating ? "#FDC800" : "#e2e8f0", lineHeight: 1 }}>★</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5" style={{ color: "#475569" }}>Your review * <span className="font-normal">(min. 20 characters)</span></label>
                      <textarea value={tForm.quote} onChange={e => setTForm(f => ({ ...f, quote: e.target.value }))} rows={4}
                        placeholder="Tell other parents what you thought of SelectEd..."
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
                    </div>
                    {/* Honeypot – invisible to humans, filled by bots */}
                    <input aria-hidden="true" tabIndex={-1} value={tHoneypot} onChange={e => setTHoneypot(e.target.value)}
                      style={{ position: "absolute", left: -9999, width: 1, height: 1, opacity: 0 }} autoComplete="off" />

                    {/* Human verification */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
                      <p className="text-xs font-bold" style={{ color: "#475569" }}>
                        🤖 Quick verification — What is <span style={{ color: "#0066CB" }}>{captchaQ[0]} + {captchaQ[1]}</span>?
                      </p>
                      <input
                        type="number" value={captchaA} onChange={e => setCaptchaA(e.target.value)}
                        placeholder="Your answer"
                        className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button onClick={submitTestimonial} disabled={tSubmitting}
                        className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
                        style={{ background: "#000936", color: "#FDC800" }}>
                        {tSubmitting ? "Submitting…" : "Submit review"}
                      </button>
                      <button onClick={() => setShowTestimonialForm(false)}
                        className="px-4 py-3 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                        style={{ color: "#64748b" }}>
                        Cancel
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>Reviews are moderated before appearing publicly.</p>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── PRICING ── */}
        <div className="py-16 sm:py-20" style={{ background: "#f8fafc" }}>
          <div className="max-w-3xl mx-auto px-5 sm:px-8">
            <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-black text-center mb-4" style={{ color: "#0f172a" }}>Simple, honest pricing</h2>
            <p className="text-center text-base max-w-lg mx-auto mb-12 leading-relaxed" style={{ color: "#64748b" }}>Start free. Upgrade when you&apos;re ready.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white border-2 border-slate-200 p-7 flex flex-col gap-5">
                <div>
                  <p className="font-black text-2xl" style={{ color: "#0f172a" }}>Free</p>
                  <p className="text-4xl font-black mt-1" style={{ color: "#000936" }}>$0</p>
                  <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Forever. No card needed.</p>
                </div>
                <ul className="space-y-2.5 text-sm flex-1" style={{ color: "#475569" }}>
                  {["All 8 exams & year levels", "AI Chat Tutor (unlimited)", "Practice mode", "Mock exams with instant grading", "Adventure Mode", "Guest mode — no sign-up needed"].map(f => (
                    <li key={f} className="flex items-center gap-2.5"><span style={{ color: "#059669" }}>✓</span>{f}</li>
                  ))}
                </ul>
                <button onClick={() => setShowStartChoice(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:bg-slate-900 hover:text-white"
                  style={{ border: "2px solid #000936", color: "#000936", background: "white" }}>
                  Start for free →
                </button>
              </div>
              <div className="rounded-2xl border-2 p-7 flex flex-col gap-5 relative overflow-hidden" style={{ background: "#000936", borderColor: "#FDC800" }}>
                <div className="absolute top-5 right-5">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#FDC800", color: "#000936" }}>7 days free</span>
                </div>
                <div>
                  <p className="font-black text-2xl text-white">Premium</p>
                  <p className="text-4xl font-black mt-1" style={{ color: "#FDC800" }}>$9.99<span className="text-base font-medium" style={{ color: "#64748b" }}>/mo</span></p>
                  <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Free for 7 days, then $9.99/month AUD</p>
                </div>
                <ul className="space-y-2.5 text-sm flex-1" style={{ color: "#cbd5e1" }}>
                  {["Unlimited questions — no daily cap", "All modes: Exam & Adventure unlocked", "Up to 5 child profiles", "Progress tracking & streak badges", "Leaderboard access", "Parent dashboard & weekly reports"].map(f => (
                    <li key={f} className="flex items-center gap-2.5"><span style={{ color: "#FDC800" }}>✓</span>{f}</li>
                  ))}
                </ul>
                <button onClick={() => setShowStartChoice(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: "#FDC800", color: "#000936" }}>
                  Start free trial →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        {(() => {
          const FAQS = [
            { q: "Do I need to create an account to use SelectEd?", a: "No — you can try the AI tutor and practice mode as a guest with no sign-up, up to 10 questions per day (resets at midnight). Exam Mode and Adventure Mode require an account. Creating a parent account starts your 7-day free trial, which gives unlimited questions, child profiles, progress tracking, and streaks." },
            { q: "How does the 7-day free trial work?", a: "When you start your trial, we collect your payment method (Apple Pay, Google Pay, or card) but charge nothing today. On day 8 your subscription begins at $9.99/month AUD. Cancel any time before the end of day 7 and you will never be charged." },
            { q: "How does my child log in?", a: "Parents create a child profile with a name, emoji avatar, and a 4-digit PIN. Children tap their avatar on the device your parent account is signed into, enter their PIN, and they're in — with access only to the exam content, never to billing or account settings." },
            { q: "Can I set a daily question limit for my child?", a: "Yes. From your parent dashboard you can set a per-child daily question limit, or leave it unlimited. You can update it any time." },
            { q: "Which Australian exams does SelectEd cover?", a: "AMC, Maths Olympiad, ACER Selective Entry, ICAS, ATAR, NAPLAN, Bebras Computing, and Kangourou sans frontières (KSF) — for Year 2 through Year 12." },
            { q: "My child is in primary school — is SelectEd appropriate?", a: "Absolutely. SelectEd covers Year 2 upwards. The AI tutor adapts its language and difficulty to the chosen year level, so a Year 3 student doing ICAS gets very different content from a Year 10 student doing AMC." },
            { q: "How is SelectEd different from a regular tutoring app?", a: "SelectEd uses the Socratic method — the AI never just hands over the answer. It asks guiding questions that help your child reach the solution themselves, building real understanding rather than answer memorisation." },
            { q: "Is SelectEd affiliated with any of the exam organisations?", a: "No. SelectEd is an independent preparation platform. It is not affiliated with, endorsed by, or connected to AMC, ACER, ICAS, NAPLAN, or any other organisation that administers the exams listed." },
          ]
          return (
            <div className="py-16 sm:py-20" style={{ background: "#f8fafc" }}>
              <div className="max-w-3xl mx-auto px-5 sm:px-8">
                <p className="text-xs font-bold tracking-widest uppercase text-center mb-3" style={{ color: "#0066CB" }}>FAQ</p>
                <h2 className="text-3xl sm:text-4xl font-black text-center mb-10" style={{ color: "#0f172a" }}>Common questions</h2>
                <div className="space-y-2">
                  {FAQS.map((faq, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-bold text-sm hover:bg-slate-50 transition-colors"
                        style={{ color: "#0f172a" }}
                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                        <span>{faq.q}</span>
                        <span className="shrink-0 text-lg leading-none transition-transform" style={{ color: "#94a3b8", transform: faqOpen === i ? "rotate(45deg)" : "none" }}>+</span>
                      </button>
                      {faqOpen === i && (
                        <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: "#64748b", borderTop: "1px solid #f1f5f9" }}>
                          <div className="pt-3">{faq.a}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── FINAL CTA ── */}
        <div className="py-16 sm:py-24 bg-white">
          <div className="max-w-2xl mx-auto px-5 sm:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ color: "#0f172a" }}>
              Ready to give your child a head start?
            </h2>
            <p className="text-base max-w-lg mx-auto mb-8 leading-relaxed" style={{ color: "#64748b" }}>
              Free to start. No sign-up required. Just pick an exam and begin.
            </p>
            <button onClick={() => setShowStartChoice(true)}
              className="px-10 py-4 rounded-xl font-bold text-base transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{ background: "#000936", color: "#FDC800" }}>
              Start for free today →
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="border-t border-slate-100 py-10" style={{ background: "#f8fafc" }}>
          <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <WordmarkLight small />
              <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>Made in Melbourne 🇦🇺</p>
            </div>
            <div className="flex flex-wrap justify-center gap-5 text-xs" style={{ color: "#94a3b8" }}>
              <a href="/about" className="hover:text-slate-700 transition-colors">Our story</a>
              <a href="/pricing" className="hover:text-slate-700 transition-colors">Pricing</a>
              <a href="/leaderboard" className="hover:text-slate-700 transition-colors">Leaderboard</a>
              <a href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</a>
            </div>
            <p className="text-xs" style={{ color: "#cbd5e1" }}>© 2026 SelectEd. All rights reserved.</p>
          </div>
        </footer>

        {/* ── Math CAPTCHA modal (top-level — no stacking context parent) ── */}
        {showMathCaptcha && (
          <div
            className="fixed inset-0 z-[400] flex items-center justify-center p-4"
            style={{ background: "rgba(0,9,54,0.82)" }}
            onClick={() => setShowMathCaptcha(false)}
          >
            <div
              className="bg-white rounded-2xl p-7 w-full max-w-xs shadow-2xl space-y-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center space-y-1">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#0066CB" }}>
                  Quick verification
                </p>
                <p className="text-xl font-black" style={{ color: "#0f172a" }}>
                  What is{" "}
                  <span style={{ color: "#0066CB" }}>{mathQ[0]}</span>
                  {" + "}
                  <span style={{ color: "#0066CB" }}>{mathQ[1]}</span>?
                </p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  Just making sure you&apos;re human before we create your account.
                </p>
              </div>
              {mathErr && (
                <p className="text-sm text-center font-medium" style={{ color: "#dc2626" }}>{mathErr}</p>
              )}
              <input
                type="number"
                inputMode="numeric"
                value={mathA}
                onChange={e => { setMathA(e.target.value); setMathErr("") }}
                onKeyDown={e => e.key === "Enter" && verifyMath()}
                placeholder={`${mathQ[0]} + ${mathQ[1]} = ?`}
                autoFocus
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold focus:outline-none focus:border-blue-400"
                style={{ color: "#0f172a" }}
              />
              <button
                onClick={verifyMath}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 shadow-sm"
                style={{ background: "#000936", color: "#FDC800" }}
              >
                Verify &amp; continue →
              </button>
              <button
                onClick={() => setShowMathCaptcha(false)}
                className="w-full text-xs py-1 transition-colors hover:text-slate-600"
                style={{ color: "#94a3b8" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Start-choice modal ── */}
        {showStartChoice && (
          <div
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            style={{ background: "rgba(0,9,54,0.82)" }}
            onClick={() => setShowStartChoice(false)}
          >
            <div
              className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-5"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <p className="text-3xl font-black italic tracking-tight" style={{ fontFamily: '"Arial Black", system-ui' }}>
                  <span style={{ color: "#000936" }}>Select</span><span style={{ color: "#E34C00" }}>Ed</span>
                </p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: "#0066CB" }}>Sharpen · Sit · Succeed</p>
              </div>
              <p className="text-center font-bold text-lg" style={{ color: "#0f172a" }}>How would you like to start?</p>
              <button
                onClick={openMathCaptcha}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 shadow-sm"
                style={{ background: "#000936", color: "#FDC800" }}
              >
                Create account — 7-day free trial →
              </button>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs" style={{ color: "#94a3b8" }}>or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <button
                onClick={() => { setShowStartChoice(false); setSplashDone(true) }}
                className="w-full py-3 rounded-xl font-semibold text-sm border-2 transition-all hover:bg-slate-50"
                style={{ borderColor: "#e2e8f0", color: "#475569" }}
              >
                Continue as guest (10 questions/day)
              </button>
              <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
                Already have an account?{" "}
                <a href="/sign-in" className="font-semibold underline" style={{ color: "#0066CB" }}>Sign in</a>
              </p>
            </div>
          </div>
        )}

      </div>
    )
  }

  // ── OLD dark splash below — replaced by new landing above. Keeping the HERO ──
  if (false) {
    return (
      <div className="overflow-y-auto" style={{ backgroundColor: "#000936", color: "#f1f5f9" }}>

        {/* ── HERO ── */}
        <div className="relative h-[100dvh] flex flex-col items-center justify-center gap-6 sm:gap-8 overflow-hidden">
          <div className="absolute w-48 h-48 sm:w-96 sm:h-96 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "#E34C00", top: "10%", left: "10%" }} />
          <div className="absolute w-40 h-40 sm:w-80 sm:h-80 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: "#0066CB", bottom: "15%", right: "12%" }} />

          {/* Nav bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 sm:px-8 py-4 z-10">
            <Wordmark />
            <button
              onClick={() => setSplashDone(true)}
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Open app →
            </button>
          </div>

          <img src="/selected-logo.svg" alt="SelectEd" className="select-none shrink-0" style={{ width: "min(80vw, 400px)", height: "auto" }} />

          <div className="flex flex-col items-center gap-4 relative z-10">
            <button
              onClick={() => setSplashDone(true)}
              className="px-10 py-4 rounded-full text-white font-bold text-xl tracking-wide transition-all hover:scale-105 active:scale-95 shadow-2xl"
              style={{
                background: "linear-gradient(135deg, #E34C00 0%, #FDC800 50%, #0066CB 100%)",
                boxShadow: "0 0 32px #FDC80066",
              }}
            >
              Start Learning →
            </button>
            <p className="text-sm" style={{ color: "#4a5568" }}>
              AMC · Olympiad · ACER · ICAS · ATAR · NAPLAN · Bebras · KSF
            </p>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-1 pointer-events-none select-none" style={{ animation: "bounce 2s infinite" }}>
            <p className="text-xs tracking-widest uppercase" style={{ color: "#4a5568" }}>scroll to explore</p>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M2 2L10 10L18 2" stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase text-center mb-2">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-2" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>Three ways to prepare</h2>
          <p className="text-slate-400 text-sm text-center mb-10">Pick the mode that fits how you want to study today.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              {
                icon: "💬",
                title: "Chat",
                badge: "Socratic tutor",
                desc: "Ask anything. Your AI tutor guides you step-by-step with questions — never just handing you the answer.",
                color: "#818cf8",
              },
              {
                icon: "📝",
                title: "Practice",
                badge: "Targeted problems",
                desc: "Tackle exam-style problems with up to 5 guided attempts before the full solution is revealed.",
                color: "#fbbf24",
              },
              {
                icon: "⏱️",
                title: "Exam",
                badge: "Timed mock tests",
                desc: "Sit a full timed exam, get graded instantly, then review every mistake with an AI walkthrough.",
                color: "#34d399",
              },
            ] as const).map(({ icon, title, badge, desc, color }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 p-6 flex flex-col gap-3"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <span className="text-3xl">{icon}</span>
                <div>
                  <p className="font-black text-white text-lg" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>{title}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider mt-0.5" style={{ color }}>{badge}</p>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed flex-1">{desc}</p>
                <button
                  onClick={() => setSplashDone(true)}
                  className="text-xs font-semibold transition-colors text-left"
                  style={{ color }}
                >
                  Try it →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── EXAMS ── */}
        <div className="max-w-4xl mx-auto px-6 pb-12">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase text-center mb-2">Coverage</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-2" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>8 Australian exams, one place</h2>
          <p className="text-slate-400 text-sm text-center mb-10">Questions, difficulty, and topics calibrated for each exam and year level.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {([
              { short: "AMC", name: "Australian Mathematics Competition", years: "Year 3 – 12", color: "#00e5ff" },
              { short: "Olympiad", name: "Maths Olympiad", years: "Year 4 – 10", color: "#a78bfa" },
              { short: "ACER", name: "ACER Selective", years: "Year 3 – 9", color: "#ff44aa" },
              { short: "ICAS", name: "ICAS", years: "Year 2 – 12", color: "#34d399" },
              { short: "ATAR", name: "ATAR", years: "Year 11 – 12", color: "#fbbf24" },
              { short: "NAPLAN", name: "NAPLAN", years: "Year 3, 5, 7, 9", color: "#f97316" },
              { short: "Bebras", name: "Bebras Computational Thinking", years: "Year 3 – 12", color: "#06b6d4" },
              { short: "Kangaroo", name: "Kangourou sans frontières (KSF)", years: "Year 3 – 12", color: "#e879f9" },
            ] as const).map(({ short, name, years, color }) => (
              <div
                key={short}
                className="rounded-2xl border border-white/10 p-5 flex flex-col gap-1.5"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                <span className="font-black text-xl" style={{ color, fontFamily: '"Arial Black", Impact, system-ui' }}>{short}</span>
                <span className="text-white text-sm font-semibold leading-snug">{name}</span>
                <span className="text-slate-500 text-xs">{years}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── TRUST STRIP ── */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div
            className="rounded-2xl border border-white/10 p-8 grid grid-cols-1 sm:grid-cols-3 gap-6"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            {([
              { icon: "🚀", label: "No account required", sub: "10 free questions a day as a guest — just open and start." },
              { icon: "💸", label: "Free to start", sub: "No credit card today. 7-day full-access trial, then $9.99/month AUD." },
              { icon: "🤖", label: "Powered by Claude AI", sub: "Anthropic's latest model as your personal tutor." },
            ] as const).map(({ icon, label, sub }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-center">
                <span className="text-3xl">{icon}</span>
                <p className="text-white font-bold text-sm">{label}</p>
                <p className="text-slate-500 text-xs leading-relaxed">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── BREAK ZONE + FEEDBACK ── */}
        <div className="max-w-4xl mx-auto px-6 pb-8 space-y-4">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase text-center mb-6">Need a moment?</p>
          <BreakZone />
          <FeedbackForm />
        </div>

        {/* ── FOOTER ── */}
        <div className="pb-12 flex flex-col items-center gap-4">
          <button
            onClick={() => setSplashDone(true)}
            className="px-8 py-3 rounded-full text-white font-bold text-base tracking-wide transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #E34C00 0%, #FDC800 50%, #0066CB 100%)" }}
          >
            Start Learning →
          </button>
          <div className="flex items-center gap-4">
            <a href="/about" className="text-xs transition-colors" style={{ color: "#4a5568" }} onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")} onMouseLeave={e => (e.currentTarget.style.color = "#4a5568")}>About the founder</a>
            <span style={{ color: "#2d3748" }}>·</span>
            <a href="/privacy" className="text-xs transition-colors" style={{ color: "#4a5568" }} onMouseEnter={e => (e.currentTarget.style.color = "#818cf8")} onMouseLeave={e => (e.currentTarget.style.color = "#4a5568")}>Privacy Policy</a>
          </div>
        </div>

        {/* Back to top */}
        {showBackToTop && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-xs font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4338ca)", boxShadow: "0 0 20px #7c3aed66" }}
            aria-label="Back to top"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 10L7 4L12 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to top
          </button>
        )}

      </div>
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
              <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                {(["chat", "practice", "exam", "adventure"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => handleModeChange(m)}
                    className="px-3 py-2 text-sm font-semibold transition-all"
                    style={mode === m ? {
                      background: m === "adventure" ? "#14532d" : "#000936",
                      color: m === "adventure" ? "#86efac" : "#FDC800",
                    } : {
                      background: "white",
                      color: "#64748b",
                    }}
                    title={m === "adventure" ? "Adventure Mode — mine through chapters!" : undefined}
                  >
                    {m === "chat" ? "💬 Chat" : m === "practice" ? "📝 Practice" : m === "exam" ? "⏱️ Exam" : "⛏️ Adventure"}
                  </button>
                ))}
              </div>
            </div>
          </div>

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
          {mode !== "exam" && mode !== "adventure" && (
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
                        Click &quot;Get Practice Problem&quot; to receive a question for {subject.split(" ")[0]}.
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
