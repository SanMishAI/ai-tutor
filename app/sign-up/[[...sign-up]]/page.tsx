"use client"

import { useSignUp } from "@clerk/nextjs"
import { useState } from "react"
import { useRouter } from "next/navigation"

type CE = { message: string; longMessage?: string }
function msg(e: CE) { return e.longMessage ?? e.message }

export default function SignUpPage() {
  const { signUp, fetchStatus } = useSignUp()
  const router = useRouter()

  const [step, setStep] = useState<"form" | "verify">("form")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" })
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const loading = busy || fetchStatus === "fetching"

  function field(key: keyof typeof form, val: string) {
    setForm(f => ({ ...f, [key]: val })); setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("")
    try {
      const { error: e1 } = await signUp.password({
        emailAddress: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      })
      if (e1) { setError(msg(e1)); return }

      const { error: e2 } = await signUp.verifications.sendEmailCode()
      if (e2) { setError(msg(e2)); return }

      setStep("verify")
    } finally { setBusy(false) }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("")
    try {
      const { error: e1 } = await signUp.verifications.verifyEmailCode({ code })
      if (e1) { setError(msg(e1)); return }

      if (signUp.status === "complete") {
        const { error: e2 } = await signUp.finalize()
        if (e2) { setError(msg(e2)); return }
        router.push("/")
      }
    } finally { setBusy(false) }
  }

  async function handleResend() {
    const { error: e } = await signUp.verifications.sendEmailCode()
    if (e) setError(msg(e))
  }

  async function handleGoogle() {
    setError("")
    const { error: e } = await signUp.sso({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectCallbackUrl: "/sso-callback",
    })
    if (e) setError(msg(e))
  }

  const Wrap = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#0a0b1a" }}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl space-y-5">
        <div className="text-center">
          <p className="text-3xl font-black italic tracking-tight" style={{ fontFamily: '"Arial Black", system-ui' }}>
            <span style={{ color: "#000936" }}>Select</span><span style={{ color: "#E34C00" }}>Ed</span>
          </p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: "#0066CB" }}>Sharpen · Sit · Succeed</p>
        </div>
        {children}
      </div>
    </div>
  )

  if (step === "verify") {
    return (
      <Wrap>
        <div className="text-center space-y-1">
          <p className="text-xl font-black" style={{ color: "#0f172a" }}>Check your email</p>
          <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
            We sent a 6-digit code to <strong>{form.email}</strong>
          </p>
        </div>
        {error && (
          <p className="text-sm text-center font-medium rounded-lg px-3 py-2 bg-red-50 border border-red-100" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={code}
            onChange={e => { setCode(e.target.value.replace(/\D/g, "")); setError("") }}
            placeholder="6-digit code"
            autoFocus
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] focus:outline-none focus:border-blue-400"
            style={{ color: "#0f172a" }}
          />
          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#000936", color: "#FDC800" }}
          >
            {loading ? "Verifying…" : "Verify email →"}
          </button>
        </form>
        <div className="text-center space-y-2">
          <button onClick={handleResend} className="text-xs underline" style={{ color: "#0066CB" }}>
            Resend code
          </button>
          <p className="text-xs" style={{ color: "#94a3b8" }}>
            <a href="/sign-in" className="underline" style={{ color: "#0066CB" }}>Already have an account? Sign in</a>
          </p>
        </div>
      </Wrap>
    )
  }

  return (
    <Wrap>
      <div className="text-center space-y-0.5">
        <p className="text-xl font-black" style={{ color: "#0f172a" }}>Create your account</p>
        <p className="text-sm" style={{ color: "#64748b" }}>7-day free trial · No charge until day 8</p>
      </div>

      <button
        onClick={handleGoogle} disabled={loading}
        className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 font-semibold text-sm transition-all hover:bg-slate-50 disabled:opacity-50"
        style={{ borderColor: "#e2e8f0", color: "#0f172a" }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs" style={{ color: "#94a3b8" }}>or sign up with email</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {error && (
        <p className="text-sm text-center font-medium rounded-lg px-3 py-2 bg-red-50 border border-red-100" style={{ color: "#dc2626" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text" value={form.firstName}
            onChange={e => field("firstName", e.target.value)}
            placeholder="First name" required
            className="flex-1 min-w-0 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            style={{ color: "#0f172a" }}
          />
          <input
            type="text" value={form.lastName}
            onChange={e => field("lastName", e.target.value)}
            placeholder="Last name"
            className="flex-1 min-w-0 border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400"
            style={{ color: "#0f172a" }}
          />
        </div>
        <input
          type="email" value={form.email}
          onChange={e => field("email", e.target.value)}
          placeholder="Email address" required
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          style={{ color: "#0f172a" }}
        />
        <input
          type="password" value={form.password}
          onChange={e => field("password", e.target.value)}
          placeholder="Password (min 8 characters)" required minLength={8}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
          style={{ color: "#0f172a" }}
        />
        <button
          type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
          style={{ background: "#000936", color: "#FDC800" }}
        >
          {loading ? "Creating account…" : "Create account →"}
        </button>
      </form>

      <p className="text-xs text-center" style={{ color: "#94a3b8" }}>
        Already have an account?{" "}
        <a href="/sign-in" className="font-semibold underline" style={{ color: "#0066CB" }}>Sign in</a>
      </p>
    </Wrap>
  )
}
