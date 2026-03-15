import { Link } from 'react-router-dom'
import { TrendingUp, Target, BarChart2, Trophy, Flame, AlertCircle, Eye, ChevronRight } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { verdictColor, scoreColor } from '../utils/scoreHelpers'
import { formatDate } from '../utils/dateHelpers'

export default function Progress() {
  const { user, userProfile } = useAuth()
  const { sessions, weakAreas, chartData, bestScore, loading, error } = useProgress(user?.id)

  const stats = [
    { label: 'Total Sessions', value: userProfile?.total_sessions ?? 0,    icon: Target,   border: 'border-l-blue-500',   iconColor: 'text-blue-400' },
    { label: 'Average Score',  value: userProfile?.average_score ? `${parseFloat(userProfile.average_score).toFixed(1)}/10` : '—', icon: BarChart2, border: 'border-l-emerald-500', iconColor: 'text-emerald-400' },
    { label: 'Best Score',     value: bestScore ? `${bestScore}/10` : '—', icon: Trophy,   border: 'border-l-amber-500',  iconColor: 'text-amber-400' },
    { label: 'Day Streak',     value: userProfile?.streak_count || 0,       icon: Flame,    border: 'border-l-orange-500', iconColor: 'text-orange-400' },
  ]

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white">My Progress</h1>
          <p className="text-gray-500 text-sm mt-1">Track your improvement over time</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size={24} color="border-emerald-500" /></div>
        ) : (
          <>
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

            {/* Score trend chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={18} className="text-emerald-400" />
                <h2 className="text-white font-semibold">Score Trend</h2>
              </div>
              <p className="text-gray-500 text-xs mb-6">Your interview scores over time</p>

              {chartData.length < 2 ? (
                <div className="h-40 flex flex-col items-center justify-center text-center">
                  <BarChart2 size={32} className="text-gray-700 mb-3" />
                  <p className="text-gray-500 text-sm">Complete at least 2 interviews to see your trend</p>
                  <Link to="/interview/setup" className="text-emerald-400 text-xs hover:underline mt-2">Start practicing →</Link>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2 h-48">
                    {chartData.map((d, i) => {
                      const heightPct = Math.max(4, (d.score / 10) * 100)
                      const isLast = i === chartData.length - 1
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {d.score}/10 · {d.role}
                          </div>
                          <div
                            className={`w-full rounded-t transition-all ${isLast ? 'bg-emerald-500' : 'bg-gray-700 group-hover:bg-emerald-500/50'}`}
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-gray-600 text-xs">{d.index}</span>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-gray-600 text-xs mt-4 text-right">
                    {chartData[0].score < chartData[chartData.length - 1].score
                      ? '↑ Improving over time'
                      : chartData[0].score > chartData[chartData.length - 1].score
                      ? '↓ Recent sessions lower — keep practicing'
                      : '→ Consistent performance'}
                  </p>
                </>
              )}
            </div>

            {/* Weak areas + sessions side by side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

              {/* Weak areas */}
              {weakAreas.length > 0 && (
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 border-l-4 border-l-purple-500 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle size={16} className="text-purple-400" />
                    <h2 className="text-white font-semibold">Focus Areas</h2>
                  </div>
                  <p className="text-gray-500 text-xs mb-5">Based on AI feedback across all sessions</p>
                  <div className="space-y-4">
                    {weakAreas.map(area => (
                      <div key={area.area}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-gray-300 text-sm">{area.area}</span>
                          <span className={`font-mono text-xs font-bold ${scoreColor(area.avg_score)}`}>{area.avg_score}/10</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(area.avg_score / 10) * 100}%`, backgroundColor: area.avg_score >= 7 ? '#10b981' : area.avg_score >= 5 ? '#f59e0b' : '#ef4444' }}
                          />
                        </div>
                        <p className="text-gray-600 text-xs mt-0.5">{area.occurrences} session{area.occurrences > 1 ? 's' : ''}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All sessions */}
              <div className={`${weakAreas.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'} bg-gray-900 border border-gray-800 rounded-xl overflow-hidden`}>
                <div className="px-6 py-4 border-b border-gray-800">
                  <h2 className="text-white font-semibold">All Sessions</h2>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <Target size={32} className="text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">No completed interviews yet</p>
                    <Link to="/interview/setup" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-5 py-2.5 rounded-lg text-sm transition-colors">
                      <Play size={14} /> Start Interview
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800/60">
                    {sessions.map((s, i) => (
                      <Link
                        key={s.id}
                        to={`/report/${s.id}`}
                        className={`flex items-center justify-between px-6 py-4 hover:bg-gray-800/50 transition-colors group ${i % 2 === 1 ? 'bg-gray-800/10' : ''}`}
                      >
                        <div className="min-w-0">
                          <p className="text-gray-200 text-sm font-medium capitalize truncate">
                            {s.role?.replace(/_/g, ' ')} · {s.interview_type}
                          </p>
                          <p className="text-gray-600 text-xs mt-0.5">{formatDate(s.completed_at)}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-3 shrink-0">
                          {s.verdict && (
                            <span className={`text-xs font-mono px-2 py-0.5 rounded-full hidden sm:inline ${verdictColor(s.verdict)}`}>{s.verdict}</span>
                          )}
                          {s.total_score != null && (
                            <span className={`font-mono font-bold text-sm ${scoreColor(s.total_score)}`}>{s.total_score}/10</span>
                          )}
                          <Eye size={14} className="text-gray-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
