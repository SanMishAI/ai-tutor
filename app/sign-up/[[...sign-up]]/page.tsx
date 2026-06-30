"use client"

import { useState, useRef, useEffect } from "react"
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  const [verified, setVerified] = useState(false)
  const [captchaQ, setCaptchaQ] = useState<[number, number]>([4, 7])
  const [captchaA, setCaptchaA] = useState("")
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const a = Math.ceil(Math.random() * 9)
    const b = Math.ceil(Math.random() * 9)
    setCaptchaQ([a, b])
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  function handleVerify() {
    if (parseInt(captchaA) !== captchaQ[0] + captchaQ[1]) {
      setError("Incorrect — please try again")
      const a = Math.ceil(Math.random() * 9)
      const b = Math.ceil(Math.random() * 9)
      setCaptchaQ([a, b]); setCaptchaA("")
      return
    }
    setVerified(true)
  }

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0b1a" }}>
        <SignUp />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#0a0b1a" }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-6">
        {/* Wordmark */}
        <div className="text-center">
          <p className="text-3xl font-black italic tracking-tight" style={{ fontFamily: '"Arial Black", system-ui' }}>
            <span style={{ color: "#000936" }}>Select</span><span style={{ color: "#E34C00" }}>Ed</span>
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: "#0066CB" }}>Sharpen · Sit · Succeed</p>
        </div>

        {/* Verification prompt */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#0066CB" }}>
            Quick verification
          </p>
          <p className="text-2xl font-black" style={{ color: "#0f172a" }}>
            What is{" "}
            <span style={{ color: "#0066CB" }}>{captchaQ[0]}</span>
            {" + "}
            <span style={{ color: "#0066CB" }}>{captchaQ[1]}</span>?
          </p>
          <p className="text-sm" style={{ color: "#64748b" }}>
            Just confirming you&apos;re human before we create your account.
          </p>
        </div>

        {error && (
          <p className="text-sm text-center font-medium rounded-lg px-3 py-2 bg-red-50 border border-red-100"
            style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}

        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={captchaA}
          onChange={e => { setCaptchaA(e.target.value); setError("") }}
          onKeyDown={e => e.key === "Enter" && handleVerify()}
          placeholder={`${captchaQ[0]} + ${captchaQ[1]} = ?`}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-bold focus:outline-none focus:border-blue-400"
          style={{ color: "#0f172a" }}
        />

        <button
          onClick={handleVerify}
          className="w-full py-3.5 rounded-xl font-bold text-base transition-all hover:opacity-90 shadow-sm"
          style={{ background: "#000936", color: "#FDC800" }}
        >
          Verify & create account →
        </button>

        <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
          Already have an account?{" "}
          <a href="/sign-in" className="font-semibold underline hover:text-slate-700" style={{ color: "#0066CB" }}>
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}
