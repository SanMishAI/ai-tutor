import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing — SelectEd",
  description: "SelectEd is free to start. No credit card, no paywall. Premium features coming soon.",
}

const FREE_FEATURES = [
  "All 8 exams & year levels",
  "AI Chat Tutor (unlimited sessions)",
  "Practice mode with guided hints",
  "Mock exams with instant grading & AI review",
  "Adventure Mode (gamified learning)",
  "Daily streak tracking",
  "Guest mode — no sign-up required",
]

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Full progress history across sessions",
  "Leaderboard & streak badges",
  "Priority AI responses",
  "Downloadable practice packs (PDF)",
  "Parent dashboard with weekly summary",
  "Email progress reports",
  "Early access to new exam modules",
]

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", color: "#0f172a" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold flex items-center gap-1.5 transition-colors hover:opacity-80" style={{ color: "#0066CB" }}>
            ← SelectEd
          </Link>
          <Link href="/"
            className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
            style={{ background: "#000936", color: "#FDC800" }}>
            Get started free →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="py-16 sm:py-20" style={{ background: "linear-gradient(155deg, #f8fafc 0%, #eff6ff 100%)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#0066CB" }}>Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5" style={{ fontFamily: "system-ui, sans-serif", color: "#0f172a" }}>
            Simple, honest pricing.
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Start completely free — no credit card, no trial period, no paywall. Every core feature is free.
            Premium is coming soon with extras for families who want more.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Free */}
          <div className="rounded-2xl bg-white border-2 border-slate-200 p-8 flex flex-col gap-6">
            <div>
              <p className="font-black text-2xl" style={{ color: "#0f172a" }}>Free</p>
              <p className="text-5xl font-black mt-2" style={{ color: "#000936" }}>$0</p>
              <p className="text-sm mt-1.5" style={{ color: "#94a3b8" }}>Forever. No card ever needed.</p>
            </div>
            <ul className="space-y-3 text-sm flex-1" style={{ color: "#475569" }}>
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0" style={{ color: "#059669" }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <Link href="/"
              className="block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all hover:bg-slate-900 hover:text-white"
              style={{ border: "2px solid #000936", color: "#000936", background: "white" }}>
              Start for free →
            </Link>
          </div>

          {/* Premium */}
          <div className="rounded-2xl border-2 p-8 flex flex-col gap-6 relative overflow-hidden" style={{ background: "#000936", borderColor: "#FDC800" }}>
            <div className="absolute top-6 right-6">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#FDC800", color: "#000936" }}>Coming soon</span>
            </div>
            <div>
              <p className="font-black text-2xl text-white">Premium</p>
              <p className="text-5xl font-black mt-2" style={{ color: "#FDC800" }}>
                $9.99<span className="text-xl font-medium" style={{ color: "#475569" }}>/mo</span>
              </p>
              <p className="text-sm mt-1.5" style={{ color: "#64748b" }}>Billed monthly. Cancel anytime.</p>
            </div>
            <ul className="space-y-3 text-sm flex-1" style={{ color: "#cbd5e1" }}>
              {PREMIUM_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-0.5 shrink-0" style={{ color: "#FDC800" }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button disabled className="w-full py-3.5 rounded-xl font-bold text-sm opacity-60 cursor-not-allowed" style={{ background: "#FDC800", color: "#000936" }}>
              Join waitlist (coming soon)
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-5">
          <h2 className="text-2xl font-black" style={{ color: "#0f172a" }}>Common questions</h2>
          <div className="divide-y divide-slate-100">
            {[
              { q: "Do I need to sign up to use SelectEd?", a: "No. You can use the AI tutor, practice mode, and Adventure Mode as a guest without any account. An account lets you save conversations and track streaks across sessions." },
              { q: "Is the free plan really free — no catch?", a: "Yes. All 8 exams, all year levels, all learning modes, unlimited AI chat — completely free. We're funded by the founder and will introduce optional Premium features in the future." },
              { q: "When will Premium be available?", a: "We're targeting Premium launch in late 2025. Join the waitlist and you'll be the first to know — and you'll get an early-bird rate." },
              { q: "Who is SelectEd built for?", a: "Australian students from Year 2 to Year 12 sitting selective school tests, maths competitions, NAPLAN, ATAR, and more. The AI adapts to each exam and year level automatically." },
              { q: "What exams does SelectEd cover?", a: "AMC, Maths Olympiad, ACER Selective, ICAS, ATAR, NAPLAN, Bebras, and Kangourou sans frontières (KSF)." },
            ].map(({ q, a }) => (
              <div key={q} className="py-5">
                <p className="font-bold text-base mb-2" style={{ color: "#0f172a" }}>{q}</p>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl p-8 text-center" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <h3 className="text-2xl font-black mb-3" style={{ color: "#0f172a" }}>Ready to start?</h3>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>No sign-up required. Pick an exam and begin in seconds.</p>
          <Link href="/"
            className="inline-block px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 shadow-sm"
            style={{ background: "#000936", color: "#FDC800" }}>
            Start for free →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 mt-10" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-wrap justify-center gap-5 text-xs" style={{ color: "#94a3b8" }}>
          <Link href="/" className="hover:text-slate-600 transition-colors">Home</Link>
          <Link href="/about" className="hover:text-slate-600 transition-colors">Our story</Link>
          <Link href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</Link>
          <Link href="/leaderboard" className="hover:text-slate-600 transition-colors">Leaderboard</Link>
        </div>
        <p className="text-center text-xs mt-4" style={{ color: "#cbd5e1" }}>© 2026 SelectEd · Made in Melbourne 🇦🇺</p>
      </footer>

    </div>
  )
}
