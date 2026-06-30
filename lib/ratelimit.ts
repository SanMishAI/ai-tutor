type Entry = { count: number; resetAt: number }

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, Entry>()

  return function check(ip: string): boolean {
    const now = Date.now()
    const entry = store.get(ip)

    if (!entry || now > entry.resetAt) {
      store.set(ip, { count: 1, resetAt: now + windowMs })
      return true
    }

    if (entry.count >= maxRequests) return false
    entry.count++
    return true
  }
}

export function getIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}
