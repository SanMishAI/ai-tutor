import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Our Story — SelectEd",
  description: "Meet San Mishra, the Melbourne dad who built SelectEd because he couldn't find the right exam prep tool for his son.",
  openGraph: {
    title: "Built by a dad. For every parent. — SelectEd",
    description: "Meet Santrupta Mishra, the Melbourne dad who built SelectEd because he couldn't find the right exam prep tool for his son.",
    url: "https://selected-ed.vercel.app/about",
    siteName: "SelectEd",
    type: "website",
    locale: "en_AU",
  },
}

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#ffffff", color: "#0f172a" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold flex items-center gap-1.5 transition-colors hover:opacity-80" style={{ color: "#0066CB" }}>
            ← SelectEd
          </Link>
          <Link href="/"
            className="text-sm font-bold px-4 py-1.5 rounded-lg transition-all hover:opacity-90"
            style={{ background: "#000936", color: "#FDC800" }}>
            Get started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="py-16 sm:py-20" style={{ background: "linear-gradient(155deg, #f8fafc 0%, #eff6ff 100%)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#0066CB" }}>Our story</p>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-5" style={{ fontFamily: "system-ui, sans-serif", color: "#0f172a" }}>
            Built by a dad.<br />For every parent.
          </h1>
          <p className="text-lg leading-relaxed max-w-xl mx-auto" style={{ color: "#64748b" }}>
            SelectEd started with one simple frustration — and a determination to fix it.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-14 space-y-14">

        {/* Founder card */}
        <div className="rounded-2xl border border-slate-200 shadow-sm p-7 sm:p-8">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0" style={{ outline: "3px solid #FDC800", outlineOffset: 3 }}>
              <Image src="/san.jpeg" alt="Santrupta Mishra" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-black text-xl" style={{ color: "#0f172a" }}>Santrupta Mishra</p>
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Known as San</p>
              <p className="text-sm" style={{ color: "#64748b" }}>Director, Global Consulting · Melbourne</p>
            </div>
          </div>
        </div>

        {/* Origin */}
        <div className="space-y-5">
          <h2 className="text-2xl font-black" style={{ color: "#0f172a" }}>The origin story</h2>
          <p className="leading-relaxed" style={{ color: "#475569" }}>
            When San&rsquo;s son turned 11, the selective school exam season arrived. San went looking for a single, well-designed platform that could help his son prepare — something that covered all the key Australian selective and competition exams in one place, adapted to the child&rsquo;s level, and didn&rsquo;t cost a fortune.
          </p>
          <p className="leading-relaxed" style={{ color: "#475569" }}>
            What he found were fragmented worksheets, expensive tutoring centres, and generic tools built for overseas curricula that barely touched the Australian landscape.
          </p>
          <p className="leading-relaxed" style={{ color: "#475569" }}>
            So San — a Director at a global consulting firm by day, and a determined parent every other hour — started building the tool he wished had existed.
          </p>
          <div className="rounded-xl p-5 border-l-4" style={{ background: "#f8fafc", borderColor: "#FDC800" }}>
            <p className="font-black text-lg" style={{ color: "#0f172a" }}>
              &ldquo;I built the tool I wished existed when my own son was preparing for selective school.&rdquo;
            </p>
            <p className="text-sm mt-2" style={{ color: "#94a3b8" }}>— San Mishra, Founder</p>
          </div>
        </div>

        {/* Vision */}
        <div className="space-y-5">
          <h2 className="text-2xl font-black" style={{ color: "#0f172a" }}>The vision</h2>
          <p className="leading-relaxed" style={{ color: "#475569" }}>
            San&rsquo;s goal is straightforward: give every Australian family access to high-quality, personalised exam preparation — easy enough for an 11-year-old to use independently, and affordable enough that cost is never the barrier.
          </p>
          <p className="leading-relaxed" style={{ color: "#475569" }}>
            The road ahead is bigger. SelectEd will expand to cover more Australian exams and build in accessibility features, because a child&rsquo;s potential shouldn&rsquo;t be limited by what their family can afford.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              { icon: "🎯", label: "Purpose-built", desc: "Designed for Australian selective & competition exams — not a generic tool retrofitted." },
              { icon: "💰", label: "Affordable", desc: "High-quality prep shouldn't be a luxury. Free to start, with fair premium pricing ahead." },
              { icon: "♿", label: "Accessible", desc: "Accessibility features are on the roadmap — every child deserves a fair shot." },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="rounded-xl p-5 border border-slate-200 space-y-2" style={{ background: "#f8fafc" }}>
                <div className="text-2xl">{icon}</div>
                <p className="font-bold text-sm" style={{ color: "#0f172a" }}>{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4 pb-10">
          <Link href="/"
            className="inline-block px-8 py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90"
            style={{ background: "#000936", color: "#FDC800" }}>
            Start for free →
          </Link>
        </div>

      </div>
    </div>
  )
}
