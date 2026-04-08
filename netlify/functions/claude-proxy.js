/**
 * Netlify Function v1 — Claude API Proxy
 * CLAUDE_API_KEY stays server-side only. Never exposed to browser.
 * Accessible at /.netlify/functions/claude-proxy
 */

const ALLOWED_MODELS = ['claude-haiku-4-5', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-6']
const MAX_CHARS = 50000

// Daily API call limits per plan
const RATE_LIMITS = { free: 15, pro: 100 }

// ── logError — async, non-blocking, never throws ──────────────────────────────
async function logError({ errorType, errorMessage, userId = null, sessionId = null, sector = null, context = {} }) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY
  if (!SUPABASE_URL || !SERVICE_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/error_logs`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ error_type: errorType, error_message: String(errorMessage).slice(0, 500), user_id: userId, session_id: sessionId, sector, context }),
    })
  } catch (_) {
    // logging must never cause another error
  }
}

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
})

// ── checkAndIncrementUsage ────────────────────────────────────────────────────
// Returns { allowed: true } or { allowed: false, message: '...' }
// Uses service key to bypass RLS — only called server-side.
async function checkAndIncrementUsage(userId, plan) {
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return { allowed: true } // skip if not configured

  const today = new Date().toISOString().split('T')[0]
  const limit = RATE_LIMITS[plan] ?? RATE_LIMITS.free
  const headers = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }

  // Upsert: create row if first call of the day, otherwise increment
  const upsertRes = await fetch(
    `${SUPABASE_URL}/rest/v1/api_usage`,
    {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ user_id: userId, usage_date: today, call_count: 1 }),
    }
  )

  if (!upsertRes.ok) {
    // If table doesn't exist yet, allow the call rather than blocking users
    console.warn('api_usage upsert failed — skipping rate limit check')
    return { allowed: true }
  }

  const rows = await upsertRes.json()
  const callCount = rows?.[0]?.call_count ?? 1

  if (callCount > limit) {
    // Reset is midnight IST (UTC+5:30)
    const resetIST = new Date(`${today}T18:30:00.000Z`) // next midnight IST = today 18:30 UTC
    const now = new Date()
    if (resetIST < now) resetIST.setDate(resetIST.getDate() + 1)
    const resetTime = resetIST.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
    return {
      allowed: false,
      message: `Daily limit of ${limit} AI calls reached. Resets at ${resetTime} IST.${plan === 'free' ? ' Upgrade to Pro for 100 calls/day.' : ''}`,
    }
  }

  // If count was already above 1 (existing row was incremented by Supabase trigger/default),
  // we need to manually increment. The upsert above inserts call_count=1 on conflict merge
  // which Supabase REST does not auto-increment. Use RPC to increment properly.
  if (callCount === 1 && rows?.[0]) {
    // First call of the day — already inserted with count 1, good.
    return { allowed: true }
  }

  // Increment existing row
  await fetch(
    `${SUPABASE_URL}/rest/v1/api_usage?user_id=eq.${userId}&usage_date=eq.${today}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ call_count: callCount }),
    }
  )

  return { allowed: true }
}

export const handler = async (event) => {
  const origin = event.headers?.origin || ''

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin), body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
  if (!CLAUDE_API_KEY) {
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'AI service not configured' }) }
  }

  let body
  try { body = JSON.parse(event.body || '{}') }
  catch {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const { messages, system, model, max_tokens } = body

  if (!messages || !Array.isArray(messages)) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'messages array required' }) }
  }
  if (model && !ALLOWED_MODELS.includes(model)) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Model not allowed' }) }
  }
  if (JSON.stringify(messages).length > MAX_CHARS) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Request too large' }) }
  }

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  let _userId = null
  if (jwt) {
    try {
      // Verify JWT with Supabase (cryptographic check — never trust client-decoded payload)
      const SUPABASE_URL = process.env.SUPABASE_URL
      const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY
      if (SUPABASE_URL && SERVICE_KEY) {
        const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${jwt}` },
        })
        if (userRes.ok) {
          const userData = await userRes.json()
          _userId = userData?.id || null

          if (_userId) {
            // Fetch plan server-side — never trust client-sent plan value
            const planRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=plan&id=eq.${_userId}&limit=1`, {
              headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
            })
            const planRows = planRes.ok ? await planRes.json() : []
            const plan = planRows?.[0]?.plan || 'free'

            const rateCheck = await checkAndIncrementUsage(_userId, plan)
            if (!rateCheck.allowed) {
              logError({ errorType: 'rate_limit', errorMessage: rateCheck.message, userId: _userId, context: { plan } })
              return {
                statusCode: 429,
                headers: corsHeaders(origin),
                body: JSON.stringify({ error: rateCheck.message }),
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Rate limit check failed — skipping:', err.message)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      // Always non-streaming — v1 functions return a complete response
      body: JSON.stringify({
        model:      model || 'claude-haiku-4-5',
        max_tokens: max_tokens || 500,
        system,
        messages,
        stream:     false,
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}))
      const errMsg = err?.error?.message || 'Claude API error'
      const errType = upstream.status === 429 ? 'rate_limit'
        : upstream.status === 413 ? 'token_limit'
        : 'claude_error'
      logError({ errorType: errType, errorMessage: errMsg, userId: _userId, context: { status: upstream.status, model: model || 'claude-haiku-4-5' } })
      return {
        statusCode: upstream.status,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: errMsg }),
      }
    }

    const data = await upstream.json()
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify(data),
    }
  } catch (err) {
    const errType = err?.name === 'AbortError' ? 'timeout' : 'claude_error'
    logError({ errorType: errType, errorMessage: err.message || 'Unknown error', userId: _userId, context: { model: model || 'claude-haiku-4-5' } })
    console.error('claude-proxy error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'AI service temporarily unavailable' }),
    }
  }
}
