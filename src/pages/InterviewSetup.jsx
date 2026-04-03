import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlayCircle, Warning,
  Desktop, Buildings, Bank, Wrench, Heartbeat, GraduationCap, Briefcase,
  Code, Terminal, ChartBar, ChartLineUp, ClipboardText, UserCircle,
  Globe, Shield, BookOpen, Lightning, Target, Brain, Microphone,
  Star, Trophy, Medal, Crown, Gear, Newspaper, Calculator,
  FirstAidKit, Pill, Scales, Flag,
} from '@phosphor-icons/react'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useResume } from '../hooks/useResume'
import { useInterview } from '../hooks/useInterview'
import { supabase } from '../lib/supabase'
import { checkRateLimit } from '../lib/rateLimiter'

// ─── Data ────────────────────────────────────────────────────────────────────

const SECTORS = [
  { id: 'it-tech',      icon: Desktop,       color: '#2563EB', title: 'IT & Tech',    subtitle: 'Software, cloud & digital careers' },
  { id: 'government',   icon: Buildings,     color: '#7C3AED', title: 'Government',   subtitle: 'UPSC, SSC, PSU & civil services' },
  { id: 'banking',      icon: Bank,          color: '#F59E0B', title: 'Banking',      subtitle: 'IBPS, SBI, RBI & finance roles' },
  { id: 'engineering',  icon: Wrench,        color: '#059669', title: 'Engineering',  subtitle: 'Core engineering & manufacturing' },
  { id: 'medical',      icon: Heartbeat,     color: '#DC2626', title: 'Medical',      subtitle: 'Healthcare, nursing & medical exams' },
  { id: 'students',     icon: GraduationCap, color: '#EA580C', title: 'Students',     subtitle: 'Fresher, campus & entry-level' },
  { id: 'business',     icon: Briefcase,     color: '#DB2777', title: 'Business',     subtitle: 'MBA, consulting & management' },
]

