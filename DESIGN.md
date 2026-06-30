# SelectEd — Design Document

> **AI-powered exam preparation for Australian selective exams.**
> *Sharpen. Sit. Succeed.*

**Author:** Santrupta Mishra (San)
**Role:** Founder & Developer
**Contact:** Director, Global Consulting · Melbourne, Australia
**Repository:** https://github.com/SanMishAI/ai-tutor
**Live URL:** https://selected-ed.vercel.app

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
   - 6.7 Brain Break (Trivia Zone)
   - 6.8 Feedback Form
   - 6.9 Welcome Screen ("Choose Your Mission")
7. [API Routes](#7-api-routes)
8. [State Management](#8-state-management)
9. [Data Persistence](#9-data-persistence)
10. [Authentication](#10-authentication)
11. [UI & Design System](#11-ui--design-system)
12. [Environment Variables](#12-environment-variables)
13. [Local Development Setup](#13-local-development-setup)
14. [Roadmap](#14-roadmap)
15. [Deployment](#15-deployment)
16. [Favicon & Open Graph](#16-favicon--open-graph)
17. [Privacy Policy](#17-privacy-policy)
18. [About Page](#18-about-page)
19. [Version History](#19-version-history)

---

## 1. Project Overview

SelectEd is a web application that prepares Australian students for selective school and competition exams using Claude AI as a Socratic tutor. Students can:

- **Chat** — ask questions and get guided (never directly answered) in a ruled-notebook UI
- **Practice** — receive generated problems and work through them with up to 5 attempts before the answer is revealed
- **Exam** — sit a timed mock exam, auto-submitted when time expires, then review mistakes with AI-generated walkthroughs

Users can optionally sign in with Google, Apple, GitHub, email, or phone to sync their data across devices. Guests can use the full app without creating an account.

### Supported exams

| Exam | Levels available |
|------|-----------------|
| Australian Mathematics Competition (AMC) | Year 3–6, 7–8, 9–10, 11–12 |
| Maths Olympiad | Year 4–6, 7–8, 9–10 |
| ACER Exam | Year 3 – Year 9 |
| ICAS | Year 2 – Year 12 |
| ATAR | Year 11, Year 12 |
| NAPLAN | Year 3, 5, 7, 9 |
| Bebras | Year 3–4, 5–6, 7–8, 9–10, 11–12 |
| Kangourou sans frontières (KSF) | Year 3–4 (Känguru), 5–6 (Cadet), 7–8 (Junior), 9–10 (Student), 11–12 (Senior) |

---

## 2. Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** (App Router) | 16.2.9 | Framework — file-based routing, React Server Components, co-located API routes |
| **React** | 19.2.4 | Component model and hooks |
| **TypeScript** | ^5 | Static typing across the entire codebase |
| **Tailwind CSS v4** | ^4 | Utility-first styling, dark mode variants, responsive breakpoints |
| **@tailwindcss/typography** | ^0.5.20 | `prose` classes for AI-generated Markdown content |
| **Caveat** (Google Fonts via `next/font`) | — | Handwriting font for the notebook chat aesthetic |
| **Geist Sans / Geist Mono** | — | App UI and code font (Next.js default) |

### AI & Content Rendering

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Anthropic Claude** (`claude-sonnet-4-6`) | — | Socratic tutor, exam generation, grading, review walkthroughs |
| **@anthropic-ai/sdk** | ^0.106.0 | Official typed Anthropic API client |
| **react-markdown** | ^10.1.0 | Renders Markdown returned by Claude |
| **remark-math** | ^6.0.0 | Parses LaTeX math in Markdown (`$...$`, `$$...$$`) |
| **rehype-katex** | ^7.0.1 | Renders parsed math using KaTeX |
| **rehype-raw** | ^7.0.0 | Passes raw HTML/SVG through the rehype pipeline — enables inline SVG diagrams in Claude responses |
| **katex** | ^0.17.0 | KaTeX math renderer (CSS + runtime) |

### Authentication

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Clerk** (`@clerk/nextjs`) | ^7.5.10 | User authentication — Google, Apple, GitHub, email, phone number sign-in. Pre-built modal UI, session management, server-side `auth()` helper |

### Database & ORM

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Neon** (PostgreSQL) | — | Serverless Postgres database hosted in AWS Sydney (closest region to Melbourne) |
| **Prisma** | ^7.8.0 | ORM — schema definition, migrations, type-safe query client |
| **@prisma/adapter-neon** | ^7.8.0 | Prisma driver adapter for Neon's HTTP protocol |
| **@neondatabase/serverless** | ^1.1.0 | Neon serverless HTTP driver (works in Vercel Edge/serverless functions) |

### Analytics & Observability

| Technology | Version | Purpose |
|-----------|---------|---------|
| **@vercel/analytics** | ^2.0.1 | Page view tracking, top pages, device and country breakdowns. Dashboard at vercel.com |

### Infrastructure

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Vercel** | — | Hosting, CI/CD, serverless functions, environment variable management |
| **GitHub** | — | Source control (`github.com/SanMishAI/ai-tutor`) |
| **dotenv** | ^17.4.2 | Loads `.env.local` into `prisma.config.ts` for local Prisma CLI operations |

---

## 3. Repository Layout

```
ai-tutor/
├── app/
│   ├── about/
│   │   └── page.tsx                  # Founder story page (/about)
│   ├── privacy/
│   │   └── page.tsx                  # Privacy policy page (/privacy)
│   ├── icon.tsx                      # Branded favicon (32×32 PNG via ImageResponse)
│   ├── opengraph-image.tsx           # Social preview card (1200×630 PNG via ImageResponse)
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts              # Socratic tutor (chat + practice)
│   │   ├── conversations/
│   │   │   └── route.ts              # GET/POST/DELETE user conversations (auth-protected)
│   │   ├── exam/
│   │   │   ├── generate/route.ts     # Generates 10 exam questions
│   │   │   ├── grade/route.ts        # Grades submitted answers
│   │   │   └── review/route.ts       # Step-by-step AI walkthroughs for wrong answers
│   │   ├── exam-results/
│   │   │   └── route.ts              # GET/POST exam results (auth-protected)
│   │   ├── feedback/
│   │   │   └── route.ts              # POST feedback (auth-optional, saves to Feedback table)
│   │   ├── practice-results/
│   │   │   └── route.ts              # POST practice results (auth-protected)
│   │   └── trivia/
│   │       └── route.ts              # POST trivia questions (Brain Break, no auth)
│   ├── components/
│   │   ├── BreakZone.tsx             # Brain Break trivia quiz (landing page)
│   │   ├── ExamView.tsx              # All exam UI (setup → in-progress → results → review)
│   │   ├── FeedbackForm.tsx          # Emoji mood + text feedback form (landing page)
│   │   ├── Sidebar.tsx               # Chat history sidebar
│   │   └── WelcomeScreen.tsx         # "Choose your mission" onboarding (between splash and app)
│   ├── generated/
│   │   └── prisma/                   # Auto-generated Prisma client (do not edit)
│   ├── sign-in/[[...sign-in]]/
│   │   └── page.tsx                  # Clerk sign-in page (/sign-in)
│   ├── sign-up/[[...sign-up]]/
│   │   └── page.tsx                  # Clerk sign-up page (/sign-up)
│   ├── globals.css                   # Tailwind import, dark-mode custom properties
│   ├── layout.tsx                    # Root layout: fonts, KaTeX CSS, ClerkProvider, Analytics
│   ├── page.tsx                      # Main page: splash, header, controls, chat/practice/exam
│   └── types.ts                      # Shared TypeScript types
├── lib/
│   ├── db.ts                         # Prisma client singleton (with Neon HTTP adapter)
│   └── ratelimit.ts                  # In-memory rate limiter (createRateLimiter + getIp)
├── prisma/
│   ├── migrations/                   # Prisma migration history
│   └── schema.prisma                 # Database schema (Conversation, ExamResult, PracticeResult, Feedback)
├── public/
│   └── san.jpeg                      # Founder photo (About page)
├── middleware.ts                     # Clerk auth middleware (runs on every request)
├── prisma.config.ts                  # Prisma 7 config (datasource URL, migration path)
├── .env.local                        # All secrets — never committed (see Section 12)
├── package.json
├── tsconfig.json
└── DESIGN.md                         # ← this file
```

---

## 4. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                           Browser                            │
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │  Splash  │   │  page.tsx    │   │   ExamView.tsx       │  │
│  │  Screen  │──▶│  (main app)  │──▶│   (exam flow)        │  │
│  └──────────┘   └──────┬───────┘   └──────────┬──────────┘  │
│                        │                      │              │
│             ┌──────────┼──────────────────────┘              │
│             │          │                                     │
│       Sidebar.tsx   localStorage (guest)                     │
│       (history)     OR /api/conversations (signed in)        │
└─────────────┼────────────────────────────────────────────────┘
              │  fetch (JSON over HTTPS)
              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│                                                              │
│  POST  /api/chat                POST /api/exam/generate      │
│  POST  /api/exam/grade          POST /api/exam/review        │
│  GET   /api/conversations       POST /api/conversations      │
│  DELETE /api/conversations      POST /api/exam-results       │
│  POST  /api/practice-results                                 │
└──────────┬──────────────────────────┬───────────────────────┘
           │  @anthropic-ai/sdk       │  Prisma + Neon adapter
           ▼                          ▼
┌─────────────────────┐   ┌──────────────────────────────────┐
│  Anthropic API      │   │  Neon PostgreSQL (AWS Sydney)     │
│  claude-sonnet-4-6  │   │  Conversation, ExamResult,        │
└─────────────────────┘   │  PracticeResult tables            │
                          └──────────────────────────────────┘

Auth layer (middleware.ts + Clerk):
  Every request → Clerk middleware → session validated
  API routes call auth() to get userId before touching DB
```

---

## 5. Component Hierarchy

```
Home (page.tsx)
│
├── [Splash Screen]          shown when splashDone === false
│
├── [WelcomeScreen]          shown when splashDone === true && introSeen === false
│       └── Step 1: exam card grid → Step 2: year pills + mode buttons → sets introSeen
│
└── [Main App]               shown when splashDone === true && introSeen === true
    │
    ├── <header>
    │   ├── ☰ sidebar toggle button
    │   ├── <Wordmark />          gradient "SelectEd" + coloured tagline
    │   ├── <AuthButton />        "Sign in" (guest) | <UserButton /> (signed in)
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

### 6.1 Splash Screen / Landing Page

Shown on first load (`splashDone` state starts `false`). Clicking the **SelectEd** wordmark in the header at any time resets `splashDone` to `false`, returning here.

The page is a scrollable landing page (`overflow-y-auto`). Above the fold it behaves as a full-screen hero; below are marketing sections.

**Hero** (`h-[100dvh]`) — illustrated `<Logo />` centered (responsive: `min(70vw, 320px)` wide), purple/cyan neon glow blobs (halved on mobile), gradient "Start Learning →" button, exam list tagline.

**Features section** — three cards (Chat / Practice / Exam), each with an icon, colour-coded badge, description, and "Try it →" CTA that calls `setSplashDone(true)`.

**Exams section** — six cards, one per supported exam (AMC, Olympiad, ACER, ICAS, ATAR, NAPLAN), each showing the short name in brand colour, full name, and year level range.

**Trust strip** — single card with three columns: "No account required", "Free to use", "Powered by Claude AI".

**Brain Break + Feedback** — collapsible panels below the trust strip (see §6.7 and §6.8).

**Footer** — second "Start Learning →" button (so users don't scroll back up) above About + Privacy links.

---

### 6.2 Chat Mode — Notebook UI

```
User types → sendMessage() → POST /api/chat → reply appended → scrolls to bottom
```

**Notebook paper effect** — achieved with CSS `background-image`:

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

Font: **Caveat** (Google Fonts, loaded via `next/font/google`, CSS variable `--font-caveat`).

| Role | Light ink | Dark ink |
|------|-----------|----------|
| You (label) | `#6366f1` indigo | `#818cf8` indigo-400 |
| You (text) | `#1e3a5f` deep blue | `#93c5fd` sky-300 |
| Tutor (label) | `#b45309` amber-700 | `#ffffff` white |
| Tutor (text) | `#431407` dark brown | `#ffffff` white |

Prose colour fix: `@tailwindcss/typography` sets `color: var(--tw-prose-body)` explicitly on child elements. These CSS custom properties are overridden via inline `style` on the prose container: `--tw-prose-body`, `--tw-prose-headings`, `--tw-prose-bold`, etc. Both the custom property override and `[&_*]:!text-inherit` are applied for maximum cross-browser coverage.

**Rich content rendering:** All tutor responses and exam content are rendered through a `rehype-raw → rehype-katex` pipeline so that:
- LaTeX math (`$...$` inline, `$$...$$` display) is typeset via KaTeX
- Inline SVG diagrams generated by Claude are rendered directly in the browser
- Answer option buttons in exams also run through this pipeline, so options can contain typeset math or diagrams

---

### 6.3 Practice Mode

```
"Get Practice Problem" clicked
  → POST /api/chat  (mode="practice" system prompt)
  → problem appears as assistant message

Student types answer
  → POST /api/chat  (mode="practice" system prompt, full history)
  → Claude gives Socratic hint, never answer directly
  → attemptCount incremented each send

attemptCount >= 5  → "Reveal Answer" button appears
  → sends "I give up. Please reveal the full solution."
```

---

### 6.4 Exam Mode — State Machine

`ExamView.tsx` owns a local state machine:

```
  ┌─────────┐
  │  setup  │  ← user picks duration (30 / 45 / 60 min)
  └────┬────┘
       │ "Start Exam" clicked
       ▼
  ┌───────────┐
  │ generating │  POST /api/exam/generate → 10 questions JSON
  └─────┬─────┘
        ▼
  ┌─────────────┐     timer hits 0 or "Submit" clicked
  │ in_progress  │ ──────────────────────────────────▶ ┌────────────┐
  └─────────────┘                                       │ submitting │
                                                        └─────┬──────┘
                                                              │ POST /api/exam/grade
                                                              ▼
                                                        ┌─────────┐
                                                        │ results │ → onFinish() saves to cloud
                                                        └─────────┘
```

**Timer** uses `setInterval` in `useEffect`. The submit function is stored in `useRef` (`submitRef`) to avoid stale-closure bugs in the interval callback.

| Exam | Question format |
|------|----------------|
| AMC | 7 MC (5 options A–E) + 3 open-ended |
| Maths Olympiad | 10 open-ended (proof/reasoning) |
| ACER | 10 MC (4 options A–D) |
| ICAS | 10 MC (4 options A–D) |
| ATAR | 5 MC + 5 open-ended |
| NAPLAN | 5 MC + 5 short answer |

**Rich question content:** Claude is instructed to use LaTeX for all mathematical notation and to embed inline SVG diagrams for geometry and visual questions. Answer options may also contain LaTeX or SVG (e.g. four shapes where the student picks the correct one). The `answers` state stores only the letter (`A`/`B`/`C`/`D`/`E`), not the full option text, to keep storage clean regardless of option content size.

**SVG strip before grading/review:** The grade and review API routes call `stripSvg()` on question text and options before sending them to Claude, replacing `<svg>...</svg>` with `[diagram]`. This avoids sending large SVG payloads in context while Claude still has enough information to grade the answer and write a walkthrough.

---

### 6.5 Exam Mistake Review

On the results screen, the **"📖 Review N Mistakes with AI Tutor"** button calls `POST /api/exam/review` with all wrong answers. Claude returns per-question walkthroughs (what was asked, where the student went wrong, correct approach, memorable tip). Rendered as Markdown + KaTeX cards.

---

### 6.6 Chat History Sidebar

**Responsive behaviour:** Collapsed by default on mobile, open on desktop (≥ 640px). `useEffect` on mount uses `window.matchMedia("(min-width: 640px)")` with a `change` listener to track orientation changes. On mobile, the sidebar is a `fixed` overlay (z-50) with a semi-transparent backdrop — tapping closes it. On desktop, it is `relative` inline.

**Storage:** When the user is a guest, conversations are stored in `localStorage` under `tutormate_conversations`. When signed in, they are loaded from and saved to the Neon database via `/api/conversations`.

---

### 6.9 Welcome Screen ("Choose Your Mission")

**File:** `app/components/WelcomeScreen.tsx`

Shown once per session, between the landing page and the main app. Triggered when the user clicks "Start Learning →" on the splash screen. Replaces the jarring cold-entry into a blank chat UI with an engaging onboarding flow.

**Page flow:**
```
Landing page  →  [Start Learning]  →  WelcomeScreen  →  Main app
                                       (splashDone=true,     (introSeen=true,
                                        introSeen=false)      subject/year/mode set)
```

**Step 1 — Pick your exam:**
- Header: 🚀 "Choose your mission"
- 2×4 grid of exam cards (AMC, Olympiad, ACER, ICAS, ATAR, NAPLAN, Bebras, KSF)
- Each card shows: emoji · short label in brand colour · one-line description
- Cards glow in their brand colour on hover
- Clicking a card selects it and advances to Step 2

**Step 2 — Pick year level + mode:**
- Selected exam shown as a large emoji + coloured label
- Year level: pill buttons (from the same `YEAR_LEVELS` data as the main app; coloured to match the chosen exam)
- Three mode buttons: 💬 Chat with tutor · 📝 Practice problems · 📋 Timed exam
- Clicking a mode button calls `onStart(subject, yearLevel, mode)` → sets state in `page.tsx` and sets `introSeen = true`
- "← Change exam" link returns to Step 1

**State management:**
- `introSeen` boolean lives in `page.tsx` (React state, resets on page refresh — intentional so each new session starts with quest selection)
- `onStart` callback sets `subject`, `yearLevel`, `mode` in `page.tsx` before revealing the main app

**Design:** same dark `#0a0b1a` background and glow blobs as the splash screen, so the transition feels seamless.

---

### 6.7 Brain Break (Trivia Zone)

**File:** `app/components/BreakZone.tsx`

A collapsible panel on the splash/landing page designed to help students decompress after studying. Powered by `POST /api/trivia`.

**State machine:** `choose → loading → playing → answered → done`

**Categories:** Animals 🐾, Space 🚀, Sports ⚽, Pop Culture 🎬, World Records 🌍, Surprise Me! 🎲

**Flow:**
1. User picks a category
2. Spinner while Claude generates 5 fun MC questions (4 options A–D, plus a fun fact per question)
3. Answer buttons highlight green (correct) or red (wrong) after selection
4. A fun fact is shown with a "Next Question →" button
5. Results screen shows score/5 with an emoji message; "Play Again" resets to category picker

Questions are generated live by Claude (`claude-sonnet-4-6`), targeting Australian school students aged 8–16 with surprising, non-academic content. Rate-limited to 10 requests/minute.

---

### 6.8 Feedback Form

**File:** `app/components/FeedbackForm.tsx`

A collapsible panel below Brain Break. Saves to the `Feedback` table in Neon.

**Mood options:** 😍 Love it! · 😊 Like it · 😐 It's okay · 😕 Confused · 💡 Got ideas?

**Flow:**
1. User picks a mood (required)
2. Optional text field (500 chars max) with mood-aware placeholder text
3. Submit calls `POST /api/feedback` — stores mood + optional message + userId (if signed in) in Neon
4. Success shows a confetti thank-you screen; "Send another message" link resets the form

Guest users can submit feedback without signing in (`userId` is nullable).

---

## 7. API Routes

### Rate limiting

All AI routes are protected by an in-memory rate limiter (`lib/ratelimit.ts`) keyed on the client IP address (read from `x-forwarded-for` / `x-real-ip` headers set by Vercel's proxy). Limits are enforced per serverless function instance; a `429 Too Many Requests` response is returned when exceeded.

| Route | Limit |
|-------|-------|
| `POST /api/chat` | 30 requests / minute |
| `POST /api/exam/generate` | 3 requests / 10 minutes |
| `POST /api/exam/grade` | 5 requests / 10 minutes |
| `POST /api/exam/review` | 3 requests / 10 minutes |
| `POST /api/trivia` | 10 requests / minute |

> **Note:** The limiter is in-process. Under heavy load Vercel may spin up multiple instances, each with its own counter. This is sufficient to prevent casual abuse; replace with Upstash Redis if higher traffic demands distributed enforcement.

### AI routes (no auth required)

#### `POST /api/chat`
Socratic tutor for chat and practice modes.

```json
// Request
{ "messages": [...], "subject": "string", "yearLevel": "string", "mode": "chat|practice" }

// Response
{ "reply": "string" }
```

#### `POST /api/exam/generate`
Generates 10 exam questions as JSON. `max_tokens: 8000` to accommodate SVG content.

```json
// Request
{ "subject": "string", "yearLevel": "string" }

// Response — question text and options may contain LaTeX and inline SVG
{ "questions": [{ "id": 1, "text": "string (may contain $LaTeX$ or <svg>)</svg>)", "type": "multiple_choice", "options": ["A. text or <svg>...</svg>", ...] }] }
```

#### `POST /api/exam/grade`
Grades all submitted answers. SVG is stripped from question text/options (`stripSvg()`) before sending to Claude; the student answer is always a single letter.

```json
// Request
{ "subject": "string", "questions": [...], "answers": { "1": "A", "2": "B" } }

// Response — correctAnswer and explanation use LaTeX
{ "results": [{ "id": 1, "correct": true, "correctAnswer": "B", "explanation": "$x = \\frac{-b}{2a}$...", "question": {...} }] }
```

#### `POST /api/exam/review`
Generates step-by-step walkthroughs for wrong answers. `max_tokens: 8000`. SVG stripped from input; Claude may generate new SVG diagrams in the walkthrough output.

```json
// Request
{ "subject": "string", "wrongQuestions": [{ "id": 1, "text": "...(SVG stripped)...", "studentAnswer": "A", "correctAnswer": "B" }] }

// Response — walkthroughs are full Markdown with LaTeX and optional SVG
{ "reviews": [{ "id": 1, "walkthrough": "Full markdown + LaTeX + optional <svg>...</svg>..." }] }
```

#### `POST /api/trivia`
Generates 5 fun general-knowledge trivia questions for the Brain Break zone.

```json
// Request
{ "category": "animals" | "space" | "sports" | "popculture" | "records" | "random" }

// Response
{ "questions": [{ "question": "string", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A", "funFact": "string" }] }
```

Rate-limited to 10/minute. No auth required.

#### `POST /api/feedback`
Saves a user feedback entry. Auth optional — works for guests and signed-in users.

```json
// Request
{ "mood": "love" | "like" | "okay" | "confused" | "idea", "message": "optional string" }

// Response
{ "ok": true }
```

---

### Data routes (Clerk auth required — return 401 if not signed in)

#### `GET /api/conversations`
Returns all conversations for the signed-in user, ordered by `createdAt` descending.

#### `POST /api/conversations`
Upserts a conversation (creates if new, updates messages if existing).

```json
// Request body
{ "id": "string", "title": "string", "subject": "string", "yearLevel": "string", "mode": "chat|practice", "messages": [...] }
```

#### `DELETE /api/conversations`
Deletes a conversation by id (only if it belongs to the signed-in user).

```json
// Request body
{ "id": "string" }
```

#### `POST /api/exam-results`
Saves an exam result after the exam is graded.

```json
// Request body
{ "subject": "string", "yearLevel": "string", "score": 7, "total": 10, "timeTaken": 1823, "wrongAnswers": [...] }
```

#### `GET /api/exam-results`
Returns all exam results for the signed-in user, ordered by `createdAt` descending.

#### `POST /api/practice-results`
Records a single practice question attempt.

```json
// Request body
{ "subject": "string", "yearLevel": "string", "question": "string", "correct": true }
```

---

## 8. State Management

All state lives in two components. There is no global store.

### `page.tsx` state

| Variable | Type | Purpose |
|----------|------|---------|
| `splashDone` | `boolean` | Controls splash vs welcome/main app |
| `introSeen` | `boolean` | Controls welcome screen vs main app (resets on page refresh) |
| `isDark` | `boolean` | OS dark-mode preference |
| `conversations` | `Conversation[]` | Chat history — sourced from DB (signed in) or localStorage (guest) |
| `activeId` | `string \| null` | Which conversation is currently open |
| `input` | `string` | Current text input value |
| `loading` | `boolean` | AI request in flight |
| `mode` | `"chat"\|"practice"\|"exam"` | Active mode tab |
| `subject` | `string` | Selected exam type |
| `yearLevel` | `string` | Selected year level |
| `sidebarOpen` | `boolean` | Sidebar visibility (default `false`; `true` on mount if ≥ 640px) |
| `attemptCount` | `number` | Practice mode attempt counter |
| `practiceActive` | `boolean` | Whether a practice problem is running |

### `ExamView.tsx` state

| Variable | Type | Purpose |
|----------|------|---------|
| `examState` | `ExamState` | State-machine node (`setup\|generating\|in_progress\|submitting\|results`) |
| `duration` | `number` | Selected duration in minutes (30/45/60) |
| `questions` | `ExamQuestion[]` | Generated questions |
| `answers` | `Record<number, string>` | Student answers keyed by question id |
| `currentQ` | `number` | Index of the visible question |
| `timeLeft` | `number` | Seconds remaining |
| `showWarning` | `boolean` | 2-minute warning banner visible |
| `results` | `GradedResult[]` | Graded results from Claude |
| `error` | `string` | Error message if an API call fails |
| `showReview` | `boolean` | Review screen vs results summary |
| `reviewData` | `Record<number, string>` | AI walkthroughs keyed by question id |
| `reviewLoading` | `boolean` | Review API call in flight |

---

## 9. Data Persistence

### Storage strategy

| User state | Where data lives | Mechanism |
|------------|-----------------|-----------|
| Guest (not signed in) | Browser localStorage | `loadConversations()` / `saveMessages()` in `page.tsx` |
| Signed in | Neon PostgreSQL | `/api/conversations`, `/api/exam-results`, `/api/practice-results` |

On mount, `useEffect` checks `isSignedIn` (from Clerk's `useUser()`). If signed in, conversations are fetched from the API. If not, they are loaded from localStorage. The guest localStorage path is fully preserved — no login is required to use the app.

### Database schema (Prisma)

```prisma
model Conversation {
  id        String   @id
  userId    String                   // Clerk user ID
  title     String
  subject   String
  yearLevel String
  mode      String
  messages  Json                     // Message[] serialised as JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId])
}

model ExamResult {
  id           String   @id @default(cuid())
  userId       String
  subject      String
  yearLevel    String
  score        Int
  total        Int
  timeTaken    Int?                  // seconds
  wrongAnswers Json
  createdAt    DateTime @default(now())
  @@index([userId])
}

model PracticeResult {
  id        String   @id @default(cuid())
  userId    String
  subject   String
  yearLevel String
  question  String
  correct   Boolean
  createdAt DateTime @default(now())
  @@index([userId])
}

model Feedback {
  id        String   @id @default(cuid())
  userId    String?                   // null for guest submissions
  mood      String                    // "love" | "like" | "okay" | "confused" | "idea"
  message   String?
  createdAt DateTime @default(now())
}
```

### localStorage key (guest fallback)

```
Key:   "tutormate_conversations"
Value: JSON array of Conversation objects
```

---

## 10. Authentication

Authentication is handled by **Clerk** (`@clerk/nextjs` v7).

### Sign-in methods available
- Google OAuth
- Apple Sign-In
- GitHub OAuth
- Email + password
- Phone number (SMS OTP)

### Architecture

```
middleware.ts  (clerkMiddleware)
  └── runs on every request
  └── makes session available to server components and API routes

app/layout.tsx
  └── <ClerkProvider> wraps the entire app

page.tsx
  └── <AuthButton /> — renders "Sign in" button (guest) or <UserButton /> (signed in)
  └── useUser() — reads isSignedIn to decide localStorage vs cloud

API routes
  └── auth() from "@clerk/nextjs/server" → returns { userId }
  └── 401 returned if no session
```

### Sign-in / sign-up pages

| Route | File | Notes |
|-------|------|-------|
| `/sign-in` | `app/sign-in/[[...sign-in]]/page.tsx` | Clerk's pre-built `<SignIn />` component, dark background |
| `/sign-up` | `app/sign-up/[[...sign-up]]/page.tsx` | Clerk's pre-built `<SignUp />` component, dark background |

Sign-in can also be triggered as a modal from anywhere in the app (no page navigation needed).

### User experience
- Guest mode is fully preserved. No login is required to use the app.
- When signed in, the user's avatar appears in the header. Clicking opens account management and sign-out.
- After signing in, conversations load from the cloud database automatically.

---

## 11. UI & Design System

### Colour palette

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#4338ca` indigo-700 | Buttons, focus rings |
| Brand cyan | `#00e5ff` | Logo, wordmark gradient start |
| Brand purple | `#7c3aed` | Logo, wordmark gradient end, glow blobs |
| Brand pink | `#ff44aa` | "Ed" suffix in wordmark |
| Neon green | `#00ff80` | Stair edges in logo |
| Amber | `#fbbf24` | Logo AI orb trail, practice labels |
| Paper light | `#fefce8` | Notebook background |
| Paper dark | `#0d1117` | Dark-mode notebook background |
| Line light | `#bfdbfe` | Ruled lines (light) |
| Line dark | `#1a2744` | Ruled lines (dark) |
| Splash bg | `#0a0b1a` | Splash screen and About page background |

### Typography

| Context | Font | Size |
|---------|------|------|
| App UI | Geist Sans | Tailwind defaults |
| Monospace | Geist Mono | Tailwind defaults |
| Notebook chat | Caveat (Google Fonts) | 20px, line-height 32px |
| Notebook labels | system-ui | 11px uppercase |
| Logo wordmark | Arial Black / Impact | `clamp(22px, 5.5vw, 34px)` |

### Dark mode

Driven by the OS `prefers-color-scheme` media query. Tailwind `dark:` variants handle most components. The notebook's inline styles use a React `isDark` state populated by `window.matchMedia` in a `useEffect`.

### Responsive / mobile design

Designed mobile-first at the Tailwind `sm` (640px) breakpoint. Viewport uses `h-[100dvh]` (dynamic viewport height) to handle iOS Safari's collapsible toolbar.

| Area | Mobile (< 640px) | Desktop (≥ 640px) |
|------|-----------------|-------------------|
| Sidebar | Fixed overlay, collapsed by default | Inline column, open by default |
| Sidebar backdrop | Semi-transparent, tap to close | Not rendered |
| Main padding | `p-2` | `p-4` |
| Splash logo | `min(70vw, 320px)` | 320px |
| Wordmark font | `clamp(22px, 5.5vw, 34px)` | 34px |
| Exam navigator buttons | 40×40px | 32×32px |

### Logo components

| Component | Usage |
|-----------|-------|
| `<Logo size={n} style={...}/>` | Illustrated SVG (student on stairs, flag, orb). CSS `style` attribute used so width can be overridden. |
| `<Wordmark />` | Pure HTML/CSS. "Select" in cyan→blue gradient, "Ed" in pink→purple. Font size uses `clamp()`. Clicking returns to splash. |
| `<AuthButton />` | Shows "Sign in" button for guests or Clerk's `<UserButton />` for signed-in users. |

---

## 12. Environment Variables

All secrets live in `.env.local` at the project root. This file is in `.gitignore` and is **never committed**.

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key — `console.anthropic.com` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key — `dashboard.clerk.com` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key — `dashboard.clerk.com` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | `/` |
| `POSTGRES_PRISMA_URL` | Yes | Neon pooled connection string (for Prisma queries) — added automatically by Vercel when Neon is connected |
| `POSTGRES_URL_NON_POOLING` | Yes | Neon direct connection string (for Prisma Migrate) |
| `DATABASE_URL` | Yes | Neon pooled URL (general use) |

All Neon variables (`POSTGRES_*`, `DATABASE_*`) are automatically injected into the Vercel project when the Neon integration is added via the Vercel Storage tab. They are pulled locally with `vercel env pull .env.local`.

---

## 13. Local Development Setup

### Prerequisites

| Tool | Min version | Check |
|------|------------|-------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Git | any | `git --version` |
| Vercel CLI | any | `vercel --version` |

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/SanMishAI/ai-tutor.git
cd ai-tutor

# 2. Install dependencies
npm install

# 3. Pull all environment variables from Vercel (includes Neon + Clerk keys)
vercel env pull .env.local

# 4. Re-add Clerk keys if they were removed by the pull
#    (Clerk keys are only in the Production environment on Vercel)
#    Add to .env.local:
#      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
#      CLERK_SECRET_KEY=sk_test_...
#      NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
#      NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
#      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
#      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# 5. Generate Prisma client
npx prisma generate

# 6. Start the dev server
npm run dev

# 7. Open http://localhost:3000
```

### Database commands

```bash
npx prisma generate           # Regenerate the Prisma client after schema changes
npx prisma migrate dev        # Apply schema changes to Neon (creates a new migration)
npx prisma studio             # Open Prisma Studio to browse data visually
```

### Useful commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Production build (runs prisma generate first)
npm run lint         # ESLint
npx tsc --noEmit     # Type-check without building
vercel --prod --yes  # Deploy to production
```

---

## 14. Roadmap

### Phase 4 — User Accounts ✅ COMPLETED (June 2026)

- Sign-up / login (Google, Apple, GitHub, email, phone via Clerk)
- Server-side conversation storage in Neon PostgreSQL
- Exam results and practice results saved per user
- Cross-device data sync — sign in on any device to access history

### Phase 5 — Gamification (planned)

- **Streaks**: consecutive days of practice, with one 30-day freeze
- **Leaderboard**: top users by weekly practice score, displayed by username
- **Badges**: awarded for milestones (first exam, perfect score, 7-day streak, etc.)

### Phase 6 — Accessibility & Expansion (planned)

- Accessibility features: screen reader support, adjustable font size, high-contrast mode
- Additional Australian exams added to the platform
- Progress dashboard showing score trends over time per subject

---

## 15. Deployment

### Live URLs

| URL | Notes |
|-----|-------|
| `https://selected-ed.vercel.app` | Primary alias — share this one |
| `https://ai-tutor-psi-three.vercel.app` | Auto-updated production alias |

### Platform

Hosted on **Vercel** (hobby tier) under the `select-ed` team. All API routes deploy as serverless functions.

> **Note:** Vercel SSO deployment protection (`ssoProtection`) was disabled on the project so that the app is publicly accessible without a Vercel account. It can be re-enabled via `vercel api /v9/projects/<id> -X PATCH -F ssoProtection.deploymentType=all_except_custom_domains` if needed.

### Deploy command

```bash
vercel --prod --yes
```

After deploying, update the custom alias:

```bash
vercel ls --prod | grep "Ready" | head -1 | awk '{print $3}' | xargs -I{} vercel alias set {} selected-ed.vercel.app
```

### Environment variables on Vercel

All variables in Section 12 must be set in **Vercel dashboard → Project → Settings → Environment Variables** for the Production environment. Neon variables are added automatically when the Neon integration is connected via the Storage tab.

---

## 16. Favicon & Open Graph

### Favicon

`app/icon.tsx` generates a 32×32 PNG at build time using Next.js `ImageResponse`. Design: dark rounded square (`#0a0b1a`) with "S" in cyan (`#00e5ff`) and "E" in pink (`#ff44aa`), italic bold. Next.js injects `<link rel="icon">` automatically.

The legacy `app/favicon.ico` (Next.js scaffold default) remains as a fallback for very old browsers.

### Open Graph / social preview

**Root (`app/opengraph-image.tsx`)** — 1200×630 PNG, used for `/` and all routes without their own image:
- Background: `#0a0b1a` with purple radial glow (top-left) and cyan radial glow (bottom-right)
- Wordmark: "Select" in `#00e5ff`, "Ed" in `#ff44aa`, 130px italic bold
- Tagline: coloured "Sharpen · Sit · Succeed." row
- Subtitle and badge row: AMC · Maths Olympiad · ACER · ICAS · ATAR · NAPLAN

**About (`app/about/opengraph-image.tsx`)** — 1200×630 PNG with full-bleed founder photo:
- San's photo (`public/san.jpeg`) fills the entire card via `objectFit: cover`, `objectPosition: center top`
- Dark gradient overlay on the bottom 68% keeps text legible
- Headline "Built by a dad. / For every parent." in 64px white bold anchored bottom-left
- Name/role line and SelectEd wordmark below

`app/layout.tsx` metadata includes `metadataBase`, `openGraph`, and `twitter: { card: "summary_large_image" }` so all major platforms (WhatsApp, iMessage, Twitter/X, Slack, LinkedIn) render rich preview cards. The About page has its own `openGraph`/`twitter` metadata with a founder-specific title and description.

---

## 17. Privacy Policy

**Route:** `/privacy`
**File:** `app/privacy/page.tsx`
**Type:** Static server component

Covers Australian Privacy Act 1988 / APPs compliance. Key sections:
- What is collected (different for guests vs signed-in users)
- Third-party services table (Clerk, Neon, Anthropic, Vercel)
- Children's privacy note (target audience includes minors)
- Data retention and deletion instructions
- Contact: santrupta.mishra@gmail.com

Linked from the splash screen footer alongside "About the founder".

---

## 18. About Page


**Route:** `/about`
**File:** `app/about/page.tsx`
**Type:** Static server component

Standalone marketing page telling the founder's story. Accessible via a subtle "About the founder" link on the splash screen.

| Section | Content |
|---------|---------|
| Hero | "Built by a dad. For every parent." |
| Founder card | Photo (`/public/san.jpeg`), Santrupta Mishra, Director Global Consulting · Melbourne |
| Origin Story | Son's exam prep, gap in the market, building SelectEd |
| Vision | Affordable, purpose-built, accessible — 3 feature cards |
| CTA | "Start Learning →" back to `/` |

Design: always dark (`#0a0b1a`), glow blobs, `max-w-2xl`, white headings, `slate-300` body text.

---

## 19. Version History

| Version | Date | Summary |
|---------|------|---------|
| **v0.1.0** | May 2026 | Initial build — Chat mode with Socratic tutor, notebook UI, Caveat font, ruled paper CSS effect, subject/year level selectors, localStorage conversation history, Sidebar component |
| **v0.2.0** | May 2026 | Practice mode — Claude generates problems, up to 5 attempts with hints, Reveal Answer after 5th attempt |
| **v0.3.0** | May 2026 | Exam mode — timed mock exams (30/45/60 min), question navigator, auto-submit on timer, grading, mistake review with AI walkthroughs, ExamView state machine |
| **v0.4.0** | June 2026 | Mobile responsiveness — `h-[100dvh]` for iOS Safari, responsive logo (`min(70vw, 320px)`), sidebar overlay pattern for mobile, `window.matchMedia` change listener for orientation, iOS Safari backdrop click fix (`cursor-pointer`), close button in sidebar header |
| **v0.5.0** | June 2026 | Dark mode notebook text fix — `@tailwindcss/typography` overrides `color` explicitly on child elements; fixed by setting `--tw-prose-body`, `--tw-prose-headings`, and other CSS custom properties via inline style on the prose container. Tutor text changed from amber (`#fde68a`) to white (`#ffffff`) after iOS Safari rendering issues |
| **v0.6.0** | June 2026 | About page — `/about` route with founder story, photo, origin story, vision cards. "About the founder" link added to splash screen |
| **v0.7.0** | June 2026 | Vercel Analytics — `@vercel/analytics` added to root layout; page views, devices, and countries visible in Vercel dashboard |
| **v0.8.0** | June 2026 | User authentication — Clerk integration with Google, Apple, GitHub, email, and phone sign-in. Pre-built sign-in/sign-up pages. Sign in/out button in app header. Guest mode fully preserved |
| **v0.9.0** | June 2026 | Cloud data persistence — Neon PostgreSQL database (AWS Sydney), Prisma 7 ORM with `prisma-client` generator and `PrismaNeonHttp` adapter. Three tables: `Conversation`, `ExamResult`, `PracticeResult`. Conversations, exam results, and practice results sync to the cloud for signed-in users. Guests continue to use localStorage |
| **v0.10.0** | June 2026 | Rich math and image support — `rehype-raw` added so inline SVG passes through the ReactMarkdown pipeline. All AI prompts (chat, practice, exam generate/grade/review) updated with detailed LaTeX formatting rules (fractions, roots, Greek letters, vectors, chemistry, physics units, integrals) and SVG diagram generation guidelines. Geometry exam questions now include inline SVG diagrams. Answer options render through the full KaTeX+SVG pipeline. Answers stored as letter-only (A/B/C/D/E). `stripSvg()` used before sending to grade/review APIs to keep context lean. `max_tokens` raised to 8000 for generate and review routes, 2048 for chat |
| **v0.11.0** | June 2026 | Deployment protection fix — Vercel SSO protection (`ssoProtection: all_except_custom_domains`) was inadvertently blocking all public access to the app. Disabled via Vercel API (`PATCH /v9/projects/{id}`). App is now publicly accessible without a Vercel account |
| **v0.12.0** | June 2026 | Share-readiness pass — (1) In-memory rate limiting added to all four AI API routes (`lib/ratelimit.ts`): 30 req/min for chat, 3–5 req/10 min for exam routes. (2) Branded favicon via `app/icon.tsx` (32×32 PNG, "SE" in cyan/pink). (3) Social preview card via `app/opengraph-image.tsx` (1200×630 PNG with full brand treatment). (4) `layout.tsx` metadata updated with `metadataBase`, `openGraph`, and `twitter` fields. (5) Privacy policy page at `/privacy` covering Australian Privacy Act, children's privacy, third-party services, and data retention. Privacy Policy link added to splash screen footer |
| **v0.13.0** | June 2026 | Landing page expansion and About OG image — Splash screen converted to scrollable landing page with Features (Chat/Practice/Exam cards), Exams (6 branded cards with year level ranges), Trust strip (No account / Free / Claude AI), and footer CTA. Hero remains full-screen above the fold. About OG image redesigned: San's photo fills the full 1200×630 card (full-bleed, objectFit cover), dark gradient overlay on bottom 68%, founder headline and wordmark anchored bottom-left |
| **v0.15.0** | June 2026 | New logo design adopted — `public/selected-logo.svg` (gold star, gold/orange swoosh, blue orbital, white "SelectEd", blue tagline). Hero `<img>` replaces old inline SVG. Wordmark: sky-blue "Select" + gold "Ed". Hero glows: brand-orange + brand-blue. CTA gradient: gold→orange→blue. Page bg: `#000936`. Favicon and OG image colours updated to match |
| **v0.14.0** | June 2026 | Added Bebras and Kangourou sans frontières (KSF) — both available in Chat, Practice, and Exam modes. Exam format prompts added to generate route (Bebras: 10 MC computational thinking tasks; Kangaroo: 10 MC with 5 options, competition-style maths). Year level dropdowns added for both. Landing page exam grid expanded to 8 cards (2×4 on desktop). OG image badge row updated to two rows of 4. Hero tagline shortened to fit all 8 names |
| **v0.15.0** | June 2026 | Brain Break trivia zone and Feedback form added to landing page. `BreakZone.tsx` — collapsible panel with 6 category choices; Claude generates 5 fun MC questions per session with fun facts and per-answer feedback; score screen with emoji message. `FeedbackForm.tsx` — emoji mood picker (5 options) + optional text (500 chars); saves to new `Feedback` table in Neon (nullable userId so guests can submit). New API routes: `POST /api/trivia` (rate-limited 10/min) and `POST /api/feedback` (auth-optional). Prisma schema updated with `Feedback` model; `prisma db push` applied |
| **v0.16.0** | June 2026 | Welcome Screen ("Choose your mission") added between landing page and main app. `WelcomeScreen.tsx` shows once per session after clicking Start Learning. Step 1: 8 colourful exam cards with per-exam brand colours and glow-on-hover. Step 2: year level pill buttons + three mode start buttons (Chat / Practice / Exam). Selection pre-fills `subject`, `yearLevel`, and `mode` in the main app before the user sees a single input field. `introSeen` boolean in `page.tsx` controls visibility; resets on page refresh so each new session starts with quest selection. Also: scroll-down hint (bouncing chevron) added to hero, back-to-top button (fixed bottom-right, appears after scrolling past the hero) added to splash, "6 Australian exams" heading corrected to "8 Australian exams" |

---

*Document last updated: 30 June 2026 (v0.16). Updated alongside the codebase whenever routes, components, or UX decisions change.*
*Author: Santrupta Mishra (San) — Founder, SelectEd*
