// Client-side rate limiter — prevents rapid-fire abuse of auth and interview starts.
// Keyed by userId or email + action type. Resets per time window.

const LIMITS = {
  interview_start: { max: 10, windowMs: 60 * 60 * 1000 },  // 10 per hour
  auth_attempts:   { max: 5,  windowMs: 15 * 60 * 1000 },  // 5 per 15 min
}

const log = new Map()

export function checkRateLimit(key, limitType) {
  const limit = LIMITS[limitType]
  if (!limit) return { allowed: true }

  const now = Date.now()
  const windowStart = now - limit.windowMs
  const mapKey = `${limitType}:${key}`

  const prev = (log.get(mapKey) || []).filter(t => t > windowStart)

  if (prev.length >= limit.max) {
    const resetAt = new Date(prev[0] + limit.windowMs)
    return {
      allowed: false,
      message: `Too many attempts. Try again after ${resetAt.toLocaleTimeString()}.`,
    }
  }

  log.set(mapKey, [...prev, now])
  return { allowed: true }
}
