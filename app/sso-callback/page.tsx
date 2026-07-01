"use client"

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0b1a" }}>
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
