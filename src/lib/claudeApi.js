// All Claude calls go through /.netlify/functions/claude-proxy — key stays server-side.
// Use `netlify dev` locally (port 8888) so functions run alongside the frontend.

const PROXY_URL = '/.netlify/functions/claude-proxy'

const HAIKU  = 'claude-haiku-4-5-20251001'
const SONNET = 'claude-sonnet-4-6'

async function fetchWithTimeout(url, options, timeoutMs = 30000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    clearTimeout(id)
    return res
  } catch (err) {
    clearTimeout(id)
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.')
    throw err
  }
}

function buildSystemPrompt(role, interviewType, companyFocus, resumeContext) {
  return `You are an interviewer at a top Indian tech company.
Role: ${role} | Type: ${interviewType} | Company: ${companyFocus}
${resumeContext ? `Resume (key points): ${resumeContext.slice(0, 800)}` : ''}

Rules:
- Ask ONE question at a time
- Keep questions relevant to Indian job market
- Technical: concepts, system design, problem solving
- Behavioral: STAR-based scenarios
- HR: career goals, salary, culture fit
- Mixed: combine all types naturally
- Ask only the question — no preamble`.trim()
}

async function callClaude({ system, messages, maxTokens = 1024, model = SONNET }) {
  const res = await fetchWithTimeout(PROXY_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || err?.error || `AI service error: ${res.status}`)
  }

  const data = await res.json()
  return data.content[0].text
}

// ── startInterview — returns first question text ──────────────────────────────
export async function startInterview({ role, interviewType, companyFocus, resumeText }) {
  const resumeContext = resumeText ? resumeText.slice(0, 800) : null
  return callClaude({
    model:     HAIKU,
    maxTokens: 300,
    system:    buildSystemPrompt(role, interviewType, companyFocus, resumeContext),
    messages:  [{ role: 'user', content: 'Begin the interview. Ask question 1.' }],
  })
}

// ── evaluateAnswer ────────────────────────────────────────────────────────────
export async function evaluateAnswer({
  conversationHistory, userAnswer, questionNumber,
  interviewType, role, companyFocus, resumeText,
}) {
  const system = `You are an interviewer at a top Indian tech company.
Conducting a ${interviewType} interview for ${role} (${companyFocus}).
${resumeText ? `Resume excerpt: ${resumeText.slice(0, 400)}` : ''}

Evaluate the answer. Respond ONLY with this JSON (no other text):
{
  "score": 7,
  "good": "what was strong",
  "missing": "what was absent",
  "ideal": "ideal answer summary",
  "star_breakdown": {"situation":"present","task":"present","action":"present","result":"missing"},
  "next_question": "next question text"
}
For technical questions set star_breakdown values to "N/A".
Question ${questionNumber} of 5.${questionNumber === 5 ? ' LAST question — set next_question to "".' : ''}`

  const recentHistory = conversationHistory.slice(-6)
  const messages = [...recentHistory, { role: 'user', content: userAnswer }]

  const raw = await callClaude({ system, messages, maxTokens: 800, model: HAIKU })

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0])
  } catch {
    const retry = await callClaude({
      system,
      messages: [...messages, { role: 'assistant', content: raw }, { role: 'user', content: 'Respond with only the JSON object.' }],
      maxTokens: 800,
      model: HAIKU,
    })
    try {
      const match = retry.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON on retry')
      return JSON.parse(match[0])
    } catch {
      return { score: 5, good: 'Answer received.', missing: 'Could not parse feedback.', ideal: '', star_breakdown: { situation: 'N/A', task: 'N/A', action: 'N/A', result: 'N/A' }, next_question: '' }
    }
  }
}

// ── generateReport ────────────────────────────────────────────────────────────
export async function generateReport({ conversationHistory, role, interviewType }) {
  const system = `You are an interviewer. Generate a final interview report.
Respond ONLY with this JSON (no other text):
{
  "overallScore": 7.2,
  "verdict": "Almost Ready",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "top_advice": "single most important thing to work on",
  "weak_areas": ["area1", "area2"]
}
Verdict: >= 8 = "Ready", >= 6 = "Almost Ready", < 6 = "Needs Work"
Role: ${role}, Type: ${interviewType}`

  const messages = [...conversationHistory, { role: 'user', content: 'Interview complete. Generate the final report.' }]
  const raw = await callClaude({ system, messages, maxTokens: 1024, model: SONNET })

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0])
  } catch {
    return { overallScore: 6, verdict: 'Almost Ready', strengths: [], improvements: [], top_advice: '', weak_areas: [] }
  }
}
