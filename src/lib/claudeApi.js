// All Claude calls go through /.netlify/functions/claude-proxy — key stays server-side.
// Use `netlify dev` locally (port 8888) so functions run alongside the frontend.

import { supabase } from './supabase'

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

const buildBaseRules = (questionCount, previousQuestions = []) => `
CRITICAL RULES — FOLLOW EXACTLY:
1. Ask exactly ${questionCount} questions total
2. After question ${questionCount} generate report JSON
3. Plain text only — no markdown no asterisks no hashtags
4. One question at a time — never ask two together
5. Be direct — no long introductions before question
6. CRITICAL: Never start any question with "Question X of Y:" or "Q1:" or any numbering prefix whatsoever. Just ask the question directly. The UI already shows question numbers.
   Example of WRONG format: "Question 3 of 10: Tell me about..."
   Example of CORRECT format: "Tell me about..."

NEVER REPEAT THESE QUESTIONS:
${previousQuestions.length > 0 ? previousQuestions.slice(0, 30).join('\n') : 'No previous questions yet'}

If repeating a topic ask from completely different angle.
`.trim()

export function buildSectorPrompt(sector, role, interviewType, companyFocus, state, profile, totalQuestions = 10, previousQuestions = []) {
  const BASE = buildBaseRules(totalQuestions, previousQuestions)
  const stateContext = state === 'maharashtra'
    ? 'Include Maharashtra specific questions about Maratha history, Maharashtra geography, state schemes, and local governance when relevant.'
    : `Include ${state} specific regional questions when relevant.`

  const prompts = {
    government: `
${BASE}

You are an experienced UPSC and government exam interview coach in India.
Role: ${role}
State: ${state}
${stateContext}

Interview rules for government exams:
- Ask questions based on actual UPSC MPSC SSC exam patterns
- Mix topics: History, Geography, Polity, Economy, Current Affairs
- Include 2 to 3 current affairs questions based on recent India news
- Focus on government schemes policies Supreme Court judgments international relations
- Ask location specific questions based on user state
- For UPSC: formal academic question style. For SSC: faster paced practical questions
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"History","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Questions must be from actual exam syllabus only. Never make up facts or incorrect historical dates.
    `.trim(),

    banking: `
${BASE}

You are an experienced banking exam coach and HR interviewer at SBI IBPS.
Role: ${role}
State: ${state}

Interview rules for banking:
- Ask questions about banking concepts RBI policies recent news
- Include current RBI policy questions. Ask about repo rate current value
- Ask about recent banking sector news. Include one question on digital banking UPI
- Include numerical and reasoning questions for PO Clerk roles
- Ask situation based banking customer service scenarios
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Banking Awareness","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Facts about banking must be current and accurate
    `.trim(),

    engineering: `
${BASE}

You are an experienced technical interviewer at a top engineering company or PSU.
Role: ${role} Engineer
State: ${state}

Interview rules for engineering:
- Ask core technical questions from engineering fundamentals
- Start with concept then go to application. Ask numerical problems with calculations
- Include one question about recent technological development in this field
- For PSU ask about company specific operations
- Include questions about projects and practical experience. For freshers ask final year project questions
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Thermodynamics","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Technical answers must be scientifically accurate
    `.trim(),

    medical: `
${BASE}

You are an experienced medical professor and clinical interviewer in India.
Role: ${role}
State: ${state}

Interview rules for medical:
- Present clinical cases and ask for diagnosis management
- Ask about drug mechanisms side effects dosages
- Include one question about recent health scheme or disease update in India
- Reference current health guidelines
- Include emergency medicine priority questions. For NEET PG ask subject specific high yield topics
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Medicine","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Medical facts must be accurate and based on current guidelines
    `.trim(),

    students: `
${BASE}

You are an encouraging and friendly interview coach for students and freshers in India.
Role: ${role}
Education: ${profile?.education_level || 'graduate'}
Target: ${profile?.target_exam || 'placement'}
State: ${state}

Interview rules for students:
- Be encouraging always. Start with easier question to build confidence. Gradually increase difficulty
- Ask questions appropriate for their education level. No assumption of work experience
- For CET JEE ask conceptual subject questions. For first job ask basic HR and aptitude questions
- Explain what a good answer looks like after each response
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","encouragement":"You are on the right track!","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
- Always include encouragement field for student sector
    `.trim(),

    business: `
${BASE}

You are an experienced MBA interviewer and business coach in India.
Role: ${role}
State: ${state}

Interview rules for business MBA:
- Ask case study and business problem questions
- Include one current business news topic as group discussion practice
- Ask about recent economic policy change
- Ask about business fundamentals strategy finance
- For group discussion give opinion based prompts. Ask about leadership teamwork examples
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","topic":"Strategy","next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
    `.trim(),

    it_tech: `
${BASE}

You are an experienced technical interviewer at a top Indian tech company.
Role: ${role} | Type: ${interviewType} | Company: ${companyFocus}
${profile?.resumeText ? `Resume (key points): ${profile.resumeText.slice(0, 800)}` : ''}

Interview rules for IT:
- Ask about latest technology trends. If resume available ask about their projects first
- Mix technical and behavioral questions for mixed type
- Use STAR method evaluation for behavioral answers
- Keep questions relevant to Indian job market. Ask ONE question at a time no preamble
- After each answer respond ONLY with JSON:
  {"score":7,"good":"...","missing":"...","ideal":"...","star_breakdown":{"situation":"present","task":"present","action":"present","result":"missing"},"next_question":"..."}
- Ask exactly ${totalQuestions} questions total. After question ${totalQuestions} generate final report.
    `.trim(),
  }

  return prompts[sector] || prompts.it_tech
}

