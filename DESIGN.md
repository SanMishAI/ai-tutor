# SelectEd — Design Document

> **AI-powered exam preparation for Australian selective exams.**
> *Sharpen. Sit. Succeed.*

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Repository Layout](#3-repository-layout)
4. [High-Level Architecture](#4-high-level-architecture)
5. [Component Hierarchy](#5-component-hierarchy)
6. [Feature Breakdown](#6-feature-breakdown)
   - 6.1 Splash Screen
   - 6.2 Chat Mode (Notebook UI)
   - 6.3 Practice Mode
   - 6.4 Exam Mode
   - 6.5 Exam Mistake Review
   - 6.6 Chat History Sidebar
7. [API Routes](#7-api-routes)
8. [State Management](#8-state-management)
9. [Data Persistence](#9-data-persistence)
10. [UI & Design System](#10-ui--design-system)
11. [Environment Variables](#11-environment-variables)
12. [Local Development Setup](#12-local-development-setup)
13. [Roadmap](#13-roadmap)
14. [Deployment](#14-deployment)

---

## 1. Project Overview

SelectEd is a single-page web application that prepares students for six Australian exams using Claude AI as a Socratic tutor. Students can:

- **Chat** — ask questions and get guided (never directly answered) in a ruled-notebook UI
- **Practice** — receive generated problems and work through them with up to 5 attempts before the answer is revealed
- **Exam** — sit a timed mock exam, auto-submitted when time expires, then review mistakes with AI-generated walkthroughs

### Supported exams

| Exam | Levels available |
|------|-----------------|
| Australian Mathematics Competition (AMC) | Year 3–6, 7–8, 9–10, 11–12 |
| Maths Olympiad | Year 4–6, 7–8, 9–10 |
| ACER Exam | Year 3 – Year 9 |
| ICAS | Year 2 – Year 12 |
| ATAR | Year 11, Year 12 |
| NAPLAN | Year 3, 5, 7, 9 |

---

## 2. Tech Stack

| Layer | Technology | Version | Why |
|-------|-----------|---------|-----|
| Framework | Next.js (App Router) | 16.2.9 | File-based routing, API routes co-located with UI, RSC-ready |
| UI library | React | 19.2.4 | Component model, hooks |
| Styling | Tailwind CSS v4 | ^4 | Utility classes, dark mode, typography plugin |
| AI | Anthropic Claude | `claude-sonnet-4-6` | Capable instruction-following, cost-effective |
| AI SDK | `@anthropic-ai/sdk` | ^0.106 | Official typed client |
| Math rendering | KaTeX + remark-math + rehype-katex | — | Inline LaTeX in AI responses |
| Markdown | react-markdown | ^10 | Safe Markdown rendering in chat |
| Handwriting font | Caveat (Google Fonts via Next.js) | — | Notebook chat aesthetic |
| Type checking | TypeScript | ^5 | Catches shape mismatches between API and UI |

---

## 3. Repository Layout

```
ai-tutor/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Socratic tutor (chat + practice)
│   │   └── exam/
│   │       ├── generate/
│   │       │   └── route.ts      # Generates 10 exam questions
│   │       ├── grade/
│   │       │   └── route.ts      # Grades submitted answers
│   │       └── review/
│   │           └── route.ts      # Step-by-step AI walkthroughs for wrong answers
│   ├── components/
│   │   ├── ExamView.tsx           # All exam UI (setup → in-progress → results → review)
│   │   └── Sidebar.tsx            # Chat history sidebar
│   ├── globals.css                # Tailwind import, dark-mode custom properties
│   ├── layout.tsx                 # Root layout: fonts (Geist, Caveat), KaTeX CSS, metadata
│   ├── page.tsx                   # Main page: splash, header, controls, chat/practice/exam
│   └── types.ts                   # Shared TypeScript types
├── public/                        # Static assets (favicon, SVGs)
├── .env.local                     # ANTHROPIC_API_KEY (never committed)
├── package.json
├── tsconfig.json
└── DESIGN.md                      # ← this file
```

---

## 4. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                                                         │
│  ┌───────────┐   ┌─────────────┐   ┌────────────────┐  │
│  │  Splash   │   │  page.tsx   │   │  ExamView.tsx  │  │
│  │  Screen   │──▶│  (main app) │──▶│  (exam flow)   │  │
│  └───────────┘   └──────┬──────┘   └───────┬────────┘  │
│                         │                  │            │
│              ┌──────────┼──────────────────┘            │
│              │          │                               │
│        Sidebar.tsx   localStorage                       │
│        (history)     (conversations)                    │
└──────────────┼──────────────────────────────────────────┘
               │  fetch (JSON over HTTP)
               ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js API Routes                    │
│                                                         │
│  POST /api/chat          POST /api/exam/generate        │
│  POST /api/exam/grade    POST /api/exam/review          │
└──────────────┬──────────────────────────────────────────┘
               │  @anthropic-ai/sdk
               ▼
┌─────────────────────────────────────────────────────────┐
│              Anthropic API  (claude-sonnet-4-6)         │
└─────────────────────────────────────────────────────────┘
```

### Request lifecycle

```
User types message
       │
       ▼
page.tsx  sendMessage()
       │  builds messages array
       │  calls fetch("/api/chat", { method: "POST", body: JSON })
       ▼
/api/chat/route.ts
       │  picks system prompt (chat vs practice)
       │  appends subject + yearLevel context
       │  calls client.messages.create(...)
       ▼
Anthropic API
       │  streams / returns text
       ▼
route.ts  returns { reply: string }
       ▼
page.tsx  appends assistant message to state
          saves to localStorage
          re-focuses input
```

---

## 5. Component Hierarchy

```
Home (page.tsx)
│
├── [Splash Screen]          shown when splashDone === false
│
└── [Main App]               shown when splashDone === true
    │
    ├── <header>
    │   ├── ☰ sidebar toggle button
    │   ├── <Wordmark />          gradient "SelectEd" + coloured tagline
    │   └── <Logo />              illustrated SVG icon (student + stairs)
    │
    ├── <Sidebar />               slide-in chat history
    │   ├── conversation list (reverse-chronological)
    │   ├── per-item: title, subject badge, date, delete button
    │   └── "New Chat" button
    │
    └── <main>
        ├── Controls bar
        │   ├── Subject <select>
        │   ├── Year Level <select>
        │   └── Mode toggle  [Chat | Practice | Exam]
        │
        ├── {mode === "exam"}  →  <ExamView />
        │       ├── setup screen
        │       ├── generating spinner
        │       ├── in-progress (timer + navigator + question card)
        │       ├── submitting spinner
        │       ├── results summary  (+  "Review Mistakes" button)
        │       └── review screen   (AI walkthroughs per wrong answer)
        │
        ├── {mode === "chat"}  →  Notebook UI
        │       └── ruled paper bg + Caveat font
        │           ├── "You" entries  (ink blue / sky in dark)
        │           └── "Tutor" entries (dark brown / white in dark)
        │
        ├── {mode === "practice"}  →  Chat bubble UI
        │
        ├── Practice controls bar  (Get Problem / attempt counter / Reveal Answer)
        │
        └── Input row  (text input + Send button)
```

---

## 6. Feature Breakdown

### 6.1 Splash Screen

Shown on first load (`splashDone` state starts `false`). Clicking the **SelectEd** wordmark in the header at any time resets `splashDone` to `false`, returning here.

```
State:  splashDone: boolean  (useState, not persisted)

Flow:
  App loads → splashDone === false → render splash
  "Start Learning →" clicked → setSplashDone(true) → render main app
  Wordmark clicked (in header) → setSplashDone(false) → splash again
```

Design: full-screen dark (`#0a0b1a`), the illustrated `<Logo />` centered (responsive: `min(70vw, 320px)` wide with `height: auto`), purple/cyan neon glow blobs (halved on mobile via `sm:` breakpoint), gradient button.

---

### 6.2 Chat Mode — Notebook UI

```
User types → sendMessage() → POST /api/chat → reply appended → scrolls to bottom
```

**Notebook paper effect** — achieved entirely with CSS `background-image` on the chat container:

```
Light mode:
  backgroundColor: #fefce8            (cream paper)
  backgroundImage:
    linear-gradient(...)              (red margin line at x=72–74px)
    repeating-linear-gradient(...)    (blue ruled lines every 32px)

Dark mode (isDark detected via window.matchMedia):
  backgroundColor: #0d1117            (dark paper)
  backgroundImage:
    linear-gradient(...)              (maroon margin line)
    repeating-linear-gradient(...)    (navy ruled lines)
```

`backgroundAttachment: local` keeps lines locked to content when scrolling.

Font: **Caveat** (Google Fonts, loaded via Next.js `next/font/google`, exposed as CSS variable `--font-caveat`).

| Role | Light ink | Dark ink |
|------|-----------|----------|
| You (label) | `#6366f1` indigo | `#818cf8` indigo-400 |
| You (text) | `#1e3a5f` deep blue | `#93c5fd` sky-300 |
| Tutor (label) | `#b45309` amber-700 | `#ffffff` white |
| Tutor (text) | `#431407` dark brown | `#ffffff` white |

Loading state: animated ✏️ and blinking cursor `|` in tutor ink colour.

---

### 6.3 Practice Mode

```
"Get Practice Problem" clicked
  → builds system prompt asking Claude to generate a problem
  → POST /api/chat  (mode="practice" system prompt)
  → problem appears as assistant message

Student types answer
  → POST /api/chat  (mode="practice" system prompt, full history)
  → Claude gives Socratic hint, never answer directly
  → attemptCount incremented each send

attemptCount >= 5  → "Reveal Answer" button appears
  → sends "I give up. Please reveal the full solution."
  → Claude provides complete worked solution
```

**System prompt rules for practice** (in `/api/chat/route.ts`):
- Never give answer directly
- Give a small hint only
- Reveal only on explicit give-up OR after 5 genuine attempts
- Praise correct partial reasoning

---

### 6.4 Exam Mode — State Machine

`ExamView.tsx` owns a local state machine with these states:

```
  ┌─────────┐
  │  setup  │  ← user picks duration (30 / 45 / 60 min)
  └────┬────┘
       │ "Start Exam" clicked
       ▼
  ┌───────────┐
  │ generating │  POST /api/exam/generate → 10 questions JSON
  └─────┬─────┘
        │ questions arrive
        ▼
  ┌─────────────┐     timer hits 0 or
  │ in_progress  │ ──────────────────────▶ ┌────────────┐
  └─────────────┘     "Submit" clicked      │ submitting │
                                            └─────┬──────┘
                                                  │ POST /api/exam/grade
                                                  ▼
                                            ┌─────────┐
                                            │ results │
                                            └─────────┘
```

**Timer** uses `setInterval` inside `useEffect`. The submit function is stored in a `useRef` (`submitRef`) so the stale-closure problem in the interval callback is avoided.

**Two-minute warning**: when `timeLeft === 121` (121 seconds = 2:01 remaining) the warning banner appears.

**Question formats** (defined in `/api/exam/generate/route.ts`):

| Exam | Format |
|------|--------|
| AMC | 7 MC (5 options A–E) + 3 open-ended |
| Maths Olympiad | 10 open-ended (proof/reasoning) |
| ACER | 10 MC (4 options A–D) |
| ICAS | 10 MC (4 options A–D) |
| ATAR | 5 MC + 5 open-ended |
| NAPLAN | 5 MC + 5 short answer |

---

### 6.5 Exam Mistake Review

Triggered by the **"📖 Review N Mistakes with AI Tutor"** button on the results screen.

```
fetchReview(results) called
  │
  ├── filters results to wrong answers only
  ├── builds wrongQuestions array:
  │     { id, text, type, options, studentAnswer, correctAnswer }
  ├── POST /api/exam/review  { subject, wrongQuestions }
  │
  ▼
/api/exam/review/route.ts
  │  Claude writes per-question walkthroughs:
  │    1. What the question was asking
  │    2. Where the student went wrong
  │    3. Correct approach step-by-step
  │    4. Memorable tip
  │  Returns { reviews: [{ id, walkthrough }] }
  ▼
reviewData state populated  (Record<questionId, walkthrough>)
showReview = true  → review view rendered
```

Review view: each wrong question gets a card with:
- Red "Your answer" / Green "Correct answer" side-by-side
- Blue "Step-by-step walkthrough" panel (Markdown + KaTeX)

---

### 6.6 Chat History Sidebar

**Responsive behaviour:** The sidebar is collapsed by default. On mount, `useEffect` checks `window.innerWidth >= 640` (Tailwind's `sm` breakpoint) and opens it automatically on desktop. On mobile it stays closed; the ☰ header button toggles it. When open on mobile, the sidebar renders as a `fixed` overlay (z-50) on top of the content with a semi-transparent backdrop (`bg-black/50`) behind it — tapping the backdrop or selecting a conversation closes it. On sm+ it is `relative` and inline, pushing the content to the right.

All conversations are kept in `localStorage` under the key `tutormate_conversations` (array of `Conversation` objects).

```
Conversation {
  id:        string          (timestamp)
  title:     string          (first 38 chars of first message)
  subject:   string
  messages:  Message[]
  mode:      "chat" | "practice"
  createdAt: string          (ISO 8601)
}
```

`Sidebar.tsx` displays conversations in reverse-chronological order. Dates are shown as "Today", "Yesterday", or `dd/mm/yyyy`. A subject abbreviation badge is extracted from the exam name (e.g. `(AMC)` → `AMC`).

Selecting a conversation loads its messages into the main view. Deleting removes it from `localStorage`.

---

## 7. API Routes

All routes are `POST`, accept and return JSON.

### `POST /api/chat`

**Purpose:** Socratic tutor responses for chat and practice modes.

**Request body:**
```json
{
  "messages":  [{ "role": "user"|"assistant", "content": "string" }],
  "subject":   "Australian Mathematics Competition (AMC)",
  "yearLevel": "Year 7–8 (Junior)",
  "mode":      "chat" | "practice"
}
```

**Response:**
```json
{ "reply": "string" }
```

Two system prompts live here — one for chat (explain concepts, never give answers) and one for practice (generate problems, guide without revealing).

---

### `POST /api/exam/generate`

**Purpose:** Generates 10 exam questions in JSON.

**Request body:**
```json
{ "subject": "string", "yearLevel": "string" }
```

**Response:**
```json
{
  "questions": [
    { "id": 1, "text": "string", "type": "multiple_choice", "options": ["A. ...", "B. ..."] },
    { "id": 2, "text": "string", "type": "open_ended" }
  ]
}
```

Uses `extractJson()` helper to strip markdown fences from Claude's response before parsing.

---

### `POST /api/exam/grade`

**Purpose:** Grades all 10 submitted answers.

**Request body:**
```json
{
  "subject": "string",
  "questions": [ExamQuestion],
  "answers": { "1": "A. answer text", "2": "student wrote..." }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "correct": true,
      "correctAnswer": "string",
      "explanation": "one-line explanation",
      "question": { ...original ExamQuestion... }
    }
  ]
}
```

---

### `POST /api/exam/review`

**Purpose:** Generates detailed step-by-step walkthroughs for wrong answers only.

**Request body:**
```json
{
  "subject": "string",
  "wrongQuestions": [
    {
      "id": 1,
      "text": "string",
      "type": "multiple_choice",
      "options": [...],
      "studentAnswer": "string",
      "correctAnswer": "string"
    }
  ]
}
```

**Response:**
```json
{
  "reviews": [
    { "id": 1, "walkthrough": "Full markdown + LaTeX walkthrough..." }
  ]
}
```

---

## 8. State Management

All state lives in two places: **`page.tsx`** (app-level) and **`ExamView.tsx`** (exam-level). There is no global store.

### `page.tsx` state

| State variable | Type | Purpose |
|---------------|------|---------|
| `splashDone` | `boolean` | Controls splash vs main app |
| `isDark` | `boolean` | OS dark-mode preference (drives notebook colours) |
| `conversations` | `Conversation[]` | Full chat history, synced to localStorage |
| `activeId` | `string \| null` | Which conversation is open |
| `input` | `string` | Current input box value |
| `loading` | `boolean` | AI request in flight |
| `mode` | `"chat"\|"practice"\|"exam"` | Active mode tab |
| `subject` | `string` | Selected exam type |
| `yearLevel` | `string` | Selected year level |
| `sidebarOpen` | `boolean` | Sidebar visibility (default `false`; set to `true` on mount if viewport ≥ 640px) |
| `attemptCount` | `number` | Practice mode attempt counter |
| `practiceActive` | `boolean` | Whether a practice problem is running |

### `ExamView.tsx` state

| State variable | Type | Purpose |
|---------------|------|---------|
| `examState` | `ExamState` | Current state-machine node |
| `duration` | `number` | Selected minutes (30/45/60) |
| `questions` | `ExamQuestion[]` | Generated questions |
| `answers` | `Record<number, string>` | Student's answers keyed by question id |
| `currentQ` | `number` | Index of the visible question |
| `timeLeft` | `number` | Seconds remaining |
| `showWarning` | `boolean` | 2-minute warning banner visible |
| `results` | `GradedResult[]` | Graded results from Claude |
| `error` | `string` | Error message if API fails |
| `showReview` | `boolean` | Review screen vs results screen |
| `reviewData` | `Record<number, string>` | AI walkthroughs keyed by question id |
| `reviewLoading` | `boolean` | Review API in flight |

---

## 9. Data Persistence

The only persistence today is **`localStorage`** for chat conversations.

```
Key:   "tutormate_conversations"
Value: JSON array of Conversation objects
```

Write happens in `saveMessages()` inside `page.tsx`, called after every AI response. Read happens in `useEffect` on mount via `loadConversations()`.

**Limits:** No cross-device sync. No authentication. Conversations survive browser refresh but not clearing localStorage. Max storage is browser-dependent (~5–10 MB).

**Planned (Phase 4):** Replace localStorage with a server-side database behind user accounts, enabling cross-device access, score history, and leaderboards.

---

## 10. UI & Design System

### Colour palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#4338ca` indigo-700 | Buttons, focus rings |
| Brand cyan | `#00e5ff` | Logo, wordmark gradient start |
| Brand purple | `#7c3aed` | Logo, wordmark gradient end |
| Brand pink | `#ff44aa` | "Ed" suffix in wordmark |
| Neon green | `#00ff80` | Stair edges in logo |
| Amber | `#fbbf24` | Logo AI orb trail, practice labels |
| Paper light | `#fefce8` | Notebook background |
| Paper dark | `#0d1117` | Dark-mode notebook background |
| Line light | `#bfdbfe` | Ruled lines (light) |
| Line dark | `#1a2744` | Ruled lines (dark) |
| Margin light | `#fca5a5` | Red margin line (light) |
| Margin dark | `#3d1530` | Red margin line (dark) |

### Typography

| Context | Font | Size |
|---------|------|------|
| App UI | Geist Sans (Next.js default) | Tailwind defaults |
| Monospace | Geist Mono | Tailwind defaults |
| Notebook chat | Caveat (Google Fonts) | 20px, line-height 32px |
| Notebook labels | system-ui | 11px uppercase |
| Logo wordmark | Arial Black / Impact | 34px italic |

### Dark mode

Dark mode is driven by the OS `prefers-color-scheme` media query. Tailwind's `dark:` variants handle most components. The notebook's inline styles use a `isDark` React state value that is populated by `window.matchMedia` in a `useEffect`.

### Responsive / mobile design

The app is designed mobile-first at the Tailwind `sm` (640px) breakpoint.

| Area | Mobile (< 640px) | Desktop (≥ 640px) |
|------|-----------------|-------------------|
| Viewport height | `h-[100dvh]` (dynamic, avoids iOS Safari toolbar) | same |
| Splash logo | `min(70vw, 320px)` wide | 320px |
| Splash glow blobs | `w-48 h-48` | `w-96 h-96` |
| Sidebar | Fixed overlay, collapsed by default | Inline column, open by default |
| Sidebar backdrop | Semi-transparent overlay, tap to close | Not rendered |
| Main padding | `p-2` | `p-4` |
| Wordmark font | `clamp(22px, 5.5vw, 34px)` | 34px |
| Exam navigator buttons | `40×40px` (minimum touch target) | `32×32px` |
| Review answer grid | `grid-cols-1` | `grid-cols-2` |
| Practice controls | `flex-wrap` | same |
| Viewport meta | `width=device-width, initialScale=1, maximumScale=1` | same |

### Logo components

| Component | Usage |
|-----------|-------|
| `<Logo size={n} style={...}/>` | Illustrated SVG (student on stairs, flag, orb). Uses CSS `style` (not HTML attributes) so width can be overridden. Used in header (right, 56px) and splash (responsive). Inline SVG with `<defs>` for gradients and neon glow filters. |
| `<Wordmark />` | Pure HTML/CSS. "Select" in cyan→blue gradient, "Ed" in pink→purple gradient. "Sharpen · Sit · Succeed." in green/blue/amber. Used in header (left). Clicking returns to splash. Font size uses `clamp()` for responsiveness. |

---

## 11. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key from console.anthropic.com |

Store in `.env.local` at the project root. This file is in `.gitignore` and must **never** be committed.

```
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

Next.js automatically loads `.env.local` and makes variables available to server-side code (API routes). Variables are **not** exposed to the browser.

---

## 12. Local Development Setup

### Prerequisites

| Tool | Min version | Check |
|------|------------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | any | `git --version` |

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/SanMishAI/ai-tutor.git
cd ai-tutor

# 2. Install dependencies
npm install

# 3. Add your API key
# Create a file called .env.local in the project root:
#   ANTHROPIC_API_KEY=sk-ant-...

# 4. Start the dev server
npm run dev

# 5. Open http://localhost:3000
```

> **Important:** Start the dev server AFTER creating `.env.local`. If you create the file while the server is running, restart it (Ctrl+C then `npm run dev`) so the key is picked up.

### Useful commands

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Production build (catches type errors)
npm run lint     # ESLint
npx tsc --noEmit # Type-check without building
```

---

## 13. Roadmap

### Phase 4 — User Accounts (planned)

- Sign-up / login (email + password or OAuth)
- Server-side conversation storage (replaces localStorage)
- Per-user score history with subject and date filters
- Account settings (display name, preferred year level)

### Phase 5 — Gamification (planned)

- **Streaks**: consecutive days of practice, with one 30-day freeze
- **Leaderboard**: top users by weekly practice score, displayed by username
- **Badges**: awarded for milestones (first exam, perfect score, 7-day streak, etc.)

---

---

## 14. Deployment

### Live URL

| URL | Notes |
|-----|-------|
| `https://selected-ed.vercel.app` | Primary alias — share this one |
| `https://ai-tutor-psi-three.vercel.app` | Original alias — also works |

### Platform

Hosted on **Vercel** (free hobby tier) under the `select-ed` team. All four API routes deploy as serverless functions (Dynamic rendering).

### Environment variables on Vercel

`ANTHROPIC_API_KEY` must be set in **Vercel dashboard → Project → Settings → Environment Variables** for Production, Preview, and Development environments. Without it, all AI calls fail with 500.

### Deploy command

```bash
vercel --prod --yes
```

Run from the project root. Vercel auto-builds with `npm run build` and deploys the output.

---

*Document last updated: June 2026. Updated alongside the codebase whenever routes, components, or UX decisions change.*
