"use client"

import { useState, useEffect, useRef } from "react"

type Profile = { id: string; name: string; avatarEmoji: string }

type Props = {
  parentId: string
  onLogin: (token: string, child: { id: string; name: string; avatarEmoji: string }) => void
  onBack: () => void
}

export default function ChildLoginScreen({ parentId, onLogin, onBack }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selected, setSelected] = useState<Profile | null>(null)
  const [pin, setPin] = useState(["", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    fetch(`/api/child-auth?parentId=${parentId}`)
      .then(r => r.json())
      .then(data => { setProfiles(Array.isArray(data) ? data : []); setFetching(false) })
      .catch(() => setFetching(false))
  }, [parentId])

  function handlePinDigit(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...pin]
    next[i] = val
    setPin(next)
    setError("")
    if (val && i < 3) inputRefs[i + 1].current?.focus()
    if (next.every(d => d) && i === 3) submitPin(next.join(""))
  }

  function handlePinKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[i] && i > 0) {
      inputRefs[i - 1].current?.focus()
    }
  }

  async function submitPin(code: string) {
    if (!selected) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/child-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: selected.id, pin: code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Incorrect PIN"); setPin(["", "", "", ""]); inputRefs[0].current?.focus() }
      else onLogin(data.token, data.child)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <p style={{ color: "#94a3b8" }}>Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#f8fafc" }}>

      {!selected ? (
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm"
              style={{ background: "#000936" }}>
              <img src="/selected-logo.svg" alt="SelectEd" style={{ width: 34, height: 34 }} />
            </div>
            <h1 className="text-2xl font-black" style={{ color: "#0f172a" }}>Who&apos;s studying today?</h1>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Pick your profile to get started.</p>
          </div>

          {profiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: "#94a3b8" }}>No student profiles found.</p>
              <p className="text-xs mt-1" style={{ color: "#cbd5e1" }}>Ask a parent to create your profile.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelected(p); setPin(["", "", "", ""]); setError("") }}
                  className="flex items-center gap-4 px-5 py-4 rounded-2xl border border-slate-200 bg-white text-left transition-all hover:shadow-md hover:scale-[1.01] active:scale-[0.99] shadow-sm"
                >
                  <span className="text-3xl">{p.avatarEmoji}</span>
                  <span className="font-bold text-base" style={{ color: "#0f172a" }}>{p.name}</span>
                  <span className="ml-auto text-lg" style={{ color: "#cbd5e1" }}>→</span>
                </button>
              ))}
            </div>
          )}

          <button onClick={onBack} className="text-xs transition-colors hover:text-slate-700" style={{ color: "#94a3b8" }}>
            ← Back to home
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs flex flex-col items-center gap-8">
          <div className="text-center">
            <div className="text-5xl mb-3">{selected.avatarEmoji}</div>
            <h2 className="text-xl font-black" style={{ color: "#0f172a" }}>Hi, {selected.name}!</h2>
            <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Enter your 4-digit PIN to continue.</p>
          </div>

          <div className="flex gap-3 justify-center">
            {pin.map((d, i) => (
              <input
                key={i}
                ref={inputRefs[i]}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={e => handlePinDigit(i, e.target.value)}
                onKeyDown={e => handlePinKey(i, e)}
                autoFocus={i === 0}
                className="w-14 h-16 text-center text-2xl font-black rounded-xl border-2 focus:outline-none transition-all"
                style={{
                  borderColor: error ? "#dc2626" : d ? "#000936" : "#e2e8f0",
                  background: "white",
                  color: "#000936",
                }}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm font-medium text-center" style={{ color: "#dc2626" }}>{error}</p>
          )}

          {loading && <p className="text-sm" style={{ color: "#94a3b8" }}>Checking…</p>}

          <button onClick={() => { setSelected(null); setPin(["", "", "", ""]); setError("") }}
            className="text-xs transition-colors hover:text-slate-700" style={{ color: "#94a3b8" }}>
            ← Switch profile
          </button>
        </div>
      )}
    </div>
  )
}
