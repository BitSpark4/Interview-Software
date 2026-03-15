import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Award, CheckCircle2, XCircle, Lightbulb, Play, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import StarBreakdown from '../components/StarBreakdown'
import { verdictColor, scoreColor } from '../utils/scoreHelpers'
import { formatDate } from '../utils/dateHelpers'
import { supabase } from '../lib/supabase'

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession]   = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [openQ, setOpenQ]       = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [
          { data: { user } },
          { data: s, error: sErr },
          { data: msgs },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('sessions')
            .select('id, user_id, role, interview_type, total_score, verdict, strengths, improvements, top_advice, completed, completed_at')
            .eq('id', id).single(),
          supabase.from('messages')
            .select('id, session_id, sender, content, score, feedback, is_question, question_num, created_at')
            .eq('session_id', id).order('created_at', { ascending: true }),
        ])
        if (sErr || !s) throw new Error('Report not found.')
        if (s.user_id !== user.id) throw new Error('Unauthorised.')
        if (!s.completed) { navigate(`/interview/session?id=${id}`, { replace: true }); return }
        setSession(s)
        setMessages(msgs || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size={28} color="border-emerald-500" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/dashboard" className="text-emerald-400 text-sm">← Back to Dashboard</Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const questions  = messages.filter(m => m.is_question)
  const userAnswers = messages.filter(m => m.sender === 'user')
  const feedbacks  = messages.filter(m => m.sender === 'ai' && !m.is_question)
  const pairs      = questions.map(q => ({
    question: q,
    answer:   userAnswers.find(a => a.question_num === q.question_num),
    feedback: feedbacks.find(f => f.question_num === q.question_num),
  }))

  const strengths    = Array.isArray(session.strengths)    ? session.strengths    : []
  const improvements = Array.isArray(session.improvements) ? session.improvements : []
  const linkedInText = encodeURIComponent(
    `I scored ${session.total_score}/10 in a ${session.role} mock interview on InterviewIQ! #InterviewPrep #JobSearch`
  )

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div>
          <p className="text-emerald-400 text-sm font-mono mb-1 flex items-center gap-1.5">
            <CheckCircle2 size={14} /> Interview Complete
          </p>
          <h1 className="text-2xl font-bold text-white capitalize">
            {session.role?.replace(/_/g, ' ')} — {session.interview_type}
          </h1>
          <p className="text-gray-500 text-xs mt-1">{formatDate(session.completed_at)}</p>
        </div>

        {/* Score hero + S&I grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <Award size={28} className="text-emerald-400 mb-3" />
            <p className="font-mono font-bold text-white text-6xl mb-2">
              {session.total_score}
              <span className="text-gray-600 text-2xl font-normal">/10</span>
            </p>
            <span className={`inline-block px-4 py-1.5 rounded-full font-mono font-bold text-sm mb-4 ${verdictColor(session.verdict)}`}>
              {session.verdict}
            </span>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(session.total_score / 10) * 100}%` }} />
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-gray-900 border border-gray-800 border-l-4 border-l-emerald-500 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-400" /> What you did well
            </h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-gray-900 border border-gray-800 border-l-4 border-l-amber-500 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-amber-400" /> Areas to improve
            </h3>
            <ul className="space-y-2">
              {improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-amber-400 shrink-0 mt-0.5">→</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top advice */}
        {session.top_advice && (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 flex gap-3">
            <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">Most Important Thing To Work On</p>
              <p className="text-white text-sm leading-relaxed">{session.top_advice}</p>
            </div>
          </div>
        )}

        {/* Q&A Breakdown */}
        {pairs.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-3">Answer Review</h2>
            <div className="space-y-3">
              {pairs.map((pair, i) => {
                const fb    = pair.feedback?.feedback
                const score = pair.feedback?.score
                const isOpen = openQ === i
                return (
                  <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenQ(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-emerald-400 text-xs shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Q{i + 1}</span>
                        <p className="text-gray-300 text-sm truncate">{pair.question?.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {score && <span className={`font-mono font-bold text-sm ${scoreColor(score)}`}>{score}/10</span>}
                        {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-800 space-y-4 pt-4">
                        <div>
                          <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Question</p>
                          <p className="text-gray-200 text-sm leading-relaxed">{pair.question?.content}</p>
                        </div>
                        {pair.answer && (
                          <div>
                            <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">Your Answer</p>
                            <p className="text-gray-400 text-sm leading-relaxed italic">{pair.answer.content}</p>
                          </div>
                        )}
                        {fb && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                                <p className="text-xs text-emerald-400 mb-1 flex items-center gap-1"><CheckCircle2 size={12} /> Good</p>
                                <p className="text-gray-300 text-xs leading-relaxed">{fb.good}</p>
                              </div>
                              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                <p className="text-xs text-red-400 mb-1 flex items-center gap-1"><XCircle size={12} /> Missing</p>
                                <p className="text-gray-300 text-xs leading-relaxed">{fb.missing}</p>
                              </div>
                              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                                <p className="text-xs text-amber-400 mb-1 flex items-center gap-1"><Lightbulb size={12} /> Ideal</p>
                                <p className="text-gray-300 text-xs leading-relaxed">{fb.ideal}</p>
                              </div>
                            </div>
                            {fb.star_breakdown && <StarBreakdown breakdown={fb.star_breakdown} />}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/interview/setup" className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-sm transition-colors">
            <Play size={16} /> Start Another Interview
          </Link>
          <Link to="/progress" className="flex-1 flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 py-3 rounded-lg text-sm transition-colors">
            View All Progress
          </Link>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=https://interviewiq.in&summary=${linkedInText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 px-5 py-3 rounded-lg text-sm transition-colors"
          >
            <Share2 size={14} /> Share
          </a>
        </div>

      </div>
    </AppLayout>
  )
}