const ROLES_BY_SECTOR = {
  'it-tech': [
    { id: 'frontend',  icon: Code,         label: 'Frontend Developer',    sub: 'React, Vue, HTML/CSS' },
    { id: 'backend',   icon: Terminal,      label: 'Backend Developer',     sub: 'Node, Python, Java' },
    { id: 'fullstack', icon: Lightning,     label: 'Full Stack Developer',  sub: 'End-to-end web development' },
    { id: 'data',      icon: ChartLineUp,   label: 'Data Engineer',         sub: 'SQL, pipelines, analytics' },
    { id: 'pm',        icon: ClipboardText, label: 'Product Manager',       sub: 'Roadmap, stakeholders, metrics' },
    { id: 'hr',        icon: UserCircle,    label: 'HR & People',           sub: 'Talent, culture, operations' },
  ],
  'government': [
    { id: 'upsc',     icon: Scales,        label: 'UPSC Civil Services', sub: 'IAS, IPS, IFS & allied' },
    { id: 'mpsc',     icon: Flag,          label: 'MPSC Maharashtra',     sub: 'State civil services' },
    { id: 'ssc',      icon: ClipboardText, label: 'SSC CGL',              sub: 'Staff Selection Commission' },
    { id: 'railway',  icon: Globe,         label: 'Railway RRB NTPC',     sub: 'Non-technical popular categories' },
    { id: 'defence',  icon: Shield,        label: 'Defence NDA / CDS',    sub: 'Army, Navy, Air Force entry' },
    { id: 'teaching', icon: BookOpen,      label: 'Teaching TET / CTET',  sub: 'Teacher eligibility tests' },
  ],
  'banking': [
    { id: 'ibps-po',    icon: Bank,          label: 'IBPS PO',         sub: 'Probationary Officer' },
    { id: 'ibps-clerk', icon: ClipboardText, label: 'IBPS Clerk',      sub: 'Clerical cadre' },
    { id: 'sbi-po',     icon: Bank,          label: 'SBI PO',          sub: 'State Bank Probationary Officer' },
    { id: 'sbi-clerk',  icon: Medal,         label: 'SBI Clerk',       sub: 'Junior Associates' },
    { id: 'rbi',        icon: Buildings,     label: 'RBI Grade B',     sub: 'Reserve Bank of India' },
    { id: 'insurance',  icon: Shield,        label: 'Insurance / LIC', sub: 'LIC ADO, AAO & agents' },
  ],
  'engineering': [
    { id: 'mechanical',  icon: Wrench,    label: 'Mechanical Engineering',  sub: 'Manufacturing, design, thermal' },
    { id: 'civil',       icon: Buildings, label: 'Civil Engineering',       sub: 'Structures, infrastructure' },
    { id: 'electrical',  icon: Lightning, label: 'Electrical Engineering',   sub: 'Power, circuits, systems' },
    { id: 'electronics', icon: Gear,      label: 'Electronics Engineering',  sub: 'Embedded, VLSI, IoT' },
    { id: 'chemical',    icon: Brain,     label: 'Chemical Engineering',     sub: 'Process, refinery, pharma' },
    { id: 'gate',        icon: Target,    label: 'GATE Preparation',         sub: 'Graduate Aptitude Test in Eng.' },
  ],
  'medical': [
    { id: 'neet-pg',     icon: Heartbeat,    label: 'NEET PG',              sub: 'Postgraduate medical entrance' },
    { id: 'mbbs',        icon: FirstAidKit,  label: 'MBBS Clinical',         sub: 'Residency & hospital interviews' },
    { id: 'nursing',     icon: Heartbeat,    label: 'Nursing Entrance',      sub: 'B.Sc Nursing & staff nurse' },
    { id: 'pharmacy',    icon: Pill,         label: 'Pharmacy',              sub: 'D.Pharm, B.Pharm & clinical' },
    { id: 'paramedical', icon: Star,         label: 'Paramedical',           sub: 'Lab tech, radiology, physio' },
  ],
  'students': [
    { id: 'cet',       icon: Brain,        label: 'CET Maharashtra',      sub: 'MHT-CET engineering & pharmacy' },
    { id: 'jee',       icon: Calculator,   label: 'JEE Mains Prep',       sub: 'Engineering entrance' },
    { id: '12th-viva', icon: BookOpen,     label: '12th Standard Viva',   sub: 'Board practical examinations' },
    { id: 'first-job', icon: Briefcase,    label: 'First Job Interview',  sub: 'Entry-level & internships' },
    { id: 'campus',    icon: Target,       label: 'Campus Placement',     sub: 'On-campus recruitment drives' },
  ],
  'business': [
    { id: 'cat',        icon: ChartBar,     label: 'CAT Preparation',         sub: 'Common Admission Test for MBA' },
    { id: 'iim',        icon: GraduationCap,label: 'IIM MBA Interview',        sub: 'Personal interview & WAT' },
    { id: 'gd',         icon: Microphone,   label: 'Group Discussion',         sub: 'GD practice & strategies' },
    { id: 'sales',      icon: ChartLineUp,  label: 'Sales Interview',          sub: 'B2B, B2C & inside sales' },
    { id: 'operations', icon: Gear,         label: 'Operations Interview',     sub: 'Supply chain & process mgmt' },
  ],
}

