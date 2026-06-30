import { clerkMiddleware } from "@clerk/nextjs/server"
import { NextResponse, type NextRequest } from "next/server"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Singleton — null = not yet initialized, undefined = checked and skipped
let _apiLimiter: Ratelimit | null | undefined = undefined

function getApiLimiter(): Ratelimit | null {
  if (_apiLimiter !== undefined) return _apiLimiter
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    _apiLimiter = null
    return null
  }
  try {
    _apiLimiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(120, "60 s"),
      analytics: false,
      prefix: "sel_mw",
    })
  } catch {
    _apiLimiter = null
  }
  return _apiLimiter
}

// Blanket gate: 120 req / 60 s per IP across all /api/* routes.
// Runs before any serverless function is invoked — flooded requests are
// rejected without incurring compute or AI API costs.
// Initialization deferred to first request; no module-level side effects.
export default clerkMiddleware(async (_auth, request: NextRequest) => {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const limiter = getApiLimiter()
    if (limiter) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown"
      const { success } = await limiter.limit(ip)
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429, headers: { "Retry-After": "60" } },
        )
      }
    }
  }
  // Returning nothing lets Clerk continue normal auth processing.
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
