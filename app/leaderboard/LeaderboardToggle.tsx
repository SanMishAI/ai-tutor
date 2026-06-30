"use client"

import { useState } from "react"

export default function LeaderboardToggle({ initial }: { initial: boolean }) {
  const [visible, setVisible] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    setSaving(true)
    const next = !visible
    await fetch("/api/streak", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showOnLeaderboard: next }),
    }).catch(() => {})
    setVisible(next)
    setSaving(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors disabled:opacity-50"
    >
      {saving ? "Saving…" : visible ? "Remove me from leaderboard" : "Add me to leaderboard"}
    </button>
  )
}