const EDUCATION_LEVELS = [
  { id: '10th',    icon: BookOpen,      color: '#64748B', label: '10th Standard',       sub: 'Secondary school' },
  { id: '12th',    icon: BookOpen,      color: '#2563EB', label: '12th Standard',       sub: 'Higher secondary' },
  { id: 'diploma', icon: ClipboardText, color: '#059669', label: 'Diploma',             sub: '3-year polytechnic' },
  { id: 'eng-grad',icon: Gear,          color: '#2563EB', label: 'Engineering Graduate',sub: 'B.E / B.Tech' },
  { id: 'grad',    icon: GraduationCap, color: '#7C3AED', label: 'Other Graduate',      sub: 'B.A / B.Com / B.Sc' },
  { id: 'pg',      icon: Medal,         color: '#F59E0B', label: 'Post Graduate',       sub: 'M.A / M.Sc / MBA' },
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
    { id: 'technical',  icon: Code,       color: '#2563EB', label: 'Technical',   sub: 'Algorithms, system design, code' },
    { id: 'behavioral', icon: Star,       color: '#F59E0B', label: 'Behavioral',  sub: 'STAR method, past experience' },
    { id: 'hr',         icon: UserCircle, color: '#7C3AED', label: 'HR Round',    sub: 'Salary, culture, career goals' },
    { id: 'mixed',      icon: Lightning,  color: '#059669', label: 'Mixed',       sub: 'All types — like a real interview', recommended: true },
  ],
  'government': [
    { id: 'gk',              icon: Globe,        color: '#2563EB', label: 'GK Round',        sub: 'History, Geography, Polity' },
    { id: 'current_affairs', icon: Newspaper,    color: '#7C3AED', label: 'Current Affairs', sub: 'News, events, schemes' },
    { id: 'essay_writing',   icon: ClipboardText,color: '#059669', label: 'Essay Writing',   sub: 'Descriptive answer practice' },
    { id: 'mock_test',       icon: Target,       color: '#F59E0B', label: 'Full Mock Test',  sub: 'Complete exam simulation', recommended: true },
  ],
  'banking': [
    { id: 'banking_awareness', icon: Bank,       color: '#F59E0B', label: 'Banking Awareness',   sub: 'RBI, schemes, banking concepts' },
    { id: 'numerical',         icon: Calculator, color: '#2563EB', label: 'Numerical Reasoning', sub: 'Quant, DI, logical reasoning' },
    { id: 'english',           icon: BookOpen,   color: '#059669', label: 'English Round',       sub: 'Grammar, comprehension, vocab' },
    { id: 'mock_test',         icon: Target,     color: '#F59E0B', label: 'Full Mock Test',      sub: 'Complete exam simulation', recommended: true },
  ],
  'engineering': [
    { id: 'core_technical', icon: Gear,   color: '#059669', label: 'Core Technical', sub: 'Fundamentals & numericals' },
    { id: 'hr_behavioral',  icon: Star,   color: '#F59E0B', label: 'HR Behavioral',  sub: 'Teamwork, leadership, goals' },
    { id: 'aptitude',       icon: Brain,  color: '#7C3AED', label: 'Aptitude Round', sub: 'Quant, reasoning, verbal' },
    { id: 'mock_test',      icon: Target, color: '#2563EB', label: 'Full Mock Test', sub: 'Complete interview simulation', recommended: true },
  ],
  'medical': [
    { id: 'clinical_case',     icon: Heartbeat,  color: '#DC2626', label: 'Clinical Case',     sub: 'Diagnosis, management plans' },
    { id: 'subject_knowledge', icon: BookOpen,   color: '#2563EB', label: 'Subject Knowledge', sub: 'Pharma, anatomy, medicine' },
    { id: 'viva_voce',         icon: Microphone, color: '#7C3AED', label: 'Viva Practice',     sub: 'Oral examination style' },
    { id: 'mock_test',         icon: Target,     color: '#F59E0B', label: 'Full Mock Test',    sub: 'Complete exam simulation', recommended: true },
  ],
  'students': [
    { id: 'subject_knowledge',  icon: BookOpen,   color: '#2563EB', label: 'Subject Knowledge',  sub: 'Topic-wise concept questions' },
    { id: 'aptitude_reasoning', icon: Brain,      color: '#7C3AED', label: 'Aptitude Reasoning', sub: 'Quant, logical & verbal' },
    { id: 'hr_personality',     icon: Star,       color: '#F59E0B', label: 'HR & Personality',   sub: 'Intro, strengths, goals' },
    { id: 'mock_test',          icon: Target,     color: '#059669', label: 'Full Mock Test',      sub: 'Complete exam simulation', recommended: true },
  ],
  'business': [
    { id: 'case_study',       icon: ChartBar,   color: '#2563EB', label: 'Case Study',       sub: 'Business problem analysis' },
    { id: 'hr_leadership',    icon: Star,       color: '#F59E0B', label: 'HR Leadership',    sub: 'STAR, leadership examples' },
    { id: 'group_discussion', icon: Microphone, color: '#7C3AED', label: 'Group Discussion', sub: 'Opinion, debate, communication' },
    { id: 'mock_test',        icon: Target,     color: '#059669', label: 'Full Mock Test',   sub: 'Complete interview simulation', recommended: true },
  ],
}

const EXPERIENCE_OPTIONS = [
  { id: 'fresher', icon: GraduationCap, color: '#94A3B8', label: 'Fresher',   sub: 'No work experience yet' },
  { id: '1-2',     icon: Briefcase,     color: '#2563EB', label: '1–2 Years', sub: 'Early career professional' },
  { id: '3-5',     icon: ChartLineUp,   color: '#059669', label: '3–5 Years', sub: 'Mid-level professional' },
  { id: '5plus',   icon: Trophy,        color: '#F59E0B', label: '5+ Years',  sub: 'Senior professional' },
]

