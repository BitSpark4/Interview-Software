import { useState } from 'react'
import ScoreBadge from './ScoreBadge'
import StarBreakdown from './StarBreakdown'

export default function FeedbackCard({ feedback }) {
  const [open, setOpen] = useState(false)
  if (!feedback) return null

  return (
    <div className="mt-2 rounded-lg border border-gray-800 bg-gray-900 text-sm">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-800 transition-colors rounded-lg min-h-11"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          <ScoreBadge score={feedback.score} />
          <span className="text-gray-400 text-xs truncate max-w-48">{feedback.good?.slice(0, 60)}…</span>
        </div>
        <span className="text-gray-600 text-xs shrink-0 ml-2">{open ? '▲' : '▼'} Feedback</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-3">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">✅ What was good</p>
            <p className="text-gray-300">{feedback.good}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">❌ What was missing</p>
            <p className="text-gray-300">{feedback.missing}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">💡 Ideal answer</p>
            <p className="text-gray-300">{feedback.ideal}</p>
          </div>
          {feedback.star_breakdown && (
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">STAR Breakdown</p>
              <StarBreakdown breakdown={feedback.star_breakdown} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
