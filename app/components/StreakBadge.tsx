"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"

type StreakData = {
  currentStreak: number
  longestStreak: number
  freezesAvailable: number
  lastActivityDate: string | null
}

export default function StreakBadge() {
  const { isSignedIn } = useUser()
  const [data, setData] = useState<StreakData | null>(null)

  useEffect(() => {
    if (!isSignedIn) return
    fetch("/api/streak")
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [isSignedIn])

  if (!isSignedIn || !data) return null

  const active = data.currentStreak > 0

  return (
    <Link
      href="/leaderboard"
      className="flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 select-none"
      title={`${data.currentStreak}-day streak · ${data.freezesAvailable} freeze${data.freezesAvailable !== 1 ? "s" : ""} left · Best: ${data.longestStreak} days`}
    >
      <span style={{ color: active ? "#f97316" : "#9ca3af" }}>
        🔥 {data.currentStreak}
      </span>
      {data.freezesAvailable > 0 && (
        <span style={{ color: "#56DBFF" }} className="text-xs">
          ❄️ {data.freezesAvailable}
        </span>
      )}
    </Link>
  )
}
