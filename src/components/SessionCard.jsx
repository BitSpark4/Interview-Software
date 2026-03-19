import { Link } from 'react-router-dom'
import ScoreBadge from './ScoreBadge'
import { formatShortDate } from '../utils/dateHelpers'

export default function SessionCard({ session }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <div className="flex flex-col gap-0.5">
        <p className="text-white text-sm font-medium">{session.role}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{session.interview_type}</span>
          {session.total_score && <ScoreBadge score={Math.round(session.total_score)} />}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <p className="text-xs text-gray-600">{formatShortDate(session.created_at)}</p>
        <Link
          to={`/report/${session.id}`}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          View report →
        </Link>
      </div>
    </div>
  )
}
