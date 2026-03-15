import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useUsage } from '../hooks/useUsage'
import Navbar from '../components/Navbar'
import ProgressBar from '../components/ProgressBar'
import UpgradeModal from '../components/UpgradeModal'
import SessionCard from '../components/SessionCard'
import { supabase } from '../lib/supabase'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const {
    interviewsUsed,
    interviewsLeft,
    canStartInterview,
    resetDate,
    isPro,
    showUpgradeModal,
    setShowUpgradeModal,
  } = useUsage(userProfile)

  const [recentSessions, setRecentSessions] = useState([])

  useEffect(() => {
    if (!user) return

    async function loadSessions() {
      try {
        const { data } = await supabase
          .from('sessions')
          .select('id, role, interview_type, total_score, verdict, completed_at, created_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentSessions(data || [])
      } catch {
        // non-critical — dashboard still works without recent sessions
      }
    }

    loadSessions()
  }, [user])

  function handleStartInterview() {
    if (!canStartInterview) { setShowUpgradeModal(true); return }
    navigate('/interview/setup')
  }

  const firstName = userProfile?.name?.split(' ')[0] || 'there'

  const stats = [
    {
      label: 'This Month',
      value: isPro ? `${interviewsUsed}` : `${interviewsUsed}/3`,
      sub: isPro ? 'Unlimited plan' : `Resets ${resetDate}`,
    },
    { label: 'Avg Score', value: userProfile?.average_score ? `${userProfile.average_score}/10` : '—', sub: 'Last 5 sessions' },
    { label: 'Total Sessions', value: userProfile?.total_sessions ?? 0, sub: 'All time' },
    { label: 'Streak', value: userProfile?.streak_count ? `🔥 ${userProfile.streak_count}` : '—', sub: 'Days in a row' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Pro banner */}
        {isPro && (
          <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="text-emerald-400 text-sm">✦</span>
            </div>
            <div>
              <p className="text-emerald-400 text-sm font-medium font-mono">Pro Plan Active</p>
              <p className="text-gray-500 text-xs">Unlimited interviews · Resume-aware questions · Full progress tracking</p>
            </div>
          </div>
        )}

        <div>
          <h1 className="font-mono font-bold text-white text-2xl">
            Welcome back, {firstName}{isPro ? ' ✦' : ''}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {canStartInterview
              ? `You have ${interviewsLeft === 'Unlimited' ? 'unlimited' : `${interviewsLeft} interview${interviewsLeft === 1 ? '' : 's'}`} remaining this month`
              : "You've used all 3 free interviews this month"}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(stat => (
            <div
              key={stat.label}
              className={`rounded-lg p-4 border ${
                isPro
                  ? 'bg-gray-900 border-emerald-500/15'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <p className="text-gray-600 text-xs mb-1">{stat.label}</p>
              <p className={`font-mono font-bold text-xl ${isPro ? 'text-emerald-300' : 'text-white'}`}>
                {stat.value}
              </p>
              <p className="text-gray-600 text-xs mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {!isPro && <ProgressBar value={interviewsUsed} max={3} />}

        <button
          type="button"
          onClick={handleStartInterview}
          className={`w-full font-bold py-4 rounded-xl text-lg transition-all min-h-11 ${
            !canStartInterview
              ? 'bg-amber-500 hover:bg-amber-400 text-black'
              : isPro
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_24px_rgba(16,185,129,0.25)] hover:shadow-[0_0_32px_rgba(16,185,129,0.35)]'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black'
          }`}
        >
          {!canStartInterview ? 'Upgrade to Continue' : isPro ? '✦ Start Pro Interview' : 'Start New Interview'}
        </button>

        <div>
          <h2 className="font-mono font-bold text-white text-base mb-3">Recent Interviews</h2>
          <div className="space-y-2">
            {recentSessions.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                <p className="text-3xl mb-3">🎯</p>
                <p className="text-sm">No interviews yet</p>
                <p className="text-xs mt-1">Start your first interview to see results here</p>
              </div>
            ) : (
              recentSessions.map(s => <SessionCard key={s.id} session={s} />)
            )}
          </div>
        </div>
      </div>

      {showUpgradeModal && (
        <UpgradeModal resetDate={resetDate} onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  )
}
