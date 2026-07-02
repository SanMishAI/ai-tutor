"use client"

import { useRef, useState } from "react"

type Props = {
  parentId: string
  onLogin: (token: string, child: { id: string; name: string; avatarEmoji: string }) => void
  onBack: () => void
}

export default function ChildLoginScreen({ parentId, onLogin, onBack }: Props) {
  const [name, setName] = useState("")
  const [pin, setPin] = useState(["", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  function handlePinDigit(i: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...pin]
    next[i] = val
    setPin(next)
    setError("")
    if (val && i < 3) inputRefs[i + 1].current?.focus()
    if (next.every(d => d) && i === 3) submitLogin(name.trim(), next.join(""))
  }

  function handlePinKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !pin[i] && i > 0) inputRefs[i - 1].current?.focus()
  }

  async function submitLogin(studentName: string, code: string) {
    if (!studentName) { setError("Please enter your name."); return }
    if (code.length < 4) { setError("Please enter your 4-digit PIN."); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/child-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: studentName, pin: code, parentId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Name or PIN not recognised. Ask a parent to check your details.")
        setPin(["", "", "", ""])
        inputRefs[0].current?.focus()
      } else {
        onLogin(data.token, data.child)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    submitLogin(name.trim(), pin.join(""))
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "#f8fafc" }}>
      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col items-center gap-7">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: "#000936" }}>
          <img src="/selected-logo.svg" alt="SelectEd" style={{ width: 34, height: 34 }} />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black" style={{ color: "#0f172a" }}>Student login</h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Enter your name and PIN to get started.</p>
        </div>

        {/* Name field */}
        <div className="w-full space-y-1.5">
          <label className="text-xs font-semibold block" style={{ color: "#475569" }}>Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError("") }}
            placeholder="e.g. Alex"
            autoFocus
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl border-2 text-base font-semibold focus:outline-none transition-all"
            style={{
              borderColor: error && !name.trim() ? "#dc2626" : "#e2e8f0",
              background: "white",
              color: "#0f172a",
            }}
          />
        </div>

        {/* PIN */}
        <div className="w-full space-y-1.5">
          <label className="text-xs font-semibold block" style={{ color: "#475569" }}>4-digit PIN</label>
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
                className="w-14 h-16 text-center text-2xl font-black rounded-xl border-2 focus:outline-none transition-all"
                style={{
                  borderColor: error ? "#dc2626" : d ? "#000936" : "#e2e8f0",
                  background: "white",
                  color: "#000936",
                }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium text-center" style={{ color: "#dc2626" }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim() || pin.some(d => !d)}
          className="w-full py-3.5 rounded-xl font-black text-base transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "#000936", color: "#FDC800" }}
        >
          {loading ? "Checking…" : "Log in →"}
        </button>

        <button type="button" onClick={onBack} className="text-xs transition-colors hover:text-slate-700" style={{ color: "#94a3b8" }}>
          ← Back to home
        </button>
      </form>
    </div>
  )
}
