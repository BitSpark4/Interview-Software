// All Claude calls go through /.netlify/functions/claude-proxy — key stays server-side.
// Use `netlify dev` locally (port 8888) so functions run alongside the frontend.

const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const PROXY_URL = isLocalDev
  ? 'http://localhost:8888/.netlify/functions/claude-proxy'
  : '/.netlify/functions/claude-proxy'

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

// ── analyzeResume ─────────────────────────────────────────────────────────────
export async function analyzeResume(resumeText) {
  const system = `Analyze this resume and extract the following in JSON only:
{
  "technical_skills": [
    { "name": "React", "category": "frontend", "level": "advanced" }
  ],
  "experience_years": 3,
  "current_role": "Frontend Developer",
  "education": "B.Tech Computer Science",
  "ats_score": 72,
  "ats_feedback": ["Add more quantified achievements", "Include LinkedIn URL"],
  "top_strengths": ["React ecosystem", "API integration"],
  "improvement_areas": ["System design", "Cloud services"]
}
Categories for technical_skills: frontend, backend, database, devops, mobile, tools, soft
Return only JSON. No other text.`

  const raw = await callClaude({
    system,
    messages: [{ role: 'user', content: resumeText.slice(0, 3000) }],
    maxTokens: 1000,
    model: HAIKU,
  })

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return null
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

// ── analyzeResumeATS ──────────────────────────────────────────────────────────
export async function analyzeResumeATS(resumeText) {
  const system = `You are an ATS (Applicant Tracking System) expert.
Analyze this resume and return ONLY this JSON:
{
  "score": 72,
  "grade": "Good",
  "breakdown": {
    "contact_info": 8,
    "work_experience": 20,
    "quantified_achievements": 12,
    "keywords": 15,
    "education": 8,
    "skills_section": 7,
    "formatting": 4
  },
  "improvements": ["improvement 1","improvement 2","improvement 3","improvement 4","improvement 5"],
  "strengths": ["strength 1","strength 2","strength 3"],
  "missing_keywords": ["keyword1","keyword2","keyword3"]
}
Grade: 80-100=Excellent, 60-79=Good, 40-59=Average, 0-39=Poor.
Scoring guide — contact_info(max 10): name/email/phone/LinkedIn present; work_experience(max 25): clear job titles/dates/company; quantified_achievements(max 20): numbers/percentages/metrics used; keywords(max 20): industry-relevant keywords; education(max 10): degree/institution/year; skills_section(max 10): dedicated skills section; formatting(max 5): clean readable structure.
Return only JSON. No other text.`

  const raw = await callClaude({
    system,
    messages: [{ role: 'user', content: resumeText.slice(0, 3000) }],
    maxTokens: 800,
    model: HAIKU,
  })

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON')
    return JSON.parse(match[0])
  } catch {
    // retry once
    try {
      const retry = await callClaude({
        system,
        messages: [
          { role: 'user', content: resumeText.slice(0, 3000) },
          { role: 'assistant', content: raw },
          { role: 'user', content: 'Return only the JSON object, no other text.' },
        ],
        maxTokens: 800,
        model: HAIKU,
      })
      const match2 = retry.match(/\{[\s\S]*\}/)
      if (!match2) return null
      return JSON.parse(match2[0])
    } catch {
      return null
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
