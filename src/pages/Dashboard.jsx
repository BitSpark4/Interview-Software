import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  PlayCircle, Target, ChartBar, Trophy,
  Eye, Circle, CaretRight, Medal, Lock, X,
  Rocket, Sparkle, Lightning,
} from '@phosphor-icons/react'
import AppLayout from '../components/AppLayout'
import ProFeatureWrapper from '../components/ProFeatureWrapper'
import UpgradeModal from '../components/UpgradeModal'
import Spinner from '../components/Spinner'
import { EmptyStudyAnimation, SectorIcon } from '../components/LottieAnimation'
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
  const { user, userProfile, refreshProfile } = useAuth()
  const {
    interviewsUsed, interviewsLeft, canStartInterview,
    resetDate, isPro, showUpgradeModal, setShowUpgradeModal,
  } = useUsage(userProfile)

  const [sessions, setSessions]       = useState([])
  const [weakAreas, setWeakAreas]     = useState([])
  const [loading, setLoading]         = useState(true)
  const [savingGoal, setSavingGoal]         = useState(false)
  const [goalError, setGoalError]           = useState('')
  const [toast, setToast]                   = useState('')
  const [sectorStats, setSectorStats]       = useState({ count: 0, avg: null })
  const [showChangeWarning, setShowChangeWarning] = useState(false)
  const [showSectorPicker, setShowSectorPicker]   = useState(false)

  const SECTORS = [
    { id: 'it_tech',     label: 'IT & Technology',           emoji: '💻', color: '#3B82F6' },
    { id: 'government',  label: 'Government Services',        emoji: '🏛️', color: '#8B5CF6' },
    { id: 'banking',     label: 'Banking & Finance',          emoji: '🏦', color: '#F59E0B' },
    { id: 'engineering', label: 'Engineering',                emoji: '⚙️', color: '#22C55E' },
    { id: 'medical',     label: 'Medical & Healthcare',       emoji: '🏥', color: '#EF4444' },
    { id: 'students',    label: 'Students & Entrance Exams',  emoji: '🎓', color: '#F97316' },
    { id: 'business',    label: 'Business & Management',      emoji: '📊', color: '#EC4899' },
  ]

  // Show onboarding when primary_sector not yet set
  const showOnboarding = !!userProfile && !userProfile.primary_sector

  async function saveCareerGoal(sectorId) {
    const sector = SECTORS.find(s => s.id === sectorId)
    if (!sector || !user) return
    setSavingGoal(true)
    setGoalError('')
    try {
      // Step 1 — Close previous career_history entry if one exists
      const { data: currentEntry } = await supabase
        .from('career_history')
        .select('id, sector')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .maybeSingle()

      if (currentEntry) {
        const { data: sectorSessions } = await supabase
          .from('sessions')
          .select('total_score')
          .eq('user_id', user.id)
          .eq('sector', currentEntry.sector)
          .eq('completed', true)
        const scores    = (sectorSessions || []).map(s => s.total_score ?? 0).filter(v => v > 0)
        const count     = scores.length
        const avg       = count ? parseFloat((scores.reduce((a, b) => a + b, 0) / count).toFixed(2)) : 0
        const best      = count ? parseFloat(Math.max(...scores).toFixed(2)) : 0
        const milestone = getMilestone(count, avg).label
        await supabase.from('career_history').update({
          ended_at:          new Date().toISOString(),
          is_current:        false,
          total_sessions:    count,
          average_score:     avg,
          best_score:        best,
          milestone_reached: milestone,
        }).eq('id', currentEntry.id)
      }

      // Step 2 — Create new career_history entry
      await supabase.from('career_history').insert({
        user_id:      user.id,
        sector:       sectorId,
        sector_label: sector.label,
        started_at:   new Date().toISOString(),
        is_current:   true,
      })

      // Step 3 — Update users table
      const { error } = await supabase.from('users').update({
        primary_sector:      sectorId,
        career_goal:         sector.label,
        last_active_sector:  sectorId,
        onboarding_complete: true,
      }).eq('id', user.id)
      if (error) throw error

      // Step 4 — Close modal + toast
      await refreshProfile()
      setShowSectorPicker(false)
      setToast('Career goal updated successfully')
      setTimeout(() => setToast(''), 3000)
    } catch (err) {
      setGoalError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSavingGoal(false)
    }
  }

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

  // Fetch primary-sector stats when profile loads
  useEffect(() => {
    const sector = userProfile?.primary_sector
    if (!user || !sector) return
    async function loadSectorStats() {
      const { data } = await supabase
        .from('sessions')
        .select('total_score')
        .eq('user_id', user.id)
        .eq('sector', sector)
        .eq('completed', true)
      if (!data) return
      const count = data.length
      const avg   = count
        ? data.reduce((sum, s) => sum + (s.total_score ?? 0), 0) / count
        : null
      setSectorStats({ count, avg: avg ? parseFloat(avg.toFixed(1)) : null })
    }
    loadSectorStats()
  }, [user, userProfile?.primary_sector])

  function getMilestone(count, avg) {
    if (avg > 8.5) return { label: 'Expert — Interview Ready ✓',    color: '#22C55E', bg: 'rgba(34,197,94,0.15)'  }
    if (avg > 7.5) return { label: 'Ready — Interview Confident',    color: '#22C55E', bg: 'rgba(34,197,94,0.12)'  }
    if (count >= 11) return { label: 'Preparing — Almost There',     color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' }
    if (count >= 4)  return { label: 'Learner — Getting Serious',    color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' }
    if (count >= 1)  return { label: 'Explorer — Building Foundation',color: '#F97316', bg: 'rgba(249,115,22,0.12)' }
    return               { label: 'Beginner — Just Started',         color: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
  }

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
    border: '1px solid #1E293B',
    borderRadius: 16,
  }

  return (
    <AppLayout>
      <style>{`
        @keyframes iconGlowBlue {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
          50%       { box-shadow: 0 0 14px 4px rgba(37,99,235,0.28); }
        }
        @keyframes iconGlowGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
          50%       { box-shadow: 0 0 14px 4px rgba(245,158,11,0.32); }
        }
        @keyframes iconGlowPurple {
          0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0); }
          50%       { box-shadow: 0 0 14px 4px rgba(139,92,246,0.28); }
        }
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.18); }
        }
        @keyframes iconSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes iconRing {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0px) rotate(-15deg); }
          50%       { transform: translateY(-6px) rotate(-15deg); }
        }
        @keyframes sparkleRotate {
          0%   { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.4); }
          50%       { box-shadow: 0 0 24px 6px rgba(37,99,235,0.25); }
        }
        @keyframes btnGlowGold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.4); }
          50%       { box-shadow: 0 0 24px 6px rgba(245,158,11,0.25); }
        }
      `}</style>
      <div style={{ background: '#0A0F1E', minHeight: '100vh', padding: 32 }}>

        {/* Welcome header */}
        <div style={{ marginBottom: userProfile?.primary_sector ? 16 : 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>
              Welcome back, {firstName} 👋
            </h1>
            <Rocket size={28} color="#2563EB" style={{ animation: 'rocketFloat 2.4s ease-in-out infinite', flexShrink: 0 }} />
          </div>
          <p style={{ fontSize: 15, color: '#9CA3AF', marginTop: 6 }}>
            Ready to improve your interview skills today?
          </p>
        </div>

        {/* Career goal card — shown when primary_sector is set */}
        {userProfile?.primary_sector && (() => {
          const sector    = SECTORS.find(s => s.id === userProfile.primary_sector)
          const milestone = getMilestone(sectorStats.count, sectorStats.avg)
          return (
            <div style={{
              background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: 12, padding: '16px 20px', marginBottom: 24,
              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 20,
            }}>
              {/* Goal label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 180 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{
                    position: 'absolute', inset: -4, borderRadius: '50%',
                    border: '2px solid #2563EB',
                    animation: 'iconRing 2s ease-out infinite',
                  }} />
                  <Target size={20} color="#2563EB" />
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px 0' }}>
                    Your Career Goal
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <SectorIcon sector={userProfile.primary_sector} size={22} />
                    <p style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>
                      {sector?.label ?? userProfile.career_goal}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 40, background: 'rgba(37,99,235,0.2)', flexShrink: 0 }} className="hidden sm:block" />

              {/* Stats */}
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 2px 0' }}>Sessions</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>{sectorStats.count}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 2px 0' }}>Avg Score</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: sectorStats.avg ? scoreColor(sectorStats.avg) : '#4B5563', margin: 0 }}>
                    {sectorStats.avg ?? '—'}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 4px 0' }}>Milestone</p>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: milestone.color,
                    background: milestone.bg, padding: '3px 10px', borderRadius: 6,
                  }}>
                    {milestone.label}
                  </span>
                </div>
              </div>

              {/* Change goal button */}
              <button
                onClick={() => setShowChangeWarning(true)}
                style={{
                  background: 'transparent', border: '1px solid rgba(37,99,235,0.25)',
                  color: '#64748B', fontSize: 12, padding: '6px 14px',
                  borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)'; e.currentTarget.style.color = '#94A3B8' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'; e.currentTarget.style.color = '#64748B' }}
              >
                Change Goal
              </button>
            </div>
          )
        })()}

        {/* Two-column: Hero + Focus Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ marginBottom: 24 }}>

          {/* LEFT — Ready to Practice hero */}
          <div className="lg:col-span-8" style={{ ...CARD_STYLE, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>
                Ready to Practice?
              </p>
              <Sparkle size={18} color="#F59E0B" weight="fill" style={{ animation: 'sparkleRotate 3s ease-in-out infinite' }} />
            </div>
            <p style={{ fontSize: 14, color: '#9CA3AF', margin: '0 0 24px 0' }}>
              Start an AI mock interview tailored to your role.
            </p>

            {!isPro && interviewsLeft === 0 ? (
              <button
                onClick={() => navigate('/upgrade')}
                className="w-full flex items-center justify-center gap-2 transition-all duration-200"
                style={{ height: 52, background: '#F59E0B', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#000', border: 'none', cursor: 'pointer', animation: 'btnGlowGold 2.5s ease-in-out infinite' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#D97706' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F59E0B' }}
              >
                <Lightning size={18} color="#000" weight="fill" />
                Upgrade for Unlimited Practice
              </button>
            ) : (
              <button
                onClick={() => { if (!canStartInterview) { setShowUpgradeModal(true); return } navigate('/interview/setup') }}
                className="w-full flex items-center justify-center gap-2 transition-all duration-200"
                style={{ height: 52, background: '#2563EB', borderRadius: 10, fontSize: 15, fontWeight: 700, color: '#fff', border: 'none', cursor: 'pointer', animation: 'btnGlow 2.5s ease-in-out infinite' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1D4ED8' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#2563EB' }}
              >
                <PlayCircle size={20} color="#fff" weight="fill" style={{ animation: 'iconFloat 2s ease-in-out infinite' }} />
                Start Interview
              </button>
            )}

            {/* Role chips */}
            <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
              {ROLE_CHIPS.map(r => (
                <button
                  key={r.id}
                  onClick={() => startWithRole(r.id)}
                  className="transition-all duration-150"
                  style={{
                    background: '#1E293B', border: '1px solid #334155',
                    color: '#94A3B8', fontSize: 13, fontWeight: 500,
                    padding: '6px 16px', borderRadius: 20, cursor: 'pointer',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#334155'
                    e.currentTarget.style.borderColor = '#475569'
                    e.currentTarget.style.color = '#F8FAFC'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#1E293B'
                    e.currentTarget.style.borderColor = '#334155'
                    e.currentTarget.style.color = '#94A3B8'
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT — Focus Areas */}
          <div className="lg:col-span-4" style={{ ...CARD_STYLE, padding: 24, borderLeft: '3px solid #F59E0B' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid #F59E0B', animation: 'iconRing 2s ease-out infinite',
                }} />
                <Lightning size={14} color="#F59E0B" weight="fill" style={{ animation: 'iconPulse 2s ease-in-out infinite' }} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>Focus Areas</p>
            </div>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 0 }}>
              Based on AI feedback across all sessions
            </p>

            <ProFeatureWrapper
              userProfile={userProfile}
              featureName="Focus Areas"
              description="See your weak topics and get targeted practice"
              compact={true}
            >
            {loading ? (
              <div className="flex justify-center" style={{ padding: '24px 0' }}>
                <Spinner size={18} color="border-purple-400" />
              </div>
            ) : totalSessions < 3 ? (
              <div style={{ marginTop: 20 }}>
                {[
                  { label: 'Technical Skills',  w: '40%' },
                  { label: 'Communication',     w: '55%' },
                  { label: 'Problem Solving',   w: '30%' },
                ].map((item, i) => (
                  <div key={i} style={{ marginTop: i > 0 ? 20 : 0, opacity: 0.25 }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB' }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#6B7280' }}>—/10</span>
                    </div>
                    <div style={{ height: 4, background: '#1E293B', borderRadius: 2, marginTop: 10 }}>
                      <div style={{ height: '100%', borderRadius: 2, width: item.w, background: '#374151' }} />
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 20, padding: '12px 14px', borderRadius: 8,
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                }}>
                  <p style={{ fontSize: 12, color: '#8B5CF6', fontWeight: 600, margin: '0 0 4px 0' }}>
                    {3 - totalSessions} more interview{3 - totalSessions !== 1 ? 's' : ''} to unlock
                  </p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>
                    AI identifies your real weak areas after 3 sessions.
                  </p>
                </div>
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
                        background: '#1E293B', border: '1px solid #374151',
                        padding: '2px 8px', borderRadius: 4,
                      }}>Pending</span>
                    </div>
                    <div style={{ height: 4, background: '#1E293B', borderRadius: 2, marginTop: 8 }}>
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
                  style={{ color: '#2563EB', fontSize: 13, fontWeight: 500, marginTop: 14, display: 'flex' }}
                >
                  Start your first interview <CaretRight size={13} />
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
                      <div style={{ height: 4, background: '#1E293B', borderRadius: 2, marginTop: 8 }}>
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
                  style={{ color: '#2563EB', fontSize: 13, fontWeight: 500, display: 'flex', marginTop: 16 }}
                >
                  Practice these areas <CaretRight size={13} />
                </Link>
              </div>
            )}
            </ProFeatureWrapper>
          </div>
        </div>

        {/* Stats row — modern metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>

          {/* Sessions card */}
          <div
            className="relative overflow-hidden group transition-all duration-200"
            style={{
              ...CARD_STYLE, padding: '20px 22px',
              borderTop: '2px solid #2563EB',
              ...((!isPro && interviewsLeft === 0) ? { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderTop: '2px solid #2563EB' } : {}),
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = isPro ? '#2563EB' : interviewsLeft === 0 ? 'rgba(239,68,68,0.4)' : '#2563EB'}
            onMouseLeave={e => e.currentTarget.style.borderColor = (!isPro && interviewsLeft === 0) ? 'rgba(239,68,68,0.2)' : '#1E293B'}
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Sessions</span>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', animation: 'iconGlowBlue 2.5s ease-in-out infinite' }}>
                <Target size={15} color="#3B82F6" style={{ animation: 'iconFloat 2.5s ease-in-out infinite' }} />
              </div>
            </div>
            <p style={{ fontSize: 40, fontWeight: 800, color: '#F9FAFB', margin: '0 0 4px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {isPro ? totalSessions : interviewsUsed}
            </p>
            {isPro ? (
              <p style={{ fontSize: 12, color: '#4B5563' }}>Total completed</p>
            ) : interviewsLeft === 0 ? (
              <>
                <p style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, margin: '0 0 2px 0' }}>Monthly limit reached</p>
                <p style={{ fontSize: 11, color: '#6B7280' }}>Resets on 1st next month</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 12, color: '#4B5563', marginBottom: 8 }}>{interviewsLeft} session{interviewsLeft !== 1 ? 's' : ''} remaining this month</p>
                <div style={{ height: 4, background: '#1E293B', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${(interviewsUsed / 3) * 100}%`, background: '#F59E0B', transition: 'width 0.5s ease' }} />
                </div>
              </>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)' }} />
          </div>

          {/* Average Score card */}
          <div
            className="relative overflow-hidden group transition-all duration-200"
            style={{ ...CARD_STYLE, padding: '20px 22px', borderTop: `2px solid ${avgScore ? scoreColor(avgScore) : '#334155'}` }}
            onMouseEnter={e => e.currentTarget.style.borderColor = avgScore ? scoreColor(avgScore) : '#334155'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1E293B'}
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `radial-gradient(circle, rgba(100,116,139,0.12) 0%, transparent 70%)` }} />
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Score</span>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)', animation: 'iconGlowBlue 3s ease-in-out infinite' }}>
                <ChartBar size={15} color="#64748B" style={{ animation: 'iconPulse 3s ease-in-out infinite' }} />
              </div>
            </div>
            <p style={{ fontSize: 40, fontWeight: 800, color: avgScore ? scoreColor(avgScore) : '#374151', margin: '0 0 4px 0', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {avgScore ? avgScore.toFixed(1) : '—'}
            </p>
            <p style={{ fontSize: 12, color: '#4B5563' }}>
              {avgScore ? 'All-time average' : 'No sessions yet'}
            </p>
            {avgScore && (
              <div style={{ marginTop: 10, height: 3, borderRadius: 2, background: '#1E293B', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 2, width: `${(avgScore / 10) * 100}%`, background: scoreColor(avgScore), transition: 'width 0.8s ease' }} />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              style={{ background: 'linear-gradient(90deg, transparent, #2563EB, transparent)' }} />
          </div>

          {/* Best Score card */}
          <div
            className="relative overflow-hidden group transition-all duration-200"
            style={{ ...CARD_STYLE, padding: '20px 22px', borderTop: '2px solid #F59E0B' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#F59E0B'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1E293B'}
          >
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best Score</span>
              <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', animation: 'iconGlowGold 2s ease-in-out infinite' }}>
                <Trophy size={15} color="#F59E0B" weight="fill" style={{ animation: 'iconFloat 2s ease-in-out infinite' }} />
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
                <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', animation: 'iconGlowPurple 2.8s ease-in-out infinite' }}>
                  <Medal size={15} color="#8B5CF6" weight="fill" style={{ animation: 'iconPulse 2.8s ease-in-out infinite' }} />
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
                <div className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: '#1E293B', border: '1px solid #374151' }}>
                  <Lock size={15} color="#6B7280" />
                </div>
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#4B5563', margin: '0 0 6px 0' }}>Pro only</p>
              <Link to="/upgrade" style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }} className="hover:underline">
                Upgrade to unlock →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Interviews */}
        <div style={{ ...CARD_STYLE, padding: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ChartBar size={18} color="#2563EB" style={{ animation: 'iconFloat 2.5s ease-in-out infinite' }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>Recent Interviews</p>
            </div>
            <Link
              to="/progress"
              style={{ fontSize: 13, fontWeight: 500, color: '#2563EB' }}
              className="hover:underline"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center" style={{ padding: '32px 0' }}>
              <Spinner size={20} color="border-blue-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center' }}>
              <EmptyStudyAnimation size={180} />
              <h3 style={{ color: '#F8FAFC', fontSize: '18px', fontWeight: '600', margin: '8px 0 8px' }}>No interviews yet</h3>
              <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px', maxWidth: '280px', lineHeight: '1.6' }}>
                Start your first practice session and see your results here
              </p>
              <button
                onClick={() => navigate('/interview/setup')}
                style={{ background: '#2563EB', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 28px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Start First Interview →
              </button>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div
                className="hidden md:grid"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                  paddingBottom: 12,
                  borderBottom: '1px solid #1E293B',
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
                    style={{ height: 56, borderBottom: '1px solid #1E293B', gap: 16, cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#F9FAFB', margin: 0 }} className="truncate capitalize">
                      {s.role?.replace(/_/g, ' ')}
                    </p>

                    <div className="hidden md:block">
                      <span style={{
                        fontSize: 13, color: '#9CA3AF',
                        background: '#1E293B', padding: '4px 12px', borderRadius: 20,
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
                      style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', whiteSpace: 'nowrap' }}
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

      {/* Career goal onboarding modal */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520 }}>

            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 24 }}>🎯</span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', margin: '0 0 6px 0' }}>
                What is your career goal?
              </h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
                Choose your primary sector. We'll personalise your AI coaching and track your progress toward this goal.
              </p>
            </div>

            {/* Sector grid */}
            <div className="grid grid-cols-1 gap-2" style={{ marginBottom: 20 }}>
              {SECTORS.map(s => (
                <button
                  key={s.id}
                  onClick={() => saveCareerGoal(s.id)}
                  disabled={savingGoal}
                  className="flex items-center gap-3 w-full text-left transition-all duration-150"
                  style={{
                    background: '#0B0F19', border: '1px solid #1E293B',
                    borderRadius: 12, padding: '14px 18px',
                    cursor: savingGoal ? 'not-allowed' : 'pointer', opacity: savingGoal ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!savingGoal) e.currentTarget.style.borderColor = s.color }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E293B' }}
                >
                  <SectorIcon sector={s.id} size={26} />
                  <div className="flex-1">
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', margin: 0 }}>{s.label}</p>
                  </div>
                  {savingGoal && (
                    <Spinner size={14} color={`border-[${s.color}]`} />
                  )}
                  <CaretRight size={16} color="#4B5563" />
                </button>
              ))}
            </div>

            {goalError && (
              <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{goalError}</p>
            )}

            <p style={{ fontSize: 12, color: '#4B5563', textAlign: 'center', marginTop: 8 }}>
              You can change your goal anytime from your Profile page
            </p>
          </div>
        </div>
      )}

      {/* Change Career Goal — warning modal */}
      {showChangeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#111827', border: '1px solid #374151', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB', margin: '0 0 10px 0' }}>
                Change Your Career Goal?
              </h2>
              <p style={{ fontSize: 14, color: '#9CA3AF', margin: 0, lineHeight: 1.6 }}>
                Changing your primary sector will <strong style={{ color: '#F9FAFB' }}>reset your focus plan</strong> and
                AI coaching direction. Your past session history will be preserved, but milestones and progress
                tracking will shift to the new goal.
              </p>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: '#F59E0B', margin: 0 }}>
                💡 Tip: If you just want to explore another sector, you don't need to change your goal — you can start any interview freely.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowChangeWarning(false)}
                style={{ flex: 1, height: 44, background: 'transparent', border: '1px solid #374151', borderRadius: 10, color: '#9CA3AF', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#4B5563'; e.currentTarget.style.color = '#F9FAFB' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#374151'; e.currentTarget.style.color = '#9CA3AF' }}
              >
                Keep Current Goal
              </button>
              <button
                onClick={() => { setShowChangeWarning(false); setShowSectorPicker(true) }}
                style={{ flex: 1, height: 44, background: '#2563EB', border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
                onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
              >
                Yes, Change Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Career Goal — sector picker modal */}
      {showSectorPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB', margin: '0 0 4px 0' }}>Select New Career Goal</h2>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Choose your new primary sector</p>
              </div>
              <button
                onClick={() => setShowSectorPicker(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4 }}
                onMouseEnter={e => e.currentTarget.style.color = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2" style={{ marginBottom: 16 }}>
              {SECTORS.map(s => (
                <button
                  key={s.id}
                  onClick={() => saveCareerGoal(s.id)}
                  disabled={savingGoal}
                  className="flex items-center gap-3 w-full text-left transition-all duration-150"
                  style={{
                    background: userProfile?.primary_sector === s.id ? `rgba(37,99,235,0.08)` : '#0A0F1E',
                    border: `1px solid ${userProfile?.primary_sector === s.id ? 'rgba(37,99,235,0.3)' : '#1E293B'}`,
                    borderRadius: 12, padding: '14px 18px',
                    cursor: savingGoal ? 'not-allowed' : 'pointer', opacity: savingGoal ? 0.6 : 1,
                  }}
                  onMouseEnter={e => { if (!savingGoal) e.currentTarget.style.borderColor = s.color }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = userProfile?.primary_sector === s.id ? 'rgba(37,99,235,0.3)' : '#1E293B' }}
                >
                  <SectorIcon sector={s.id} size={26} />
                  <div className="flex-1">
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', margin: 0 }}>{s.label}</p>
                  </div>
                  {savingGoal ? <Spinner size={14} color="border-blue-400" /> : <CaretRight size={16} color="#4B5563" />}
                </button>
              ))}
            </div>
            {goalError && <p style={{ color: '#EF4444', fontSize: 13, textAlign: 'center' }}>{goalError}</p>}
          </div>
        </div>
      )}

      {showUpgradeModal && (
        <UpgradeModal resetDate={resetDate} onClose={() => setShowUpgradeModal(false)} />
      )}

      {/* Success toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#2563EB', color: '#fff',
          fontSize: 14, fontWeight: 600, padding: '12px 24px',
          borderRadius: 10, boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
          pointerEvents: 'none',
        }}>
          ✓ {toast}
        </div>
      )}
    </AppLayout>
  )
}
