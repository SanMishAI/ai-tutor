"use client"

import { useState, useEffect, useRef } from "react"
import { useClerk } from "@clerk/nextjs"

type Props = {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function CaptchaSignUpGate({ children, className, style }: Props) {
  const { openSignUp } = useClerk()
  const [open, setOpen] = useState(false)
  const [captchaQ, setCaptchaQ] = useState<[number, number]>([4, 7])
  const [captchaA, setCaptchaA] = useState("")
  const [error, setError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60)
  }, [open])

  function handleTrigger() {
    const a = Math.ceil(Math.random() * 9)
    const b = Math.ceil(Math.random() * 9)
    setCaptchaQ([a, b]); setCaptchaA(""); setError(""); setOpen(true)
  }

  function handleVerify() {
    if (parseInt(captchaA) !== captchaQ[0] + captchaQ[1]) {
      setError("Incorrect — try again")
      const next = Math.ceil(Math.random() * 9)
      const next2 = Math.ceil(Math.random() * 9)
      setCaptchaQ([next, next2]); setCaptchaA("")
      return
    }
    setOpen(false)
    openSignUp()
  }

  return (
    <>
      <div onClick={handleTrigger} className={className} style={{ cursor: "pointer", ...style }}>
        {children}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,9,54,0.72)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-7 w-full max-w-xs shadow-2xl space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-center space-y-1">
              <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#0066CB" }}>
                Quick verification
              </p>
              <p className="text-xl font-black" style={{ color: "#0f172a" }}>
                What is{" "}
                <span style={{ color: "#0066CB" }}>{captchaQ[0]}</span>
                {" + "}
                <span style={{ color: "#0066CB" }}>{captchaQ[1]}</span>?
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Just making sure you&apos;re human before we create your account.
              </p>
            </div>

            {error && (
              <p className="text-sm text-center font-medium" style={{ color: "#dc2626" }}>{error}</p>
            )}

            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={captchaA}
              onChange={e => { setCaptchaA(e.target.value); setError("") }}
              onKeyDown={e => e.key === "Enter" && handleVerify()}
              placeholder={`${captchaQ[0]} + ${captchaQ[1]} = ?`}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-xl font-bold focus:outline-none focus:border-blue-400"
              style={{ color: "#0f172a" }}
            />

            <button
              onClick={handleVerify}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90 shadow-sm"
              style={{ background: "#000936", color: "#FDC800" }}
            >
              Verify & continue →
            </button>

            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs py-1 transition-colors hover:text-slate-600"
              style={{ color: "#94a3b8" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
