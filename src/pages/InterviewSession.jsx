import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Clock, XCircle, Send, CheckCircle, AlertCircle,
  Lightbulb, MessageSquare, Loader2, Mic,
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

/** Circular score ring (SVG) */
function ScoreRing({ score }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const filled = (score / 10) * circ

  const color = score >= 8 ? '#22C55E' : score >= 6 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1F2937" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="font-mono font-bold text-xl" style={{ color }}>{score}</span>
        <span className="text-gray-600 text-[10px] font-mono">/10</span>
      </div>
    </div>
  )
}

/** Question progress stepper — wired to questionNumber (1-5) */
function SessionProgress({ questionNumber, totalQuestions = 5, hasAnsweredCurrent }) {
  return (
    <div
      className="shrink-0 px-4 md:px-6"
      style={{
        background: '#0B1120',
        borderBottom: '1px solid #1a2235',
        paddingTop: 12,
        paddingBottom: 12,
      }}
    >
      <div className="flex items-start gap-2">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const step = i + 1
          const isCompleted = step < questionNumber
          const isActive = step === questionNumber
          const isUpcoming = step > questionNumber

          return (
            <div key={step} className="flex flex-col gap-1.5 flex-1">
              {/* Bar */}
              <div
                className="h-[3px] w-full rounded-full overflow-hidden"
                style={{ background: '#1a2235' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: isCompleted ? '100%' : isActive ? (hasAnsweredCurrent ? '100%' : '50%') : '0%',
                    background: isCompleted
                      ? '#22C55E'
                      : isActive
                      ? 'linear-gradient(90deg, #22C55E 0%, #86EFAC 100%)'
                      : 'transparent',
                    boxShadow: isActive && !hasAnsweredCurrent ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
                  }}
                />
              </div>

              {/* Label row */}
              <div className="flex items-center gap-1">
                {/* Circle indicator */}
                <div
                  className="flex items-center justify-center shrink-0 rounded-full transition-all duration-300"
                  style={{
                    width: 16,
                    height: 16,
                    background: isCompleted ? '#22C55E' : isActive ? 'rgba(34,197,94,0.15)' : 'transparent',
                    border: isCompleted ? 'none' : isActive ? '1.5px solid #22C55E' : '1.5px solid #1F2937',
                  }}
                >
                  {isCompleted ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span
                      className="font-mono font-bold"
                      style={{ fontSize: 8, color: isActive ? '#22C55E' : '#374151' }}
                    >
                      {step}
                    </span>
                  )}
                </div>

                {/* Label — hidden on mobile for steps > 1 to save space */}
                <span
                  className={`font-mono text-[10px] transition-colors duration-300 ${step > 1 ? 'hidden sm:block' : ''}`}
                  style={{
                    color: isCompleted ? '#22C55E' : isActive ? '#E2E8F0' : '#374151',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  Q{step}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Auto-resize textarea hook */
function useAutoResize(value) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`
  }, [value])
  return ref
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
  const textareaRef = useAutoResize(input)

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

  const currentQuestion = [...messages].reverse().find(m => m.is_question)

  async function handleSubmit(e) {
    e?.preventDefault()
    if (loading) return
    const answerErr = validators.interviewAnswer(input)
    if (answerErr) { setError(answerErr); return }
    const answer = validators.sanitize(input)
    setInput('')
    setError('')
    setLoading(true)
    try {
      const result = await sendAnswer(answer)
      if (result.isComplete) setGeneratingReport(true)
    } catch (err) {
      setError(err.message || 'Failed to get response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit() }
  }

  const lastFeedbackMsg = [...messages].reverse().find(m => m.sender === 'ai' && !m.is_question && m.feedback)
  const latestFeedback  = lastFeedbackMsg?.feedback
  const hasAnsweredCurrentQ = messages.some(m => m.sender === 'user' && m.question_num === currentQuestion?.question_num)

  if (initLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spinner size={28} color="border-emerald-500" />
          <p className="text-gray-500 text-sm font-mono">Preparing your interview…</p>
        </div>
      </div>
    )
  }

  const roleLabel = sessionData?.role?.replace(/_/g, ' ') || 'Interview'
  const typeLabel = sessionData?.interviewType || ''

  return (
    <div className="bg-[#080C14]" style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center justify-between px-4 md:px-6 z-10"
        style={{ height: 56, background: '#0F172A', borderBottom: '1px solid #1a2235' }}
      >
        {/* Session label */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono text-gray-400 capitalize truncate max-w-[140px] sm:max-w-none">
            {roleLabel} · <span className="text-gray-500">{typeLabel}</span>
          </span>
        </div>

        {/* Progress pips */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <div
              key={n}
              style={{
                width: n === questionNumber ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background:
                  n < questionNumber  ? '#22C55E' :
                  n === questionNumber ? '#22C55E' :
                  '#1F2937',
                opacity: n === questionNumber ? 1 : n < questionNumber ? 0.7 : 1,
                transition: 'width 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
          <span className="text-gray-600 text-xs font-mono ml-2">
            {questionNumber}<span className="text-gray-700">/5</span>
          </span>
        </div>

        {/* Timer + Exit */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-xs"
            style={{ color: '#4B5563', background: '#111827', padding: '4px 10px', borderRadius: 6 }}>
            <Clock size={12} />
            {timer}
          </div>
          <button
            type="button"
            onClick={() => setShowExit(true)}
            className="flex items-center gap-1 text-gray-600 hover:text-red-400 text-xs transition-colors"
          >
            <XCircle size={15} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* ── Question stepper ─────────────────────────────────── */}
      <SessionProgress
        questionNumber={questionNumber}
        totalQuestions={5}
        hasAnsweredCurrent={hasAnsweredCurrentQ}
      />

      {/* ── Two-panel body ───────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left panel — Question + Feedback */}
        <div
          className="w-full md:w-[40%] flex flex-col overflow-y-auto"
          style={{ background: '#0B1120', borderRight: '1px solid #1a2235' }}
        >
          <div className="p-6 flex-1 space-y-5">

            {/* Question badge */}
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ADE80' }}
              >
                <MessageSquare size={10} />
                Question {questionNumber} of 5
              </span>
            </div>

            {/* Question text */}
            <div>
              {loading && !currentQuestion ? (
                <div className="flex items-center gap-2.5 py-2">
                  <Loader2 size={15} className="text-emerald-500 animate-spin shrink-0" />
                  <span className="text-gray-500 text-sm">Generating question…</span>
                </div>
              ) : currentQuestion ? (
                <p
                  className="leading-relaxed font-medium"
                  style={{ fontSize: 17, color: '#E2E8F0', letterSpacing: '-0.01em', lineHeight: 1.65 }}
                >
                  {currentQuestion.content}
                </p>
              ) : (
                <div className="flex items-center gap-2.5 py-2">
                  <Loader2 size={15} className="text-emerald-500 animate-spin shrink-0" />
                  <span className="text-gray-500 text-sm">Loading question…</span>
                </div>
              )}
              {streamError && (
                <p className="text-red-400 text-sm mt-3">{streamError}</p>
              )}
            </div>

            {/* Tip — shown before answering */}
            {currentQuestion && !hasAnsweredCurrentQ && !loading && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)' }}
              >
                <p
                  className="text-xs font-semibold flex items-center gap-1.5 mb-2"
                  style={{ color: '#60A5FA' }}
                >
                  <Lightbulb size={12} /> Tip
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {sessionData?.interviewType === 'behavioral'
                    ? 'Use the STAR method: Situation → Task → Action → Result. Quantify your results.'
                    : sessionData?.interviewType === 'technical'
                    ? 'Think out loud. Explain your reasoning before diving into the answer.'
                    : 'Be specific and back up claims with concrete examples from past experience.'}
                </p>
              </div>
            )}

            {/* Feedback — shown after answering */}
            {hasAnsweredCurrentQ && latestFeedback && latestFeedback.score != null && (
              <div className="space-y-4">
                {/* Score */}
                <div
                  className="flex items-center gap-4 rounded-xl p-4"
                  style={{ background: '#111827', border: '1px solid #1F2937' }}
                >
                  <ScoreRing score={latestFeedback.score} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm mb-1">Answer Score</p>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(latestFeedback.score / 10) * 100}%`,
                          background: latestFeedback.score >= 8
                            ? 'linear-gradient(90deg, #22C55E, #86EFAC)'
                            : latestFeedback.score >= 6
                            ? 'linear-gradient(90deg, #F59E0B, #FCD34D)'
                            : 'linear-gradient(90deg, #EF4444, #FCA5A5)',
                        }}
                      />
                    </div>
                    <p className="text-gray-600 text-xs mt-1.5 font-mono">
                      {latestFeedback.score >= 8 ? 'Excellent' : latestFeedback.score >= 6 ? 'Good' : latestFeedback.score >= 4 ? 'Needs work' : 'Keep practicing'}
                    </p>
                  </div>
                </div>

                {/* What went well */}
                {latestFeedback.good && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.18)' }}
                  >
                    <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#4ADE80' }}>
                      <CheckCircle size={12} /> What went well
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">{latestFeedback.good}</p>
                  </div>
                )}

                {/* What was missing */}
                {latestFeedback.missing && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.18)' }}
                  >
                    <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#F87171' }}>
                      <AlertCircle size={12} /> What was missing
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">{latestFeedback.missing}</p>
                  </div>
                )}

                {/* Ideal answer */}
                {latestFeedback.ideal && (
                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.18)' }}
                  >
                    <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#60A5FA' }}>
                      <Lightbulb size={12} /> Ideal answer
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

            {/* Evaluating indicator */}
            {loading && hasAnsweredCurrentQ && !generatingReport && (
              <div className="flex items-center gap-2.5 py-3 text-sm text-gray-500">
                <Loader2 size={15} className="animate-spin text-emerald-500 shrink-0" />
                <span>AI is evaluating your answer…</span>
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Answer input */}
        <div className="hidden md:flex flex-col flex-1 overflow-hidden" style={{ background: '#080C14' }}>
          {generatingReport ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <Loader2 size={28} className="text-emerald-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-1">Generating your report…</p>
                <p className="text-gray-500 text-sm">Analyzing all 5 answers</p>
              </div>
              <div className="w-56 h-1 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #22C55E, #86EFAC)',
                    animation: 'progfill 4s ease-in-out forwards',
                    width: '85%',
                  }}
                />
              </div>
              <style>{`@keyframes progfill { from { width: 10%; } to { width: 85%; } }`}</style>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col h-full p-6 gap-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold text-sm">Your Answer</p>
                  <p className="text-gray-600 text-xs mt-0.5">Ctrl+Enter to submit</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-xs px-2 py-1 rounded"
                    style={{
                      background: '#111827',
                      color: input.length > 50 ? '#4ADE80' : '#4B5563',
                      transition: 'color 0.3s',
                    }}
                  >
                    {input.length} chars
                  </span>
                </div>
              </div>

              {/* Textarea */}
              <div
                className="relative flex-1 rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  border: `1px solid ${input.length > 0 ? 'rgba(34,197,94,0.3)' : '#1E2D45'}`,
                  background: '#0B1120',
                  boxShadow: input.length > 0 ? '0 0 0 3px rgba(34,197,94,0.05)' : 'none',
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Type your answer here…\n\nBe specific. Use real examples. Think out loud.`}
                  disabled={loading || hasAnsweredCurrentQ}
                  className="w-full h-full min-h-[200px] bg-transparent text-gray-100 px-5 py-4 text-sm outline-none resize-none disabled:opacity-50 leading-relaxed placeholder-gray-700"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle size={12} /> {error}
                </p>
              )}

              {/* Submit */}
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading || !input.trim() || hasAnsweredCurrentQ}
                  className="flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: loading || !input.trim() || hasAnsweredCurrentQ
                      ? '#1A2A1A'
                      : '#22C55E',
                    color: loading || !input.trim() || hasAnsweredCurrentQ ? '#2D4A2D' : '#000',
                    boxShadow: !loading && input.trim() && !hasAnsweredCurrentQ
                      ? '0 4px 16px rgba(34,197,94,0.25)'
                      : 'none',
                  }}
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  {loading ? 'Evaluating…' : hasAnsweredCurrentQ ? 'Answered' : 'Submit Answer'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Mobile answer area */}
      <div
        className="md:hidden shrink-0 px-4 py-3"
        style={{ background: '#0F172A', borderTop: '1px solid #1a2235' }}
      >
        {generatingReport ? (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 size={15} className="text-emerald-500 animate-spin" />
            <p className="text-gray-400 text-sm">Generating report…</p>
          </div>
        ) : (
          <>
            {error && <p className="text-red-400 text-xs mb-2 flex items-center gap-1"><AlertCircle size={11} /> {error}</p>}
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer…"
                disabled={loading || hasAnsweredCurrentQ}
                rows={3}
                className="flex-1 text-white text-sm px-3 py-2.5 outline-none resize-none disabled:opacity-50 rounded-xl leading-relaxed placeholder-gray-700"
                style={{ background: '#111827', border: '1px solid #1E2D45', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || hasAnsweredCurrentQ}
                className="flex items-center justify-center text-black font-bold p-3 rounded-xl transition-colors shrink-0 disabled:opacity-40"
                style={{ background: '#22C55E', minWidth: 44 }}
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Exit dialog */}
      {showExit && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: '#0F172A', border: '1px solid #1E2D45' }}>
            <h3 className="font-mono font-bold text-white text-base mb-2">Exit interview?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">Your progress will be saved and you can resume later from the dashboard.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExit(false)}
                className="flex-1 text-gray-300 hover:text-white py-3 rounded-xl text-sm transition-colors"
                style={{ border: '1px solid #1E2D45' }}
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 text-white py-3 rounded-xl text-sm transition-colors"
                style={{ background: '#1F2937', border: '1px solid #374151' }}
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
