"use client"

export default function LandingFooter() {
  return (
    <footer className="bg-white border-t border-slate-200 py-10">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-2.5">
            <img
              src="/selected-logo.svg"
              alt="SelectEd"
              width={28}
              height={28}
              style={{ width: 28, height: 28, objectFit: "contain" }}
            />
            <div className="leading-none">
              <span
                className="font-black text-base"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
              >
                Select
              </span>
              <span
                className="font-black text-base"
                style={{ fontFamily: "var(--font-jakarta)", color: "#E34C00" }}
              >
                Ed
              </span>
            </div>
          </div>

          {/* Nav links */}
          <nav
            className="flex flex-wrap justify-center gap-6 text-sm"
            aria-label="Footer navigation"
          >
            {[
              { href: "/about", label: "About" },
              { href: "/pricing", label: "Pricing" },
              { href: "/privacy", label: "Privacy Policy" },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="transition-colors hover:text-slate-900"
                style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Made in Melbourne */}
          <p
            className="text-sm"
            style={{ fontFamily: "var(--font-inter)", color: "#8898B0" }}
          >
            Made in Melbourne, Australia 🇦🇺
          </p>
        </div>

        {/* Bottom row */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p
            className="text-xs"
            style={{ fontFamily: "var(--font-inter)", color: "#CBD5E1" }}
          >
            &copy; 2025 SelectEd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
