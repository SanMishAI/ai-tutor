import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

type Checker = (identifier: string) => Promise<boolean>

function inMemoryLimiter(maxReq: number, windowMs: number): Checker {
  const store = new Map<string, { count: number; resetAt: number }>()
  return async (id: string) => {
    const now = Date.now()
    const entry = store.get(id)
    if (!entry || now > entry.resetAt) {
      store.set(id, { count: 1, resetAt: now + windowMs })
      return true
    }
    if (entry.count >= maxReq) return false
    entry.count++
    return true
  }
}

/**
 * Returns a distributed sliding-window rate limiter backed by Upstash Redis,
 * falling back to per-instance in-memory state if credentials are absent.
 *
 * Initialization is fully deferred to the first request — nothing runs at
 * module import time, so the build phase is never affected.
 */
export function createRateLimiter(requests: number, windowSec: number, name: string): Checker {
  let checker: Checker | undefined = undefined

  return async (identifier: string) => {
    if (!checker) {
      const url = process.env.UPSTASH_REDIS_REST_URL
      const token = process.env.UPSTASH_REDIS_REST_TOKEN
      if (url && token) {
        try {
          const redis = new Redis({ url, token })
          const limiter = new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(requests, `${windowSec} s`),
            analytics: false,
            prefix: `sel_${name}`,
          })
          checker = async (id: string) => {
            const { success } = await limiter.limit(id)
            return success
          }
        } catch {
          checker = inMemoryLimiter(requests, windowSec * 1000)
        }
      } else {
        checker = inMemoryLimiter(requests, windowSec * 1000)
      }
    }
    return checker(identifier)
  }
}

export function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}