// ─── Sector ID maps (module-level so hooks can reference them) ───────────────
const TO_DB   = { 'it-tech':'it_tech','government':'government','banking':'banking','engineering':'engineering','medical':'medical','students':'students','business':'business' }
const FROM_DB = Object.fromEntries(Object.entries(TO_DB).map(([k,v]) => [v,k]))

// ─── Card Grid (shared inside this file) ────────────────────────────────────

function CardIcon({ icon, color, isSelected }) {
  // Phosphor icons are React.forwardRef objects (typeof === 'object'), not plain functions
  if (typeof icon !== 'string') {
    const Ic = icon
    return <Ic size={26} weight="duotone" color={isSelected ? (color || '#60A5FA') : '#64748B'} />
  }
  return <span className="text-2xl leading-none">{icon}</span>
}

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
                ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_0_1px_#2563eb33]'
                : 'border-gray-800 bg-gray-900 hover:border-gray-600 hover:bg-gray-800/60'
            }`}
          >
            {item.recommended && (
              <span className="absolute top-2 right-2 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-mono leading-none">
                Recommended
              </span>
            )}
            <CardIcon icon={item.icon} color={item.color} isSelected={isSelected} />
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
  const [pendingSector, setPendingSector] = useState('')
  const [role, setRole]               = useState('')
  const [state, setState]             = useState('Maharashtra')
  const [education, setEducation]     = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [experience, setExperience]   = useState('')
  const [showUpload, setShowUpload]   = useState(false)
  const [resumeError, setResumeError] = useState('')
  const [questionCount, setQuestionCount] = useState(5)
  const [showSwitchWarning, setShowSwitchWarning] = useState(false)
  const [savingGoalChange, setSavingGoalChange]   = useState(false)

  const primarySector   = userProfile?.primary_sector ?? ''       // DB format
  const primarySectorUI = FROM_DB[primarySector] ?? primarySector // UI format
  const primaryLabel    = SECTORS.find(s => s.id === primarySectorUI)?.title ?? primarySector
  const pendingLabel    = SECTORS.find(s => s.id === pendingSector)?.title ?? pendingSector
  const isPro           = userProfile?.plan === 'pro'

  // Set question count default based on plan
  useEffect(() => {
    setQuestionCount(isPro ? 10 : 5)
  }, [isPro])

  // Auto-select career goal sector and skip straight to role step on first load
  useEffect(() => {
    if (!userProfile?.primary_sector) return
    const uiSector = FROM_DB[userProfile.primary_sector] ?? userProfile.primary_sector
    if (!uiSector) return
    setSector(uiSector)
    setStep('role')
  }, [userProfile?.primary_sector])

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setResumeError('')
    if (file.type !== 'application/pdf') { setResumeError('PDF files only.'); return }
    if (file.size > 5 * 1024 * 1024) { setResumeError('File must be under 5MB.'); return }
    try { await processResume(file) } catch { /* error handled inside useResume */ }
  }

  // ── Navigation helpers ──────────────────────────────────────────────────

  // Intercept sector card clicks — show modal if user picks a different sector than goal
  function handleSectorSelect(id) {
    if (primarySector && TO_DB[id] !== primarySector) {
      setPendingSector(id)
      setShowSwitchWarning(true)
      return
    }
    setSector(id)
  }

  function handleSectorContinue() {
    setRole('')
    setStep('role')
  }

  // Modal: stay on primary goal
  function handleStayPrimary() {
    setShowSwitchWarning(false)
    setPendingSector('')
  }

  // Modal: try pending sector this session only (no DB write)
  function handleTryThisSession() {
    setSector(pendingSector)
    setPendingSector('')
    setShowSwitchWarning(false)
    setRole('')
    setStep('role')
  }

  // Modal: permanently change career goal in DB
  async function handleChangePrimary() {
    if (!user) return
    setSavingGoalChange(true)
    await supabase.from('users').update({
      primary_sector:     TO_DB[pendingSector],
      career_goal:        pendingLabel,
      last_active_sector: TO_DB[pendingSector],
    }).eq('id', user.id)
    setSavingGoalChange(false)
    setSector(pendingSector)
    setPendingSector('')
    setShowSwitchWarning(false)
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
        <div className="p-4 md:p-8 max-w-6xl">
          <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
            ← Back to Dashboard
          </Link>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <p className="text-gray-500 text-sm mb-6">Takes 30 seconds</p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left — sector grid */}
            <div className="lg:col-span-7">
              <p className="text-gray-300 text-sm font-medium mb-4">Which sector are you preparing for?</p>
              <CardGrid items={SECTORS} selected={sector} onSelect={handleSectorSelect} cols={3} />
              {primarySector ? (
                <p className="text-xs text-gray-500 mt-3">
                  Your career goal: <span className="text-gray-400 font-medium">{primaryLabel}</span>
                  {' '}· Click another sector to change goal
                </p>
              ) : sector ? (
                <p className="text-xs text-gray-500 mt-3">This will become your career goal</p>
              ) : null}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleSectorContinue}
                  disabled={!sector}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
                >
                  Continue →
                </button>
              </div>
            </div>

            {/* Right — why practice matters */}
            <div className="hidden lg:block lg:col-span-5 space-y-4">
              <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 16 }}>Why practice matters</p>
                <div className="space-y-3">
                  {[
                    { stat: '10M+',  label: 'exam aspirants in India compete each year' },
                    { stat: '3%',    label: 'pass rate in competitive exams like UPSC' },
                    { stat: '3×',    label: 'more likely to succeed with mock practice' },
                  ].map(({ stat, label }) => (
                    <div key={stat} style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.12)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: '#2563EB', flexShrink: 0, minWidth: 48 }}>{stat}</span>
                      <span style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.4 }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 20 }}>
                <p style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 12 }}>
                  "I cleared IBPS PO after practicing here for 3 weeks. The questions were exactly what came in the real exam."
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>R</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', margin: 0 }}>Rahul S.</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>IBPS PO 2025</p>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#F59E0B' }}>★★★★★</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Step: role ─────────────────────────────────────────────────────────

  if (step === 'role') {
    const sectorLabel = SECTORS.find(s => s.id === sector)?.title ?? ''
    const roles = ROLES_BY_SECTOR[sector] ?? []

    const SECTOR_TIPS = {
      'it-tech':     { headline: 'Frontend roles are most hired in India', facts: ['Top hiring companies: TCS, Wipro, Infosys, Startups', 'React & Node.js skills command 30% salary premium', 'Freshers placed avg ₹4–8 LPA in campus drives'] },
      'government':  { headline: 'UPSC has 1.2M aspirants yearly', facts: ['Only ~1000 make it to final selection', 'Start with GS Paper 1 — History & Geography basics', 'Consistent daily practice is the #1 success factor'] },
      'banking':     { headline: 'IBPS conducts 5000+ vacancies per year', facts: ['IBPS PO is the most sought-after banking exam', 'Numerical reasoning is where most marks are lost', 'Mock tests improve speed and accuracy significantly'] },
      'engineering': { headline: 'GATE 2025 had 9 lakh+ registrations', facts: ['Core branch questions test conceptual fundamentals', 'PSU recruitment depends heavily on GATE score', 'Practice numerical problems daily for best results'] },
      'medical':     { headline: 'NEET PG has 2 lakh+ doctors appearing', facts: ['Clinical case approach separates toppers from others', 'High-yield topics: Pharma, Pathology, Medicine', 'Practice with real clinical case scenarios daily'] },
      'students':    { headline: 'First impression matters in campus placements', facts: ['Communication skills determine 60% of selection', 'Resume shortlisting happens in under 30 seconds', 'Practice with sector-specific questions for confidence'] },
      'business':    { headline: 'CAT has 3 lakh+ aspirants competing for IIM seats', facts: ['GD performance is often the deciding factor', 'Case studies require structured MECE thinking', 'IIM interviews focus on academics + self-awareness'] },
    }
    const tip = SECTOR_TIPS[sector] ?? { headline: 'Practice makes perfect', facts: ['Mock interviews build confidence', 'AI feedback identifies blind spots', 'Track your improvement over time'] }

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-6xl">
          <button type="button" onClick={handleBack} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{sectorLabel}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left — role cards */}
            <div className="lg:col-span-7">
              <p className="text-gray-300 text-sm font-medium mb-4">Which role or exam are you targeting?</p>
              <CardGrid items={roles} selected={role} onSelect={setRole} cols={2} />
              <div className="mt-8">
                <button type="button" onClick={handleRoleContinue} disabled={!role}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11">
                  Continue →
                </button>
              </div>
            </div>

            {/* Right — sector tip panel */}
            <div className="hidden lg:block lg:col-span-5">
              <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Did you know?</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 20, lineHeight: 1.4 }}>{tip.headline}</p>
                <div className="space-y-3">
                  {tip.facts.map((f, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span style={{ color: '#2563EB', fontSize: 14, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>{f}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
            className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="mt-8">
            <button
              type="button"
              onClick={() => { setInterviewType(''); setStep('type') }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
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
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
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

    const TYPE_DETAILS = [
      { id: 'technical',         emoji: '💻', title: 'Technical Round',    desc: 'Algorithms, system design, coding concepts, and domain-specific technical questions.' },
      { id: 'behavioral',        emoji: '🌟', title: 'Behavioral Round',   desc: 'STAR method questions on past experiences, leadership, teamwork, and problem solving.' },
      { id: 'hr',                emoji: '👥', title: 'HR Round',           desc: 'Salary negotiation, culture fit, career goals, strengths and weaknesses.' },
      { id: 'mixed',             emoji: '🔀', title: 'Mixed Round',        desc: 'Complete real interview simulation covering all question types in one session.' },
      { id: 'gk',                emoji: '🌍', title: 'GK Round',           desc: 'History, Geography, Polity, Economy and Science questions.' },
      { id: 'current_affairs',   emoji: '📰', title: 'Current Affairs',    desc: 'Latest government schemes, international events, and policy changes.' },
      { id: 'mock_test',         emoji: '🎯', title: 'Full Mock Test',     desc: 'Complete exam simulation covering all topics and question types.' },
      { id: 'banking_awareness', emoji: '🏦', title: 'Banking Awareness',  desc: 'RBI policies, banking terms, NBFC types, accounts and recent monetary decisions.' },
      { id: 'numerical',         emoji: '🔢', title: 'Numerical Reasoning',desc: 'Quantitative aptitude, data interpretation and logical reasoning.' },
      { id: 'core_technical',    emoji: '⚙️', title: 'Core Technical',    desc: 'Engineering fundamentals, numerical problems, and concept-based questions.' },
      { id: 'case_study',        emoji: '📊', title: 'Case Study',         desc: 'Business problem analysis using MECE framework and structured thinking.' },
    ]

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-6xl">
          <button type="button" onClick={handleBack} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{sectorLabel}</span>
            <span className="text-gray-700 text-xs">›</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{roleLabel}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left — type cards */}
            <div className="lg:col-span-7">
              <p className="text-gray-300 text-sm font-medium mb-4">Which type of round do you want to practice?</p>
              <CardGrid items={types} selected={interviewType} onSelect={setInterviewType} cols={2} />
              <div className="mt-8">
                <button type="button" onClick={() => setStep('profile')} disabled={!interviewType}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11">
                  Continue →
                </button>
              </div>
            </div>

            {/* Right — what to expect */}
            <div className="hidden lg:block lg:col-span-5">
              <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 24 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 4 }}>What to expect</p>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Each round type focuses on different skills</p>
                <div className="space-y-4">
                  {TYPE_DETAILS.filter(t => types.some(ty => ty.id === t.id)).map(t => (
                    <div key={t.id} style={{
                      background: interviewType === t.id ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${interviewType === t.id ? 'rgba(37,99,235,0.25)' : '#1E293B'}`,
                      borderRadius: 10, padding: '12px 14px',
                      transition: 'all 0.2s',
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: 14 }}>{t.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: interviewType === t.id ? '#2563EB' : '#E5E7EB' }}>{t.title}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{t.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
        <div className="p-4 md:p-8 max-w-6xl">
          <button type="button" onClick={handleBack} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</button>
          <h1 className="font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{sectorLabel}</span>
            <span className="text-gray-700 text-xs">›</span>
            <span className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full border border-gray-700">{roleLabel}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">

          {/* IT Tech / Medical — Resume upload */}
          {needsResume && (
            <div>
              <p className="text-gray-300 text-sm font-medium mb-4">Your resume <span className="text-gray-600 font-normal">(optional)</span></p>
              {savedResume && !showUpload ? (
                <>
                  <div className="border border-blue-500/40 bg-blue-500/5 rounded-xl p-5 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">✅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-blue-400 text-sm font-semibold">Resume ready</p>
                      <p className="text-gray-500 text-xs truncate mt-0.5">{savedResume.filename}</p>
                      <button type="button" onClick={() => setShowUpload(true)} className="text-gray-600 hover:text-gray-400 text-xs mt-1 transition-colors underline underline-offset-2">Update resume</button>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep('review')} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue with saved resume →</button>
                </>
              ) : uploading ? (
                <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center gap-3">
                  <Spinner size={24} color="border-blue-500" />
                  <p className="text-gray-400 text-sm">Reading resume…</p>
                </div>
              ) : resumeText ? (
                <>
                  <div className="border border-blue-500/40 bg-blue-500/5 rounded-xl p-5 flex items-start gap-4">
                    <span className="text-2xl mt-0.5">✅</span>
                    <div>
                      <p className="text-blue-400 text-sm font-semibold">Resume ready</p>
                      <p className="text-gray-500 text-xs mt-0.5">{resumeText.length} characters extracted</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setStep('review')} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue →</button>
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
              <button type="button" onClick={() => setStep('review')} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue →</button>
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
              <button type="button" onClick={() => setStep('review')} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors min-h-11">Continue →</button>
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
          </div>{/* end left col */}

          {/* Right — why resume / profile matters */}
          <div className="hidden lg:block lg:col-span-5">
            <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 24 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 4 }}>Why this step matters</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Claude tailors every question to your profile</p>
              <div className="space-y-4">
                {[
                  { emoji: '🎯', title: 'Resume-aware questions', desc: 'Claude reads your actual projects and asks about them specifically.' },
                  { emoji: '🧠', title: 'Tailored to your experience', desc: 'Fresher vs senior — difficulty and depth adjust automatically.' },
                  { emoji: '📍', title: 'Location context', desc: 'State-specific vacancies, cut-offs, and current affairs included.' },
                ].map(item => (
                  <div key={item.emoji} className="flex items-start gap-3">
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', margin: '0 0 2px' }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>{/* end grid */}
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
    const Q_LABELS    = { 5: 'Quick practice', 10: 'Standard session', 15: 'Extended practice', 20: 'Deep preparation', 30: 'Full mock test' }
    const qLabel      = isPro ? `${questionCount} questions` : '5 questions (Free plan)'

    const rows = [
      { label: 'Sector',    value: sectorLabel },
      { label: 'Role',      value: roleLabel },
      STATE_SECTORS.has(sector) ? { label: 'State', value: state } : null,
      education ? { label: 'Education', value: eduLabel } : null,
      { label: 'Round',     value: typeLabel },
      { label: 'Questions', value: qLabel, color: isPro ? '#2563EB' : '#F59E0B' },
    ].filter(Boolean)

    return (
      <AppLayout>
        <div className="p-4 md:p-8 max-w-6xl">
          <button type="button" onClick={() => setStep('profile')} className="text-gray-500 hover:text-gray-300 text-sm transition-colors">← Back</button>
          <h1 className="font-bold text-white text-xl mt-4 mb-1">Ready to start?</h1>
          <p className="text-sm text-gray-400 mb-6">Review your interview setup</p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left — summary + question count + start */}
            <div className="lg:col-span-7">
              {/* Summary card */}
              <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 12, padding: 24, marginBottom: 16 }}>
                {rows.map((row, i) => (
                  <div key={row.label} className="flex items-center justify-between" style={{ paddingTop: 12, paddingBottom: 12, borderBottom: i < rows.length - 1 ? '1px solid #1E293B' : 'none' }}>
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
                  {[5, 10, 15, 20, 30].map(n => {
                    const locked = !isPro && n > 5
                    const active = questionCount === n
                    return (
                      <div key={n} style={{ flex: 1, position: 'relative' }}>
                        <button
                          type="button"
                          onClick={() => !locked && setQuestionCount(n)}
                          className="w-full font-bold text-sm transition-all"
                          style={{
                            height: 44, borderRadius: 8,
                            background: active ? 'rgba(37,99,235,0.12)' : '#1E293B',
                            border: active ? '2px solid #2563EB' : '1px solid #334155',
                            color: active ? '#2563EB' : '#94A3B8',
                            opacity: locked ? 0.35 : 1,
                            cursor: locked ? 'not-allowed' : 'pointer',
                            pointerEvents: locked ? 'none' : 'auto',
                          }}
                        >{n}</button>
                        {locked && (
                          <span style={{
                            position: 'absolute', top: -6, right: -6,
                            background: '#F59E0B', color: '#000',
                            fontSize: 9, fontWeight: 700,
                            padding: '2px 6px', borderRadius: 20,
                            lineHeight: 1.4,
                          }}>PRO</span>
                        )}
                      </div>
                    )
                  })}
                </div>
                {isPro ? (
                  <p className="text-center mt-2" style={{ fontSize: 12, color: '#6B7280' }}>
                    {questionCount} — {Q_LABELS[questionCount]}
                  </p>
                ) : (
                  <p className="text-center mt-2" style={{ fontSize: 12, color: '#64748B' }}>
                    Free plan includes 5 questions{' '}
                    <Link to="/upgrade" style={{ color: '#F59E0B', textDecoration: 'none' }}>
                      Upgrade to Pro for more →
                    </Link>
                  </p>
                )}
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              {/* Start Interview button */}
              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
                style={{ height: 52, background: loading ? '#334155' : '#2563EB', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1D4ED8' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? '#334155' : '#2563EB' }}
              >
                {loading ? (
                  <><Spinner size={18} color="border-white" /><span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Setting up your interview…</span></>
                ) : (
                  <><PlayCircle size={18} color="#fff" /><span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Start Interview</span></>
                )}
              </button>

              <button type="button" onClick={() => setStep('profile')} className="block w-full text-center text-gray-500 hover:text-gray-300 text-sm transition-colors mt-3">
                Change something
              </button>
            </div>

            {/* Right — preparation tips */}
            <div className="hidden lg:block lg:col-span-5">
              <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 24, marginBottom: 16 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 4 }}>Before you start</p>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>3 tips for a great interview session</p>
                <div className="space-y-4">
                  {[
                    { n: '1', tip: 'Speak clearly and specifically', desc: 'Avoid vague answers. Name real examples, dates, numbers.' },
                    { n: '2', tip: 'Use examples from experience', desc: 'The STAR method: Situation → Task → Action → Result.' },
                    { n: '3', tip: 'Think out loud while answering', desc: 'Show your reasoning process — interviewers evaluate your thinking.' },
                  ].map(({ n, tip, desc }) => (
                    <div key={n} className="flex items-start gap-3">
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#2563EB', flexShrink: 0, marginTop: 1 }}>{n}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', margin: '0 0 2px' }}>{tip}</p>
                        <p style={{ fontSize: 12, color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '14px 18px' }}>
                <p style={{ fontSize: 13, color: '#F59E0B', fontWeight: 600, margin: '0 0 4px' }}>💡 Pro tip</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                  Answer in 2–3 minutes per question. Too short shows lack of depth. Too long loses focus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  // ── Sector switch warning modal ────────────────────────────────────────

  if (showSwitchWarning) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)' }}>
        <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400 }}>

          <Warning size={32} color="#F59E0B" />

          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', margin: '12px 0 0' }}>
            Change your career goal?
          </h2>

          <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.6, margin: '12px 0 20px' }}>
            You are currently focused on <strong style={{ color: '#F9FAFB' }}>{primaryLabel}</strong>.
            Switching to <strong style={{ color: '#F9FAFB' }}>{pendingLabel}</strong> may split your preparation focus.
          </p>

          {/* Button 1 — stay on goal */}
          <button
            onClick={handleStayPrimary}
            style={{ display: 'block', width: '100%', height: 48, background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            Continue with {primaryLabel}
          </button>

          {/* Button 2 — try this session only */}
          <button
            onClick={handleTryThisSession}
            style={{ display: 'block', width: '100%', height: 44, marginTop: 8, background: 'transparent', color: '#94A3B8', border: '1px solid #374151', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#6B7280'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#374151'}
          >
            Try {pendingLabel} this session only
          </button>

          {/* Button 3 — change goal permanently */}
          <button
            onClick={handleChangePrimary}
            disabled={savingGoalChange}
            style={{ display: 'block', width: '100%', marginTop: 12, background: 'transparent', border: 'none', fontSize: 12, color: '#64748B', cursor: 'pointer', textAlign: 'center' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          >
            {savingGoalChange ? 'Saving…' : `Change my career goal to ${pendingLabel}`}
          </button>
        </div>
      </div>
    )
  }

  return null
}
