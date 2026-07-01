"use client"

import { useState, useEffect, Suspense } from "react"
import { useUser, UserButton } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

type Child = { id: string; name: string; avatarEmoji: string; dailyLimit: number | null; createdAt: string }
type Sub = {
  status: string; isPremium: boolean; isFounder: boolean
  trialDaysLeft?: number | null; trialEndsAt?: string | null; cancelBy?: string | null
  currentPeriodEnd?: string
}

const AVATARS = ["🧑‍🎓", "👦", "👧", "🧒", "🦊", "🐼", "🦁", "🐸", "🦋", "🚀", "⭐", "🎮"]
const CHILD_LIMIT = 5

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export default function ParentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}><p style={{ color: "#94a3b8" }}>Loading…</p></div>}>
      <ParentDashboard />
    </Suspense>
  )
}

function ParentDashboard() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justUpgraded = searchParams.get("upgraded") === "1"

  const [children, setChildren] = useState<Child[]>([])
  const [sub, setSub] = useState<Sub>({ status: "none", isPremium: false, isFounder: false })
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: "", pin: "", avatarEmoji: "🧑‍🎓", dailyLimit: "" })
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editLimit, setEditLimit] = useState<string>("")
  const [portalLoading, setPortalLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { router.push("/"); return }
    Promise.all([
      fetch("/api/child-profiles").then(r => r.json()),
      fetch("/api/subscription").then(r => r.json()),
    ]).then(([c, s]) => {
      setChildren(Array.isArray(c) ? c : [])
      setSub(s)
      setLoading(false)
    })
  }, [isLoaded, isSignedIn, router])

  async function addChild() {
    if (!form.name.trim()) { setFormError("Name is required."); return }
    if (form.pin.length !== 4 || !/^\d{4}$/.test(form.pin)) { setFormError("PIN must be exactly 4 digits."); return }
    setSaving(true); setFormError("")
    const res = await fetch("/api/child-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, dailyLimit: form.dailyLimit ? parseInt(form.dailyLimit) : null }),
    })
    const data = await res.json()
    if (!res.ok) { setFormError(data.error ?? "Error adding profile."); setSaving(false); return }
    setChildren(prev => [...prev, data])
    setShowAdd(false)
    setForm({ name: "", pin: "", avatarEmoji: "🧑‍🎓", dailyLimit: "" })
    setSaving(false)
  }

  async function deleteChild(id: string) {
    await fetch("/api/child-profiles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setChildren(prev => prev.filter(c => c.id !== id))
  }

  async function saveLimit(id: string) {
    const dailyLimit = editLimit === "" ? null : parseInt(editLimit)
    const res = await fetch("/api/child-profiles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, dailyLimit }),
    })
    const data = await res.json()
    if (res.ok) setChildren(prev => prev.map(c => c.id === id ? { ...c, dailyLimit: data.dailyLimit } : c))
    setEditId(null)
  }

  async function handleCheckout() {
    setCheckoutLoading(true)
    const res = await fetch("/api/stripe/checkout", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setCheckoutLoading(false)
  }

  async function handlePortal() {
    setPortalLoading(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  const canAddMore = children.length < CHILD_LIMIT

  if (!isLoaded || loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <p style={{ color: "#94a3b8" }}>Loading…</p>
    </div>
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc", color: "#0f172a" }}>

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/selected-logo.svg" alt="SelectEd" style={{ width: 28, height: 28 }} />
            <span className="font-black italic text-lg" style={{ fontFamily: '"Arial Black", system-ui' }}>
              <span style={{ color: "#000936" }}>Select</span><span style={{ color: "#E34C00" }}>Ed</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-slate-900" style={{ color: "#64748b" }}>
              Open app
            </Link>
            <UserButton />
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 space-y-8">

        {/* Welcome / upgrade success */}
        <div>
          <h1 className="text-2xl font-black" style={{ color: "#0f172a" }}>
            Parent dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Welcome, {user?.firstName ?? "there"} — manage your children&apos;s profiles and subscription here.
          </p>
          {justUpgraded && (
            <div className="mt-3 rounded-xl px-4 py-3 flex items-center gap-2 text-sm font-semibold"
              style={{ background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d" }}>
              ✓ Premium activated! Your children now have unlimited access.
            </div>
          )}
        </div>

        {/* Trial countdown banner */}
        {sub.status === "trialing" && sub.cancelBy && (() => {
          const daysLeft = sub.trialDaysLeft ?? 0
          const urgent = daysLeft <= 1
          return (
            <div className="rounded-2xl px-5 py-4 border"
              style={{ background: urgent ? "#fef2f2" : "#fefce8", borderColor: urgent ? "#fca5a5" : "#fde68a" }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-sm" style={{ color: urgent ? "#b91c1c" : "#92400e" }}>
                    {daysLeft === 0 ? "⚠️ Your trial ends today"
                      : daysLeft === 1 ? "⚠️ 1 day left in your trial"
                      : `⏳ ${daysLeft} days left in your free trial`}
                  </p>
                  <p className="text-xs mt-1" style={{ color: urgent ? "#dc2626" : "#b45309" }}>
                    Cancel before <strong>{fmtDate(sub.cancelBy)}</strong> to avoid being charged $9.99/month.
                  </p>
                </div>
                <button onClick={handlePortal} disabled={portalLoading}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: urgent ? "#dc2626" : "#92400e", color: "white" }}>
                  {portalLoading ? "…" : "Cancel trial"}
                </button>
              </div>
            </div>
          )
        })()}

        {/* Subscription card */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
            <div>
              <p className="font-bold text-sm" style={{ color: "#0f172a" }}>
                {sub.isFounder ? "⭐ Founder access"
                  : sub.status === "trialing" ? "🎉 Free trial — full access"
                  : sub.status === "active" ? "✦ Premium"
                  : "No active plan"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                {sub.isFounder
                  ? "Permanent unlimited access · All features"
                  : sub.status === "trialing" && sub.trialEndsAt
                  ? `Trial ends ${fmtDate(sub.trialEndsAt)} · $9.99/month after`
                  : sub.status === "active" && sub.currentPeriodEnd
                  ? `Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`
                  : "Start your 7-day free trial — no charge today"}
              </p>
            </div>
            {sub.isFounder ? null
              : sub.status === "active" ? (
              <button onClick={handlePortal} disabled={portalLoading}
                className="text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                style={{ color: "#475569" }}>
                {portalLoading ? "Opening…" : "Manage billing"}
              </button>
            ) : sub.status === "trialing" ? (
              <button onClick={handlePortal} disabled={portalLoading}
                className="text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                style={{ color: "#475569" }}>
                {portalLoading ? "Opening…" : "Manage billing"}
              </button>
            ) : (
              <button onClick={handleCheckout} disabled={checkoutLoading}
                className="text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#000936", color: "#FDC800" }}>
                {checkoutLoading ? "Loading…" : "Start free trial →"}
              </button>
            )}
          </div>
          {!sub.isPremium && !sub.isFounder && (
            <div className="px-6 py-3 text-xs" style={{ background: "#f8fafc", color: "#64748b" }}>
              <strong style={{ color: "#0f172a" }}>Trial includes everything: </strong>
              Unlimited questions · All modes · Up to 5 child profiles · Progress tracking · Leaderboard
            </div>
          )}
        </div>

        {/* Child profiles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black" style={{ color: "#0f172a" }}>
              Child profiles
              <span className="ml-2 text-sm font-normal" style={{ color: "#94a3b8" }}>
                {children.length} / {CHILD_LIMIT}
              </span>
            </h2>
            {canAddMore && !showAdd && (
              <button onClick={() => setShowAdd(true)}
                className="text-sm font-bold px-4 py-2 rounded-xl transition-all hover:opacity-90"
                style={{ background: "#000936", color: "#FDC800" }}>
                + Add child
              </button>
            )}
            {!canAddMore && !sub.isPremium && !sub.isFounder && (
              <button onClick={handleCheckout}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-50 transition-colors"
                style={{ color: "#b45309", background: "#fef3c7" }}>
                Upgrade for more
              </button>
            )}
          </div>

          {/* Add child form */}
          {showAdd && (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-5 mb-4 space-y-4">
              <h3 className="font-bold text-sm" style={{ color: "#0f172a" }}>New child profile</h3>

              {/* Avatar picker */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: "#94a3b8" }}>Choose an avatar</p>
                <div className="flex flex-wrap gap-2">
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, avatarEmoji: a }))}
                      className="w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all hover:scale-110"
                      style={form.avatarEmoji === a ? { background: "#000936", boxShadow: "0 0 0 2px #FDC800" } : { background: "#f1f5f9" }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    style={{ border: "1px solid #e2e8f0", background: "white", color: "#334155" }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>4-digit PIN</label>
                  <input value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                    type="password" inputMode="numeric" maxLength={4} placeholder="••••"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    style={{ border: "1px solid #e2e8f0", background: "white", color: "#334155" }} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "#64748b" }}>
                  Daily question limit <span style={{ color: "#94a3b8" }}>(leave blank = use plan default{(sub.isPremium || sub.isFounder) ? " — unlimited" : " — 20"})</span>
                </label>
                <input value={form.dailyLimit} onChange={e => setForm(f => ({ ...f, dailyLimit: e.target.value.replace(/\D/g, "") }))}
                  type="text" inputMode="numeric" placeholder={(sub.isPremium || sub.isFounder) ? "Unlimited" : "20"}
                  className="w-32 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  style={{ border: "1px solid #e2e8f0", background: "white", color: "#334155" }} />
              </div>

              {formError && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{formError}</p>}

              <div className="flex gap-2">
                <button onClick={addChild} disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#000936", color: "#FDC800" }}>
                  {saving ? "Saving…" : "Add profile"}
                </button>
                <button onClick={() => { setShowAdd(false); setFormError("") }}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                  style={{ color: "#64748b" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Child list */}
          {children.length === 0 && !showAdd ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-3xl mb-3">👨‍👩‍👧</p>
              <p className="font-bold text-sm" style={{ color: "#0f172a" }}>No child profiles yet</p>
              <p className="text-xs mt-1 mb-4" style={{ color: "#94a3b8" }}>Add a profile so your child can log in with their name and PIN.</p>
              <button onClick={() => setShowAdd(true)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: "#000936", color: "#FDC800" }}>
                + Add your first child
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map(c => (
                <div key={c.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 flex items-center gap-4 shadow-sm">
                  <span className="text-3xl shrink-0">{c.avatarEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold" style={{ color: "#0f172a" }}>{c.name}</p>
                    {editId === c.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text" inputMode="numeric"
                          value={editLimit}
                          onChange={e => setEditLimit(e.target.value.replace(/\D/g, ""))}
                          placeholder={(sub.isPremium || sub.isFounder) ? "blank = unlimited" : "blank = 20"}
                          className="w-28 px-2 py-1 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                          style={{ border: "1px solid #e2e8f0", background: "white", color: "#334155" }}
                        />
                        <span className="text-xs" style={{ color: "#94a3b8" }}>q/day</span>
                        <button onClick={() => saveLimit(c.id)}
                          className="text-xs font-bold px-2.5 py-1 rounded-lg transition-all hover:opacity-90"
                          style={{ background: "#000936", color: "#FDC800" }}>
                          Save
                        </button>
                        <button onClick={() => setEditId(null)} className="text-xs hover:text-slate-700" style={{ color: "#94a3b8" }}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                        {c.dailyLimit !== null
                          ? `${c.dailyLimit} questions/day`
                          : (sub.isPremium || sub.isFounder) ? "Unlimited questions/day" : "10 questions/day (free plan)"}
                        {" · "}
                        <button onClick={() => { setEditId(c.id); setEditLimit(c.dailyLimit?.toString() ?? "") }}
                          className="underline hover:text-slate-700 transition-colors">
                          edit limit
                        </button>
                      </p>
                    )}
                  </div>
                  <button onClick={() => { if (confirm(`Remove ${c.name}? This deletes all their usage history.`)) deleteChild(c.id) }}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 transition-colors hover:border-red-200 hover:text-red-500"
                    style={{ color: "#94a3b8" }}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How children log in */}
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5">
          <h3 className="font-bold text-sm mb-3" style={{ color: "#0f172a" }}>How children log in</h3>
          <ol className="space-y-2 text-sm" style={{ color: "#475569" }}>
            <li className="flex gap-2"><span className="font-bold shrink-0" style={{ color: "#0066CB" }}>1.</span> Your child visits <strong>selected-ed.vercel.app</strong></li>
            <li className="flex gap-2"><span className="font-bold shrink-0" style={{ color: "#0066CB" }}>2.</span> They tap <strong>&quot;I&apos;m a student&quot;</strong> on the home page</li>
            <li className="flex gap-2"><span className="font-bold shrink-0" style={{ color: "#0066CB" }}>3.</span> They pick their name, enter their 4-digit PIN, and they&apos;re in</li>
          </ol>
          <p className="text-xs mt-3" style={{ color: "#94a3b8" }}>
            Children can only access the study centre — no pricing, account settings, or other pages.
          </p>
        </div>

      </div>
    </div>
  )
}
