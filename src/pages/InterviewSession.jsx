import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Clock, XCircle, Send, CheckCircle, AlertCircle,
  Lightbulb, MessageSquare, Loader2,
} from 'lucide-react'
import { useInterview } from '../hooks/useInterview'
import Spinner from '../components/Spinner'
import StarBreakdown from '../components/StarBreakdown'
import { validators } from '../utils/validators'
import { scoreColor } from '../utils/scoreHelpers'

function useTimer() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const s = String(elapsed % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function InterviewSession() {
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const sessionId = params.get('id')
  const timer     = useTimer()

  const {
    messages, loading, setLoading, questionNumber,
    isComplete, sessionData, streamError, loadSession, sendAnswer,
  } = useInterview()

  const [input, setInput]           = useState('')
  const [error, setError]           = useState('')
  const [showExit, setShowExit]     = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [currentFeedback, setCurrentFeedback] = useState(null) // feedback for current Q
  const [feedbackQ, setFeedbackQ]   = useState(null)           // which Q this feedback is for
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!sessionId) { navigate('/dashboard'); return }
    async function init() {
      try {
        const session = await loadSession(sessionId)
        if (session.completed) navigate(`/report/${sessionId}`, { replace: true })
      } catch (err) { setError(err.message) }
      finally { setInitLoading(false) }
    }
    init()
  }, [sessionId])

  useEffect(() => {
    if (isComplete) navigate(`/report/${sessionId}`, { replace: true })
  }, [isComplete])

  // Current question is the last AI message that is_question
  const currentQuestion = [...messages].reverse().find(m => m.is_question)

  async function handleSubmit(e) {
    e?.preventDefault()
    if (loading) return
    const answerErr = validators.interviewAnswer(input)
    if (answerErr) { setError(answerErr); return }
    const answer = validators.sanitize(input)
    setInput('')
    setError('')
    setCurrentFeedback(null)
    setLoading(true)

    try {
      const result = await sendAnswer(answer)
      // After sendAnswer, get the feedback from the last AI non-question message
      if (result.isComplete) {
        setGeneratingReport(true)
      }
    } catch (err) {
      setError(err.message || 'Failed to get response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }

  // Find last feedback from messages
  const lastFeedbackMsg = [...messages].reverse().find(m => m.sender === 'ai' && !m.is_question && m.feedback)
  const latestFeedback  = lastFeedbackMsg?.feedback
  const hasAnsweredCurrentQ = messages.some(m => m.sender === 'user' && m.question_num === currentQuestion?.question_num)

  // Loading skeleton
  if (initLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spinner size={28} color="border-emerald-500" />
          <p className="text-gray-500 text-sm">Loading your interview…</p>
        </div>
      </div>
    )
  }

  const roleLabel = sessionData?.role?.replace(/_/g, ' ') || 'Interview'
  const typeLabel = sessionData?.interviewType || ''

  return (
    <div className="bg-[#0a0a0f]" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ──────────────────────────────────────── */}
      <header className="shrink-0 h-14 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 z-10">
        <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-full font-mono truncate max-w-36 capitalize">
          {roleLabel} · {typeLabel}
        </span>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              className={`w-2 h-2 rounded-full transition-colors ${
                n < questionNumber ? 'bg-emerald-500'
                : n === questionNumber ? 'bg-emerald-500/60'
                : 'bg-gray-700'
              }`}
            />
          ))}
          <span className="text-gray-500 text-xs ml-1 font-mono">Q{questionNumber}/5</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-gray-500 text-xs font-mono">
            <Clock size={13} />
            {timer}
          </div>
          <button
            type="button"
            onClick={() => setShowExit(true)}
            className="flex items-center gap-1 text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            <XCircle size={16} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* ── Two-panel body ───────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left panel — Question + Feedback */}
        <div className="w-full md:w-[38%] border-r border-gray-800 flex flex-col overflow-y-auto bg-gray-950">
          <div className="p-5 flex-1">

            {/* Question number badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <MessageSquare size={11} /> Question {questionNumber}
              </span>
            </div>

            {/* Question text */}
            {loading && !currentQuestion ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 size={16} className="text-emerald-500 animate-spin" />
                <span className="text-gray-500 text-sm">AI is thinking…</span>
              </div>
            ) : currentQuestion ? (
              <p className="text-white text-base md:text-lg leading-relaxed font-medium">
                {currentQuestion.content}
              </p>
            ) : (
              <div className="flex items-center gap-2 py-4">
                <Loader2 size={16} className="text-emerald-500 animate-spin" />
                <span className="text-gray-500 text-sm">Loading question…</span>
              </div>
            )}

            {streamError && <p className="text-red-400 text-sm mt-3">{streamError}</p>}

            {/* Hint card — shown before answering */}
            {currentQuestion && !hasAnsweredCurrentQ && !loading && (
              <div className="mt-6 bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-400 text-xs font-medium flex items-center gap-1.5 mb-1.5">
                  <Lightbulb size={13} /> Tip
                </p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  {sessionData?.interviewType === 'behavioral'
                    ? 'Use the STAR method: Situation → Task → Action → Result'
                    : sessionData?.interviewType === 'technical'
                    ? 'Think out loud. Explain your reasoning before giving the answer.'
                    : 'Be specific and use real examples where possible.'}
                </p>
              </div>
            )}

            {/* Feedback panel — shown after answering */}
            {hasAnsweredCurrentQ && latestFeedback && latestFeedback.score != null && (
              <div className="mt-6 space-y-4">
                {/* Score ring */}
                <div className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-xl">
                  <div className={`text-3xl font-bold font-mono ${scoreColor(latestFeedback.score)}`}>
                    {latestFeedback.score}<span className="text-gray-600 text-base font-normal">/10</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                        style={{ width: `${(latestFeedback.score / 10) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Good */}
                {latestFeedback.good && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 mb-1.5">
                      <CheckCircle size={13} /> What went well
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">{latestFeedback.good}</p>
                  </div>
                )}

                {/* Missing */}
                {latestFeedback.missing && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <p className="text-red-400 text-xs font-medium flex items-center gap-1.5 mb-1.5">
                      <AlertCircle size={13} /> What was missing
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">{latestFeedback.missing}</p>
                  </div>
                )}

                {/* Ideal */}
                {latestFeedback.ideal && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <p className="text-blue-400 text-xs font-medium flex items-center gap-1.5 mb-1.5">
                      <Lightbulb size={13} /> Ideal answer
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">{latestFeedback.ideal}</p>
                  </div>
                )}

                {/* STAR breakdown */}
                {latestFeedback.star_breakdown && (
                  <StarBreakdown breakdown={latestFeedback.star_breakdown} />
                )}
              </div>
            )}

            {/* AI evaluating indicator */}
            {loading && hasAnsweredCurrentQ && !generatingReport && (
              <div className="mt-6 flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin text-emerald-500" />
                AI is evaluating your answer…
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Answer input */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden">
          {generatingReport ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
              <Loader2 size={32} className="text-emerald-500 animate-spin" />
              <p className="text-white font-medium">Generating your interview report…</p>
              <p className="text-gray-500 text-sm">Analyzing all 5 answers</p>
              <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-[progress_4s_ease-in-out_forwards]" style={{ width: '85%' }} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm font-medium">Your Answer</p>
                <span className="text-gray-600 text-xs font-mono">{input.length} chars</span>
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer here…&#10;&#10;Be specific. Use examples. Think out loud."
                disabled={loading || hasAnsweredCurrentQ}
                className="flex-1 bg-gray-900 border border-gray-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-white rounded-xl px-5 py-4 text-sm outline-none transition-colors resize-none disabled:opacity-50 leading-relaxed"
              />

              {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

              <div className="flex items-center justify-between mt-4">
                <p className="text-gray-700 text-xs">Ctrl+Enter to submit</p>
                <button
                  type="submit"
                  disabled={loading || !input.trim() || hasAnsweredCurrentQ}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {loading ? 'Evaluating…' : 'Submit Answer'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Mobile answer area — shown below question panel on mobile */}
      <div className="md:hidden shrink-0 bg-gray-950 border-t border-gray-800 px-4 py-3">
        {generatingReport ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 size={16} className="text-emerald-500 animate-spin" />
            <p className="text-gray-400 text-sm">Generating report…</p>
          </div>
        ) : (
          <>
            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer…"
                disabled={loading || hasAnsweredCurrentQ}
                rows={3}
                className="flex-1 bg-gray-800 border border-gray-700 focus:border-emerald-500 text-white rounded-lg px-3 py-2.5 text-sm outline-none transition-colors resize-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || hasAnsweredCurrentQ}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold p-3 rounded-lg transition-colors shrink-0"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Exit dialog */}
      {showExit && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-20 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="font-mono font-bold text-white mb-2">Exit interview?</h3>
            <p className="text-gray-400 text-sm mb-6">Your progress will be saved and you can resume later.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExit(false)}
                className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-3 rounded-lg text-sm transition-colors"
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg text-sm transition-colors"
              >
                Exit and save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
