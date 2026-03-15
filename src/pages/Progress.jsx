import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useProgress } from '../hooks/useProgress'
import { verdictColor, scoreColor } from '../utils/scoreHelpers'
import { formatDate } from '../utils/dateHelpers'

export default function Progress() {
  const { user, userProfile } = useAuth()
  const { sessions, weakAreas, chartData, bestScore, loading, error } = useProgress(user?.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Spinner size={24} color="border-emerald-500" />
      </div>
    )
  }

  const stats = [
    { label: 'Total Sessions', value: userProfile?.total_sessions ?? 0 },
    { label: 'Average Score',  value: userProfile?.average_score ? `${userProfile.average_score}/10` : '—' },
    { label: 'Best Score',     value: bestScore ? `${bestScore}/10` : '—' },
    { label: 'Streak',         value: userProfile?.streak_count ? `🔥 ${userProfile.streak_count}` : '—' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="font-mono font-bold text-white text-2xl">My Progress</h1>
          <p className="text-gray-500 text-sm mt-1">Track your improvement over time</p>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <p className="text-gray-600 text-xs mb-1">{stat.label}</p>
              <p className="font-mono font-bold text-white text-xl">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Score trend chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="font-mono font-bold text-white text-sm mb-5">Score Trend</h2>

          {chartData.length < 2 ? (
            <div className="h-32 flex items-center justify-center text-gray-600 text-sm">
              Complete at least 2 interviews to see your trend
            </div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {chartData.map((d, i) => {
                const heightPct = Math.max(4, (d.score / 10) * 100)
                const isLast = i === chartData.length - 1
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {d.score}/10 · {d.role}
                    </div>
                    <div
                      className={`w-full rounded-t transition-all ${isLast ? 'bg-emerald-500' : 'bg-gray-700 group-hover:bg-gray-500'}`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-gray-600 text-xs">{d.index}</span>
                  </div>
                )
              })}
            </div>
          )}

          {chartData.length >= 2 && (
            <p className="text-gray-700 text-xs mt-3 text-right">
              {chartData[0].score < chartData[chartData.length - 1].score
                ? '↑ Improving over time'
                : chartData[0].score > chartData[chartData.length - 1].score
                ? '↓ Recent sessions lower — keep practicing'
                : '→ Consistent performance'}
            </p>
          )}
        </div>

        {/* Weak areas */}
        {weakAreas.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-mono font-bold text-white text-sm mb-1">Weak Areas to Focus On</h2>
            <p className="text-gray-600 text-xs mb-5">Based on your AI feedback across all sessions</p>
            <div className="space-y-3">
              {weakAreas.map(area => (
                <div key={area.area}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-300 text-sm">{area.area}</span>
                    <span className={`font-mono text-xs font-bold ${scoreColor(area.avg_score)}`}>
                      {area.avg_score}/10
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(area.avg_score / 10) * 100}%`,
                        backgroundColor: area.avg_score >= 7 ? '#10b981' : area.avg_score >= 5 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                  <p className="text-gray-600 text-xs mt-0.5">{area.occurrences} session{area.occurrences > 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All sessions history */}
        <div>
          <h2 className="font-mono font-bold text-white text-sm mb-3">All Sessions</h2>

          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p className="text-3xl mb-3">🎯</p>
              <p className="text-sm mb-4">No completed interviews yet</p>
              <Link
                to="/interview/setup"
                className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors"
              >
                Start Your First Interview
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <Link
                  key={s.id}
                  to={`/report/${s.id}`}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-xl px-5 py-4 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-gray-200 text-sm font-medium truncate">
                      {s.role?.replace(/([A-Z])/g, ' $1')} — {s.interview_type}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">{formatDate(s.completed_at)}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    {s.verdict && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${verdictColor(s.verdict)}`}>
                        {s.verdict}
                      </span>
                    )}
                    {s.total_score != null && (
                      <span className={`font-mono font-bold text-sm ${scoreColor(s.total_score)}`}>
                        {s.total_score}/10
                      </span>
                    )}
                    <span className="text-gray-700 group-hover:text-gray-400 text-xs transition-colors">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
