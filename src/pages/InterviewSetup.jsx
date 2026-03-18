import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useResume } from '../hooks/useResume'
import { useInterview } from '../hooks/useInterview'
import { supabase } from '../lib/supabase'
import { checkRateLimit } from '../lib/rateLimiter'

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTORS = [
  { id: 'it-tech',      icon: '💻', title: 'IT & Tech',    subtitle: 'Software, cloud & digital careers' },
  { id: 'government',   icon: '🏛️', title: 'Government',   subtitle: 'UPSC, SSC, PSU & civil services' },
  { id: 'banking',      icon: '🏦', title: 'Banking',      subtitle: 'IBPS, SBI, RBI & finance roles' },
  { id: 'engineering',  icon: '⚙️', title: 'Engineering',  subtitle: 'Core engineering & manufacturing' },
  { id: 'medical',      icon: '🏥', title: 'Medical',      subtitle: 'Healthcare, nursing & medical exams' },
  { id: 'students',     icon: '🎓', title: 'Students',     subtitle: 'Fresher, campus & entry-level' },
  { id: 'business',     icon: '📈', title: 'Business',     subtitle: 'MBA, consulting & management' },
]

const ROLES_BY_SECTOR = {
  'it-tech': [
    { id: 'frontend',  icon: '🎨', label: 'Frontend Developer',    sub: 'React, Vue, HTML/CSS' },
    { id: 'backend',   icon: '⚙️', label: 'Backend Developer',     sub: 'Node, Python, Java' },
    { id: 'fullstack', icon: '🔗', label: 'Full Stack Developer',  sub: 'End-to-end web development' },
    { id: 'data',      icon: '📊', label: 'Data Engineer',         sub: 'SQL, pipelines, analytics' },
    { id: 'pm',        icon: '📋', label: 'Product Manager',       sub: 'Roadmap, stakeholders, metrics' },
    { id: 'hr',        icon: '👥', label: 'HR & People',           sub: 'Talent, culture, operations' },
  ],
  'government': [
    { id: 'upsc',     icon: '🏛️', label: 'UPSC Civil Services', sub: 'IAS, IPS, IFS & allied' },
    { id: 'mpsc',     icon: '📜', label: 'MPSC Maharashtra',     sub: 'State civil services' },
    { id: 'ssc',      icon: '📝', label: 'SSC CGL',              sub: 'Staff Selection Commission' },
    { id: 'railway',  icon: '🚂', label: 'Railway RRB NTPC',     sub: 'Non-technical popular categories' },
    { id: 'defence',  icon: '🪖', label: 'Defence NDA / CDS',    sub: 'Army, Navy, Air Force entry' },
    { id: 'teaching', icon: '📚', label: 'Teaching TET / CTET',  sub: 'Teacher eligibility tests' },
  ],
  'banking': [
    { id: 'ibps-po',    icon: '🏦', label: 'IBPS PO',      sub: 'Probationary Officer' },
    { id: 'ibps-clerk', icon: '📋', label: 'IBPS Clerk',   sub: 'Clerical cadre' },
    { id: 'sbi-po',     icon: '💼', label: 'SBI PO',       sub: 'State Bank Probationary Officer' },
    { id: 'sbi-clerk',  icon: '📝', label: 'SBI Clerk',    sub: 'Junior Associates' },
    { id: 'rbi',        icon: '🏛️', label: 'RBI Grade B',  sub: 'Reserve Bank of India' },
    { id: 'insurance',  icon: '🛡️', label: 'Insurance / LIC', sub: 'LIC ADO, AAO & agents' },
  ],
  'engineering': [
    { id: 'mechanical',  icon: '🔩', label: 'Mechanical Engineering',  sub: 'Manufacturing, design, thermal' },
    { id: 'civil',       icon: '🏗️', label: 'Civil Engineering',       sub: 'Structures, infrastructure' },
    { id: 'electrical',  icon: '⚡', label: 'Electrical Engineering',   sub: 'Power, circuits, systems' },
    { id: 'electronics', icon: '🔌', label: 'Electronics Engineering',  sub: 'Embedded, VLSI, IoT' },
    { id: 'chemical',    icon: '🧪', label: 'Chemical Engineering',     sub: 'Process, refinery, pharma' },
    { id: 'gate',        icon: '📐', label: 'GATE Preparation',         sub: 'Graduate Aptitude Test in Eng.' },
  ],
  'medical': [
    { id: 'neet-pg',     icon: '🏥', label: 'NEET PG',              sub: 'Postgraduate medical entrance' },
    { id: 'mbbs',        icon: '🩺', label: 'MBBS Clinical',         sub: 'Residency & hospital interviews' },
    { id: 'nursing',     icon: '💉', label: 'Nursing Entrance',      sub: 'B.Sc Nursing & staff nurse' },
    { id: 'pharmacy',    icon: '💊', label: 'Pharmacy',              sub: 'D.Pharm, B.Pharm & clinical' },
    { id: 'paramedical', icon: '🩹', label: 'Paramedical',           sub: 'Lab tech, radiology, physio' },
  ],
  'students': [
    { id: 'cet',       icon: '📝', label: 'CET Maharashtra',      sub: 'MHT-CET engineering & pharmacy' },
    { id: 'jee',       icon: '🔬', label: 'JEE Mains Prep',       sub: 'Engineering entrance' },
    { id: '12th-viva', icon: '📚', label: '12th Standard Viva',   sub: 'Board practical examinations' },
    { id: 'first-job', icon: '💼', label: 'First Job Interview',  sub: 'Entry-level & internships' },
    { id: 'campus',    icon: '🎯', label: 'Campus Placement',     sub: 'On-campus recruitment drives' },
  ],
  'business': [
    { id: 'cat',        icon: '📊', label: 'CAT Preparation',         sub: 'Common Admission Test for MBA' },
    { id: 'iim',        icon: '🎓', label: 'IIM MBA Interview',        sub: 'Personal interview & WAT' },
    { id: 'gd',         icon: '💬', label: 'Group Discussion',         sub: 'GD practice & strategies' },
    { id: 'sales',      icon: '📈', label: 'Sales Interview',          sub: 'B2B, B2C & inside sales' },
    { id: 'operations', icon: '🔄', label: 'Operations Interview',     sub: 'Supply chain & process mgmt' },
  ],
}

