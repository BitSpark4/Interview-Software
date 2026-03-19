import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  UserCircle, ChartBar, Trophy, Lightning, Target, PlayCircle,
  FileText, CaretRight, UploadSimple, PencilSimple, Trash,
  Crown, Lock, CheckCircle, Warning, FileMagnifyingGlass, ArrowCounterClockwise, Gear,
  Code, Medal,
} from '@phosphor-icons/react'
import { UploadAnimation } from '../components/LottieAnimation'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useResume } from '../hooks/useResume'
import { supabase } from '../lib/supabase'

function scoreColor(v) {
  if (v >= 7) return '#22C55E'
  if (v >= 5) return '#F59E0B'
  return '#EF4444'
}

function atsRingColor(v) {
  if (v >= 80) return '#22C55E'
  if (v >= 60) return '#F59E0B'
  return '#EF4444'
}

function AtsRing({ score = 0 }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = atsRingColor(score)
  return (
    <svg width={72} height={72} viewBox="0 0 72 72" style={{ flexShrink: 0 }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="#1F2937" strokeWidth={6} />
      <circle
        cx={36} cy={36} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={36} y={32} textAnchor="middle" fill={color} fontSize={16} fontWeight="800" fontFamily="Inter,sans-serif">{score}</text>
      <text x={36} y={46} textAnchor="middle" fill="#6B7280" fontSize={9} fontFamily="Inter,sans-serif">/ 100</text>
    </svg>
  )
}

function categorizeSkills(skillsList) {
  const frontendKeywords = ['react','vue','angular','html','css','typescript','javascript','next','tailwind','svelte','sass','scss','redux','graphql','apollo','jquery','bootstrap']
  const backendKeywords = ['node','python','java','go','ruby','php','express','django','flask','spring','rust','c#','dotnet','nest','fastapi','laravel','rails','kotlin','swift']
  const toolsKeywords = ['git','docker','kubernetes','aws','gcp','azure','figma','webpack','vite','postgres','mysql','redis','supabase','mongodb','firebase','linux','nginx','jest','cypress','terraform','ansible']
  const groupStyles = {
    Frontend:    { dot: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: '1px solid rgba(59,130,246,0.25)',  color: '#60A5FA' },
    Backend:     { dot: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  border: '1px solid rgba(139,92,246,0.25)',  color: '#A78BFA' },
    Tools:       { dot: '#6B7280', bg: 'rgba(107,114,128,0.12)', border: '1px solid rgba(107,114,128,0.25)', color: '#9CA3AF' },
    Methodology: { dot: '#10B981', bg: 'rgba(16,185,129,0.12)',  border: '1px solid rgba(16,185,129,0.25)',  color: '#6EE7B7' },
  }
  const groups = { Frontend: [], Backend: [], Tools: [], Methodology: [] }
  skillsList.forEach(skill => {
    const n = (skill.name || '').toLowerCase()
    if (frontendKeywords.some(k => n.includes(k)))    groups.Frontend.push(skill.name)
    else if (backendKeywords.some(k => n.includes(k))) groups.Backend.push(skill.name)
    else if (toolsKeywords.some(k => n.includes(k)))   groups.Tools.push(skill.name)
    else groups.Methodology.push(skill.name)
  })
  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([cat, items]) => ({ category: cat, items, style: groupStyles[cat] }))
}

const RANGE_OPTIONS = ['All time', '30 days', '7 days']

