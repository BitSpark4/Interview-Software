import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChartLineUp, Target, ChartBar, Trophy, Lightning, Warning, Eye, CaretRight, PlayCircle, Sparkle, ArrowUp, ArrowDown, ArrowRight, BookOpen, Lightbulb, ClipboardText, CaretLeft, Star, Medal, Crown, Globe } from '@phosphor-icons/react'
import { FireStreakAnimation } from '../components/LottieAnimation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import AppLayout from '../components/AppLayout'
import ProFeatureWrapper from '../components/ProFeatureWrapper'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { supabase } from '../lib/supabase'
import { verdictColor, scoreColor } from '../utils/scoreHelpers'
import { formatDate } from '../utils/dateHelpers'

export default function Progress() {
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()
  const { sessions, weakAreas, strongAreas, sectorGroups, chartData, filteredChartData, chartFilter, setChartFilter, bestScore, readinessScore, weeklyCount, loading, error } = useProgress(user?.id)

  // Readiness ring
  const RADIUS = 54
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const ringOffset = CIRCUMFERENCE * (1 - readinessScore / 100)
  const ringColor = readinessScore < 50 ? '#EF4444' : readinessScore <= 75 ? '#F59E0B' : '#22C55E'

  const aiMessage = sessions.length === 0
    ? 'Welcome! Start your first interview to get personalized AI coaching and track your progress over time.'
    : readinessScore < 50
    ? 'You are just getting started. Every expert was once a beginner. Practice daily for 2 weeks and you will see major improvement.'
    : readinessScore <= 75
    ? 'Good progress! You are getting there. Focus on your weak topics listed below and practice 3 more sessions this week.'
    : 'Excellent! You are nearly interview ready. A few more practice sessions and you will be fully confident.'

  // Trend: compare last 3 vs previous 3 sessions (chronological order)
  const trendInfo = (() => {
    const data = filteredChartData
    if (data.length < 4) return null
    const last3 = data.slice(-3).map(d => d.score)
    const prev3 = data.slice(-6, -3).map(d => d.score)
    if (!prev3.length) return null
    const avgLast = last3.reduce((a, b) => a + b, 0) / last3.length
    const avgPrev = prev3.reduce((a, b) => a + b, 0) / prev3.length
    const pct = Math.abs(Math.round(((avgLast - avgPrev) / avgPrev) * 100))
    if (avgLast > avgPrev) return { dir: 'up',    pct, label: `Up ${pct}% from last sessions` }
    if (avgLast < avgPrev) return { dir: 'down',  pct, label: `Down ${pct}% — review your weak areas` }
    return { dir: 'stable', pct: 0, label: 'Stable — push harder this week' }
  })()

  // X axis date formatter
  const fmtX = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`
  }

  // Custom tooltip
  const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        <p className="text-gray-400">{fmtX(d.date)}</p>
        <p className="text-white font-bold text-sm">{d.score}/10</p>
        <p className="text-gray-400 capitalize mt-0.5">{d.sector?.replace(/_/g,' ')} · {d.role?.replace(/_/g,' ')}</p>
        <p className="text-blue-400 mt-1">Click dot to view report →</p>
      </div>
    )
  }

  // Custom clickable dot
  const ClickableDot = (props) => {
    const { cx, cy, payload } = props
    return (
      <circle
        cx={cx} cy={cy} r={5}
        fill="#2563EB" stroke="#0f172a" strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => navigate(`/report/${payload.id}`)}
      />
    )
  }

  // Sector metadata
  const SECTOR_META = {
    it_tech:     { label: 'IT & Technology',          emoji: '💻', color: '#3B82F6' },
    government:  { label: 'Government Services',       emoji: '🏛️', color: '#8B5CF6' },
    banking:     { label: 'Banking & Finance',         emoji: '🏦', color: '#F59E0B' },
    engineering: { label: 'Engineering',               emoji: '⚙️', color: '#22C55E' },
    medical:     { label: 'Medical & Healthcare',      emoji: '🏥', color: '#EF4444' },
    students:    { label: 'Students & Entrance Exams', emoji: '🎓', color: '#F97316' },
    business:    { label: 'Business & Management',     emoji: '📊', color: '#EC4899' },
  }

  function getSectorMilestone(count, avg) {
    if (avg > 8.5) return { label: 'Expert — Interview Ready ✓',     color: '#22C55E', pct: 100 }
    if (avg > 7.5) return { label: 'Ready — Interview Confident',     color: '#22C55E', pct: 90  }
    if (count >= 11) return { label: 'Preparing — Almost There',      color: '#3B82F6', pct: 70  }
    if (count >= 4)  return { label: 'Learner — Getting Serious',     color: '#F59E0B', pct: 45  }
    if (count >= 1)  return { label: 'Explorer — Building Foundation',color: '#F97316', pct: 20  }
    return                 { label: 'Beginner — Just Started',        color: '#6B7280', pct: 5   }
  }

  function getNextMilestoneHint(count, avg) {
    if (avg > 8.5)   return 'You have reached Expert level!'
    if (avg > 7.5)   return 'Improve average above 8.5 to reach Expert level'
    if (count >= 11) return 'Improve average above 7.5 to reach Ready level'
    if (count >= 4)  return `${11 - count} more session${11 - count !== 1 ? 's' : ''} to reach Preparing level`
    if (count >= 1)  return `${4 - count} more session${4 - count !== 1 ? 's' : ''} to reach Learner level`
    return 'Complete your first session to get started'
  }

  const primarySector = userProfile?.primary_sector ?? ''

  // Career history
  const [careerHistory, setCareerHistory]   = useState([])
  const [careerLoading, setCareerLoading]   = useState(true)

  useEffect(() => {
    if (!user) return
    supabase.from('career_history')
      .select('*').eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .then(({ data }) => { setCareerHistory(data || []); setCareerLoading(false) })
  }, [user])

  function generateAnalysis(prev, curr) {
    const prevAvg = parseFloat(prev.average_score) || 0
    const currAvg = parseFloat(curr.average_score) || 0
    if (prevAvg > currAvg + 1) return {
      verdict: 'Consider Returning', color: '#F59E0B',
      message: `You performed better in ${prev.sector_label} (${prevAvg.toFixed(1)}/10) than your current ${curr.sector_label} goal (${currAvg.toFixed(1)}/10). You may have stronger aptitude for ${prev.sector_label}. Consider whether your career switch aligns with your natural strengths.`,
      recommendation: `Your strengths align with ${prev.sector_label}. Consider switching back or practicing more in ${curr.sector_label} before deciding.`,
    }
    if (currAvg > prevAvg + 1) return {
      verdict: 'Great Switch', color: '#22C55E',
      message: `Excellent decision! You are performing better in ${curr.sector_label} (${currAvg.toFixed(1)}/10) than your previous ${prev.sector_label} goal (${prevAvg.toFixed(1)}/10). This career direction suits you well. Keep focusing on ${curr.sector_label}.`,
      recommendation: `Stay focused on ${curr.sector_label}. Avoid switching again until you reach the Interview Ready milestone.`,
    }
    return {
      verdict: 'Similar Performance', color: '#3B82F6',
      message: `You are performing similarly in both sectors. ${prev.sector_label}: ${prevAvg.toFixed(1)}/10 vs ${curr.sector_label}: ${currAvg.toFixed(1)}/10. Focus deeply on your current ${curr.sector_label} goal to see meaningful improvement.`,
      recommendation: `Choose one sector and commit fully. Split focus leads to average results in both areas.`,
    }
  }

  // Study suggestions — keyword match on topic name
  const SUGGESTIONS = [
    { keys: ['history','polity','geography','civics','art','culture'],  text: 'Study NCERT Class 12',        url: 'https://ncert.nic.in' },
    { keys: ['banking','finance','rbi','nbfc','monetary'],              text: 'Check RBI website',           url: 'https://rbi.org.in' },
    { keys: ['economy','economic','budget','gdp','inflation','fiscal'], text: 'Read Economic Survey',        url: 'https://indiabudget.gov.in' },
    { keys: ['current','affairs','news','events'],                      text: 'Read The Hindu daily',        url: 'https://thehindu.com' },
    { keys: ['science','technology','environment','ecology'],           text: 'Read NCERT Science books',    url: 'https://ncert.nic.in' },
    { keys: ['math','maths','quantitative','numerical','aptitude'],     text: 'Practice on IndiaBIX',        url: 'https://indiabix.com' },
    { keys: ['english','grammar','vocabulary','comprehension'],         text: 'Practice on Testbook',        url: 'https://testbook.com' },
    { keys: ['reasoning','logical','analytical'],                       text: 'Practice on IndiaBIX',        url: 'https://indiabix.com' },
    { keys: ['upsc','ias','ips','mpsc'],                                text: 'Check UPSC official site',    url: 'https://upsc.gov.in' },
    { keys: ['gate','engineering','technical'],                         text: 'Refer GATE syllabus',         url: 'https://gate2025.iitr.ac.in' },
    { keys: ['medical','clinical','anatomy','pharmacology'],            text: 'Check NMC guidelines',        url: 'https://www.nmc.org.in' },
  ]

  const getSuggestion = (area) => {
    const lower = area.toLowerCase()
    return SUGGESTIONS.find(s => s.keys.some(k => lower.includes(k)))
      ?? { text: 'Practice on Testbook', url: 'https://testbook.com' }
  }

  // Interview history table state
  const [historyFilter, setHistoryFilter] = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [historySort, setHistorySort]     = useState('newest')
  const [historyPage, setHistoryPage]     = useState(1)

  const TYPE_PILLS = [
    { value: 'all',        label: 'All' },
    { value: 'technical',  label: 'Technical' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'hr',         label: 'HR' },
    { value: 'mixed',      label: 'Mixed' },
  ]
  const ROWS = 10

  const SECTOR_BADGE = {
    government:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
    banking:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
    engineering: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    medical:     'bg-red-500/20 text-red-300 border-red-500/30',
    students:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    business:    'bg-pink-500/20 text-pink-300 border-pink-500/30',
    it_tech:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }

  const SECTOR_LABEL = {
    government: 'Government', banking: 'Banking', engineering: 'Engineering',
    medical: 'Medical', students: 'Students', business: 'Business', it_tech: 'IT Tech',
  }

  const fmtHistDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d)
    return `${dt.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][dt.getMonth()]} ${dt.getFullYear()}`
  }

  const historyRows = useMemo(() => {
    let rows = [...sessions]
    if (historyFilter !== 'all') rows = rows.filter(s => s.sector === historyFilter)
    if (typeFilter !== 'all') {
      rows = rows.filter(s => {
        const t = (s.interview_type ?? '').toLowerCase()
        if (typeFilter === 'mixed') return t.includes('mixed') || t.includes('full_mock') || t.includes('full mock')
        if (typeFilter === 'hr')    return t.includes('hr')
        return t.includes(typeFilter)
      })
    }
    if (historySort === 'oldest')  rows.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
    if (historySort === 'highest') rows.sort((a, b) => (b.total_score ?? 0) - (a.total_score ?? 0))
    return rows
  }, [sessions, historyFilter, typeFilter, historySort])

  const isPro         = userProfile?.plan === 'pro'
  const totalSessions = historyRows.length
  const totalPages    = Math.max(1, Math.ceil(historyRows.length / ROWS))
  const pagedRows     = isPro
    ? historyRows.slice((historyPage - 1) * ROWS, historyPage * ROWS)
    : historyRows.slice(0, 5)
  const uniqueSectors = useMemo(() => new Set(sessions.map(s => s.sector).filter(Boolean)).size, [sessions])
  const streak        = userProfile?.streak_count ?? 0
  const WEEKLY_GOAL   = 5

  const stats = [
    { label: 'Total Sessions', value: userProfile?.total_sessions ?? 0,    icon: Target,   border: 'border-l-blue-500',   iconColor: 'text-blue-400' },
    { label: 'Average Score',  value: userProfile?.average_score ? `${parseFloat(userProfile.average_score).toFixed(1)}/10` : '—', icon: ChartBar, border: 'border-l-blue-500', iconColor: 'text-blue-400' },
    { label: 'Best Score',     value: bestScore ? `${bestScore}/10` : '—', icon: Trophy,    border: 'border-l-amber-500',  iconColor: 'text-amber-400' },
    { label: 'Day Streak',     value: userProfile?.streak_count || 0,       icon: Lightning, border: 'border-l-orange-500', iconColor: 'text-orange-400' },
  ]

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white">Your Interview Journey</h1>
          <p className="text-gray-500 text-sm mt-1">Track progress and get AI coaching</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={24} color="border-blue-500" /></div>
        ) : (
          <>
            {/* Readiness ring + quick stats + AI coach message */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">

              {/* Ring + quick stats row */}
              <div className="flex flex-col sm:flex-row items-center gap-6">

                {/* SVG ring */}
                <div className="relative shrink-0">
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    {/* background track */}
                    <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#1F2937" strokeWidth="10" />
                    {/* progress arc */}
                    <circle
                      cx="70" cy="70" r={RADIUS}
                      fill="none"
                      stroke={ringColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 70 70)"
                      style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                    />
                    <text x="70" y="65" textAnchor="middle" dominantBaseline="middle"
                      fill="white" fontSize="28" fontWeight="700">{readinessScore}%</text>
                    <text x="70" y="90" textAnchor="middle" dominantBaseline="middle"
                      fill="#6B7280" fontSize="11">Interview Ready</text>
                  </svg>
                </div>

                {/* Quick stats */}
                <div className="flex sm:flex-col gap-4 sm:gap-3 flex-wrap justify-center sm:justify-start">
                  <div className="text-center sm:text-left">
                    <p className="text-gray-500 text-xs font-medium">Total Sessions</p>
                    <p className="text-2xl font-bold text-white font-mono">{userProfile?.total_sessions ?? 0}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-gray-500 text-xs font-medium">Average Score</p>
                    <p className="text-2xl font-bold text-white font-mono">
                      {userProfile?.average_score ? `${parseFloat(userProfile.average_score).toFixed(1)}/10` : '—'}
                    </p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="text-gray-500 text-xs font-medium">Best Score</p>
                    <p className="text-2xl font-bold text-white font-mono">
                      {bestScore != null ? `${bestScore}/10` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI coach message */}
              <ProFeatureWrapper
                userProfile={userProfile}
                featureName="AI Coach Messages"
                description="Get personalized coaching based on your performance patterns"
                compact={false}
              >
                <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '12px', padding: '16px 20px' }}
                  className="flex items-start gap-3">
                  <Sparkle size={18} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-gray-300 text-sm leading-relaxed">{aiMessage}</p>
                </div>
              </ProFeatureWrapper>
            </div>

            {/* Mixed sector focus alert — shown when 3+ sectors practiced */}
            {sectorGroups.length >= 3 && primarySector && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '16px 20px' }}
                className="flex flex-col sm:flex-row sm:items-start gap-4">
                <Warning size={20} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-amber-400 font-semibold text-sm mb-1">Focus Alert</p>
                  <p className="text-gray-300 text-sm leading-relaxed mb-3">
                    You are practicing across <strong className="text-white">{sectorGroups.length} sectors</strong>.
                    Spread preparation often leads to average performance in all areas.
                    <br />
                    <span className="text-gray-400">
                      Recommendation: Focus on{' '}
                      <strong className="text-white">{SECTOR_META[primarySector]?.label ?? userProfile?.career_goal}</strong>{' '}
                      until you reach Interview Ready level, then explore other sectors.
                    </span>
                  </p>
                  <Link
                    to="/interview/setup"
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
                  >
                    <PlayCircle size={12} />
                    Focus on {SECTOR_META[primarySector]?.label ?? 'Primary Sector'} Now
                  </Link>
                </div>
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map(s => (
                <div key={s.label} className={`bg-gray-900 border border-gray-800 border-l-4 ${s.border} rounded-xl p-5`}>
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-gray-500 text-xs font-medium">{s.label}</p>
                    <s.icon size={18} className={s.iconColor} />
                  </div>
                  <p className="text-3xl font-bold text-white font-mono">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Career Goal Analysis */}
            <ProFeatureWrapper
              userProfile={userProfile}
              featureName="Career Goal Analysis"
              description="Compare performance across your career goals with AI insights"
              compact={false}
            >
            {!careerLoading && careerHistory.length > 0 && (() => {
              const current  = careerHistory.find(h => h.is_current)
              const previous = careerHistory.find(h => !h.is_current)
              if (!current) return null
              const liveGroup = sectorGroups.find(g => g.sector === current.sector)
              const currStats = { count: liveGroup?.count ?? 0, avg: liveGroup?.avg ?? 0, best: liveGroup?.best ?? 0 }
              const fmtMo = (d) => d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''
              const fmtRange = (s, e) => `${fmtMo(s)} — ${e ? fmtMo(e) : 'Present'}`
              const meta = (s) => SECTOR_META[s] ?? { label: s, emoji: '🎯', color: '#6B7280' }

              if (!previous) {
                const cm = meta(current.sector)
                const m  = getSectorMilestone(currStats.count, currStats.avg)
                const hint = getNextMilestoneHint(currStats.count, currStats.avg)
                return (
                  <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 12, padding: '20px 24px' }}>
                    <div className="flex items-center gap-2 mb-3"><Target size={16} color="#2563EB" /><span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Current Career Goal</span></div>
                    <div className="flex items-center gap-3 mb-4"><span style={{ fontSize: 26 }}>{cm.emoji}</span><div><p className="text-white text-xl font-bold">{cm.label}</p><p className="text-gray-500 text-xs">{fmtRange(current.started_at, null)}</p></div></div>
                    <div className="flex gap-6 flex-wrap mb-4">
                      <div><p className="text-xs text-gray-500 mb-0.5">Sessions</p><p className="text-white text-xl font-bold">{currStats.count}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Avg Score</p><p className="text-xl font-bold" style={{ color: currStats.avg ? scoreColor(currStats.avg) : '#4B5563' }}>{currStats.avg || '—'}</p></div>
                      <div><p className="text-xs text-gray-500 mb-0.5">Best</p><p className="text-xl font-bold" style={{ color: currStats.best ? '#F59E0B' : '#4B5563' }}>{currStats.best || '—'}</p></div>
                      <div><p className="text-xs text-gray-500 mb-1">Milestone</p><span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: m.color, background: `${m.color}1A` }}>{m.label}</span></div>
                    </div>
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">{hint}</span><span style={{ color: m.color }}>{m.pct}%</span></div>
                    <div style={{ height: 6, background: '#1F2937', borderRadius: 3 }}><div style={{ height: '100%', borderRadius: 3, width: `${m.pct}%`, background: m.color, transition: 'width 0.6s ease' }} /></div>
                  </div>
                )
              }

              const prevMeta = meta(previous.sector)
              const currMeta = meta(current.sector)
              const prevM    = getSectorMilestone(previous.total_sessions, parseFloat(previous.average_score))
              const currM    = getSectorMilestone(currStats.count, currStats.avg)
              const analysis = generateAnalysis(previous, { ...current, average_score: currStats.avg })
              return (
                <div>
                  <div className="mb-4"><h2 className="text-white font-semibold text-lg">Your Career Journey</h2><p className="text-gray-500 text-xs mt-0.5">Analysis across your career goals</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Previous */}
                    <div style={{ background: 'rgba(107,114,128,0.05)', border: '1px solid rgba(107,114,128,0.2)', borderLeft: '4px solid #6B7280', borderRadius: '0 12px 12px 0', padding: 20 }}>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2" style={{ color: '#6B7280', background: 'rgba(107,114,128,0.15)' }}>Previous Goal</span>
                      <p className="text-gray-300 text-lg font-bold mt-1">{prevMeta.emoji} {prevMeta.label}</p>
                      <p className="text-gray-600 text-xs mb-3">{fmtRange(previous.started_at, previous.ended_at)}</p>
                      <div className="flex gap-4 flex-wrap mb-3">
                        <div><p className="text-xs text-gray-500 mb-0.5">Sessions</p><p className="text-white font-bold">{previous.total_sessions}</p></div>
                        <div><p className="text-xs text-gray-500 mb-0.5">Avg</p><p className="font-bold" style={{ color: scoreColor(parseFloat(previous.average_score)) }}>{parseFloat(previous.average_score).toFixed(1)}</p></div>
                        <div><p className="text-xs text-gray-500 mb-0.5">Best</p><p className="font-bold text-amber-400">{parseFloat(previous.best_score).toFixed(1)}</p></div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: prevM.color, background: `${prevM.color}1A` }}>{prevM.label}</span>
                    </div>
                    {/* Current */}
                    <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', borderLeft: '4px solid #2563EB', borderRadius: '0 12px 12px 0', padding: 20 }}>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full inline-block mb-2" style={{ color: '#2563EB', background: 'rgba(37,99,235,0.15)' }}>Current Goal</span>
                      <p className="text-white text-lg font-bold mt-1">{currMeta.emoji} {currMeta.label}</p>
                      <p className="text-gray-600 text-xs mb-3">{fmtRange(current.started_at, null)}</p>
                      <div className="flex gap-4 flex-wrap mb-3">
                        <div><p className="text-xs text-gray-500 mb-0.5">Sessions</p><p className="text-white font-bold">{currStats.count}</p></div>
                        <div><p className="text-xs text-gray-500 mb-0.5">Avg</p><p className="font-bold" style={{ color: currStats.avg ? scoreColor(currStats.avg) : '#4B5563' }}>{currStats.avg || '—'}</p></div>
                        <div><p className="text-xs text-gray-500 mb-0.5">Best</p><p className="font-bold text-amber-400">{currStats.best || '—'}</p></div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: currM.color, background: `${currM.color}1A` }}>{currM.label}</span>
                    </div>
                  </div>
                  {/* AI Analysis */}
                  <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 12, padding: '20px 24px' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkle size={16} color="#2563EB" />
                      <span className="text-white font-semibold">AI Career Analysis</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full ml-1" style={{ color: analysis.color, background: `${analysis.color}1A` }}>{analysis.verdict}</span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{analysis.message}</p>
                    <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', padding: '12px 16px', borderRadius: 8 }}>
                      <div className="flex items-start gap-2">
                        <Lightbulb size={14} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
                        <div><p className="text-xs font-semibold mb-1" style={{ color: '#2563EB' }}>Recommendation</p><p className="text-gray-400 text-xs leading-relaxed">{analysis.recommendation}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
            </ProFeatureWrapper>

            {/* Career Timeline */}
            {!careerLoading && careerHistory.length > 0 && (
              <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 16, padding: '24px 28px' }}>
                <div className="mb-5">
                  <h2 className="text-white font-semibold text-lg">Your Career Timeline</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Every goal you have worked toward</p>
                </div>

                <div style={{ position: 'relative' }}>
                  {/* Vertical connector line */}
                  {careerHistory.length > 1 && (
                    <div style={{
                      position: 'absolute', left: 9, top: 20, bottom: 20,
                      width: 2, background: '#1F2937', zIndex: 0,
                    }} />
                  )}

                  <div className="space-y-6">
                    {careerHistory.map((entry, idx) => {
                      const isCurrent = entry.is_current
                      const meta      = SECTOR_META[entry.sector] ?? { label: entry.sector, emoji: '🎯', color: '#6B7280' }
                      const liveGroup = isCurrent ? sectorGroups.find(g => g.sector === entry.sector) : null
                      const count     = liveGroup?.count ?? entry.total_sessions ?? 0
                      const avg       = liveGroup?.avg   ?? parseFloat(entry.average_score) ?? 0
                      const best      = liveGroup?.best  ?? parseFloat(entry.best_score)    ?? 0
                      const m         = getSectorMilestone(count, avg)

                      const fmtMo  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
                      const endStr = entry.ended_at ? fmtMo(entry.ended_at) : 'Present'

                      return (
                        <div key={entry.id} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>

                          {/* Timeline dot */}
                          <div style={{ flexShrink: 0, marginTop: 4 }}>
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: isCurrent ? '#2563EB' : '#374151',
                              border: `3px solid ${isCurrent ? '#2563EB' : '#4B5563'}`,
                              boxShadow: isCurrent ? '0 0 10px rgba(37,99,235,0.4)' : 'none',
                            }} />
                          </div>

                          {/* Card */}
                          <div style={{
                            flex: 1,
                            background: isCurrent ? 'rgba(37,99,235,0.04)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${isCurrent ? 'rgba(37,99,235,0.2)' : '#1F2937'}`,
                            borderRadius: 12, padding: '16px 20px',
                          }}>
                            {/* Header */}
                            <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span style={{ fontSize: 18 }}>{meta.emoji}</span>
                                  <span className="text-white font-bold">{meta.label}</span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                                    color: isCurrent ? '#2563EB' : '#6B7280',
                                    background: isCurrent ? 'rgba(37,99,235,0.15)' : 'rgba(107,114,128,0.15)',
                                  }}>
                                    {isCurrent ? 'Active' : 'Completed'}
                                  </span>
                                </div>
                                <p className="text-gray-500 text-xs">
                                  {fmtMo(entry.started_at)} — {endStr}
                                </p>
                              </div>
                              <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: m.color, background: `${m.color}1A` }}>
                                {m.label}
                              </span>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-5 flex-wrap">
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Sessions</p>
                                <p className="text-white font-bold text-lg">{count}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Avg Score</p>
                                <p className="font-bold text-lg" style={{ color: avg ? scoreColor(avg) : '#4B5563' }}>
                                  {avg ? avg.toFixed(1) : '—'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">Best</p>
                                <p className="font-bold text-lg text-amber-400">{best ? best.toFixed(1) : '—'}</p>
                              </div>
                              {isCurrent && (
                                <div className="self-end mb-0.5">
                                  <p className="text-xs text-gray-500 mb-1">Progress</p>
                                  <div style={{ width: 80, height: 4, background: '#1F2937', borderRadius: 2 }}>
                                    <div style={{ height: '100%', borderRadius: 2, width: `${m.pct}%`, background: m.color }} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Score Journey chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">

              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-1">
                <div>
                  <div className="flex items-center gap-2">
                    <ChartLineUp size={18} className="text-blue-400" />
                    <h2 className="text-white font-semibold">Score Journey</h2>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">Your improvement over time</p>
                </div>

                {/* Filter pills */}
                <div className="flex gap-2">
                  {[['all','All time'],['30d','Last 30 days'],['7d','Last 7 days']].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setChartFilter(val)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        chartFilter === val
                          ? 'bg-blue-600 text-white'
                          : 'bg-transparent border border-gray-700 text-gray-400 hover:border-gray-500'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Trend indicator */}
              {trendInfo && (
                <div className={`flex items-center gap-1.5 mb-4 mt-3 text-xs font-medium ${
                  trendInfo.dir === 'up' ? 'text-blue-400' : trendInfo.dir === 'down' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {trendInfo.dir === 'up'     && <ArrowUp size={13} />}
                  {trendInfo.dir === 'down'   && <ArrowDown size={13} />}
                  {trendInfo.dir === 'stable' && <ArrowRight size={13} />}
                  <span>{trendInfo.label}</span>
                </div>
              )}

              {/* Chart or empty state */}
              {filteredChartData.length < 2 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center">
                  <ChartBar size={32} className="text-gray-700 mb-3" />
                  <p className="text-gray-500 text-sm">Complete 2 interviews to see your score journey</p>
                  <Link to="/interview/setup" className="text-blue-400 text-xs hover:underline mt-2">Start Interview →</Link>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                    <XAxis dataKey="date" tickFormatter={fmtX} tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} ticks={[0,2,4,6,8,10]} tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={7} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: 'Target', fill: '#F59E0B', fontSize: 10, position: 'insideTopRight' }} />
                    <Line
                      type="monotone" dataKey="score"
                      stroke="#2563EB" strokeWidth={2}
                      dot={<ClickableDot />}
                      activeDot={{ r: 7, fill: '#2563EB', stroke: '#0f172a', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Your Strength Map */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="mb-5">
                <h2 className="text-white font-semibold">Your Strength Map</h2>
                <p className="text-gray-500 text-xs mt-0.5">Topic by topic performance</p>
              </div>

              {(strongAreas.length === 0 && weakAreas.length === 0) ? (
                <div className="text-center py-8">
                  <ChartBar size={28} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Complete more interviews to build your strength map</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* Left — Strengths */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy size={15} className="text-blue-400" />
                      <h3 className="text-blue-400 text-sm font-semibold">Your Strengths</h3>
                    </div>
                    {strongAreas.length === 0 ? (
                      <p className="text-gray-600 text-sm">Complete more interviews to identify your strengths</p>
                    ) : (
                      <div className="space-y-4">
                        {strongAreas.map(area => (
                          <div key={area.area}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-gray-300 text-sm capitalize">{area.area}</span>
                              <span className="font-mono text-xs font-bold text-blue-400">{area.avg_score}/10</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500 transition-all duration-500"
                                style={{ width: `${(area.avg_score / 10) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right — Focus Areas */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Target size={15} className="text-amber-400" />
                      <h3 className="text-amber-400 text-sm font-semibold">Focus Areas</h3>
                    </div>
                    {weakAreas.length === 0 ? (
                      <p className="text-gray-600 text-sm">No weak areas identified yet — keep practicing!</p>
                    ) : (
                      <div className="space-y-5">
                        {weakAreas.map(area => {
                          const suggestion = getSuggestion(area.area)
                          const barColor = area.avg_score < 5 ? '#EF4444' : '#F59E0B'
                          const scoreText = area.avg_score < 5 ? 'text-red-400' : 'text-amber-400'
                          return (
                            <div key={area.area}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-gray-300 text-sm capitalize">{area.area}</span>
                                <span className={`font-mono text-xs font-bold ${scoreText}`}>{area.avg_score}/10</span>
                              </div>
                              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-2">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${(area.avg_score / 10) * 100}%`, backgroundColor: barColor }} />
                              </div>
                              <div className="flex items-center justify-between">
                                <a href={suggestion.url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors">
                                  <BookOpen size={11} />
                                  {suggestion.text}
                                </a>
                                <Link to="/interview/setup"
                                  className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                                  Practice this topic →
                                </Link>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* This Week's Focus Plan */}
            <ProFeatureWrapper
              userProfile={userProfile}
              featureName="Personalized Study Plan"
              description="Get exact topics to study with official resource links"
              compact={false}
            >
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="mb-5">
                <h2 className="text-white font-semibold">This Week's Focus Plan</h2>
                <p className="text-gray-500 text-xs mt-0.5">AI recommended study plan</p>
              </div>

              {sessions.length < 3 || weakAreas.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb size={28} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Complete 3 interviews to get your personalized study plan</p>
                  <Link to="/interview/setup" className="text-blue-400 text-xs hover:underline mt-2 inline-block">
                    Start practicing →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { area: weakAreas[0], priority: 'Most Important', Icon: Lightning, borderColor: '#EF4444', iconColor: 'text-red-400',  time: '30 minutes today' },
                    { area: weakAreas[1], priority: 'Focus Today',     Icon: BookOpen,  borderColor: '#F59E0B', iconColor: 'text-amber-400', time: '20 minutes today' },
                    { area: weakAreas[2], priority: 'Also Practice',   Icon: Lightbulb, borderColor: '#3B82F6', iconColor: 'text-blue-400',  time: '15 minutes today' },
                  ].filter(c => c.area).map(({ area, priority, Icon, borderColor, iconColor, time }) => {
                    const suggestion = getSuggestion(area.area)
                    return (
                      <div key={area.area} style={{ borderLeft: `4px solid ${borderColor}`, borderRadius: '0 12px 12px 0', background: '#111827', border: `1px solid #1F2937`, borderLeftColor: borderColor, padding: '16px 20px' }}>
                        <div className="flex items-start gap-3">
                          <Icon size={18} className={`${iconColor} mt-0.5 shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{priority}</span>
                              <span className="text-gray-600 text-xs">{time}</span>
                            </div>
                            <p className="text-white text-sm font-semibold capitalize mt-1">{area.area}</p>
                            <p className="text-gray-500 text-xs mt-0.5">{suggestion.text}</p>
                            <a href={suggestion.url} target="_blank" rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-400 text-xs underline mt-1 inline-block transition-colors">
                              {suggestion.url.replace('https://', '')}
                            </a>
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <Link to="/interview/setup"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl text-sm transition-colors mt-2">
                    <PlayCircle size={15} />
                    Start Focused Practice Session →
                  </Link>
                </div>
              )}
            </div>
            </ProFeatureWrapper>

            {/* Career Analysis by Sector */}
            {sectorGroups.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="mb-5">
                  <h2 className="text-white font-semibold">Career Analysis by Sector</h2>
                  <p className="text-gray-500 text-xs mt-0.5">Your performance broken down by preparation area</p>
                </div>

                <div className="space-y-4">
                  {sectorGroups.map(({ sector, count, avg, best, miniChart }) => {
                    const meta       = SECTOR_META[sector] ?? { label: sector, emoji: '📋', color: '#6B7280' }
                    const milestone  = getSectorMilestone(count, avg)
                    const nextHint   = getNextMilestoneHint(count, avg)
                    const isPrimary  = sector === primarySector
                    const isSecondary = primarySector && sector !== primarySector

                    // AI recommendation
                    const recommendation = isPrimary && avg <= 7.5
                      ? 'Focus here — this is your primary career goal.'
                      : avg > 7.5
                      ? `You are interview ready in this sector! Start applying for ${meta.label} positions.`
                      : isSecondary
                      ? `You explored this sector. Consider focusing on your primary goal first.`
                      : 'Keep practicing to build your readiness in this sector.'

                    return (
                      <div key={sector} style={{
                        background: '#111827', border: '1px solid #1F2937',
                        borderLeft: `4px solid ${meta.color}`,
                        borderRadius: '0 12px 12px 0', padding: '20px 24px',
                      }}>
                        {/* Header row */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{meta.emoji}</span>
                            <span className="text-white font-semibold text-sm">{meta.label}</span>
                            {isPrimary && (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                                style={{ background: 'rgba(37,99,235,0.15)', color: '#2563EB', border: '1px solid rgba(37,99,235,0.3)' }}>
                                Primary Goal
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-400"><span className="font-bold text-white">{count}</span> session{count !== 1 ? 's' : ''}</span>
                            <span className="text-gray-400">Avg <span className="font-bold" style={{ color: avg ? scoreColor(avg) : '#6B7280' }}>{avg ?? '—'}/10</span></span>
                            {best != null && <span className="text-gray-400">Best <span className="font-bold text-amber-400">{best}/10</span></span>}
                          </div>
                        </div>

                        {/* Milestone bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium" style={{ color: milestone.color }}>{milestone.label}</span>
                            <span className="text-gray-600 text-xs">{nextHint}</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${milestone.pct}%`, background: milestone.color }} />
                          </div>
                        </div>

                        {/* Mini score trend chart */}
                        {miniChart.length >= 2 && (
                          <div className="mb-4">
                            <p className="text-gray-600 text-xs mb-1">Score trend (last {miniChart.length} sessions)</p>
                            <ResponsiveContainer width="100%" height={56}>
                              <LineChart data={miniChart} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
                                <Line type="monotone" dataKey="score" stroke={meta.color}
                                  strokeWidth={2} dot={{ r: 3, fill: meta.color, stroke: '#0f172a', strokeWidth: 1 }}
                                  activeDot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}

                        {/* AI recommendation */}
                        <div className="flex items-start gap-2 pt-3 border-t border-gray-800/60">
                          <Sparkle size={13} className="text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-gray-400 text-xs leading-relaxed">{recommendation}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Interview History */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

              {/* Header + filters */}
              <div className="px-6 py-4 border-b border-gray-800 space-y-3">
                <div>
                  <h2 className="text-white font-semibold">Interview History</h2>
                  <p className="text-gray-500 text-xs mt-0.5">All your practice sessions</p>
                </div>
                {/* Type filter pills */}
                <div className="flex gap-2 flex-wrap">
                  {TYPE_PILLS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => { setTypeFilter(p.value); setHistoryPage(1) }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        typeFilter === p.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-transparent border border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  {/* Sector filter */}
                  <select
                    value={historyFilter}
                    onChange={e => { setHistoryFilter(e.target.value); setHistoryPage(1) }}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                    <option value="all">All Sectors</option>
                    <option value="government">Government</option>
                    <option value="banking">Banking</option>
                    <option value="engineering">Engineering</option>
                    <option value="medical">Medical</option>
                    <option value="students">Students</option>
                    <option value="business">Business</option>
                    <option value="it_tech">IT Tech</option>
                  </select>
                  {/* Sort */}
                  <select
                    value={historySort}
                    onChange={e => { setHistorySort(e.target.value); setHistoryPage(1) }}
                    className="bg-gray-800 border border-gray-700 text-gray-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500">
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="highest">Highest score</option>
                  </select>
                </div>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-14">
                  <ClipboardText size={32} className="text-gray-700 mx-auto mb-3" />
                  <p className="text-white text-sm font-medium mb-1">No interviews yet</p>
                  <p className="text-gray-500 text-sm mb-4">Start your first interview</p>
                  <Link to="/interview/setup" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
                    <PlayCircle size={14} /> Start Interview
                  </Link>
                </div>
              ) : pagedRows.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">No sessions match this filter</p>
                </div>
              ) : (
                <>
                  {/* Table — horizontal scroll on mobile */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase tracking-wide">
                          <th className="text-left px-6 py-3 font-medium">Date</th>
                          <th className="text-left px-4 py-3 font-medium">Sector</th>
                          <th className="text-left px-4 py-3 font-medium">Role</th>
                          <th className="text-center px-4 py-3 font-medium">Questions</th>
                          <th className="text-center px-4 py-3 font-medium">Score</th>
                          <th className="text-center px-4 py-3 font-medium">Verdict</th>
                          <th className="text-center px-4 py-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/60">
                        {pagedRows.map(s => (
                          <tr key={s.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-6 py-3.5 text-gray-400 text-xs whitespace-nowrap">{fmtHistDate(s.completed_at)}</td>
                            <td className="px-4 py-3.5">
                              {s.sector && (
                                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${SECTOR_BADGE[s.sector] ?? 'bg-gray-700/40 text-gray-400 border-gray-600'}`}>
                                  {SECTOR_LABEL[s.sector] ?? s.sector}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-white text-sm capitalize">{s.role?.replace(/_/g, ' ')}</td>
                            <td className="px-4 py-3.5 text-center text-gray-400 text-xs">{s.question_count ? `${s.question_count} Q` : '—'}</td>
                            <td className="px-4 py-3.5 text-center">
                              {s.total_score != null
                                ? <span className={`font-mono font-bold ${scoreColor(s.total_score)}`}>{s.total_score}/10</span>
                                : <span className="text-gray-600">—</span>}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              {s.verdict
                                ? <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${verdictColor(s.verdict)}`}>{s.verdict}</span>
                                : <span className="text-gray-600 text-xs">—</span>}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <Link to={`/report/${s.id}`}
                                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs transition-colors">
                                <Eye size={13} /> View Report
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Free users: blur overlay after 5 rows */}
                  {!isPro && totalSessions > 5 && (
                    <div style={{ position: 'relative', marginTop: -20 }}>
                      <div style={{ filter: 'blur(4px)', opacity: 0.3, pointerEvents: 'none' }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{
                            height: 52, background: '#111827',
                            borderBottom: '1px solid #1F2937',
                            borderRadius: i === 3 ? '0 0 12px 12px' : 0,
                          }} />
                        ))}
                      </div>
                      <div style={{
                        position: 'absolute', inset: 0, display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(11,15,25,0.8)', borderRadius: '0 0 12px 12px',
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>
                            Showing 5 of {totalSessions} sessions
                          </p>
                          <button
                            onClick={() => navigate('/upgrade')}
                            style={{ background: 'transparent', border: '1px solid #F59E0B', color: '#F59E0B', borderRadius: 6, padding: '4px 16px', fontSize: 12, cursor: 'pointer' }}
                          >
                            View all with Pro
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagination — Pro only */}
                  {isPro && totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-800">
                      <button
                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                        disabled={historyPage === 1}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <CaretLeft size={14} /> Previous
                      </button>
                      <span className="text-gray-500 text-xs">Page {historyPage} of {totalPages}</span>
                      <button
                        onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                        disabled={historyPage === totalPages}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        Next <CaretRight size={14} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Your Achievements */}
            <ProFeatureWrapper
              userProfile={userProfile}
              featureName="Achievements and Badges"
              description="Earn badges as you practice and track your milestones"
              compact={false}
            >
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
              <h2 className="text-white font-semibold">Your Achievements</h2>

              {/* Streak card */}
              <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: '12px', padding: '20px' }}
                className="flex items-center gap-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FireStreakAnimation size={56} />
                  <div>
                    <div style={{ fontSize: '36px', fontWeight: '800', color: '#F97316' }}>{streak}</div>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>Day Streak</div>
                  </div>
                </div>
                <p className="text-gray-400 text-xs mt-1 ml-2">
                  {streak === 0
                    ? 'Start practicing today'
                    : streak <= 3
                    ? 'Keep it going!'
                    : streak <= 7
                    ? 'You are on fire!'
                    : 'Unstoppable! 🔥'}
                </p>
              </div>

              {/* Badges */}
              <div>
                <p className="text-gray-500 text-xs font-medium mb-3 uppercase tracking-wide">Badges Earned</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[
                    { Icon: Trophy, label: 'First Step',        earned: sessions.length >= 1,  color: '#F59E0B' },
                    { Icon: Star,   label: 'Getting Serious',   earned: sessions.length >= 5,  color: '#22C55E' },
                    { Icon: Medal,  label: 'Dedicated Learner', earned: sessions.length >= 10, color: '#3B82F6' },
                    { Icon: Lightning, label: 'High Scorer',    earned: (bestScore ?? 0) >= 8, color: '#A855F7' },
                    { Icon: Crown,  label: 'Champion',          earned: sessions.length >= 20, color: '#EF4444' },
                    { Icon: Globe,  label: 'All Rounder',       earned: uniqueSectors >= 3,    color: '#06B6D4' },
                  ].map(({ Icon, label, earned, color }) => (
                    <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-800/60"
                      style={earned ? { boxShadow: `0 0 12px ${color}40` } : { opacity: 0.4 }}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: earned ? `${color}20` : '#1F2937' }}>
                        <Icon size={20} style={{ color: earned ? color : '#4B5563' }} />
                      </div>
                      <span className="text-xs text-center leading-tight"
                        style={{ color: earned ? '#E5E7EB' : '#6B7280' }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly goal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm font-medium">Weekly Goal</p>
                  <span className="text-gray-500 text-xs">{weeklyCount} of {WEEKLY_GOAL} sessions this week</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (weeklyCount / WEEKLY_GOAL) * 100)}%` }} />
                </div>
                <p className="text-xs text-center">
                  {weeklyCount >= WEEKLY_GOAL
                    ? <span className="text-blue-400 font-medium">Goal achieved this week! 🎉</span>
                    : <span className="text-gray-500">{WEEKLY_GOAL - weeklyCount} more session{WEEKLY_GOAL - weeklyCount !== 1 ? 's' : ''} to reach your weekly goal</span>}
                </p>
              </div>
            </div>
            </ProFeatureWrapper>

          </>
        )}
      </div>
    </AppLayout>
  )
}
