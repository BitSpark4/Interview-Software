/**
 * Question Bank Generation Script
 * Run locally — NEVER affects production app.
 *
 * Usage:
 *   node scripts/generateQuestionBank.js --sector it --stack React --count 100
 *
 * Arguments:
 *   --sector   it | government | banking | engineering | medical | students | business
 *   --stack    Technology or topic name (e.g. React, Angular, History, Polity)
 *   --count    Number of questions to generate (default: 100)
 *
 * Requirements:
 *   npm install dotenv @supabase/supabase-js  (if not already installed)
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)

const path = require('path')

// Load from multiple possible env files
const envFiles = [
  '.env.local',
  '.env',
  '.env.development',
  '.env.development.local'
]

envFiles.forEach(file => {
  require('dotenv').config({
    path: path.resolve(process.cwd(), file),
    override: false
  })
})

// Also check for VITE prefixed versions
const API_KEY =
  process.env.CLAUDE_API_KEY ||
  process.env.ANTHROPIC_API_KEY ||
  process.env.VITE_CLAUDE_API_KEY ||
  process.env.CLAUDE_API_KEY_LOCAL

if (!API_KEY) {
  console.log('\n=== DEBUG: Available env vars ===')
  Object.keys(process.env)
    .filter(k => k.includes('CLAUDE') ||
                 k.includes('ANTHROPIC') ||
                 k.includes('API'))
    .forEach(k => console.log(k, '=',
      process.env[k]?.slice(0,10) + '...'))
  console.log('================================\n')
  console.error('ERROR: No API key found')
  process.exit(1)
}

console.log('API key found:', API_KEY.slice(0,15) + '...')

import { createClient } from '@supabase/supabase-js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Parse CLI args ────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2)
  const get  = (flag) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : null
  }
  return {
    sector: get('--sector') || 'it',
    stack:  get('--stack')  || 'React',
    count:  parseInt(get('--count') || '100', 10),
  }
}

// ── Sector → DB sector mapping ────────────────────────────────────────────────
const SECTOR_MAP = {
  it: 'it_tech', government: 'government', banking: 'banking',
  engineering: 'engineering', medical: 'medical', students: 'students', business: 'business',
}

// ── Build generation prompt ───────────────────────────────────────────────────
function buildPrompt(sector, stack, batchCount) {
  const sectorContexts = {
    it:          `You are a senior software engineering interviewer at a top Indian tech company.`,
    government:  `You are an experienced UPSC/MPSC exam coach in India.`,
    banking:     `You are an IBPS/SBI banking exam preparation expert.`,
    engineering: `You are a technical interviewer for core engineering and PSU roles.`,
    medical:     `You are a medical professor and NEET PG preparation expert.`,
    students:    `You are an exam coach for Indian student entrance exams and campus placements.`,
    business:    `You are a CAT/MBA interview preparation coach.`,
  }

  return `${sectorContexts[sector] || sectorContexts.it}

Generate exactly ${batchCount} unique interview questions about: ${stack}

Return ONLY a valid JSON array. No preamble. No explanation. No markdown code blocks. Just the raw JSON array.

Each item must follow this exact structure:
[
  {
    "question_text": "The interview question text here — do NOT include any numbering prefix",
    "correct_answer": "A comprehensive correct answer in 3-5 sentences covering all key points",
    "key_points": ["key point 1", "key point 2", "key point 3"],
    "tip": "One specific actionable tip for answering this question well",
    "difficulty": "medium",
    "topic": "Specific topic name within ${stack}"
  }
]

Rules:
- difficulty must be exactly: easy, medium, or hard
- All ${batchCount} questions must be unique — no repetition of concepts
- Questions must be at interview difficulty (not textbook definitions)
- key_points must have 3-5 strings
- Cite official sources or industry standards where applicable
- Focus on practical, real-world application of ${stack}
- Mix difficulties: ~20% easy, ~50% medium, ~30% hard`
}

// ── Call Claude Sonnet API directly ──────────────────────────────────────────
async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Claude API error ${res.status}: ${err?.error?.message || 'unknown'}`)
  }

  const data = await res.json()
  return data.content[0].text
}

// ── Parse JSON array from Claude response ─────────────────────────────────────
function parseQuestions(raw) {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
  const match   = cleaned.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('No JSON array found in response')
  return JSON.parse(match[0])
}

// ── Insert questions to Supabase ──────────────────────────────────────────────
async function insertQuestions(supabase, questions, sector, stack) {
  const rows = questions.map(q => ({
    sector,
    sub_sector:    stack,
    stack_tags:    [stack],
    question_text: q.question_text,
    correct_answer:q.correct_answer,
    key_points:    q.key_points || [],
    tip:           q.tip || '',
    difficulty:    ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : 'medium',
    topic:         q.topic || stack,
    source:        'ai_generated',
    is_active:     true,
    verified:      false,
  }))

  const { data, error } = await supabase
    .from('question_bank')
    .insert(rows)
    .select('id')

  if (error) throw new Error(`Supabase insert error: ${error.message}`)
  return (data || []).length
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const { sector, stack, count } = parseArgs()

  if (!process.env.CLAUDE_API_KEY) {
    console.error('ERROR: CLAUDE_API_KEY not set in .env.local')
    process.exit(1)
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('ERROR: VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY not set in .env.local')
    process.exit(1)
  }

  const dbSector = SECTOR_MAP[sector] || sector
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

  console.log(`\nGenerating ${count} questions | Sector: ${sector} | Stack: ${stack}\n`)

  const BATCH_SIZE = 25
  const batches = Math.ceil(count / BATCH_SIZE)
  const allGenerated = []
  let totalInserted = 0

  for (let b = 0; b < batches; b++) {
    const batchCount = Math.min(BATCH_SIZE, count - b * BATCH_SIZE)
    console.log(`Batch ${b + 1}/${batches} — generating ${batchCount} questions...`)

    let questions = null
    let retries = 0
    while (retries < 3) {
      try {
        const raw = await callClaude(buildPrompt(sector, stack, batchCount))
        questions  = parseQuestions(raw)
        if (!Array.isArray(questions)) throw new Error('Response is not an array')
        break
      } catch (err) {
        retries++
        console.warn(`  Retry ${retries}/3: ${err.message}`)
        if (retries === 3) throw err
        await new Promise(r => setTimeout(r, 2000 * retries))
      }
    }

    allGenerated.push(...questions)

    try {
      const inserted = await insertQuestions(supabase, questions, dbSector, stack)
      totalInserted += inserted
      console.log(`  [${totalInserted}/${count}] inserted to Supabase`)
    } catch (err) {
      console.error(`  Insert failed: ${err.message}`)
    }

    // Rate limit delay between batches
    if (b < batches - 1) await new Promise(r => setTimeout(r, 1500))
  }

  // Save local backup JSON
  const backupDir = join(__dirname, 'backups')
  if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })
  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = join(backupDir, `${sector}_${stack.replace(/\s+/g,'_')}_${timestamp}.json`)
  writeFileSync(backupFile, JSON.stringify(allGenerated, null, 2))

  console.log(`\nDone! ${totalInserted}/${count} questions inserted.`)
  console.log(`Backup saved: ${backupFile}\n`)
}

main().catch(err => {
  console.error('Script failed:', err.message)
  process.exit(1)
})
