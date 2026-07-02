"use client"

export default function StatsBar() {
  const stats = [
    { n: "8", label: "Exams covered" },
    { n: "Year 2–12", label: "All levels" },
    { n: "Socratic", label: "Teaching method" },
    { n: "Claude AI", label: "Powered by" },
  ]

  return (
    <div className="bg-slate-50 border-y border-slate-100 py-8">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`text-center py-4 ${i < stats.length - 1 ? "sm:border-r border-slate-200" : ""}`}
            >
              <p
                className="text-2xl sm:text-3xl font-black leading-none"
                style={{ fontFamily: "var(--font-jakarta)", color: "#0B1533" }}
              >
                {stat.n}
              </p>
              <p
                className="text-sm mt-2"
                style={{ fontFamily: "var(--font-inter)", color: "#5A6B8C" }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
