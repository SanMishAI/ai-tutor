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
   - 6.1 Splash Screen / Landing Page
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
11. [Parent / Child System](#11-parent--child-system)
12. [Billing & Subscriptions](#12-billing--subscriptions)
13. [UI & Design System](#13-ui--design-system)
14. [Environment Variables](#14-environment-variables)
15. [Local Development Setup](#15-local-development-setup)
16. [Roadmap](#16-roadmap)
17. [Deployment](#17-deployment)
18. [Favicon & Open Graph](#18-favicon--open-graph)
19. [Privacy Policy](#19-privacy-policy)
20. [About Page](#20-about-page)
21. [Version History](#21-version-history)

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

### Authentication & Payments

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Clerk** (`@clerk/nextjs`) | ^7.5.10 | Parent account authentication — Google, Apple, GitHub, email, phone. Session management, server-side `auth()` + `currentUser()` |
| **bcryptjs** | ^3.0.2 | Hashes child PINs before storage — never stored in plaintext |
| **jose** | ^6.0.10 | Signs and verifies child session JWTs (HS256, 12-hour expiry) |
| **Stripe** | ^17.7.0 | Subscription billing — 7-day free trial then $9.99/month AUD. Apple Pay and Google Pay via Stripe Checkout. API version `2026-06-24.dahlia` |

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
│   ├── parent/
│   │   └── page.tsx                  # Parent dashboard (/parent) — manage children, subscription
│   ├── pricing/
│   │   └── page.tsx                  # Standalone pricing page (/pricing)
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
│   │   ├── child-auth/
│   │   │   └── route.ts              # GET profiles list; POST verifies PIN → issues 12h JWT
│   │   ├── child-profiles/
│   │   │   └── route.ts              # CRUD for child profiles (parent auth required)
│   │   ├── feedback/
│   │   │   └── route.ts              # POST feedback (auth-optional, saves to Feedback table)
│   │   ├── practice-results/
│   │   │   └── route.ts              # POST practice results (auth-protected)
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts     # Creates Stripe Checkout session (7-day trial)
│   │   │   ├── portal/route.ts       # Creates Stripe billing portal session
│   │   │   └── webhook/route.ts      # Handles Stripe events → updates Subscription table
│   │   ├── subscription/
│   │   │   └── route.ts              # GET subscription status (isPremium, trial days, founder)
│   │   ├── testimonials/
│   │   │   └── route.ts              # GET approved testimonials; POST new submission (approved:false)
│   │   ├── trivia/
│   │   │   └── route.ts              # POST trivia questions (Brain Break, no auth)
│   │   └── usage/
│   │       └── route.ts              # GET/POST daily usage for child sessions (child JWT auth)
│   ├── components/
│   │   ├── BreakZone.tsx             # Brain Break trivia quiz (landing page)
│   │   ├── ChildLoginScreen.tsx      # PIN login screen for child profiles
│   │   ├── ExamView.tsx              # All exam UI (setup → in-progress → results → review)
│   │   ├── FeedbackForm.tsx          # Emoji mood + text feedback form (landing page)
│   │   ├── GuestLimitModal.tsx       # Modal shown when guest hits 20q/day or tries premium mode
│   │   ├── Sidebar.tsx               # Chat history sidebar (light theme)
│   │   ├── UpgradeModal.tsx          # Trial/upgrade prompt modal (child sessions — limit or locked feature)
│   │   └── WelcomeScreen.tsx         # "Choose your mission" onboarding (light theme)
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
│   ├── founder.ts                    # isFounderUser() — checks Clerk email against FOUNDER_EMAIL
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

model ChildProfile {
  id           String       @id @default(cuid())
  parentId     String                          // Clerk userId of parent
  name         String
  pinHash      String                          // bcrypt hash of 4-digit PIN
  avatarEmoji  String       @default("🧑‍🎓")
  dailyLimit   Int?                            // null = unlimited (for premium parents)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  dailyUsage   DailyUsage[]
  @@index([parentId])
}

model DailyUsage {
  id      String       @id @default(cuid())
  childId String
  date    String                              // ISO date "YYYY-MM-DD"
  count   Int          @default(0)
  child   ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  @@unique([childId, date])
}

model Subscription {
  id               String    @id @default(cuid())
  parentId         String    @unique                  // Clerk userId of parent
  stripeCustomerId String?
  stripePriceId    String?
  stripeSubId      String?
  status           String    @default("none")         // none | trialing | active | past_due | canceled
  currentPeriodEnd DateTime?                          // trial end (trialing) or billing cycle end (active)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

model Testimonial {
  id        String   @id @default(cuid())
  name      String
  location  String?
  quote     String
  rating    Int      @default(5)
  approved  Boolean  @default(false)   // approve in Prisma Studio to publish on landing page
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

## 11. Parent / Child System

SelectEd is designed for minors. Parents create and manage accounts; children log in separately with a PIN and only see the exam app — never billing, pricing, or account settings.

### Account model

```
Parent (Clerk account)
  └── ChildProfile (1–5 per parent, stored in Neon)
        └── DailyUsage (per child, per date)
```

### Parent flow

1. Parent signs up / signs in via Clerk (Google, Apple, email, etc.)
2. Parent visits `/parent` dashboard to add child profiles — each has a name, emoji avatar, 4-digit PIN, and an optional daily question limit.
3. Parent manages their Stripe subscription from the same dashboard.

### Child login flow

1. On any device where the parent has signed in, their Clerk `userId` is written to `localStorage("selected_parent_id")`.
2. The child clicks "I'm a student →" on the landing page.
3. `ChildLoginScreen.tsx` reads `localStorage("selected_parent_id")`, fetches `GET /api/child-auth?parentId=...` to list profiles (name + avatar only — no PINs exposed).
4. Child taps their avatar, types their 4-digit PIN into an auto-advancing PIN pad.
5. `POST /api/child-auth` verifies the PIN with `bcrypt.compare`, then issues a signed JWT (`jose SignJWT`, HS256, 12h, secret = `CHILD_JWT_SECRET`). Payload: `{ childId, parentId, name, avatarEmoji }`.
6. JWT is stored in `localStorage` and attached as `x-child-token` header on every usage API call.

### Premium gating for children

All premium checks in `page.tsx` (client-side):

| Check | `trackUsage()` | `checkPremiumFeature()` |
|-------|---------------|------------------------|
| Founder parent | always allowed | always allowed |
| Premium/trialing | always allowed | always allowed |
| Otherwise | POST /api/usage; show modal if `exceeded` | show UpgradeModal |

`/api/usage` looks up the child's `parentId`, checks the parent's `Subscription.status`. If `active` or `trialing` → no limit, all modes. If `founder` → unlimited. Otherwise → limited preview access.

### Child session constraints

- Children cannot see: Sidebar, `StreakBadge`, auth controls, or any billing UI.
- Child header shows: avatar emoji + name, usage count/limit, "Exit" button.
- Session expires after 12 hours (JWT expiry) — child must PIN-log-in again.

---

## 12. Billing & Subscriptions

### Model

| Status | Meaning |
|--------|---------|
| `none` | No Stripe subscription created yet |
| `trialing` | In the 7-day free trial — full premium access |
| `active` | Paying subscriber — full premium access |
| `past_due` | Payment failed — access restricted |
| `canceled` | Subscription cancelled — access restricted |
| `founder` | Virtual status returned by `/api/subscription` for founder email — never stored in DB |

### 7-day free trial

- New parent clicks "Start free trial →" → `POST /api/stripe/checkout` → Stripe Checkout in subscription mode.
- Checkout session includes `subscription_data: { trial_period_days: 7 }` and `payment_method_collection: "always"` — payment method collected upfront but **no charge on day 0**.
- Day 8: Stripe auto-charges $9.99 AUD/month.
- Cancel before end of trial day 7 (24 h before trial end) = no charge ever.
- Custom text on Stripe Checkout: "You won't be charged today. Cancel any time before day 7."
- Apple Pay and Google Pay shown automatically by Stripe Checkout on supported devices.

### Trial countdown (parent dashboard)

`/api/subscription` returns `trialDaysLeft`, `trialEndsAt`, and `cancelBy` (= `trialEndsAt − 24h`). The parent dashboard displays a colour-coded banner:
- Yellow (`#fefce8`) for 2+ days left.
- Red (`#fef2f2`) for 0–1 days left, with "Cancel trial" button.

### Stripe webhook events handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Upsert `Subscription` with Stripe sub ID + status (`trialing` or `active`) |
| `customer.subscription.updated` | Update status + `currentPeriodEnd` |
| `customer.subscription.deleted` | Update status to `canceled` |
| `customer.subscription.trial_will_end` | Keep status as `trialing` (fires 3 days before trial ends) |
| `invoice.payment_failed` | Update status to `past_due` |

Webhook endpoint: `POST /api/stripe/webhook`. Verified via `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`.

### Founder bypass

`lib/founder.ts` exports `isFounderUser()` (server) which calls Clerk's `currentUser()` and compares primary email against `FOUNDER_EMAIL`. If matched, `/api/subscription` returns `{ status: "founder", isPremium: true, isFounder: true }` without touching the DB. Client-side: `useUser().user.primaryEmailAddress?.emailAddress === NEXT_PUBLIC_FOUNDER_EMAIL` disables all usage tracking and premium gates.

### Stripe product

| Field | Value |
|-------|-------|
| Product | SelectEd Premium (`prod_UnewOomidF73aR`) |
| Price | $9.99 AUD/month (`price_1To3d22MKF2aIOmen6RDcHw8`) |
| Mode | Subscription with 7-day trial |
| Payment methods | Card, Apple Pay, Google Pay (auto-detected by Checkout) |

---

## 13. UI & Design System

### Colour palette

#### Brand colours (used throughout app)
| Token | Value | Usage |
|-------|-------|-------|
| Navy | `#000936` | Primary buttons, headers, active states |
| Gold | `#FDC800` | Button text on navy, accents, active tabs |
| Orange | `#E34C00` | Logo swoosh, secondary accent |
| Sky blue | `#56DBFF` | Logo orbital ring, wordmark "Select" |
| Blue | `#0066CB` | Landing page headings, links |

#### Light design system (app interior + landing page)
| Token | Value | Usage |
|-------|-------|-------|
| Page bg | `#f8fafc` | App interior background |
| Card bg | `white` | Cards, modals, sidebar |
| Primary text | `#0f172a` | Headings |
| Secondary text | `#64748b` | Body, labels |
| Muted text | `#94a3b8` | Hints, subtitles |
| Border | `#e2e8f0` | Dividers, card borders |
| Active border | `#000936` | Selected items, focus |

#### Legacy (splash screen, About page, Arcade mode)
| Token | Value | Usage |
|-------|-------|-------|
| Splash bg | `#0a0b1a` | Dark screens only |
| Paper light | `#fefce8` | Notebook chat background |
| Paper dark | `#0d1117` | Dark-mode notebook (unused since light-theme migration) |

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

## 14. Environment Variables

All secrets live in `.env.local` at the project root. This file is in `.gitignore` and is **never committed**.

### AI & Core
| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key — `console.anthropic.com` |

### Clerk (Auth)
| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | `/` |

### Child sessions
| Variable | Required | Description |
|----------|----------|-------------|
| `CHILD_JWT_SECRET` | Yes | HS256 signing secret for child session JWTs (32+ chars, random) |

### Stripe
| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key (used client-side) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_ID` | Yes | Stripe Price ID for the $9.99 AUD/month plan |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL (e.g. `https://selected-ed.vercel.app`) — used for Stripe redirect URLs |

### Founder bypass
| Variable | Required | Description |
|----------|----------|-------------|
| `FOUNDER_EMAIL` | Yes | `santrupta.mishra@gmail.com` — bypasses all limits and billing server-side |
| `NEXT_PUBLIC_FOUNDER_EMAIL` | Yes | Same value — bypasses all limits client-side |

### Database (Neon)
| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Yes | Neon direct connection (for migrations) |
| `POSTGRES_PRISMA_URL` | Yes | Neon pooled URL for Prisma (auto-added by Vercel Neon integration) |
| `POSTGRES_URL_NON_POOLING` | Yes | Neon non-pooling URL for Prisma Migrate |

All Neon variables are automatically injected when the Neon integration is connected via the Vercel Storage tab. Pull locally with `vercel env pull .env.local`.

---

## 15. Local Development Setup

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
npx prisma db push            # Sync schema to Neon without migration history (preferred — avoids drift)
npx prisma migrate dev        # Create a named migration (use only on clean DB)
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

## 16. Roadmap

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

## 17. Deployment

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

## 18. Favicon & Open Graph

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

## 19. Privacy Policy

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

## 20. About Page


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

## 21. Version History

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
| **v0.17.0** | June 2026 | Tutor accuracy fixes — all four AI prompts (chat, practice, grade, review) updated to eliminate self-correcting arithmetic and verbose re-derivation of correct answers. Chat/practice: correct student answers are confirmed immediately without re-checking; arithmetic computed internally and stated confidently (no step-by-step counting aloud); responses capped at 2–4 sentences + one guiding question; exam list updated to include Bebras and Kangaroo Mathematics. Grade: explanations capped at 1–2 sentences; arithmetic results stated directly. Review: walkthroughs instructed to compute once and state results confidently; tone directive added ("direct and clear, never say 'wait' or 're-check' mid-walkthrough") |
| **v0.18.0** | June 2026 | Phase 5: Streaks and Leaderboard — daily activity streaks tracked automatically after every practice problem or exam submission. New `UserStreak` Prisma model (userId, displayName, currentStreak, longestStreak, lastActivityDate, freezesAvailable, showOnLeaderboard). Streak logic in `lib/streak.ts`: consecutive day = +1; missed 1 day with a freeze = auto-use freeze + continue; missed 2+ days = reset to 1. Freeze awarded every 30-day milestone (max 2 held). `app/api/streak` route (GET current streak, PATCH toggle leaderboard visibility). `app/api/leaderboard` route (GET top 20 by currentStreak where showOnLeaderboard=true). `app/leaderboard/page.tsx` — server-rendered leaderboard page with ranked table, your-rank card, freeze count, and opt-out toggle. `StreakBadge` client component in app header showing 🔥 N (orange) + ❄️ N (cyan if freezes > 0), links to /leaderboard. Header logo updated to `selected-logo.svg` img at 44px. Streak updated server-side inside exam-results and practice-results POST routes via `upsertStreak()` |
| **v0.19.0** | June 2026 | Phase 6: Adventure Mode — Minecraft-themed gamified learning. `ArcadeProgress` Prisma model (userId, exam, chapter, stage, stars 0–3, xp; @@unique on userId+exam+chapter+stage). `app/components/arcade/blocks.tsx`: five pixel-art 16×16 SVG sprites rendered with `image-rendering:pixelated` — Coal Ore (easy, stage available), Iron Ore (medium), Diamond Ore (hard), Gold Block (stage completed), Bedrock (locked); crack overlays (Crack1, Crack2) applied to ore blocks on wrong answers. `app/components/arcade/ArcadeMode.tsx`: full state machine with four screens — WorldMap, MiningScreen, StageComplete, GameOver — all managed in a single client component. Each of the 8 exams is a World with 5 chapters and 3 stages; chapter N+1 unlocks when chapter N Stage 1 is completed; Stage 2 unlocks after Stage 1, Stage 3 after Stage 2. Mining screen: Claude generates a fresh 4-option question per block via `POST /api/arcade/question`; 3 hearts per stage; wrong answer = -1 heart + crack animation + hint revealed; Skip button appears after 2 wrongs on same question; 0 hearts = Game Over. Stage Complete screen: 1–3 stars based on hearts remaining, XP earned displayed, four transition options (Continue Mining / World Map / Practice Mode / Take an Exam). XP totals drive Pickaxe Tier (Wooden → Stone → Iron → Gold → Diamond). Press Start 2P font loaded dynamically. `GET /api/arcade/progress` returns per-stage stars+xp for an exam; `POST /api/arcade/progress` upserts only if new stars ≥ existing, also fires streak update. WelcomeScreen: ⛏️ ADVENTURE MODE added as first and most prominent option in Step 2 (Minecraft grass-block button style). page.tsx: mode type extended to `"adventure"`, 4th ⛏️ button in mode switcher (green when active), `<ArcadeMode>` renders full-height replacing normal controls; onSwitchToPractice/onSwitchToExam callbacks wire back to existing modes |
| **v0.16.0** | June 2026 | Welcome Screen ("Choose your mission") added between landing page and main app. `WelcomeScreen.tsx` shows once per session after clicking Start Learning. Step 1: 8 colourful exam cards with per-exam brand colours and glow-on-hover. Step 2: year level pill buttons + three mode start buttons (Chat / Practice / Exam). Selection pre-fills `subject`, `yearLevel`, and `mode` in the main app before the user sees a single input field. `introSeen` boolean in `page.tsx` controls visibility; resets on page refresh so each new session starts with quest selection. Also: scroll-down hint (bouncing chevron) added to hero, back-to-top button (fixed bottom-right, appears after scrolling past the hero) added to splash, "6 Australian exams" heading corrected to "8 Australian exams" |

---

| **v0.20.0** | June 2026 | Professional light-theme redesign — full white/`#f8fafc` design system replacing dark theme throughout the app interior and landing page. New brand palette: navy `#000936`, gold `#FDC800`, orange `#E34C00`, sky-blue `#56DBFF`. Landing page redesigned to be parent-facing and conversion-focused (professional hero, stat strip, problem/solution sections, pricing comparison, testimonial-style cards, FAQ, final CTA). App interior (Sidebar, WelcomeScreen, chat, practice, controls, header) migrated to light theme — white cards, slate borders, navy/gold active states. Copyright year updated 2025 → 2026. About page rewritten with light theme, founder card, gold quote blockquote |
| **v0.21.0** | June–July 2026 | Parent/child auth system — `ChildProfile`, `DailyUsage`, `Subscription` Prisma models added (`prisma db push`). `ChildLoginScreen.tsx`: PIN pad with auto-advance and backspace. Child JWTs signed with `jose` (12h expiry). `UpgradeModal.tsx`: shown on usage limit or locked mode. Parent dashboard `/parent`: child CRUD, subscription management. Premium gating: Exam + Adventure modes locked behind subscription; usage counted per child per day via `/api/usage`. Stripe integration: `@stripe/stripe-js` + server `stripe` package, Checkout session in subscription mode (AUD), Apple Pay + Google Pay automatic via Stripe Checkout, billing portal. Stripe API version `2026-06-24.dahlia`. Lazy `getStripe()` init pattern prevents build-time crashes when keys are placeholders. Pricing page `/pricing` added |
| **v0.22.0** | July 2026 | 7-day free trial + founder bypass — Stripe Checkout updated with `trial_period_days: 7` and `payment_method_collection: "always"` (collect payment method upfront, charge nothing until day 8). Daily question limit removed; all features available during trial. `Subscription.status` now includes `trialing` (treated as premium everywhere). Parent dashboard shows colour-coded trial countdown banner (days left + exact cancel-by datetime). Landing page CTA changed to "Start your 7-day free trial →". `UpgradeModal` updated to trial framing. Pricing page rewritten as single-plan trial-first page. Founder bypass: `lib/founder.ts` checks Clerk email against `FOUNDER_EMAIL` env var server-side; `NEXT_PUBLIC_FOUNDER_EMAIL` used client-side; `santrupta.mishra@gmail.com` gets permanent unlimited access, bypasses all limits and billing |
| **v0.31.0** | July 2026 | Custom sign-up form — phone number removal and Clerk v7 Future API migration. Replaced Clerk's built-in `<SignUp />` modal with a fully custom sign-up page (`app/sign-up/[[...sign-up]]/page.tsx`) using Clerk's programmatic Future API (`useSignUp()` returning `{ signUp, fetchStatus }`). Flow: email + password + optional name → `signUp.password()` → `signUp.verifications.sendEmailCode()` → 6-digit OTP screen → `signUp.verifications.verifyEmailCode({ code })` → `signUp.finalize()` → redirect to `/`. Google OAuth via `signUp.sso({ strategy: "oauth_google", redirectUrl: "/sso-callback", redirectCallbackUrl: "/sso-callback" })`. `CaptchaSignUpGate` updated to `router.push("/sign-up")` instead of `openSignUp()` modal (modal had phone issue too). `/sso-callback` page (`AuthenticateWithRedirectCallback`) handles OAuth redirect completion. No phone number field at any step — eliminates "phone numbers from this country are not supported" error for Australian users. Form is fully branded (SelectEd wordmark, navy/gold CTAs, white card on dark background) |
| **v0.30.0** | July 2026 | Cinematic hero background — (1) **Video background infrastructure**: hero section now mounts an HTML5 `<video autoPlay muted loop playsInline>` element pointing to `/public/tutor-bg.mp4`. `videoBgReady` React state tracks `onCanPlay`; the video fades in with a 1.2 s opacity transition once loaded. When no video file is present (or on load failure), `videoBgReady` stays `false` and the full CSS-animated scene renders instead. (2) **CSS animated tutor scene** (fallback + always-on decoration): deep navy base gradient (`#000936 → #060e3f → #0c1848`); a large 340 px blue radial-gradient AI orb (top-left) with `ai-orb-pulse` keyframe (scale 1 → 1.09, opacity pulse); a 520 px outer ambient glow around the orb; a 380 px warm amber/orange `warm-glow` radial gradient (right, `warm-glow` keyframe) representing the student; a 2 px horizontal `beam-pulse` connection line between orb and student; 20 rising dot particles (`particle-rise` keyframe); 5 floating maths equations (`float-equation` keyframe — e.g. `y = mx + b`, `E = mc²`, `P(A) = n(A)/n(S)`, `∫₀¹ f(x) dx`, `ax² + bx + c = 0`); 16 floating maths symbols (`float-symbol`, unchanged from v0.28, but colour-shifted to semi-transparent RGBA values for dark background). (3) **Dark overlay**: linear-gradient overlay adjusts dynamically — thick dark when CSS scene shows, semi-transparent when video plays. (4) **Bottom white fade**: 28-rem `h-28` gradient `transparent → #ffffff` at hero bottom so hero blends into the white sections below. (5) **Hero text redesigned for dark background**: headline in white `#ffffff`, accent span in sky-blue `#56DBFF`; subheadline at `rgba(255,255,255,0.72)`; "Australia's AI-powered exam prep platform" badge uses glass pill (`rgba(255,255,255,0.08)` bg + `rgba(255,255,255,0.20)` border + `backdropFilter: blur(8px)`); primary CTA changed from navy/gold to gold `#FDC800`/navy for maximum contrast on dark; secondary CTA ("I'm a student") uses `rgba(255,255,255,0.28)` border and glass bg. (6) **Frosted glass exam badge panel**: right column redesigned with `backdropFilter: blur(20px)` + `-webkit-backdrop-filter` glass card (`rgba(255,255,255,0.07)` bg, `rgba(255,255,255,0.13)` border, deep box-shadow `0 8px 48px rgba(0,0,0,0.45)`); badge card backgrounds changed to `rgba(255,255,255,0.05)`; badge circle glows use per-exam colour box-shadow; label text uses `rgba(255,255,255,0.6)`. New CSS keyframes added: `ai-orb-pulse`, `warm-glow`, `beam-pulse`, `particle-rise`, `float-equation`. To use a real AI-generated video: generate a 10–15 s looping MP4 (recommended prompt: "Serene warm study scene, soft-glowing blue AI hologram tutor floating near a desk, happy 10-year-old child looking up with curiosity, floating maths equations drifting around them, ambient film-quality lighting, cinematic, 4K, seamlessly loopable") using Runway Gen-3, Kling AI, or Sora; place the file at `public/tutor-bg.mp4`; no code change needed — the player activates automatically |
| **v0.29.0** | July 2026 | Guest limit reduced 20 → 10 questions/day — updated in `GUEST_DAILY_LIMIT` constant (`app/page.tsx`, `GuestLimitModal.tsx`), rolling banner copy, FAQ answer, trust badge, and parent dashboard label. CAPTCHA gate on sign-up — (1) `/sign-up` page now shows a math CAPTCHA challenge before the Clerk `<SignUp />` form renders (client component with `useState` gate). (2) New `CaptchaSignUpGate` component (`app/components/CaptchaSignUpGate.tsx`) wraps any button with a CAPTCHA modal; uses `useClerk().openSignUp()` to open Clerk's sign-up modal after successful verification. `GuestLimitModal`'s "Start free 7-day trial →" button now uses `CaptchaSignUpGate` instead of `<SignUpButton>` |
| **v0.28.0** | July 2026 | Landing page visual overhaul + Adventure Mode game-feel + CAPTCHA + professional diagrams — (1) **Sign-in button** made prominent: navy-bordered outlined button with `Sign in →` text. (2) **"Our story"** nav link coloured blue with arrow; **Pricing** becomes a gold pill button. (3) **Rolling banner** (navy ticker) below stats strip: auto-scrolling marquee of testimonial snippets, exam names, and feature highlights using CSS `marquee-scroll` keyframe. (4) **Animated motion background** on hero: 16 floating maths symbols (π, ∑, √, ∫, Δ, etc.) drift upward with staggered fade using `float-symbol` keyframe; three gradient orbs pulse with `pulse-orb` animation. (5) **Visual exam badges**: hero right panel and Exams section now display circular coloured badges with abbreviation text and emoji icon per exam instead of plain text with left-bar accent. (6) **Human verification CAPTCHA** on testimonial form: math challenge (`What is A + B?`) + invisible honeypot field. Bot submissions rejected client-side before API call. (7) **Adventure Mode overhaul**: rank system (Novice → Explorer → Scholar → Expert → Champion → Legend) with animated rank-glow border and XP progress bar to next rank; combo multiplier system (×2 at 3-streak, ×3 at 5-streak) with `combo-pop` animation in HUD; block shake animation on wrong answer (`shake-x`); block bounce on correct answer (`correct-bounce`); spinning loader while fetching questions; chapter numbers in world map; best-combo display on stage-complete and game-over screens; animated sequential star reveal on stage-complete; animated skull bounce on game-over with red-pulse background flash. (8) **DESIGN.docx** now includes a visual appendix of three matplotlib-generated diagrams: system architecture (component boxes with arrows), user journey funnel, and learning modes overview — auto-generated by `scripts/generate_design_doc.py` when `matplotlib` is installed |
| **v0.27.0** | July 2026 | Landing page copy fixes — FAQ "Do I need an account?" updated to mention 20-question/day guest limit and midnight reset; correctly states Exam Mode and Adventure Mode require an account. Trust badge "Free to use / no premium tier" corrected to "Free to start / 7-day trial then $9.99/month AUD". Guest badge updated to "20 free questions a day" |
| **v0.26.0** | July 2026 | DoS protection — three-layer defence: (1) Upstash Redis distributed rate limiting replaces the defunct in-memory `Map` in `lib/ratelimit.ts` — sliding window, graceful in-memory fallback when env vars absent, unique Redis prefix per endpoint. `middleware.ts` deprecated → renamed to `proxy.ts` per Next.js 16 proxy convention; proxy runs a blanket 120-req/60s-per-IP gate on all `/api/*` routes before any serverless function is invoked. (2) Per-endpoint fine-grained limits: `/api/chat` 30/60s, `/api/trivia` 10/60s, `/api/exam/generate|review` 3/600s, `/api/exam/grade` 5/600s — all now distributed and enforced across instances. All 429 responses include `Retry-After` header. (3) Input caps to block token-bomb attacks on the Anthropic API: `/api/chat` caps conversation to last 20 messages and 8,000 chars each; `/api/exam/review` and `/api/exam/grade` cap to 20 questions and 5,000 chars each with 500-char answer fields; `/api/exam/generate` validates subject string; `/api/trivia` validates category against allow-list. Requires `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars for distributed rate limiting (see Upstash setup below) |
| **v0.25.0** | July 2026 | Automated security agent — (1) `next.config.ts` now sets 7 HTTP security headers on every route: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (blocks camera/mic/geo/payment), `Strict-Transport-Security` (2yr + preload), `X-DNS-Prefetch-Control`, and a full `Content-Security-Policy` covering script/style/font/img/connect/frame origins for Clerk, Stripe, KaTeX, Google Fonts, and Vercel Analytics. (2) `scripts/pentest.mjs` — runnable Node.js audit that checks headers, probes 7 API endpoints for unauthenticated access, runs npm audit, scans codebase for dangerous patterns (dangerouslySetInnerHTML, eval, hardcoded secrets, SQL injection, wildcard CORS, sensitive console.log, NEXT_PUBLIC_ secrets, missing auth on API routes), and checks TLS redirect; outputs structured JSON. (3) Weekly Claude Code agent scheduled trigger (every Monday 18:00 UTC) — runs the audit, auto-fixes CRITICAL/HIGH findings, rebuilds, deploys, re-audits to confirm, updates DESIGN.md, and emails the founder a markdown report |
| **v0.24.0** | July 2026 | Guest 20-questions/day limit — anonymous users (no Clerk session, no child session) are now gated at 20 questions per day via localStorage (`selected_guest_usage: {count, date}`). On limit hit or locked-mode attempt, `GuestLimitModal` opens: shows reset countdown to midnight, "Start free 7-day trial" (Clerk SignUpButton modal) and "I already have an account" (SignInButton modal). Header badge shows `X/20 questions today` for guests (turns red at limit). Signed-in parents and child sessions continue to use server-side tracking. `app/components/GuestLimitModal.tsx` added |
| **v0.23.0** | July 2026 | Landing page: exam coverage panel, testimonials section, FAQ accordion — (1) Hero redesigned to two-column layout on desktop: text/CTAs left, exam coverage panel right. Panel shows 8 colour-coded exam badges (AMC, Olympiad, ACER, ICAS, ATAR, NAPLAN, Bebras, KSF) with name, full title, year range, and coloured accent bar. Includes legal disclaimer: "SelectEd is an independent preparation platform. Not affiliated with, endorsed by, or connected to the organisations that administer these assessments." (2) Testimonials section added (after Founder card): 3 hardcoded seed cards + fetched approved DB testimonials; "Share your experience →" opens inline form (name, location, star rating, quote); `POST /api/testimonials` saves with `approved: false`; `GET /api/testimonials` returns approved ones; founder approves via Prisma Studio. New `Testimonial` Prisma model (`id, name, location, quote, rating, approved, createdAt`). (3) FAQ accordion added (after Pricing, before final CTA): 8 questions covering trial, child login, limits, exam coverage, Socratic method, independence disclaimer; open/close with + toggle |

---

*Document last updated: 1 July 2026 (v0.31). Updated alongside the codebase whenever routes, components, or UX decisions change.*
*Author: Santrupta Mishra (San) — Founder, SelectEd*
