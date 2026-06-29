import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About — SelectEd",
  description: "Meet San Mishra, the Melbourne dad who built SelectEd because he couldn't find the right exam prep tool for his son.",
}

export default function AboutPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-12 relative overflow-hidden"
      style={{ backgroundColor: "#0a0b1a", color: "#f1f5f9" }}
    >
      <div className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#7c3aed", top: "5%", left: "-10%" }} />
      <div className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#0ea5e9", bottom: "10%", right: "-5%" }} />

      <div className="w-full max-w-2xl mb-8 relative z-10">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          ← Back to SelectEd
        </Link>
      </div>

      <div className="w-full max-w-2xl space-y-12 relative z-10">

        {/* Header */}
        <div className="text-center space-y-4">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">Our Story</p>
          <h1
            className="text-4xl sm:text-5xl leading-tight"
            style={{ fontFamily: '"Arial Black", Impact, system-ui', fontWeight: 900 }}
          >
            Built by a dad.<br />For every parent.
          </h1>
          <p className="text-slate-400 text-lg max-w-lg mx-auto">
            SelectEd started with one simple frustration — and a determination to fix it.
          </p>
        </div>

        {/* Founder card */}
        <div
          className="rounded-2xl border border-white/10 p-6 sm:p-8"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 ring-2 ring-white/20">
              <Image
                src="/san.jpeg"
                alt="Santrupta Mishra"
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="font-bold text-xl text-white">Santrupta Mishra</p>
              <p className="text-slate-400 text-sm mt-0.5">Known as San</p>
              <p className="text-slate-400 text-sm">Director, Global Consulting · Melbourne</p>
            </div>
          </div>
        </div>

        {/* Origin */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white">The Origin Story</h2>
          <p className="text-slate-300 leading-relaxed">
            When San&rsquo;s son turned 11, the selective school exam season arrived. San went looking for a single, well-designed platform that could help his son prepare — something that covered all the key Australian selective and competition exams in one place, adapted to the child&rsquo;s level, and didn&rsquo;t cost a fortune.
          </p>
          <p className="text-slate-300 leading-relaxed">
            What he found were fragmented worksheets, expensive tutoring centres, and generic tools built for overseas curricula that barely touched the Australian landscape.
          </p>
          <p className="text-slate-300 leading-relaxed">
            So San — a Director at a global consulting firm by day, and a determined parent every other hour — started building the tool he wished had existed.
          </p>
          <p className="text-slate-300 leading-relaxed">
            That tool became <span className="text-white font-semibold">SelectEd</span>.
          </p>
        </div>

        {/* Vision */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold text-white">The Vision</h2>
          <p className="text-slate-300 leading-relaxed">
            San&rsquo;s goal is straightforward: give every Australian family access to high-quality, personalised exam preparation — easy enough for an 11-year-old to use independently, and affordable enough that cost is never the barrier.
          </p>
          <p className="text-slate-300 leading-relaxed">
            The road ahead is bigger. SelectEd will expand to cover more Australian exams and build in accessibility features, because a child&rsquo;s potential shouldn&rsquo;t be limited by what their family can afford.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {[
              {
                icon: "🎯",
                label: "Purpose-built",
                desc: "Designed specifically for Australian selective & competition exams — not a generic tool retrofitted.",
              },
              {
                icon: "💰",
                label: "Low cost",
                desc: "High-quality prep shouldn't be a luxury. SelectEd is built to be affordable for every family.",
              },
              {
                icon: "♿",
                label: "Accessible",
                desc: "Accessibility features are on the roadmap — every child deserves a fair shot.",
              },
            ].map(({ icon, label, desc }) => (
              <div
                key={label}
                className="rounded-xl p-5 border border-white/10 space-y-2"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="text-2xl">{icon}</div>
                <p className="font-semibold text-white text-sm">{label}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-4 pb-8">
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-2xl font-bold text-white transition-opacity hover:opacity-90 text-base"
            style={{ background: "linear-gradient(135deg, #7c3aed, #0ea5e9)" }}
          >
            Start Learning →
          </Link>
        </div>

      </div>
    </div>
  )
}
