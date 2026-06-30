import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import Link from "next/link"
import type { Metadata } from "next"
import LeaderboardToggle from "./LeaderboardToggle"

export const metadata: Metadata = { title: "Leaderboard — SelectEd" }

const MEDALS = ["🥇", "🥈", "🥉"]

export default async function LeaderboardPage() {
  const { userId } = await auth()

  const leaders = await db.userStreak.findMany({
    where: { showOnLeaderboard: true, currentStreak: { gt: 0 } },
    orderBy: [{ currentStreak: "desc" }, { longestStreak: "desc" }],
    take: 20,
  })

  const myStreak = userId
    ? await db.userStreak.findUnique({ where: { userId } })
    : null

  const myRank = leaders.findIndex(l => l.userId === userId) + 1

  return (
    <div
      className="min-h-screen flex flex-col items-center px-6 py-12 relative overflow-hidden"
      style={{ backgroundColor: "#000936", color: "#f1f5f9" }}
    >
      {/* Glows */}
      <div className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#E34C00", top: "5%", left: "-8%" }} />
      <div className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "#0066CB", bottom: "8%", right: "-5%" }} />

      {/* Back */}
      <div className="w-full max-w-2xl mb-8 relative z-10">
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          ← Back to SelectEd
        </Link>
      </div>

      <div className="w-full max-w-2xl relative z-10 space-y-10">

        {/* Header */}
        <div className="text-center space-y-2">
          <p className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">Phase 5</p>
          <h1 className="text-4xl sm:text-5xl font-black" style={{ fontFamily: '"Arial Black", Impact, system-ui' }}>
            🏆 Leaderboard
          </h1>
          <p className="text-slate-400 text-sm">Ranked by current daily streak. Keep it going!</p>
        </div>

        {/* Your streak card (signed in only) */}
        {myStreak && (
          <div
            className="rounded-2xl border border-white/10 p-5 space-y-3"
            style={{ background: "rgba(253,200,0,0.05)", borderColor: "rgba(253,200,0,0.2)" }}
          >
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#FDC800" }}>Your streak</p>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-black" style={{ color: "#f97316" }}>🔥 {myStreak.currentStreak}</p>
                  <p className="text-xs text-slate-400 mt-1">Current</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{myStreak.longestStreak}</p>
                  <p className="text-xs text-slate-400 mt-1">Best ever</p>
                </div>
                {myStreak.freezesAvailable > 0 && (
                  <div className="text-center">
                    <p className="text-2xl font-bold" style={{ color: "#56DBFF" }}>❄️ {myStreak.freezesAvailable}</p>
                    <p className="text-xs text-slate-400 mt-1">Freeze{myStreak.freezesAvailable !== 1 ? "s" : ""}</p>
                  </div>
                )}
              </div>
              {myRank > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-black text-white">#{myRank}</p>
                  <p className="text-xs text-slate-400 mt-1">Your rank</p>
                </div>
              )}
              {myStreak.currentStreak === 0 && (
                <p className="text-sm text-slate-400">Complete a practice problem or exam to start your streak!</p>
              )}
            </div>
            <p className="text-xs text-slate-500">
              A freeze auto-applies when you miss one day. Earn a new freeze every 30 days.{" "}
              Max 2 freezes held at once.
            </p>
            <LeaderboardToggle initial={myStreak.showOnLeaderboard} />
          </div>
        )}

        {!userId && (
          <div className="rounded-2xl border border-white/10 p-5 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
            <p className="text-slate-300 text-sm">
              <Link href="/sign-in" className="text-indigo-400 hover:text-indigo-300 underline">Sign in</Link>{" "}
              to track your streak and appear on the leaderboard.
            </p>
          </div>
        )}

        {/* Top 20 table */}
        <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
          {leaders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No streaks yet — be the first! Complete a practice problem or exam.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold tracking-wider uppercase text-slate-400">
                  <th className="px-5 py-3 text-left">Rank</th>
                  <th className="px-5 py-3 text-left">Learner</th>
                  <th className="px-5 py-3 text-right">🔥 Streak</th>
                  <th className="px-5 py-3 text-right hidden sm:table-cell">Best</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaders.map((l, i) => {
                  const isMe = l.userId === userId
                  return (
                    <tr
                      key={l.userId}
                      className={`transition-colors ${isMe ? "bg-yellow-500/5" : "hover:bg-white/5"}`}
                    >
                      <td className="px-5 py-3 font-bold text-slate-300 w-12">
                        {MEDALS[i] ?? <span className="text-slate-500">#{i + 1}</span>}
                      </td>
                      <td className="px-5 py-3 font-medium">
                        <span style={{ color: isMe ? "#FDC800" : "#f1f5f9" }}>
                          {l.displayName}
                        </span>
                        {isMe && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                      </td>
                      <td className="px-5 py-3 text-right font-bold" style={{ color: "#f97316" }}>
                        {l.currentStreak}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-400 hidden sm:table-cell">
                        {l.longestStreak}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="text-center pb-4">
          <Link
            href="/"
            className="inline-block px-8 py-3 rounded-2xl font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #E34C00 0%, #FDC800 50%, #0066CB 100%)" }}
          >
            Back to SelectEd →
          </Link>
        </div>

      </div>
    </div>
  )
}
