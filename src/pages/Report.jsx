import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import StarBreakdown from '../components/StarBreakdown'
import { verdictColor, scoreColor } from '../utils/scoreHelpers'
import { formatDate } from '../utils/dateHelpers'
import { supabase } from '../lib/supabase'

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openQ, setOpenQ] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        // Run all three queries in parallel — cuts load time by 2/3
        const [
          { data: { user } },
          { data: s, error: sErr },
          { data: msgs },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from('sessions')
            .select('id, user_id, role, interview_type, total_score, verdict, strengths, improvements, top_advice, completed, completed_at')
            .eq('id', id)
            .single(),
          supabase
            .from('messages')
            .select('id, session_id, sender, content, score, feedback, is_question, question_num, created_at')
            .eq('session_id', id)
            .order('created_at', { ascending: true }),
        ])

        if (sErr || !s) throw new Error('Report not found.')
        if (s.user_id !== user.id) throw new Error('Unauthorised.')
        if (!s.completed) {
          navigate(`/interview/session?id=${id}`, { replace: true })
          return
        }

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
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Spinner size={28} color="border-emerald-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link to="/dashboard" className="text-emerald-400 text-sm">← Back to Dashboard</Link>
        </div>
      </div>
    )
  }

  // Build Q&A pairs
  const questions = messages.filter(m => m.is_question)
  const userAnswers = messages.filter(m => m.sender === 'user')
  const feedbacks = messages.filter(m => m.sender === 'ai' && !m.is_question)

  const pairs = questions.map(q => ({
    question: q,
    answer: userAnswers.find(a => a.question_num === q.question_num),
    feedback: feedbacks.find(f => f.question_num === q.question_num),
  }))

  const strengths = Array.isArray(session.strengths) ? session.strengths : []
  const improvements = Array.isArray(session.improvements) ? session.improvements : []

  const linkedInText = encodeURIComponent(
    `I scored ${session.total_score}/10 in a ${session.role} mock interview on InterviewIQ! Practicing daily to ace my next interview. #InterviewPrep #JobSearch`
  )

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div>
          <p className="text-emerald-400 text-sm font-mono mb-1">Interview Complete ✓</p>
          <h1 className="font-mono font-bold text-white text-2xl">{session.role} — {session.interview_type}</h1>
          <p className="text-gray-600 text-xs mt-1">{formatDate(session.completed_at)}</p>
        </div>

        {/* Score hero */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="font-mono font-bold text-white text-6xl mb-2">
            {session.total_score}
            <span className="text-gray-600 text-2xl font-normal">/10</span>
          </p>
          <span className={`inline-block px-4 py-1.5 rounded-full font-mono font-bold text-sm ${verdictColor(session.verdict)}`}>
            {session.verdict}
          </span>
          <div className="mt-5 h-2 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${(session.total_score / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Strengths + Improvements */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-mono font-bold text-white text-sm mb-3">What you did well ✅</h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-emerald-400">
                  <span className="shrink-0">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="font-mono font-bold text-white text-sm mb-3">Areas to improve 📈</h3>
            <ul className="space-y-2">
              {improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-400">
                  <span className="shrink-0">→</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Top advice */}
        {session.top_advice && (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5">
            <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
              💡 Most Important Thing To Work On
            </p>
            <p className="text-white text-sm leading-relaxed">{session.top_advice}</p>
          </div>
        )}

        {/* Q&A Breakdown */}
        {pairs.length > 0 && (
          <div>
            <h2 className="font-mono font-bold text-white text-sm mb-3">Answer Review</h2>
            <div className="space-y-3">
              {pairs.map((pair, i) => {
                const fb = pair.feedback?.feedback
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
                        <span className="font-mono text-emerald-400 text-xs shrink-0">Q{i + 1}</span>
                        <p className="text-gray-300 text-sm truncate">{pair.question?.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {score && (
                          <span className={`font-mono font-bold text-sm ${scoreColor(score)}`}>
                            {score}/10
                          </span>
                        )}
                        <span className="text-gray-600 text-xs">{isOpen ? '▲' : '▼'}</span>
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
                                <p className="text-xs text-emerald-400 mb-1">✅ Good</p>
                                <p className="text-gray-300 text-xs leading-relaxed">{fb.good}</p>
                              </div>
                              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                <p className="text-xs text-red-400 mb-1">❌ Missing</p>
                                <p className="text-gray-300 text-xs leading-relaxed">{fb.missing}</p>
                              </div>
                              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                                <p className="text-xs text-amber-400 mb-1">💡 Ideal</p>
                                <p className="text-gray-300 text-xs leading-relaxed">{fb.ideal}</p>
                              </div>
                            </div>
                            {fb.star_breakdown && (
                              <StarBreakdown breakdown={fb.star_breakdown} />
                            )}
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

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/interview/setup"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-center text-sm transition-colors min-h-11 flex items-center justify-center"
          >
            Start Another Interview
          </Link>
          <Link
            to="/interview/setup"
            className="flex-1 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 py-3 rounded-lg text-center text-sm transition-colors min-h-11 flex items-center justify-center"
          >
            Practice Weak Areas
          </Link>
          <Link
            to="/dashboard"
            className="text-gray-500 hover:text-gray-300 py-3 text-center text-sm transition-colors min-h-11 flex items-center justify-center"
          >
            ← Dashboard
          </Link>
        </div>

        {/* LinkedIn share */}
        <div className="border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-gray-500 text-xs mb-3">Share your achievement</p>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=https://interviewiq.in&summary=${linkedInText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Share on LinkedIn
          </a>
        </div>

      </div>
    </div>
  )
}