const EDUCATION_LEVELS = [
  { id: '10th',    icon: '📘', label: '10th Standard',      sub: 'Secondary school' },
  { id: '12th',    icon: '📗', label: '12th Standard',      sub: 'Higher secondary' },
  { id: 'diploma', icon: '📜', label: 'Diploma',            sub: '3-year polytechnic' },
  { id: 'eng-grad',icon: '⚙️', label: 'Engineering Graduate', sub: 'B.E / B.Tech' },
  { id: 'grad',    icon: '🏫', label: 'Other Graduate',     sub: 'B.A / B.Com / B.Sc' },
  { id: 'pg',      icon: '🎓', label: 'Post Graduate',      sub: 'M.A / M.Sc / MBA' },
]

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli',
  'Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep',
  'Puducherry',
]

// Sectors that show a state-selection step after role pick
const STATE_SECTORS = new Set(['government', 'banking', 'engineering'])

const INTERVIEW_TYPES_BY_SECTOR = {
  'it-tech': [
    { id: 'technical',  icon: '💻', label: 'Technical',   sub: 'Algorithms, system design, code' },
    { id: 'behavioral', icon: '🌟', label: 'Behavioral',  sub: 'STAR method, past experience' },
    { id: 'hr',         icon: '👥', label: 'HR Round',    sub: 'Salary, culture, career goals' },
    { id: 'mixed',      icon: '🔀', label: 'Mixed',       sub: 'All types — like a real interview', recommended: true },
  ],
  'government': [
    { id: 'gk',              icon: '🌍', label: 'GK Round',         sub: 'History, Geography, Polity' },
    { id: 'current_affairs', icon: '📰', label: 'Current Affairs',  sub: 'News, events, schemes' },
    { id: 'essay_writing',   icon: '✍️', label: 'Essay Writing',    sub: 'Descriptive answer practice' },
    { id: 'mock_test',       icon: '🎯', label: 'Full Mock Test',   sub: 'Complete exam simulation', recommended: true },
  ],
  'banking': [
    { id: 'banking_awareness', icon: '🏦', label: 'Banking Awareness',     sub: 'RBI, schemes, banking concepts' },
    { id: 'numerical',         icon: '🔢', label: 'Numerical Reasoning',   sub: 'Quant, DI, logical reasoning' },
    { id: 'english',           icon: '📝', label: 'English Round',         sub: 'Grammar, comprehension, vocab' },
    { id: 'mock_test',         icon: '🎯', label: 'Full Mock Test',        sub: 'Complete exam simulation', recommended: true },
  ],
  'engineering': [
    { id: 'core_technical', icon: '⚙️', label: 'Core Technical',  sub: 'Fundamentals & numericals' },
    { id: 'hr_behavioral',  icon: '🌟', label: 'HR Behavioral',   sub: 'Teamwork, leadership, goals' },
    { id: 'aptitude',       icon: '🧠', label: 'Aptitude Round',  sub: 'Quant, reasoning, verbal' },
    { id: 'mock_test',      icon: '🎯', label: 'Full Mock Test',  sub: 'Complete interview simulation', recommended: true },
  ],
  'medical': [
    { id: 'clinical_case',     icon: '🩺', label: 'Clinical Case',     sub: 'Diagnosis, management plans' },
    { id: 'subject_knowledge', icon: '📚', label: 'Subject Knowledge', sub: 'Pharma, anatomy, medicine' },
    { id: 'viva_voce',         icon: '🎤', label: 'Viva Practice',     sub: 'Oral examination style' },
    { id: 'mock_test',         icon: '🎯', label: 'Full Mock Test',    sub: 'Complete exam simulation', recommended: true },
  ],
  'students': [
    { id: 'subject_knowledge',  icon: '📚', label: 'Subject Knowledge',    sub: 'Topic-wise concept questions' },
    { id: 'aptitude_reasoning', icon: '🧠', label: 'Aptitude Reasoning',   sub: 'Quant, logical & verbal' },
    { id: 'hr_personality',     icon: '🌟', label: 'HR & Personality',     sub: 'Intro, strengths, goals' },
    { id: 'mock_test',          icon: '🎯', label: 'Full Mock Test',       sub: 'Complete exam simulation', recommended: true },
  ],
  'business': [
    { id: 'case_study',       icon: '📊', label: 'Case Study',       sub: 'Business problem analysis' },
    { id: 'hr_leadership',    icon: '🌟', label: 'HR Leadership',    sub: 'STAR, leadership examples' },
    { id: 'group_discussion', icon: '💬', label: 'Group Discussion', sub: 'Opinion, debate, communication' },
    { id: 'mock_test',        icon: '🎯', label: 'Full Mock Test',   sub: 'Complete interview simulation', recommended: true },
  ],
}

