import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  User, BarChart2, Trophy, Flame, Target, Play,
  FileText, Zap, ChevronRight, Upload, Pencil, Trash2,
  Crown, Lock, CheckCircle, AlertCircle, FileSearch, RefreshCw, Settings,
} from 'lucide-react'
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
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = atsRingColor(score)
  return (
    <svg width={96} height={96} viewBox="0 0 96 96">
      <circle cx={48} cy={48} r={r} fill="none" stroke="#1F2937" strokeWidth={8} />
      <circle
        cx={48} cy={48} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={48} y={44} textAnchor="middle" fill={color} fontSize={18} fontWeight="bold" fontFamily="Inter,sans-serif">{score}</text>
      <text x={48} y={60} textAnchor="middle" fill="#6B7280" fontSize={10} fontFamily="Inter,sans-serif">ATS</text>
    </svg>
  )
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
    { label: 'AVG SCORE',      icon: BarChart2, iconColor: '#22C55E', topBorder: '#22C55E', value: avgScore ? avgScore.toFixed(1) : '—', valueColor: avgScore ? scoreColor(avgScore) : '#F9FAFB' },
    { label: 'BEST SCORE',     icon: Trophy,    iconColor: '#F59E0B', topBorder: '#F59E0B', value: bestScore ? bestScore.toFixed(1) : '—', valueColor: bestScore ? scoreColor(bestScore) : '#F9FAFB' },
    { label: 'DAY STREAK',     icon: Flame,     iconColor: '#F97316', topBorder: '#F97316', value: userProfile?.streak_count || 0 },
  ]

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-5">

        {/* ── Row 1: Left profile col + Right 2x2 stats ── */}
        <div className="flex flex-col lg:flex-row gap-5 lg:items-stretch">

          {/* Left col — 320px fixed */}
          <div
            className="shrink-0 rounded-xl p-6 flex flex-col items-center text-center h-full"
            style={{ width: '100%', maxWidth: 320, background: '#111827', border: '1px solid #1F2937' }}
          >
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-black font-bold text-3xl mb-4"
              style={{ background: '#22C55E' }}
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
                    className="text-[12px] font-semibold px-3 py-1 rounded-lg text-black"
                    style={{ background: '#22C55E' }}
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
                  <Pencil size={13} color="#6B7280" />
                </button>
              </div>
            )}

            <p className="text-[13px] mb-1" style={{ color: '#9CA3AF' }}>{userProfile?.email}</p>
            {memberSince && <p className="text-[11px] mb-4" style={{ color: '#6B7280' }}>Member since {memberSince}</p>}

            {/* Plan badge */}
            {isPro ? (
              <span
                className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded mb-5"
                style={{ background: '#22C55E', color: '#000' }}
              >
                + PRO PLAN
              </span>
            ) : (
              <Link
                to="/upgrade"
                className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded mb-5"
                style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}
              >
                <Zap size={11} /> Free Plan — Upgrade
              </Link>
            )}
          </div>

          {/* Right col — 2x2 stats grid */}
          <div className="flex-1 grid grid-cols-2 gap-4 content-start auto-rows-fr">
            {stats.map(s => (
              <div
                key={s.label}
                className="rounded-xl p-5"
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
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }
                    : { background: '#1F2937', color: '#6B7280', border: '1px solid #374151' }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#9CA3AF' }}
                  itemStyle={{ color: '#22C55E' }}
                />
                <Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={2}
                  dot={{ fill: '#22C55E', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <BarChart2 size={32} color="#374151" />
              <p className="text-[13px]" style={{ color: '#6B7280' }}>
                Complete {Math.max(0, 2 - chartData.length)} more interview{chartData.length < 1 ? 's' : ''} to see your chart
              </p>
              <Link
                to="/interview/setup"
                className="flex items-center gap-2 font-semibold transition-all duration-200"
                style={{
                  background: '#22C55E', color: '#000', fontSize: 13,
                  padding: '8px 20px', borderRadius: 8, marginTop: 4,
                }}
              >
                <Play size={13} fill="#000" /> Start Interview
              </Link>
            </div>
          )}
        </div>

        {/* ── Row 3: Skills (left) + ATS ring (right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Skills card — purple left border */}
          <div
            className="rounded-xl p-5"
            style={{ background: '#111827', border: '1px solid #1F2937', borderLeft: '3px solid #8B5CF6' }}
          >
            <p className="text-[14px] font-semibold mb-1" style={{ color: '#F9FAFB' }}>Skills Detected</p>
            <p className="text-[12px] mb-4" style={{ color: '#6B7280' }}>Extracted from your resume</p>
            {skills?.technical_skills?.length ? (
              <div className="flex flex-wrap gap-2">
                {skills.technical_skills.map(s => (
                  <span
                    key={s.name}
                    className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                    style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <p className="text-[13px]" style={{ color: '#6B7280' }}>Upload your resume to detect skills</p>
                <label
                  htmlFor="skills-resume-upload"
                  className="flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer px-4 py-2 rounded-lg transition-all"
                  style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#8B5CF6'; e.currentTarget.style.color = '#8B5CF6' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9CA3AF' }}
                >
                  <Upload size={13} /> Upload Resume to detect skills
                  <input id="skills-resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
                </label>
              </div>
            )}
          </div>

          {/* ATS Score card */}
          <div className="rounded-xl p-5 relative overflow-hidden"
            style={{ background: '#111827', border: '1px solid #1F2937', borderLeft: '3px solid #22C55E' }}>
            <p className="text-[14px] font-semibold mb-1" style={{ color: '#F9FAFB' }}>Resume ATS Score</p>
            <p className="text-[12px] mb-4" style={{ color: '#6B7280' }}>How ATS-friendly your resume is</p>

            {/* FREE PLAN — locked overlay */}
            {!isPro ? (
              <div>
                {/* blurred fake content */}
                <div style={{ filter: 'blur(6px)', pointerEvents: 'none', opacity: 0.4 }}>
                  <AtsRing score={42} />
                </div>
                {/* lock overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6"
                  style={{ background: 'rgba(17,24,39,0.92)', borderRadius: 16 }}>
                  <Crown size={32} color="#F59E0B" style={{ marginBottom: 10 }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', marginBottom: 8 }}>Pro Feature</p>
                  <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 16 }}>
                    Get your ATS score and see exactly how to improve your resume to pass company filters automatically.
                  </p>
                  <a href="/upgrade"
                    className="w-full flex items-center justify-center font-bold transition-all"
                    style={{ height: 44, background: '#22C55E', color: '#000', fontSize: 14, fontWeight: 700, borderRadius: 10, textDecoration: 'none' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#16A34A'}
                    onMouseLeave={e => e.currentTarget.style.background = '#22C55E'}>
                    Upgrade to Pro — ₹199/month
                  </a>
                </div>
              </div>
            ) : !savedResume ? (
              /* PRO — no resume uploaded */
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <FileSearch size={32} color="#374151" />
                <p style={{ fontSize: 13, color: '#6B7280' }}>Upload your resume to get ATS score</p>
                <label htmlFor="ats-resume-upload"
                  className="flex items-center gap-1.5 text-[12px] font-semibold cursor-pointer px-4 py-2 rounded-lg transition-all"
                  style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#22C55E' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9CA3AF' }}>
                  <Upload size={13} /> Upload Resume
                  <input id="ats-resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
                </label>
              </div>
            ) : atsScore != null ? (
              /* PRO — has score */
              <div className="space-y-5">
                {/* Ring + grade */}
                <div className="flex items-center gap-5">
                  <AtsRing score={atsScore} />
                  <div>
                    <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Overall Score</p>
                    {atsFeedback?.strengths?.slice(0, 2).map(s => (
                      <div key={s} className="flex items-start gap-1.5" style={{ marginBottom: 3 }}>
                        <CheckCircle size={12} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
                        <p style={{ fontSize: 11, color: '#9CA3AF' }}>{s}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breakdown */}
                {atsFeedback?.breakdown && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', marginBottom: 10 }}>Score Breakdown</p>
                    {Object.entries({
                      'Contact Info':             { score: atsFeedback.breakdown.contact_info,             max: 10 },
                      'Work Experience':          { score: atsFeedback.breakdown.work_experience,          max: 25 },
                      'Quantified Achievements':  { score: atsFeedback.breakdown.quantified_achievements,  max: 20 },
                      'Keywords':                 { score: atsFeedback.breakdown.keywords,                 max: 20 },
                      'Education':                { score: atsFeedback.breakdown.education,                max: 10 },
                      'Skills Section':           { score: atsFeedback.breakdown.skills_section,           max: 10 },
                      'Formatting':               { score: atsFeedback.breakdown.formatting,               max: 5  },
                    }).map(([label, { score, max }]) => (
                      <div key={label} style={{ marginBottom: 8 }}>
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
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', marginBottom: 8 }}>📈 How to improve</p>
                    {atsFeedback.improvements.map(tip => (
                      <div key={tip} className="flex items-start gap-1.5" style={{ marginBottom: 5 }}>
                        <AlertCircle size={12} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
                        <p style={{ fontSize: 12, color: '#9CA3AF' }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Missing keywords */}
                {atsFeedback?.missing_keywords?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', marginBottom: 8 }}>🔑 Missing Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {atsFeedback.missing_keywords.map(kw => (
                        <span key={kw} style={{ fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '3px 10px', borderRadius: 20 }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reanalyze */}
                <button onClick={reanalyzeATS} disabled={reanalyzing}
                  className="flex items-center gap-1.5 transition-all"
                  style={{ fontSize: 13, color: reanalyzing ? '#4B5563' : '#9CA3AF', background: 'transparent', border: '1px solid #374151', padding: '6px 14px', borderRadius: 8, cursor: reanalyzing ? 'not-allowed' : 'pointer' }}
                  onMouseEnter={e => { if (!reanalyzing) e.currentTarget.style.borderColor = '#4B5563' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151' }}>
                  <RefreshCw size={13} className={reanalyzing ? 'animate-spin' : ''} />
                  {reanalyzing ? 'Analyzing…' : 'Reanalyze ATS Score'}
                </button>
              </div>
            ) : (
              /* PRO — resume uploaded but ATS not yet analyzed */
              <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
                <p style={{ fontSize: 13, color: '#6B7280' }}>ATS analysis pending</p>
                <button onClick={reanalyzeATS} disabled={reanalyzing}
                  className="flex items-center gap-2 font-semibold transition-all"
                  style={{ height: 36, padding: '0 16px', background: '#22C55E', color: '#000', fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                  {reanalyzing ? <><RefreshCw size={13} className="animate-spin" /> Analyzing…</> : <>Analyze Now</>}
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
            className="rounded-xl p-5"
            style={{ background: '#111827', border: '1px solid #1F2937', borderLeft: '3px solid #F59E0B' }}
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
                <Spinner size={24} color="border-emerald-500" />
                <p className="text-[13px]" style={{ color: '#9CA3AF' }}>Analyzing resume…</p>
                <p className="text-[11px]" style={{ color: '#6B7280' }}>Detecting skills · Calculating ATS score</p>
              </div>
            ) : savedResume ? (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: '#1F2937' }}
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
                  <Upload size={13} /> Replace resume
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
                <Upload size={28} color="#F59E0B" />
                <div>
                  <p className="text-[13px] font-medium" style={{ color: '#F9FAFB' }}>Upload your resume PDF</p>
                  <p className="text-[11px] mt-1" style={{ color: '#6B7280' }}>Get skill detection and ATS score · Max 5 MB</p>
                </div>
                <input id="resume-upload" type="file" accept=".pdf,application/pdf" className="hidden" onChange={handleFile} />
              </label>
            )}
          </div>

          {/* Account Settings */}
          <div
            className="rounded-xl p-5 space-y-4"
            style={{ background: '#111827', border: '1px solid #1F2937' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Settings size={15} color="#6B7280" />
              <p className="text-[14px] font-semibold" style={{ color: '#F9FAFB' }}>Account</p>
            </div>

            {/* Email */}
            <div className="py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Email</p>
              <p className="text-[13px]" style={{ color: '#F9FAFB' }}>{userProfile?.email}</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#4B5563' }}>Contact support to change</p>
            </div>

            {/* Plan */}
            <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #1F2937' }}>
              <div>
                <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>Plan</p>
                <p className="text-[13px]" style={{ color: '#F9FAFB' }}>{isPro ? 'Pro Plan' : 'Free Plan'}</p>
              </div>
              {isPro
                ? <span className="text-[11px] font-semibold" style={{ color: '#22C55E' }}>Active</span>
                : <Link to="/upgrade" className="text-[12px] font-semibold px-3 py-1.5 rounded-lg text-black" style={{ background: '#22C55E' }}>Upgrade</Link>
              }
            </div>

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
                <Trash2 size={13} /> Delete Account
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
