/**
 * Netlify Function — Detect tech stack from resume text
 * Lightweight Haiku call — returns JSON array of technology names.
 * Non-critical: on any error returns empty array so upload flow is never blocked.
 */

const ALLOWED_ORIGIN = '*'

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || ALLOWED_ORIGIN,
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
    return { statusCode: 405, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }
  }

  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
  if (!CLAUDE_API_KEY) {
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }
  }

  let resumeText = ''
  try {
    const body = JSON.parse(event.body || '{}')
    resumeText = (body.resumeText || '').slice(0, 2000)
  } catch {
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }
  }

  if (!resumeText.trim()) {
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 200,
        system: 'Extract only technology/framework names from this resume. Return a JSON array of strings only. Max 10 items. No explanation. Example: ["React","TypeScript","AWS"]',
        messages: [{ role: 'user', content: resumeText }],
        stream: false,
      }),
    })

    if (!upstream.ok) {
      return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }
    }

    const data = await upstream.json()
    const raw  = data?.content?.[0]?.text || '[]'

    // Parse JSON array safely
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }

    const technologies = JSON.parse(match[0])
    if (!Array.isArray(technologies)) {
      return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }
    }

    return {
      statusCode: 200,
      headers: corsHeaders(origin),
      body: JSON.stringify({ technologies: technologies.filter(t => typeof t === 'string').slice(0, 10) }),
    }
  } catch {
    // Never fail the resume upload flow
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ technologies: [] }) }
  }
}
