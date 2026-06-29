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
    <aside className="fixed sm:relative inset-y-0 left-0 z-50 w-72 sm:w-64 shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden shadow-xl sm:shadow-none">
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 flex gap-2">
        <button
          onClick={onNew}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          + New Chat
        </button>
        {/* Close button — visible on mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="sm:hidden px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center py-8 px-4">
            Your past conversations will appear here.
          </p>
        ) : (
          [...conversations].reverse().map((c) => (
            <div
              key={c.id}
              onClick={() => { onSelect(c.id); onClose?.() }}
              className={`group relative rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                activeId === c.id
                  ? "bg-indigo-50 dark:bg-indigo-950"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <div className="flex items-start gap-1.5 pr-5">
                <span className="text-xs mt-0.5 shrink-0">
                  {c.mode === "practice" ? "📝" : "💬"}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${
                    activeId === c.id
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-gray-800 dark:text-gray-200"
                  }`}>
                    {c.title}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {subjectAbbrev(c.subject)} · {formatDate(c.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}
                className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 text-xs px-1 transition-opacity"
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