// ── getPreviousQuestions — fetch last 50 asked questions for this user+sector ──
const getPreviousQuestions = async (userId, sector) => {
  if (!userId) return []
  try {
    const { data } = await supabase
      .from('asked_questions')
      .select('question_text')
      .eq('user_id', userId)
      .eq('sector', sector)
      .order('asked_at', { ascending: false })
      .limit(50)
    return (data || []).map(q => q.question_text)
  } catch {
    return []
  }
}

// ── saveAskedQuestion — persist a question so it is never repeated ────────────
export const saveAskedQuestion = async (userId, sector, questionText) => {
  if (!userId || !questionText?.trim()) return
  const hash = btoa(questionText.slice(0, 50))
  try {
    await supabase.from('asked_questions').insert({
      user_id: userId,
      sector,
      question_hash: hash,
      question_text: questionText,
    })
  } catch {
    // non-critical — silent fail
  }
}

// Sector → default exam name mapping for syllabus lookup
const SECTOR_EXAM_MAP = {
  government: 'UPSC Civil Services',
  banking:    'IBPS PO',
  engineering:'GATE Mechanical',
  medical:    'NEET PG',
  students:   'CET Maharashtra',
  business:   'CAT',
}

// Fetch official syllabus from Supabase for a given sector
async function fetchSyllabusContext(sector) {
  const examName = SECTOR_EXAM_MAP[sector]
  if (!examName) return null
  try {
    const { data } = await supabase
      .from('sector_syllabus')
      .select('syllabus_content, paper_structure, topic_weightage')
      .eq('sector', sector)
      .eq('exam_name', examName)
      .single()
    return data || null
  } catch {
    return null
  }
}

async function callClaude({ system, messages, maxTokens = 1024, model = SONNET, timeoutMs = 30000 }) {
  const res = await fetchWithTimeout(PROXY_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  }, timeoutMs)

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || err?.error || `AI service error: ${res.status}`)
  }

  const data = await res.json()
  return data.content[0].text
}

