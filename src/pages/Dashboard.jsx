import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Play, Target, BarChart2, Trophy,
  Eye, CircleDot, ChevronRight, Award, Lock,
} from 'lucide-react'
import AppLayout from '../components/AppLayout'
import UpgradeModal from '../components/UpgradeModal'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useUsage } from '../hooks/useUsage'
import { supabase } from '../lib/supabase'

const ROLE_CHIPS = [
  { id: 'frontend',  label: 'Frontend' },
  { id: 'backend',   label: 'Backend' },
  { id: 'fullstack', label: 'Full Stack' },
  { id: 'pm',        label: 'Product' },
  { id: 'hr',        label: 'HR' },
]

function scoreColor(v) {
  if (v >= 7) return '#22C55E'
  if (v >= 5) return '#F59E0B'
  return '#EF4444'
}

function verdictStyle(v) {
  if (v === 'Ready')        return { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.2)',  text: '#22C55E' }
  if (v === 'Almost Ready') return { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)', text: '#F59E0B' }
  return                           { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.2)',  text: '#EF4444' }
}

function weakLabel(score) {
  if (score >= 7) return { text: 'Strong',             bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.2)',  color: '#22C55E' }
  if (score >= 5) return { text: 'Improving',          bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)', color: '#F59E0B' }
  return                 { text: 'Needs Improvement',  bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.2)',  color: '#EF4444' }
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const { user, userProfile } = useAuth()
  const {
    interviewsUsed, interviewsLeft, canStartInterview,
    resetDate, isPro, showUpgradeModal, setShowUpgradeModal,
  } = useUsage(userProfile)

  const [sessions, setSessions]   = useState([])
  const [weakAreas, setWeakAreas] = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: s }, { data: w }] = await Promise.all([
        supabase.from('sessions')
          .select('id, role, interview_type, total_score, verdict, completed_at')
          .eq('user_id', user.id).eq('completed', true)
          .order('completed_at', { ascending: false }).limit(8),
        supabase.from('weak_areas')
          .select('area, avg_score, occurrences').eq('user_id', user.id)
          .order('avg_score', { ascending: true }).limit(3),
      ])
      setSessions(s || [])
      setWeakAreas(w || [])
      setLoading(false)
    }
    load()
  }, [user])

  const bestScore     = sessions.reduce((m, s) => Math.max(m, s.total_score || 0), 0)
  const firstName     = userProfile?.name?.split(' ')[0] || 'there'
  const avgScore      = userProfile?.average_score ? parseFloat(userProfile.average_score) : null
  const totalSessions = userProfile?.total_sessions || sessions.length || 0
  const hasResume     = !!userProfile?.resume_filename
  const atsScore      = userProfile?.ats_score ?? null
  const atsFeedback   = userProfile?.ats_feedback ?? null

  function startWithRole(roleId) {
    if (!canStartInterview) { setShowUpgradeModal(true); return }
    navigate(`/interview/setup?role=${roleId}`)
  }

  const CARD_STYLE = {
    background: '#111827',
    border: '1px solid #2D3748',
    borderRadius: 16,
  }

  return (
    <AppLayout>
      <div style={{ background: '#0B0F19', minHeight: '100vh', padding: 32 }}>

        {/* Welcome header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>
            Welcome back, {firstName} 👋
          </h1>
          <p style={{ fontSize: 15, color: '#9CA3AF', marginTop: 6 }}>
            Ready to improve your interview skills today?
          </p>
        </div>

        {/* Two-column: Hero + Focus Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ marginBottom: 24 }}>

          {/* LEFT — Ready to Practice hero */}
          <div className="lg:col-span-8" style={{ ...CARD_STYLE, padding: 28 }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', margin: '0 0 8px 0' }}>
              Ready to Practice?
            </p>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px 0' }}>
              Start an AI mock interview tailored to your role.
            </p>

            <button
              onClick={() => { if (!canStartInterview) { setShowUpgradeModal(true); return } navigate('/interview/setup') }}
              className="w-full flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                height: 52, background: '#22C55E', borderRadius: 10,
                fontSize: 15, fontWeight: 700, color: '#000', border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#16A34A'
                e.currentTarget.style.boxShadow = '0 0 20px rgba(34,197,94,0.3)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#22C55E'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <Play size={16} color="#000" fill="#000" />
              Start Interview
            </button>

            {/* Role chips */}
            <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
              {ROLE_CHIPS.map(r => (
                <button
                  key={r.id}
                  onClick={() => startWithRole(r.id)}
                  className="transition-all duration-150"
                  style={{
                    background: 'transparent', border: '1px solid #374151',
                    color: '#9CA3AF', fontSize: 13, fontWeight: 500,
                    padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#1F2937'
                    e.currentTarget.style.borderColor = '#4B5563'
                    e.currentTarget.style.color = '#F9FAFB'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.borderColor = '#374151'
                    e.currentTarget.style.color = '#9CA3AF'
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Focus Areas */}
          <div className="lg:col-span-4" style={{ ...CARD_STYLE, padding: 24 }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <CircleDot size={18} color="#8B5CF6" />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>Focus Areas</p>
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 0 }}>
              Based on AI feedback as all sessions
            </p>

            {loading ? (
              <div className="flex justify-center" style={{ padding: '24px 0' }}>
                <Spinner size={18} color="border-purple-400" />
              </div>
            ) : weakAreas.length === 0 ? (
              <div>
                {[
                  { label: 'Technical Skills',  w: '40%' },
                  { label: 'Communication',     w: '55%' },
                  { label: 'Problem Solving',   w: '30%' },
                ].map((item, i) => (
                  <div key={i} style={{ marginTop: 20, opacity: 0.35 }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB' }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>—/10</span>
                    </div>
                    <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                      <p style={{ fontSize: 11, color: '#6B7280' }}>No sessions yet</p>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: '#6B7280',
                        background: '#1F2937', border: '1px solid #374151',
                        padding: '2px 8px', borderRadius: 4,
                      }}>Pending</span>
                    </div>
                    <div style={{ height: 4, background: '#1F2937', borderRadius: 2, marginTop: 8 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: item.w, background: '#374151' }} />
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 20, padding: '12px 14px', borderRadius: 8,
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                }}>
                  <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, margin: '0 0 4px 0' }}>
                    Complete an interview to unlock
                  </p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>
                    AI will analyse your responses and surface your real weak areas.
                  </p>
                </div>
                <Link
                  to="/interview/setup"
                  className="flex items-center gap-1 hover:underline"
                  style={{ color: '#22C55E', fontSize: 13, fontWeight: 500, marginTop: 14, display: 'flex' }}
                >
                  Start your first interview <ChevronRight size={13} />
                </Link>
              </div>
            ) : (
              <div>
                {weakAreas.map(a => {
                  const lbl = weakLabel(a.avg_score)
                  return (
                    <div key={a.area} style={{ marginTop: 20 }}>
                      {/* Name + score row */}
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB' }}>{a.area}</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                          <span style={{ color: scoreColor(a.avg_score) }}>{parseFloat(a.avg_score).toFixed(1)}</span>
                          <span style={{ color: '#6B7280' }}>/10</span>
                        </span>
                      </div>
                      {/* Badge + sessions row */}
                      <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
                        <p style={{ fontSize: 11, color: '#6B7280' }}>
                          {a.occurrences} session{a.occurrences > 1 ? 's' : ''}
                        </p>
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: lbl.color,
                          background: lbl.bg, border: `1px solid ${lbl.border}`,
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          {lbl.text}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 4, background: '#1F2937', borderRadius: 2, marginTop: 8 }}>
                        <div style={{
                          height: '100%', borderRadius: 2,
                          width: `${(a.avg_score / 10) * 100}%`,
                          background: scoreColor(a.avg_score),
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  )
                })}
                <Link
                  to="/interview/setup"
                  className="flex items-center gap-1 transition-colors hover:underline"
                  style={{ color: '#22C55E', fontSize: 13, fontWeight: 500, display: 'flex', marginTop: 16 }}
                >
                  Practice these areas <ChevronRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats row — modern metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>

          {/* Sessions card */}
          <div
            className="relative overflow-hidden group transition-all duration-200"
            style={{ ...CARD_STYLE, padding: '20px 22px' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#3B82F6'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2D3748'}
          >
            {/* Accent glow top-left */}
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sessions</span>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Target size={15} color="#3B82F6" />
              </div>
            </div>
            <p style={{ fontSize: 40, fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {isPro ? totalSessions : interviewsUsed}
            </p>
            <p style={{ fontSize: 12, color: '#4B5563' }}>
              {isPro ? 'Total completed' : `of 3 free this month`}
            </p>
            {/* Bottom accent bar */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }} />
          </div>

          {/* Average Score card */}
          <div
            className="relative overflow-hidden group transition-all duration-200"
            style={{ ...CARD_STYLE, padding: '20px 22px' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = avgScore ? scoreColor(avgScore) : '#22C55E'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2D3748'}
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)` }} />
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Score</span>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <BarChart2 size={15} color="#22C55E" />
              </div>
            </div>
            <p style={{ fontSize: 40, fontWeight: 800, color: avgScore ? scoreColor(avgScore) : '#374151', margin: '0 0 4px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {avgScore ? avgScore.toFixed(1) : '—'}
            </p>
            <p style={{ fontSize: 12, color: '#4B5563' }}>
              {avgScore ? 'All-time average' : 'No sessions yet'}
            </p>
            {avgScore && (
              <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: '#1F2937', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${(avgScore / 10) * 100}%`, background: scoreColor(avgScore), transition: 'width 0.8s ease' }} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              style={{ background: 'linear-gradient(90deg, transparent, #22C55E, transparent)' }} />
          </div>

          {/* Best Score card */}
          <div
            className="relative overflow-hidden group transition-all duration-200"
            style={{ ...CARD_STYLE, padding: '20px 22px' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#F59E0B'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#2D3748'}
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best Score</span>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <Trophy size={15} color="#F59E0B" />
              </div>
            </div>
            <p style={{ fontSize: 40, fontWeight: 800, color: bestScore ? '#F59E0B' : '#374151', margin: '0 0 4px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {bestScore ? bestScore.toFixed(1) : '—'}
            </p>
            <p style={{ fontSize: 12, color: '#4B5563' }}>Personal best</p>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)' }} />
          </div>

          {/* ATS Score card */}
          {hasResume && isPro && atsScore != null ? (
            <div
              className="relative overflow-hidden group transition-all duration-200"
              style={{ ...CARD_STYLE, padding: '20px 22px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = scoreColor(atsScore / 10)}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2D3748'}
            >
              <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)` }} />
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ATS Score</span>
                <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <Award size={15} color="#8B5CF6" />
                </div>
              </div>
              <p style={{ fontSize: 40, fontWeight: 800, color: scoreColor(atsScore / 10), margin: '0 0 4px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
                {atsScore}
              </p>
              <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 8 }}>{atsFeedback?.grade || 'ATS Analyzed'}</p>
              <Link to="/profile" style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600 }} className="hover:underline">
                View resume details →
              </Link>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, transparent, #8B5CF6, transparent)' }} />
            </div>
          ) : (
            /* Pro upsell / no-resume placeholder */
            <div
              className="relative overflow-hidden group transition-all duration-200"
              style={{ ...CARD_STYLE, padding: '20px 22px', opacity: 0.7 }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ATS Score</span>
                <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: '#1F2937', border: '1px solid #374151' }}>
                  <Lock size={15} color="#6B7280" />
                </div>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#4B5563', margin: '0 0 6px 0' }}>Pro only</p>
              <Link to="/upgrade" style={{ fontSize: 11, color: '#22C55E', fontWeight: 600 }} className="hover:underline">
                Upgrade to unlock →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Interviews */}
        <div style={{ ...CARD_STYLE, padding: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>Recent Interviews</p>
            <Link
              to="/progress"
              style={{ fontSize: 13, fontWeight: 500, color: '#22C55E' }}
              className="hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center" style={{ padding: '32px 0' }}>
              <Spinner size={20} color="border-emerald-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center" style={{ padding: '40px 0' }}>
              <Target size={36} color="#374151" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#6B7280' }}>No interviews yet</p>
              <p style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>Start your first interview to see results here</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div
                className="hidden md:grid"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                  paddingBottom: 12,
                  borderBottom: '1px solid #1F2937',
                  gap: 16,
                }}
              >
                {['ROLE', 'TYPE', 'SCORE', 'VERDICT', 'DATE', ''].map((h, i) => (
                  <p key={i} style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{h}</p>
                ))}
              </div>

              {sessions.map(s => {
                const vs = s.verdict ? verdictStyle(s.verdict) : null
                return (
                  <div
                    key={s.id}
                    className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center transition-colors duration-150"
                    style={{ height: 56, borderBottom: '1px solid #1F2937', gap: 16, cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB', margin: 0 }} className="truncate capitalize">
                      {s.role?.replace(/_/g, ' ')}
                    </p>

                    <div className="hidden md:block">
                      <span style={{
                        fontSize: 13, color: '#9CA3AF',
                        background: '#1F2937', padding: '4px 12px', borderRadius: 20,
                      }}>
                        {s.interview_type}
                      </span>
                    </div>

                    <p className="hidden md:block" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>
                      <span style={{ color: s.total_score != null ? scoreColor(s.total_score) : '#6B7280' }}>
                        {s.total_score != null ? parseFloat(s.total_score).toFixed(1) : '—'}
                      </span>
                      {s.total_score != null && <span style={{ color: '#6B7280' }}>/10</span>}
                    </p>

                    <div className="hidden md:block">
                      {vs && (
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: vs.text,
                          background: vs.bg, border: `1px solid ${vs.border}`,
                          padding: '4px 12px', borderRadius: 6,
                        }}>
                          {s.verdict}
                        </span>
                      )}
                    </div>

                    <p className="hidden md:block" style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                      {s.completed_at ? new Date(s.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </p>

                    <Link
                      to={`/report/${s.id}`}
                      className="flex items-center gap-1.5 hover:underline"
                      style={{ fontSize: 13, fontWeight: 600, color: '#22C55E', whiteSpace: 'nowrap' }}
                    >
                      <Eye size={15} /> View Report
                    </Link>
                  </div>
                )
              })}
            </>
          )}
        </div>

      </div>

      {showUpgradeModal && (
        <UpgradeModal resetDate={resetDate} onClose={() => setShowUpgradeModal(false)} />
      )}
    </AppLayout>
  )
}
