import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing — SelectEd",
  description: "Start with a 7-day free trial. All features included. Then $9.99/month AUD. Cancel any time.",
}

const TRIAL_FEATURES = [
  "Unlimited questions — no daily cap",
  "All modes: Chat, Practice, Exam & Adventure",
  "Up to 5 child profiles per parent account",
  "Full progress history & streak tracking",
  "Leaderboard & streak badges",
  "Parent dashboard with usage analytics",
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
            Start free trial →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="py-16 sm:py-20" style={{ background: "linear-gradient(155deg, #f8fafc 0%, #eff6ff 100%)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#0066CB" }}>Pricing</p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5" style={{ fontFamily: "system-ui, sans-serif", color: "#0f172a" }}>
            One plan. Everything included.
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "#64748b" }}>
            Try every feature free for 7 days — no charge today. After your trial, just $9.99/month AUD.
            Cancel any time before day 7 to avoid being charged.
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="max-w-md mx-auto px-5 sm:px-8 py-14">
        <div className="rounded-2xl border-2 p-8 flex flex-col gap-6 relative overflow-hidden" style={{ background: "#000936", borderColor: "#FDC800" }}>
          <div className="absolute top-6 right-6">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#FDC800", color: "#000936" }}>7 days free</span>
          </div>
          <div>
            <p className="font-black text-2xl text-white">SelectEd Premium</p>
            <div className="flex items-baseline gap-3 mt-2">
              <p className="text-5xl font-black" style={{ color: "#FDC800" }}>$9.99</p>
              <span className="text-base" style={{ color: "#64748b" }}>/month AUD</span>
            </div>
            <p className="text-sm mt-1.5" style={{ color: "#94a3b8" }}>No charge for the first 7 days. Cancel any time.</p>
          </div>
          <ul className="space-y-3 text-sm" style={{ color: "#cbd5e1" }}>
            {TRIAL_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0" style={{ color: "#FDC800" }}>✓</span>{f}
              </li>
            ))}
          </ul>
          <Link href="/"
            className="block w-full py-3.5 rounded-xl font-bold text-sm text-center transition-all hover:opacity-90"
            style={{ background: "#FDC800", color: "#000936" }}>
            Start 7-day free trial →
          </Link>
          <p className="text-xs text-center" style={{ color: "#475569" }}>
            Apple Pay &amp; Google Pay accepted · Secure checkout via Stripe · Cancel before day 7 to pay nothing
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-5">
          <h2 className="text-2xl font-black" style={{ color: "#0f172a" }}>Common questions</h2>
          <div className="divide-y divide-slate-100">
            {[
              { q: "Is there really no charge for 7 days?", a: "Correct. When you start your trial, we collect your payment method (Apple Pay, Google Pay, or card) but charge nothing. On day 8 your subscription begins at $9.99/month AUD. Cancel any time before the end of day 7 and you'll never be charged." },
              { q: "What happens if I cancel during the trial?", a: "Your account reverts to limited access immediately. You won't be charged. You can restart a subscription at any time." },
              { q: "Do I need to sign up to start?", a: "Create a parent account with your email and then set up child profiles for your children. Kids log in separately with a PIN — they never see billing or account settings." },
              { q: "How many children can I add?", a: "Up to 5 child profiles per parent account, each with their own PIN, avatar, and optional daily usage limit." },
              { q: "What exams does SelectEd cover?", a: "AMC, Maths Olympiad, ACER Selective, ICAS, ATAR, NAPLAN, Bebras, and Kangourou sans frontières (KSF) — for Year 2 through Year 12." },
              { q: "Can I set a daily limit for my child?", a: "Yes. From your parent dashboard you can set a per-child daily question limit, or leave it unlimited." },
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
          <h3 className="text-2xl font-black mb-3" style={{ color: "#0f172a" }}>Ready to give your child the edge?</h3>
          <p className="text-sm mb-6" style={{ color: "#64748b" }}>7 days free. Everything included. No commitment.</p>
          <Link href="/"
            className="inline-block px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 shadow-sm"
            style={{ background: "#000936", color: "#FDC800" }}>
            Start free trial →
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
