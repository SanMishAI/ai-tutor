import type { NextConfig } from "next"

const SECURITY_HEADERS = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stop MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Limit referrer info sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not used by this app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Force HTTPS for 2 years (Vercel already does this, belt-and-suspenders)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevent DNS prefetch leaks
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Content Security Policy
  // Clerk, Stripe Checkout, and KaTeX each need specific allowances.
  // 'unsafe-inline' for styles is required by Tailwind and KaTeX at runtime.
  // This policy blocks third-party script injection while permitting the
  // exact set of origins the app legitimately loads.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + Clerk + Stripe + Vercel analytics + Cloudflare Turnstile (Clerk bot protection)
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.selected-ed.vercel.app https://*.clerk.accounts.dev https://js.stripe.com https://va.vercel-scripts.com https://challenges.cloudflare.com",
      // Styles: self + Google Fonts + KaTeX inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      // Fonts: self + Google Fonts + KaTeX
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
      // Images: self + data URIs + Clerk avatar CDN + san.jpeg served from self
      "img-src 'self' data: blob: https://*.clerk.com https://*.clerk.dev",
      // Connections: self + Anthropic API (proxied via /api/chat) + Clerk + Stripe + Neon + Cloudflare Turnstile
      "connect-src 'self' https://*.clerk.accounts.dev https://clerk.selected-ed.vercel.app https://api.stripe.com https://*.neon.tech wss://*.clerk.accounts.dev https://challenges.cloudflare.com",
      // Frames: Stripe Checkout + Cloudflare Turnstile (Clerk bot protection widget)
      "frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com",
      // Workers: none
      "worker-src 'none'",
      // Block object/embed
      "object-src 'none'",
      // Base URI: restrict to self
      "base-uri 'self'",
      // Form actions: self only
      "form-action 'self'",
      // Upgrade insecure requests
      "upgrade-insecure-requests",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
    ]
  },
}

export default nextConfig