export default function Profile() {
  const navigate = useNavigate()
  const { userProfile, refreshProfile } = useAuth()
  const { savedResume, uploading, error: resumeError, processResume } = useResume(userProfile?.plan)

  const [sessions, setSessions]             = useState([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [chartRange, setChartRange]         = useState('All time')
  const [editingName, setEditingName]       = useState(false)
  const [nameInput, setNameInput]           = useState('')
  const [savingName, setSavingName]         = useState(false)
  const [nameError, setNameError]           = useState('')
  const [fileError, setFileError]           = useState('')
  const [reanalyzing, setReanalyzing]       = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput]       = useState('')
  const [deleting, setDeleting]             = useState(false)
  const [showAllSkills, setShowAllSkills]   = useState(false)
  const [showAllTips, setShowAllTips]       = useState(false)

  const isPro        = userProfile?.plan === 'pro'
  const skills       = userProfile?.skills
  const atsScore     = userProfile?.ats_score ?? null
  const atsFeedback  = userProfile?.ats_feedback ?? null
  const name       = userProfile?.name || 'User'
  const initial    = name.charAt(0).toUpperCase()
  const memberSince = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : ''

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('sessions')
        .select('id, role, interview_type, total_score, verdict, completed_at')
        .eq('user_id', user.id).eq('completed', true)
        .order('completed_at', { ascending: false }).limit(20)
      setSessions(data || [])
      setLoadingSessions(false)
    }
    load()
  }, [])

  const bestScore = sessions.reduce((m, s) => Math.max(m, s.total_score || 0), 0)
  const avgScore  = userProfile?.average_score ? parseFloat(userProfile.average_score) : null

  function getChartData() {
    let filtered = [...sessions].reverse()
    if (chartRange === '7 days') {
      const cutoff = Date.now() - 7 * 86400000
      filtered = filtered.filter(s => new Date(s.completed_at).getTime() >= cutoff)
    } else if (chartRange === '30 days') {
      const cutoff = Date.now() - 30 * 86400000
      filtered = filtered.filter(s => new Date(s.completed_at).getTime() >= cutoff)
    }
    return filtered.map((s, i) => ({
      name: `#${i + 1}`,
      score: parseFloat(s.total_score) || 0,
      date: s.completed_at ? new Date(s.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
    }))
  }
  const chartData = getChartData()

  async function saveName() {
    if (!nameInput.trim()) return
    setSavingName(true); setNameError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('users').update({ name: nameInput.trim() }).eq('id', user.id)
    if (error) setNameError('Could not save name.')
    else { setEditingName(false); refreshProfile?.() }
    setSavingName(false)
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setFileError('PDF only.'); return }
    if (file.size > 5 * 1024 * 1024)    { setFileError('Max 5 MB.'); return }
    setFileError('')
    try { await processResume(file) } catch { /* resumeError shown below */ }
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'DELETE') return
    setDeleting(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('users').delete().eq('id', user.id)
    await supabase.auth.signOut()
    navigate('/')
  }

  async function reanalyzeATS() {
    if (!savedResume?.text || reanalyzing) return
    setReanalyzing(true)
    try {
      const { analyzeResumeATS } = await import('../lib/claudeApi')
      const ats = await analyzeResumeATS(savedResume.text)
      if (ats) {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('users').update({
          ats_score: ats.score, ats_feedback: ats, ats_analyzed_at: new Date().toISOString(),
        }).eq('id', user.id)
        refreshProfile?.()
      }
    } catch { /* ignore */ } finally { setReanalyzing(false) }
  }

  const stats = [
    { label: 'TOTAL SESSIONS', icon: Target,   iconColor: '#3B82F6', topBorder: '#3B82F6', value: userProfile?.total_sessions || 0 },
    { label: 'AVG SCORE',      icon: ChartBar,  iconColor: '#2563EB', topBorder: '#2563EB', value: avgScore ? avgScore.toFixed(1) : '—', valueColor: avgScore ? scoreColor(avgScore) : '#F9FAFB' },
    { label: 'BEST SCORE',     icon: Trophy,    iconColor: '#F59E0B', topBorder: '#F59E0B', value: bestScore ? bestScore.toFixed(1) : '—', valueColor: bestScore ? scoreColor(bestScore) : '#F9FAFB' },
    { label: 'DAY STREAK',     icon: Lightning, iconColor: '#F97316', topBorder: '#F97316', value: userProfile?.streak_count || 0 },
  ]

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">

        {/* ── Row 1: Left profile col + Right 2x2 stats ── */}
        <div className="flex flex-col lg:flex-row gap-5 lg:items-stretch">

          {/* Left col — 320px fixed */}
          <div
            className="shrink-0 rounded-xl p-6 flex flex-col items-center text-center h-full"
            style={{ width: '100%', maxWidth: 320, background: '#111827', border: '1px solid #1F2937' }}
          >
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl mb-4"
              style={{ background: '#2563EB' }}
            >
              {initial}
            </div>

            {/* Name with inline edit */}
            {editingName ? (
              <div className="flex flex-col gap-2 w-full mb-1">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveName()}
                  autoFocus
                  className="text-center text-[14px] rounded-lg px-3 py-1.5 outline-none w-full"
                  style={{ background: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={saveName} disabled={savingName}
                    className="text-[12px] font-semibold px-3 py-1 rounded-lg text-white"
                    style={{ background: '#2563EB' }}
                  >
                    {savingName ? '…' : 'Save'}
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-[12px] text-[#6B7280] hover:text-[#F9FAFB]">Cancel</button>
                </div>
                {nameError && <p className="text-[11px]" style={{ color: '#EF4444' }}>{nameError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[18px] font-bold" style={{ color: '#F9FAFB' }}>{name}</p>
                <button onClick={() => { setEditingName(true); setNameInput(name) }}>
                  <PencilSimple size={13} color="#6B7280" />
                </button>
              </div>
            )}

            <p className="text-[13px] mb-1" style={{ color: '#9CA3AF' }}>{userProfile?.email}</p>
            {memberSince && <p className="text-[11px] mb-4" style={{ color: '#6B7280' }}>Member since {memberSince}</p>}

            {/* Plan badge */}
            {isPro ? (
              <span
                className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded mb-5"
                style={{ background: '#2563EB', color: '#fff' }}
              >
                + PRO PLAN
              </span>
            ) : (
              <Link
                to="/upgrade"
                className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded mb-5"
                style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}
              >
                <Lightning size={11} /> Free Plan — Upgrade
              </Link>
            )}
          </div>

          {/* Right col — 2x2 stats grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 content-start auto-rows-fr">
            {stats.map(s => (
              <div
                key={s.label}
                className="rounded-xl p-4"
                style={{
                  background: '#111827',
                  border: '1px solid #1F2937',
                  borderTop: `2px solid ${s.topBorder}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>{s.label}</p>
                  <s.icon size={18} color={s.iconColor} />
                </div>
                <p className="text-[28px] font-bold" style={{ color: s.valueColor || '#F9FAFB' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Row 2: Progress chart (full-width) ── */}
        <div className="rounded-xl p-6" style={{ background: '#111827', border: '1px solid #1F2937' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[15px] font-semibold" style={{ color: '#F9FAFB' }}>Score Progress</p>
              <p className="text-[12px]" style={{ color: '#6B7280' }}>Interview performance over time</p>
            </div>
            <div className="flex gap-1">
              {RANGE_OPTIONS.map(r => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className="text-[12px] font-medium px-3 py-1 rounded-full transition-all duration-150"
                  style={chartRange === r
                    ? { background: 'rgba(37,99,235,0.15)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.3)' }
                    : { background: '#1F2937', color: '#6B7280', border: '1px solid #374151' }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9CA3AF' }}
                  itemStyle={{ color: '#2563EB' }}
                />
                <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2}
                  dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-2" style={{ minHeight: 100 }}>
              <ChartBar size={28} color="#374151" />
              <p className="text-[13px]" style={{ color: '#6B7280' }}>
                Complete {Math.max(0, 2 - chartData.length)} more interview{chartData.length < 1 ? 's' : ''} to see your chart
              </p>
              <Link
                to="/interview/setup"
                className="flex items-center gap-2 font-semibold transition-all duration-200"
                style={{
                  background: '#2563EB', color: '#fff', fontSize: 12,
                  padding: '6px 16px', borderRadius: 8, marginTop: 2,
                }}
              >
                <PlayCircle size={12} /> Start Interview
              </Link>
            </div>
          )}
        </div>

        {/* ── Row 3: Skills (40%) + ATS (60%) combined card ── */}
        <div
          className="rounded-xl flex flex-col lg:flex-row"
          style={{ background: '#111827', border: '1px solid #2D3748' }}
        >
          {/* Left 40%: Skills */}
          <div style={{ padding: 24, width: '100%' }} className="lg:w-[40%]">
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <Code size={16} color="#8B5CF6" />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>Skills Detected</p>
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Extracted from your resume</p>

            {skills?.technical_skills?.length ? (() => {
              const allSkills = skills.technical_skills
              const LIMIT = 12
              const visible = showAllSkills ? allSkills : allSkills.slice(0, LIMIT)
              const extra = allSkills.length - LIMIT
              const grouped = categorizeSkills(visible)
              return (
                <div>
                  {grouped.map(({ category, items, style }) => (
                    <div key={category} style={{ marginBottom: 12 }}>
                      <div className="flex items-center gap-1.5" style={{ marginBottom: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: style.dot, flexShrink: 0, display: 'inline-block' }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{category}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map(name => (
                          <span key={name} style={{ fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, height: 24, display: 'inline-flex', alignItems: 'center', background: style.bg, border: style.border, color: style.color }}>
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
                    {!showAllSkills && extra > 0 && (
                      <button
                        onClick={() => setShowAllSkills(true)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#1F2937', color: '#9CA3AF', border: '1px solid #374151', cursor: 'pointer' }}
                      >
                        +{extra} more
                      </button>
                    )}
                    <p style={{ fontSize: 11, color: '#6B7280' }}>{allSkills.length} skills detected</p>
                  </div>
                </div>
              )
            })() : savedResume ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <Lightning size={22} color="#8B5CF6" />
                <p style={{ fontSize: 13, color: '#6B7280' }}>Skills are being analyzed</p>
                <button
                  onClick={() => refreshProfile?.()}
                  className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}
                >
                  <ArrowCounterClockwise size={12} /> Refresh
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <p style={{ fontSize: 13, color: '#6B7280' }}>Upload resume to detect skills</p>
                <label
                  htmlFor="skills-resume-upload"
                  className="flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg"
                  style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}
                >
                  <UploadSimple size={12} /> Upload Resume
                  <input id="skills-resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
                </label>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="hidden lg:block" style={{ width: 1, background: '#1F2937', margin: '16px 0' }} />
          <div className="block lg:hidden" style={{ height: 1, background: '#1F2937', margin: '0 24px' }} />

          {/* Right 60%: ATS Score */}
          <div style={{ padding: 24, width: '100%', position: 'relative', overflow: 'hidden' }} className="lg:w-[60%]">
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <Medal size={16} color="#F59E0B" />
              <p style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB' }}>Resume ATS Score</p>
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>How ATS-friendly your resume is</p>

            {!isPro ? (
              <div style={{ position: 'relative' }}>
                <div style={{ filter: 'blur(6px)', pointerEvents: 'none', opacity: 0.4 }}>
                  <AtsRing score={42} />
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4" style={{ background: 'rgba(17,24,39,0.92)', borderRadius: 12 }}>
                  <Crown size={28} color="#F59E0B" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#F9FAFB', marginBottom: 6 }}>Pro Feature</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 14 }}>
                    Get your ATS score and see exactly how to improve your resume.
                  </p>
                  <a href="/upgrade" className="flex items-center justify-center font-bold transition-all"
                    style={{ height: 38, padding: '0 20px', background: '#2563EB', color: '#fff', fontSize: 13, borderRadius: 8, textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
                    onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}>
                    Upgrade to Pro — ₹199/month
                  </a>
                </div>
              </div>
            ) : !savedResume ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <FileMagnifyingGlass size={28} color="#374151" />
                <p style={{ fontSize: 13, color: '#6B7280' }}>Upload your resume to get ATS score</p>
                <label htmlFor="ats-resume-upload" className="flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer px-3 py-1.5 rounded-lg"
                  style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}>
                  <UploadSimple size={12} /> Upload Resume
                  <input id="ats-resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
                </label>
              </div>
            ) : atsScore != null ? (
              <div>
                {/* Ring + summary horizontal */}
                <div className="flex items-start gap-4" style={{ marginBottom: 16 }}>
                  <AtsRing score={atsScore} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: '#6B7280', marginBottom: 2 }}>Overall Score</p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: atsRingColor(atsScore), marginBottom: 4 }}>{atsScore}/100</p>
                    {atsFeedback?.strengths?.slice(0, 2).map(s => (
                      <div key={s} className="flex items-start gap-1.5" style={{ marginBottom: 3 }}>
                        <CheckCircle size={12} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                {atsFeedback?.breakdown && (
                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#F9FAFB', marginBottom: 8 }}>Score Breakdown</p>
                    {Object.entries({
                      'Contact Info':            { score: atsFeedback.breakdown.contact_info,            max: 10 },
                      'Work Experience':         { score: atsFeedback.breakdown.work_experience,         max: 25 },
                      'Quantified Achievements': { score: atsFeedback.breakdown.quantified_achievements, max: 20 },
                      'Keywords':                { score: atsFeedback.breakdown.keywords,                max: 20 },
                      'Education':               { score: atsFeedback.breakdown.education,               max: 10 },
                      'Skills Section':          { score: atsFeedback.breakdown.skills_section,          max: 10 },
                      'Formatting':              { score: atsFeedback.breakdown.formatting,              max: 5  },
                    }).map(([label, { score, max }]) => (
                      <div key={label} style={{ height: 28, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginBottom: 6 }}>
                        <div className="flex justify-between" style={{ marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: atsRingColor(atsScore) }}>{score}/{max}</span>
                        </div>
                        <div style={{ height: 3, background: '#1F2937', borderRadius: 2 }}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${(score / max) * 100}%`, background: atsRingColor(atsScore), transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Improvements */}
                {atsFeedback?.improvements?.length > 0 && (
                  <div style={{ marginTop: 12, marginBottom: 8 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', marginBottom: 6 }}>📈 How to improve</p>
                    {(showAllTips ? atsFeedback.improvements : atsFeedback.improvements.slice(0, 3)).map(tip => (
                      <div key={tip} className="flex items-start gap-1.5" style={{ marginBottom: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6B7280', flexShrink: 0, marginTop: 4, display: 'inline-block' }} />
                        <p style={{ fontSize: 11, color: '#9CA3AF', lineHeight: 1.4 }}>{tip}</p>
                      </div>
                    ))}
                    {!showAllTips && atsFeedback.improvements.length > 3 && (
                      <button onClick={() => setShowAllTips(true)} style={{ fontSize: 11, color: '#2563EB', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Show {atsFeedback.improvements.length - 3} more
                      </button>
                    )}
                  </div>
                )}

                {/* Missing keywords */}
                {atsFeedback?.missing_keywords?.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#F9FAFB', marginBottom: 6 }}>🔑 Missing Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {atsFeedback.missing_keywords.slice(0, 8).map(kw => (
                        <span key={kw} style={{ fontSize: 10, color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '2px 8px', borderRadius: 20 }}>
                          {kw}
                        </span>
                      ))}
                      {atsFeedback.missing_keywords.length > 8 && (
                        <span style={{ fontSize: 10, color: '#9CA3AF', background: '#1F2937', padding: '2px 8px', borderRadius: 20 }}>
                          +{atsFeedback.missing_keywords.length - 8} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Reanalyze */}
                <button onClick={reanalyzeATS} disabled={reanalyzing}
                  className="flex items-center gap-1.5 transition-all"
                  style={{ height: 32, fontSize: 12, color: reanalyzing ? '#4B5563' : '#9CA3AF', background: 'transparent', border: '1px solid #374151', padding: '0 12px', borderRadius: 8, cursor: reanalyzing ? 'not-allowed' : 'pointer', marginTop: 12 }}
                  onMouseEnter={e => { if (!reanalyzing) e.currentTarget.style.borderColor = '#4B5563' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151' }}>
                  <ArrowCounterClockwise size={12} className={reanalyzing ? 'animate-spin' : ''} />
                  {reanalyzing ? 'Analyzing…' : 'Reanalyze ATS Score'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <p style={{ fontSize: 13, color: '#6B7280' }}>ATS analysis pending</p>
                <button onClick={reanalyzeATS} disabled={reanalyzing}
                  className="flex items-center gap-2 font-semibold transition-all"
                  style={{ height: 32, padding: '0 16px', background: '#2563EB', color: '#fff', fontSize: 12, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                  {reanalyzing ? <><ArrowCounterClockwise size={12} className="animate-spin" /> Analyzing…</> : <>Analyze Now</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Row 4: Resume (60%) + Account Settings (40%) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">

          {/* Resume card — amber left border */}
          <div
            id="resume-section"
            className="rounded-xl p-4"
            style={{ background: '#111827', border: '1px solid #1F2937', borderLeft: '3px solid #F59E0B', minHeight: 180 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <FileText size={15} color="#F59E0B" />
              <p className="text-[14px] font-semibold" style={{ color: '#F9FAFB' }}>Your Resume</p>
            </div>
            <p className="text-[12px] mb-4" style={{ color: '#6B7280' }}>Used for AI-generated resume-aware questions</p>

            {fileError && <p className="text-[12px] mb-3" style={{ color: '#EF4444' }}>{fileError}</p>}
            {resumeError && <p className="text-[12px] mb-3" style={{ color: '#EF4444' }}>{resumeError}</p>}

            {uploading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Spinner size={24} color="border-blue-500" />
                <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Analyzing resume…</p>
                <p className="text-[11px]" style={{ color: '#6B7280' }}>Detecting skills · Calculating ATS score</p>
              </div>
            ) : savedResume ? (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 rounded-lg"
                  style={{ background: '#1F2937', padding: '10px 14px' }}
                >
                  <FileText size={20} color="#F59E0B" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: '#F9FAFB' }}>{savedResume.filename}</p>
                    {savedResume.uploadedAt && (
                      <p className="text-[11px]" style={{ color: '#6B7280' }}>
                        {new Date(savedResume.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <label
                  htmlFor="resume-upload"
                  className="flex items-center gap-1.5 text-[12px] font-medium cursor-pointer w-fit"
                  style={{ color: '#F59E0B' }}
                >
                  <UploadSimple size={13} /> Replace resume
                  <input id="resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
                </label>
              </div>
            ) : (
              <label
                htmlFor="resume-upload"
                className="flex flex-col items-center gap-3 rounded-xl p-8 text-center cursor-pointer transition-colors"
                style={{ border: '2px dashed #374151' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#F59E0B'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#374151'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', cursor: 'pointer' }}>
                  <UploadAnimation size={100} />
                  <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '8px' }}>Drop your resume PDF here</p>
                  <p style={{ color: '#64748B', fontSize: '12px', marginTop: '4px' }}>or click to browse · Max 5MB</p>
                </div>
                <input id="resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
              </label>
            )}
          </div>

          {/* Account Settings */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: '#111827', border: '1px solid #1F2937', minHeight: 180 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Gear size={15} color="#6B7280" />
              <p className="text-[14px] font-semibold" style={{ color: '#F9FAFB' }}>Account</p>
            </div>

            {/* Email */}
            <div style={{ height: 44, borderBottom: '1px solid #1F2937', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: '#6B7280' }}>Email</p>
              <p className="text-[13px]" style={{ color: '#F9FAFB' }}>{userProfile?.email}</p>
            </div>

            {/* Plan */}
            <div className="flex items-center justify-between" style={{ height: 44, borderBottom: '1px solid #1F2937' }}>
              <div>
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Plan</p>
                <p className="text-[13px]" style={{ color: '#F9FAFB' }}>{isPro ? 'Pro Plan' : 'Free Plan'}</p>
              </div>
              {isPro
                ? <span className="text-[11px] font-semibold" style={{ color: '#2563EB' }}>Active</span>
                : <Link to="/upgrade" className="text-[12px] font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: '#2563EB' }}>Upgrade</Link>
              }
            </div>

            {/* Active Device */}
            {userProfile?.last_login_device && (
              <div style={{ borderBottom: '1px solid #1F2937', paddingBottom: 12 }}>
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Active Device</p>
                <p className="text-[12px]" style={{ color: '#D1D5DB', wordBreak: 'break-all' }}>
                  {userProfile.last_login_device.length > 60
                    ? userProfile.last_login_device.slice(0, 60) + '…'
                    : userProfile.last_login_device}
                </p>
                {userProfile.last_login_at && (
                  <p className="text-[11px] mt-0.5" style={{ color: '#4B5563' }}>
                    Last active:{' '}
                    {new Date(userProfile.last_login_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Danger zone */}
            <div className="pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: '#EF4444' }}>Danger Zone</p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 text-[12px] font-medium px-3 py-2 rounded-lg transition-colors"
                style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.25)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Trash size={13} /> Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ background: '#111827', border: '1px solid #374151' }}>
            <p className="text-[16px] font-bold mb-2" style={{ color: '#F9FAFB' }}>Delete Account?</p>
            <p className="text-[13px] mb-4" style={{ color: '#9CA3AF' }}>
              This permanently deletes all your data, sessions, and reports. Cannot be undone.
            </p>
            <p className="text-[12px] mb-2" style={{ color: '#6B7280' }}>
              Type <span style={{ color: '#EF4444', fontFamily: 'monospace' }}>DELETE</span> to confirm
            </p>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder="DELETE"
              className="w-full text-[13px] rounded-lg px-3 py-2 outline-none mb-4"
              style={{ background: '#1F2937', border: '1px solid #374151', color: '#F9FAFB' }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteInput('') }}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-medium"
                style={{ border: '1px solid #374151', color: '#9CA3AF' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || deleting}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-bold text-white transition-colors"
                style={{ background: '#EF4444', opacity: deleteInput !== 'DELETE' || deleting ? 0.4 : 1 }}
              >
                {deleting ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
