"use client"

import type { Conversation } from "../types"

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" })
}

function subjectAbbrev(subject: string) {
  const match = subject.match(/\(([^)]+)\)/)
  return match ? match[1] : subject.split(" ").slice(0, 2).join(" ")
}

interface Props {
  open: boolean
  conversations: Conversation[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClose?: () => void
}

export default function Sidebar({ open, conversations, activeId, onSelect, onNew, onDelete, onClose }: Props) {
  if (!open) return null

  return (
    <aside className="fixed sm:relative inset-y-0 left-0 z-50 w-72 sm:w-60 shrink-0 flex flex-col overflow-hidden shadow-xl sm:shadow-none"
      style={{ background: "#ffffff", borderRight: "1px solid #e2e8f0" }}>

      <div className="p-3 flex gap-2" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <button
          onClick={onNew}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90"
          style={{ background: "#000936", color: "#FDC800" }}
        >
          + New Chat
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-slate-50"
            style={{ border: "1px solid #e2e8f0", color: "#94a3b8" }}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {conversations.length === 0 ? (
          <p className="text-xs text-center py-8 px-4" style={{ color: "#cbd5e1" }}>
            Your past conversations will appear here.
          </p>
        ) : (
          [...conversations].reverse().map((c) => (
            <div
              key={c.id}
              onClick={() => { onSelect(c.id); onClose?.() }}
              className="group relative rounded-xl px-3 py-2.5 cursor-pointer transition-all"
              style={activeId === c.id ? {
                background: "#f8fafc",
                borderLeft: "3px solid #000936",
                paddingLeft: 10,
              } : {
                borderLeft: "3px solid transparent",
                paddingLeft: 10,
              }}
              onMouseEnter={e => { if (activeId !== c.id) (e.currentTarget as HTMLElement).style.background = "#f8fafc" }}
              onMouseLeave={e => { if (activeId !== c.id) (e.currentTarget as HTMLElement).style.background = "transparent" }}
            >
              <div className="flex items-start gap-1.5 pr-5">
                <span className="text-xs mt-0.5 shrink-0">
                  {c.mode === "practice" ? "📝" : "💬"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate"
                    style={{ color: activeId === c.id ? "#000936" : "#334155" }}>
                    {c.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>
                    {subjectAbbrev(c.subject)} · {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
                className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 text-xs px-1 transition-opacity hover:text-red-500"
                style={{ color: "#cbd5e1" }}
                title="Delete"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