// ── startInterview — returns first question text ──────────────────────────────
export async function startInterview({ role, interviewType, companyFocus, resumeText, sector, state, studentProfile, totalQuestions = 10, userId }) {
  const activeSector = sector || 'it_tech'
  const activeState  = state || 'maharashtra'
  const profile      = { resumeText, ...studentProfile }

  // Fetch previous questions and syllabus in parallel
  const [previousQuestions, syllabusData] = await Promise.all([
    getPreviousQuestions(userId, activeSector),
    fetchSyllabusContext(activeSector),
  ])

  // Build prompt with previous questions baked into baseRules
  let system = buildSectorPrompt(activeSector, role, interviewType, companyFocus, activeState, profile, totalQuestions, previousQuestions)

  // Append official syllabus context if available
  if (syllabusData) {
    system += `\n\nOFFICIAL SYLLABUS CONTEXT:\n${syllabusData.syllabus_content}\n\nPAPER STRUCTURE:\n${syllabusData.paper_structure}\n\nTOPIC WEIGHTAGE:\n${JSON.stringify(syllabusData.topic_weightage)}\n\nGenerate questions strictly following this official syllabus and weightage.\nHigher weightage topics must appear more.\nNever ask questions outside this syllabus.`
  }

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
  totalQuestions = 10, questionText = '',
}) {
  const system = `You are an interview evaluator.
Evaluate the answer and respond ONLY with this exact JSON — no other text:
{
  "score": 7,
  "good": "one sentence what was good",
  "missing": "one sentence what was missing",
  "ideal": "ideal answer in 2-3 sentences",
  "correct_answer": "correct answer 2-3 sentences",
  "improvement_tip": "one specific tip",
  "topic": "topic name"
}
Be concise. JSON only. No markdown.`

  const recentHistory = conversationHistory.slice(-6)
  const userMsg = questionText?.trim()
    ? `Question: ${questionText}\n\nCandidate answer: ${userAnswer}`
    : userAnswer
  const messages = [...recentHistory, { role: 'user', content: userMsg }]

  const raw = await callClaude({ system, messages, maxTokens: 500, model: HAIKU, timeoutMs: 15000 })

  const parseFeedback = (text) => {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    try { return JSON.parse(match[0]) } catch { return null }
  }

  let feedback = parseFeedback(raw)

  // Retry: JSON parse failed
  if (!feedback) {
    const retry = await callClaude({
      system,
      messages: [...messages, { role: 'assistant', content: raw }, { role: 'user', content: 'Respond with only the JSON object.' }],
      maxTokens: 500,
      model: HAIKU,
      timeoutMs: 15000,
    })
    feedback = parseFeedback(retry)
    if (!feedback) {
      return { score: 5, good: 'Answer received.', missing: 'Could not parse feedback.', ideal: '', correct_answer: '', topic: '', improvement_tip: '' }
    }
  }

  return feedback
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

// ── generateAllQuestions ──────────────────────────────────────────────────────
export async function generateAllQuestions({
  sector,
  role,
  interviewType,
  questionCount,
  resumeText,
  state,
  userProfile,
  previousQuestions = [],
}) {
  const prompt = buildSectorPrompt(
    sector, role, interviewType,
    state, state, { resumeText, ...userProfile },
    questionCount, previousQuestions
  )

  const system = `${prompt}

IMPORTANT TASK:
Generate exactly ${questionCount} interview questions for this candidate.

Return ONLY a valid JSON array. No other text. No markdown. Just JSON.

Format:
[
  {
    "id": 1,
    "question": "question text here",
    "topic": "topic name",
    "tip": "one line tip for answering"
  }
]

Rules:
- Never number the questions in the question text
- Each question covers a unique and different topic
- Based on official syllabus for the role
- Appropriate for ${role} role
- Never start any question with "Question X of Y:" or "Q1:" or any prefix`

  const raw = await callClaude({
    system,
    messages: [{ role: 'user', content: 'Generate the interview questions now.' }],
    maxTokens: 4000,
    model: HAIKU,
  })

  try {
    const cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const questions = JSON.parse(cleaned)

    if (!Array.isArray(questions)) throw new Error('Not an array')

    return questions.slice(0, questionCount)
  } catch (err) {
    console.error('generateAllQuestions parse error:', err)
    console.error('Raw text:', raw)
    throw new Error('Failed to generate questions')
  }
}
