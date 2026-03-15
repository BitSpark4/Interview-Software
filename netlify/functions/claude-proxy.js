/**
 * Netlify Function v1 — Claude API Proxy
 * CLAUDE_API_KEY stays server-side only. Never exposed to browser.
 * Accessible at /.netlify/functions/claude-proxy
 */

const ALLOWED_MODELS = ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6']
const MAX_CHARS = 50000

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
})

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
        model:      model || 'claude-haiku-4-5-20251001',
        max_tokens: max_tokens || 500,
        system,
        messages,
        stream:     false,
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}))
      return {
        statusCode: upstream.status,
        headers: corsHeaders(origin),
        body: JSON.stringify({ error: err?.error?.message || 'Claude API error' }),
      }
    }

    const data = await upstream.json()
    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify(data),
    }
  } catch (err) {
    console.error('claude-proxy error:', err)
    return {
      statusCode: 500,
      headers: corsHeaders(origin),
      body: JSON.stringify({ error: 'AI service temporarily unavailable' }),
    }
  }
}
