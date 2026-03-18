// All Claude calls go through /.netlify/functions/claude-proxy — key stays server-side.
// Use `netlify dev` locally (port 8888) so functions run alongside the frontend.

const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const PROXY_URL = isLocalDev
  ? 'http://localhost:8888/.netlify/functions/claude-proxy'
  : '/.netlify/functions/claude-proxy'

const HAIKU  = 'claude-haiku-4-5'
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

// ── buildSectorPrompt — sector-aware system prompt ────────────────────────────
const buildQuestionRules = (n) => `
CRITICAL RULE: Ask EXACTLY ${n} questions total. Not more. Not less.
After question number ${n} you MUST generate the final report JSON.
Do not ask question ${n + 1} under any circumstances.

Rules for asking questions:
- Ask ONE direct question immediately
- No introduction text before question
- No session headers or titles
- No markdown formatting symbols
- No asterisks no hashtags no dashes
- Just ask the question plainly
- Keep question under 4 sentences
- Be direct like a real interviewer
`.trim()

export function buildSectorPrompt(sector, role, interviewType, companyFocus, state, profile, totalQuestions = 10) {
  const QUESTION_RULES = buildQuestionRules(totalQuestions)
  const stateContext = state === 'maharashtra'
    ? 'Include Maharashtra specific questions about Maratha history, Maharashtra geography, state schemes, and local governance when relevant.'
    : `Include ${state} specific regional questions when relevant.`

  const prompts = {
    government: `
${QUESTION_RULES}

You are an experienced UPSC and government exam interview coach in India.
Role: ${role}
State: ${state}
${stateContext}

Interview rules for government exams:
- Ask questions based on actual UPSC MPSC SSC exam patterns
- Mix topics: History, Geography, Polity, Economy, Current Affairs
- Include at least 2 current affairs questions per session
- Ask location specific questions based on user state
- For UPSC: formal academic question style
- For SSC: faster paced practical questions
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"History","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Questions must be from actual exam syllabus only
- Never make up facts or incorrect historical dates
    `.trim(),

    banking: `
${QUESTION_RULES}

You are an experienced banking exam coach and HR interviewer at SBI IBPS.
Role: ${role}
State: ${state}

Interview rules for banking:
- Ask questions about banking concepts RBI policies recent news
- Include numerical and reasoning questions for PO Clerk roles
- Ask about recent RBI policy changes repo rate CRR SLR
- Include questions about government financial schemes
- Ask situation based banking customer service scenarios
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Banking Awareness","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Facts about banking must be current and accurate
    `.trim(),

    engineering: `
${QUESTION_RULES}

You are an experienced technical interviewer at a top engineering company or PSU.
Role: ${role} Engineer
State: ${state}

Interview rules for engineering:
- Ask core technical questions from engineering fundamentals
- Start with concept then go to application
- Ask numerical problems with calculations
- Include questions about projects and practical experience
- For freshers ask final year project questions
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Thermodynamics","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Technical answers must be scientifically accurate
    `.trim(),

    medical: `
${QUESTION_RULES}

You are an experienced medical professor and clinical interviewer in India.
Role: ${role}
State: ${state}

Interview rules for medical:
- Present clinical cases and ask for diagnosis management
- Ask about drug mechanisms side effects dosages
- Include emergency medicine priority questions
- Ask about recent medical guidelines and protocols
- For NEET PG ask subject specific high yield topics
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Medicine","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Medical facts must be accurate and based on current guidelines
    `.trim(),

    students: `
${QUESTION_RULES}

You are an encouraging and friendly interview coach for students and freshers in India.
Role: ${role}
Education: ${profile?.education_level || 'graduate'}
Target: ${profile?.target_exam || 'placement'}
State: ${state}

Interview rules for students:
- Be encouraging and confidence building in tone
- Ask questions appropriate for their education level
- No assumption of work experience
- For CET JEE ask conceptual subject questions
- For first job ask basic HR and aptitude questions
- Explain what a good answer looks like after each response
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","encouragement":"You are on the right track!","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Always include encouragement field for student sector
    `.trim(),

    business: `
${QUESTION_RULES}

You are an experienced MBA interviewer and business coach in India.
Role: ${role}
State: ${state}

Interview rules for business MBA:
- Ask case study and business problem questions
- Include current business news India topics
- Ask about business fundamentals strategy finance
- For group discussion give opinion based prompts
- Ask about leadership teamwork examples
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Strategy","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
    `.trim(),

    it_tech: `
${QUESTION_RULES}

You are an experienced technical interviewer at a top Indian tech company.
Role: ${role} | Type: ${interviewType} | Company: ${companyFocus}
${profile?.resumeText ? `Resume (key points): ${profile.resumeText.slice(0, 800)}` : ''}

Interview rules for IT:
- Ask technical questions relevant to the role
- If resume provided ask about their actual projects
- Mix technical and behavioral questions for mixed type
- Use STAR method evaluation for behavioral answers
- Keep questions relevant to Indian job market
- Ask ONE question at a time, no preamble
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","star_breakdown":{"situation":"present","task":"present","action":"present","result":"missing"},"next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
    `.trim(),
  }

  return prompts[sector] || prompts.it_tech
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
export async function startInterview({ role, interviewType, companyFocus, resumeText, sector, state, studentProfile, totalQuestions = 10 }) {
  const activeSector = sector || 'it_tech'
  const activeState  = state || 'maharashtra'
  const profile      = { resumeText, ...studentProfile }

  const system = buildSectorPrompt(activeSector, role, interviewType, companyFocus, activeState, profile, totalQuestions)

  return callClaude({
    model:     HAIKU,
    maxTokens: 300,
    system,
    messages:  [{ role: 'user', content: 'Begin the interview. Ask question 1.' }],
  })
}

// ── evaluateAnswer ────────────────────────────────────────────────────────────
export async function evaluateAnswer({
  conversationHistory, userAnswer, questionNumber,
  interviewType, role, companyFocus, resumeText,
  sector, state, studentProfile, totalQuestions = 10,
}) {
  const activeSector = sector || 'it_tech'
  const activeState  = state || 'maharashtra'
  const profile      = { resumeText, ...studentProfile }

  const basePrompt = buildSectorPrompt(activeSector, role, interviewType, companyFocus, activeState, profile, totalQuestions)

  const isStudents = activeSector === 'students'
  const jsonShape  = isStudents
    ? `{"score":7,"good":"...","missing":"...","ideal":"...","encouragement":"...","next_question":"..."}`
    : `{"score":7,"good":"...","missing":"...","ideal":"...","star_breakdown":{"situation":"present","task":"present","action":"present","result":"missing"},"next_question":""}`

  const system = `${basePrompt}

Evaluate the answer. Respond ONLY with this JSON (no other text):
${jsonShape}
For non-behavioral questions set star_breakdown values to "N/A".
Question ${questionNumber} of ${totalQuestions}.${questionNumber === totalQuestions ? ' LAST question — set next_question to "".' : ''}`

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
export async function generateReport({ conversationHistory, role, interviewType, sector }) {
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
Role: ${role}, Type: ${interviewType}, Sector: ${sector || 'it_tech'}`

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