const EXPERIENCE_OPTIONS = [
  { id: 'fresher', icon: '🎒', label: 'Fresher',      sub: 'No work experience yet' },
  { id: '1-2',     icon: '💼', label: '1–2 Years',    sub: 'Early career professional' },
  { id: '3-5',     icon: '📈', label: '3–5 Years',    sub: 'Mid-level professional' },
  { id: '5plus',   icon: '🏆', label: '5+ Years',     sub: 'Senior professional' },
]

// ─── Card Grid (shared inside this file) ────────────────────────────────────

function CardGrid({ items, selected, onSelect, cols = 2 }) {
  const colClass = cols === 3 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'
  return (
    <div className={`grid ${colClass} gap-3`}>
      {items.map((item) => {
        const isSelected = selected === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`relative flex flex-col items-center text-center gap-2 p-4 rounded-xl border transition-all ${
              isSelected
                ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_0_1px_#22c55e33]'
                : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/60'
            }`}
          >
            {item.recommended && (
              <span className="absolute top-2 right-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-mono leading-none">
                Recommended
              </span>
            )}
            <span className="text-2xl leading-none">{item.icon}</span>
            <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-white' : 'text-gray-200'}`}>
              {item.label ?? item.title}
            </span>
            {(item.sub ?? item.subtitle) && (
              <span className="text-xs text-gray-500 leading-snug">
                {item.sub ?? item.subtitle}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function InterviewSetup() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const { createSession } = useInterview()
  const { resumeText, savedResume, uploading, processResume } = useResume(userProfile?.plan)

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleStart() {
    const rl = checkRateLimit(user?.id || 'anon', 'interview_start')
    if (!rl.allowed) { setError(rl.message); return }
    setLoading(true); setError('')
    try {
      const DB_SECTOR = { 'it-tech':'it_tech','government':'government','banking':'banking','engineering':'engineering','medical':'medical','students':'students','business':'business' }
      const EDU_DB    = { '10th':'high_school','12th':'high_school','diploma':'diploma','eng-grad':'graduate','grad':'graduate','pg':'post_graduate' }
      const dbSector     = DB_SECTOR[sector] || sector
      const companyFocus = STATE_SECTORS.has(sector) ? state : 'general'
      const studentProfile = sector === 'students'
        ? { education_level: EDU_DB[education] || 'graduate', target_exam: role }
        : null

      if (user?.id) {
        await supabase.from('users').update({
          state: state.toLowerCase(),
          ...(education && { education_level: EDU_DB[education] || 'graduate' }),
          ...(sector !== 'it-tech' && role && { target_exam: role }),
        }).eq('id', user.id)
      }

      const totalQuestions = questionCount
      const sessionId = await createSession(
        role, interviewType, companyFocus, resumeText || '',
        dbSector, interviewType, state.toLowerCase(), studentProfile, totalQuestions
      )
      navigate(`/interview/session?id=${sessionId}`)
    } catch (err) {
      setError(err.message || 'Could not start interview. Please try again.')
      setLoading(false)
    }
  }

  const [step, setStep]               = useState('sector')  // sector|role|state|education|type|profile|review
  const [sector, setSector]           = useState('')
  const [role, setRole]               = useState('')
  const [state, setState]             = useState('Maharashtra')
  const [education, setEducation]     = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [experience, setExperience]   = useState('')
  const [showUpload, setShowUpload]   = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [questionCount, setQuestionCount] = useState(10)

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeError('')
    if (file.type !== 'application/pdf') { setResumeError('PDF files only.'); return }
    if (file.size > 5 * 1024 * 1024) { setResumeError('File must be under 5MB.'); return }
    try { await processResume(file) } catch { /* error handled inside useResume */ }
  }

  // ── Navigation helpers ──────────────────────────────────────────────────

  function handleSectorContinue() {
    setRole('')
    setStep('role')
  }

  function handleRoleContinue() {
    if (STATE_SECTORS.has(sector)) {
      setStep('state')
    } else if (sector === 'students') {
      setStep('education')
    } else {
      setInterviewType('')
      setStep('type')
    }
  }

  function handleBack() {
    if (step === 'role') {
      setSector('')
      setStep('sector')
    } else if (step === 'state') {
      setState('Maharashtra')
      setStep('role')
    } else if (step === 'education') {
      setEducation('')
      setStep('role')
    } else if (step === 'type') {
      setInterviewType('')
      if (STATE_SECTORS.has(sector)) setStep('state')
      else if (sector === 'students') setStep('education')
      else setStep('role')
    } else if (step === 'profile') {
      setStep('type')
    }
  }

  // ── Step: sector ───────────────────────────────────────────────────────

  if (step === 'sector') {
    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-2xl">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <p className="text-gray-500 text-sm mb-6">Takes 30 seconds</p>

          <p className="text-gray-300 text-sm font-medium mb-4">Which sector are you preparing for?</p>
          <CardGrid items={SECTORS} selected={sector} onSelect={setSector} cols={3} />

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSectorContinue}
              disabled={!sector}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
            >
              Continue →
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Step: role ─────────────────────────────────────────────────────────

  if (step === 'role') {
    const sectorLabel = SECTORS.find(s => s.id === sector)?.title ?? ''
    const roles = ROLES_BY_SECTOR[sector] ?? []

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-2xl">
          <button
            type="button"
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back
          </button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
              {sectorLabel}
            </span>
          </div>

          <p className="text-gray-300 text-sm font-medium mb-4">Which role or exam are you targeting?</p>
          <CardGrid items={roles} selected={role} onSelect={setRole} cols={2} />

          <div className="mt-8">
            <button
              type="button"
              onClick={handleRoleContinue}
              disabled={!role}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
            >
              Continue →
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Step: state (government / banking / engineering) ───────────────────

  if (step === 'state') {
    const roleLabel = ROLES_BY_SECTOR[sector]?.find(r => r.id === role)?.label ?? ''

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-2xl">
          <button
            type="button"
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back
          </button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
              {roleLabel}
            </span>
          </div>

          <p className="text-gray-300 text-sm font-medium mb-1">Which state are you preparing from?</p>
          <p className="text-gray-500 text-xs mb-4">
            Personalises location-specific questions, vacancies, and cut-offs
          </p>

          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
          >
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => { setInterviewType(''); setStep('type') }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
            >
              Continue →
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Step: education (students sector) ─────────────────────────────────

  if (step === 'education') {
    const roleLabel = ROLES_BY_SECTOR[sector]?.find(r => r.id === role)?.label ?? ''

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-2xl">
          <button
            type="button"
            onClick={handleBack}
            className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back
          </button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">
              {roleLabel}
            </span>
          </div>

          <p className="text-gray-300 text-sm font-medium mb-4">What is your education level?</p>
          <CardGrid items={EDUCATION_LEVELS} selected={education} onSelect={setEducation} cols={2} />

          <div className="mt-8">
            <button
              type="button"
              onClick={() => { setInterviewType(''); setStep('type') }}
              disabled={!education}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
            >
              Continue →
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Step: type ─────────────────────────────────────────────────────────

  if (step === 'type') {
    const sectorLabel = SECTORS.find(s => s.id === sector)?.title ?? ''
    const roleLabel   = ROLES_BY_SECTOR[sector]?.find(r => r.id === role)?.label ?? ''
    const types       = INTERVIEW_TYPES_BY_SECTOR[sector] ?? []

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-2xl">
          <button type="button" onClick={handleBack} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back
          </button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{sectorLabel}</span>
            <span className="text-gray-700 text-xs">›</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{roleLabel}</span>
          </div>

          <p className="text-gray-300 text-sm font-medium mb-4">Which type of round do you want to practice?</p>
          <CardGrid items={types} selected={interviewType} onSelect={setInterviewType} cols={2} />

          <div className="mt-8">
            <button
              type="button"
              onClick={() => setStep('profile')}
              disabled={!interviewType}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
            >
              Continue →
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Step: profile ──────────────────────────────────────────────────────

  if (step === 'profile') {
    const needsResume = sector === 'it-tech' || sector === 'medical'
    const eduLabel    = EDUCATION_LEVELS.find(e => e.id === education)?.label ?? education
    const sectorLabel = SECTORS.find(s => s.id === sector)?.title ?? ''
    const roleLabel   = ROLES_BY_SECTOR[sector]?.find(r => r.id === role)?.label ?? ''

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-2xl">
          <button type="button" onClick={handleBack} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{sectorLabel}</span>
            <span className="text-gray-700 text-xs">›</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{roleLabel}</span>
          </div>

          {/* IT Tech / Medical — Resume upload */}
          {needsResume && (
            <div>
              <p className="text-gray-300 text-sm font-medium mb-4">Your resume <span className="text-gray-600 font-normal">(optional)</span></p>
              {savedResume && !showUpload ? (
                <>
                  <div className="border border-emerald-500/40 bg-emerald-500/5 rounded-xl p-5 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">✅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-emerald-400 text-sm font-semibold">Resume ready</p>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{savedResume.filename}</p>
                      <button type="button" onClick={() => setShowUpload(true)} className="text-gray-600 hover:text-gray-400 text-xs mt-1 transition-colors underline underline-offset-2">Update resume</button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep('review')} className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue with saved resume →</button>
                </>
              ) : uploading ? (
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center gap-3">
                  <Spinner size={24} color="border-emerald-500" />
                  <p className="text-gray-400 text-sm">Reading resume…</p>
                </div>
              ) : resumeText ? (
                <>
                  <div className="border border-emerald-500/40 bg-emerald-500/5 rounded-xl p-5 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">✅</span>
                    <div>
                      <p className="text-emerald-400 text-sm font-semibold">Resume ready</p>
                      <p className="text-gray-500 text-xs mt-0.5">{resumeText.length} characters extracted</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep('review')} className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue →</button>
                </>
              ) : (
                <>
                  <label htmlFor="resume-upload" className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-xl p-8 cursor-pointer transition-colors">
                    <span className="text-3xl">📄</span>
                    <p className="text-gray-300 text-sm font-medium">Upload your resume PDF</p>
                    <p className="text-gray-600 text-xs">Max 5MB · PDF only</p>
                    <p className="text-gray-600 text-xs text-center">Questions will be tailored to your actual experience</p>
                    <input id="resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFileSelect} />
                  </label>
                  {resumeError && <p className="text-red-400 text-xs mt-2">{resumeError}</p>}
                  <button type="button" onClick={() => setStep('review')} className="w-full mt-4 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 py-3 rounded-lg text-sm transition-colors min-h-11">Skip — use generic questions</button>
                </>
              )}
            </div>
          )}

          {/* Government / Banking / Engineering — State confirm */}
          {STATE_SECTORS.has(sector) && (
            <div>
              <p className="text-gray-300 text-sm font-medium mb-4">Location confirmed</p>
              <div className="border border-gray-800 bg-gray-900 rounded-xl p-5 flex items-start gap-4">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="text-white text-sm font-semibold">Your state: {state}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">Interview will include {state}-specific questions, current affairs, and local exam patterns</p>
                </div>
              </div>
              <button type="button" onClick={() => setStep('review')} className="w-full mt-6 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue →</button>
            </div>
          )}

          {/* Students — Profile summary */}
          {sector === 'students' && (
            <div>
              <p className="text-gray-300 text-sm font-medium mb-4">🎓 Your profile</p>
              <div className="border border-gray-800 bg-gray-900 rounded-xl p-5 space-y-3">
                {[
                  { label: 'Education', value: eduLabel },
                  { label: 'Target exam', value: roleLabel },
                  { label: 'State', value: state },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">{row.label}</span>
                    <span className="text-white text-sm font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setStep('education')} className="text-gray-600 hover:text-gray-400 text-xs mt-3 transition-colors block">← Edit profile</button>
              <button type="button" onClick={() => setStep('review')} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue →</button>
            </div>
          )}

          {/* Business — Experience */}
          {sector === 'business' && (
            <div>
              <p className="text-gray-300 text-sm font-medium mb-1">Work experience</p>
              <p className="text-gray-500 text-xs mb-4">Optional — helps personalise case study difficulty</p>
              <CardGrid items={EXPERIENCE_OPTIONS} selected={experience} onSelect={(id) => { setExperience(id); setStep('review') }} cols={2} />
              <button type="button" onClick={() => { setExperience('fresher'); setStep('review') }} className="w-full mt-4 text-gray-600 hover:text-gray-400 text-sm transition-colors py-2">Skip →</button>
            </div>
          )}
        </div>
      </AppLayout>
    )
  }

  // ── Step: review ───────────────────────────────────────────────────────

  if (step === 'review') {
    const sectorLabel = SECTORS.find(s => s.id === sector)?.title ?? ''
    const roleLabel   = ROLES_BY_SECTOR[sector]?.find(r => r.id === role)?.label ?? ''
    const typeLabel   = INTERVIEW_TYPES_BY_SECTOR[sector]?.find(t => t.id === interviewType)?.label ?? ''
    const eduLabel    = EDUCATION_LEVELS.find(e => e.id === education)?.label ?? ''
    const isPro       = userProfile?.plan === 'pro'
    const Q_LABELS    = { 5: 'Quick practice', 10: 'Standard session', 15: 'Extended practice', 20: 'Deep preparation', 30: 'Full mock test' }
    const qLabel      = isPro ? `${questionCount} questions` : '10 questions (Free plan)'

    const rows = [
      { label: 'Sector',    value: sectorLabel },
      { label: 'Role',      value: roleLabel },
      STATE_SECTORS.has(sector) ? { label: 'State', value: state } : null,
      education ? { label: 'Education', value: eduLabel } : null,
      { label: 'Round',     value: typeLabel },
      { label: 'Questions', value: qLabel, color: isPro ? '#22C55E' : '#F59E0B' },
    ].filter(Boolean)

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-2xl">
          <button type="button" onClick={() => setStep('profile')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</button>
          <h1 className="font-bold text-white text-xl mt-4 mb-1">Ready to start?</h1>
          <p className="text-sm text-gray-400 mb-6">Review your interview setup</p>

          {/* Summary card */}
          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            {rows.map((row, i) => (
              <div key={row.label} className="flex items-center justify-between" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: i < rows.length - 1 ? '1px solid #1F2937' : 'none' }}>
                <span className="text-gray-400 text-sm">{row.label}</span>
                <span className="text-sm font-medium" style={{ color: row.color || '#F9FAFB' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Question count selector */}
          <div style={{ marginBottom: 24 }}>
            <p className="text-white text-sm font-semibold mb-0.5">How many questions?</p>
            <p className="text-gray-500 text-xs mb-3">Choose your session length</p>
            <div className="flex gap-2">
              {(isPro ? [5, 10, 15, 20, 30] : [5, 10]).map(n => (
                <button
                  key={n} type="button"
                  onClick={() => setQuestionCount(n)}
                  className="flex-1 font-bold text-sm transition-all"
                  style={{
                    height: 44, borderRadius: 8,
                    background: questionCount === n ? 'rgba(34,197,94,0.12)' : '#1F2937',
                    border: questionCount === n ? '2px solid #22C55E' : '1px solid #374151',
                    color: questionCount === n ? '#22C55E' : '#9CA3AF',
                  }}
                  onMouseEnter={e => { if (questionCount !== n) { e.currentTarget.style.borderColor = '#4B5563'; e.currentTarget.style.color = '#F9FAFB' } }}
                  onMouseLeave={e => { if (questionCount !== n) { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9CA3AF' } }}
                >{n}</button>
              ))}
            </div>
            <p className="text-center mt-2" style={{ fontSize: 12, color: '#6B7280' }}>
              {questionCount} — {Q_LABELS[questionCount]}
              {!isPro && <>{' · '}<Link to="/upgrade" style={{ color: '#F59E0B' }}>Upgrade for up to 30 →</Link></>}
            </p>
          </div>

          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

          {/* Start Interview button */}
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
            style={{ height: 52, background: loading ? '#374151' : '#22C55E', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#16A34A' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? '#374151' : '#22C55E' }}
          >
            {loading ? (
              <><Spinner size={18} color="border-white" /><span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Setting up your interview…</span></>
            ) : (
              <><Play size={18} color="#000" fill="#000" /><span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>Start Interview</span></>
            )}
          </button>

          <button type="button" onClick={() => setStep('profile')} className="block w-full text-center text-gray-500 hover:text-gray-300 text-sm transition-colors mt-3">
            Change something
          </button>
        </div>
      </AppLayout>
    )
  }

  return null
}
