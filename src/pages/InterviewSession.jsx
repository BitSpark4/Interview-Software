import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Clock, XCircle, PaperPlaneTilt, CheckCircle, Warning,
  Lightbulb, Brain, CircleNotch, Microphone,
} from '@phosphor-icons/react'
import { useInterview } from '../hooks/useInterview'
import { useAuth } from '../hooks/useAuth'
import { saveAskedQuestion } from '../lib/claudeApi'
import { supabase } from '../lib/supabase'
import Spinner from '../components/Spinner'
import StarBreakdown from '../components/StarBreakdown'
import ProFeatureWrapper from '../components/ProFeatureWrapper'
import { validators } from '../utils/validators'
import { scoreColor } from '../utils/scoreHelpers'

function useTimer(paused = false) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [paused])
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const s = String(elapsed % 60).padStart(2, '0')
  return `${m}:${s}`
}

/** Circular score ring (SVG) */
function ScoreRing({ score }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const filled = (score / 10) * circ

  const color = score >= 8 ? '#22C55E' : score >= 6 ? '#3B82F6' : '#EF4444'

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
                      ? 'linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)'
                      : 'transparent',
                    boxShadow: isActive && !hasAnsweredCurrent ? '0 0 6px rgba(37,99,235,0.5)' : 'none',
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
                    background: isCompleted ? '#22C55E' : isActive ? 'rgba(37,99,235,0.15)' : 'transparent',
                    border: isCompleted ? 'none' : isActive ? '1.5px solid #2563EB' : '1.5px solid #334155',
                  }}
                >
                  {isCompleted ? (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <span
                      className="font-mono font-bold"
                      style={{ fontSize: 8, color: isActive ? '#2563EB' : '#374151' }}
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
  const { userProfile } = useAuth()

  const {
    messages, loading, setLoading, questionNumber,
    isComplete, sessionData, streamError, loadSession, sendAnswer,
  } = useInterview()

  const [input, setInput]           = useState('')
  const [error, setError]           = useState('')
  const [showExit, setShowExit]     = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const [retrying, setRetrying]     = useState(false)
  const [guideOpen, setGuideOpen]   = useState(false)
  const timer = useTimer(false)   // always count — don't pause during AI calls
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

  // Save each new question so it is never repeated in future sessions
  const lastQuestionRef = useRef('')
  useEffect(() => {
    const q = [...messages].reverse().find(m => m.is_question)
    if (!q?.content || q.content === lastQuestionRef.current) return
    lastQuestionRef.current = q.content
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user && sessionData?.sector) {
        saveAskedQuestion(user.id, sessionData.sector, q.content)
      }
    })
  }, [messages, sessionData])

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

  const totalQuestions = sessionData?.totalQuestions || 10
  const lastFeedbackMsg = [...messages].reverse().find(m => m.sender === 'ai' && !m.is_question && m.feedback)
  const latestFeedback  = lastFeedbackMsg?.feedback
  const hasAnsweredCurrentQ = messages.some(m => m.sender === 'user' && m.question_num === currentQuestion?.question_num)

  if (initLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Spinner size={28} color="border-blue-500" />
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
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-mono text-gray-400 capitalize truncate max-w-[140px] sm:max-w-none">
            {roleLabel} · <span className="text-gray-500">{typeLabel}</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 min-w-0 flex-1 mx-4">
          <span className="text-gray-400 text-xs font-mono shrink-0">Q{questionNumber} of {totalQuestions}</span>
          <div className="flex-1 rounded-full overflow-hidden" style={{ height: 4, background: '#1F2937' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((questionNumber / totalQuestions) * 100)}%`, background: '#2563EB' }}
            />
          </div>
          <span className="text-gray-600 text-xs font-mono shrink-0">{Math.round((questionNumber / totalQuestions) * 100)}%</span>
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
        totalQuestions={totalQuestions}
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
                style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)', color: '#2563EB' }}
              >
                <Brain size={10} />
                Question {questionNumber} of {totalQuestions}
              </span>
            </div>

            {/* Question text */}
            <div>
              {loading ? (
                // FIX 3: skeleton while loading
                <div className="space-y-3 py-1 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-full" />
                  <div className="h-4 bg-gray-800 rounded w-2/3" />
                  <p className="text-gray-500 text-sm pt-1">Loading your next question…</p>
                </div>
              ) : currentQuestion?.content?.trim() ? (
                // FIX 1: only render if content is non-empty
                <p className="text-gray-100 whitespace-pre-wrap leading-relaxed font-medium" style={{ fontSize: 17 }}>
                  {currentQuestion.content}
                </p>
              ) : currentQuestion && !currentQuestion.content?.trim() ? (
                // FIX 4: question object exists but content is empty — show retry
                <div className="space-y-3 py-1">
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                    <div className="h-4 bg-gray-800 rounded w-full" />
                    <div className="h-4 bg-gray-800 rounded w-2/3" />
                  </div>
                  <p className="text-gray-500 text-sm">Could not load question.</p>
                  <button
                    type="button"
                    disabled={retrying}
                    onClick={async () => {
                      setRetrying(true)
                      await new Promise(r => setTimeout(r, 1500))
                      window.location.reload()
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {retrying ? 'Retrying…' : 'Retry'}
                  </button>
                </div>
              ) : (
                // No question at all yet
                <div className="flex items-center gap-2.5 py-2">
                  <CircleNotch size={15} className="text-blue-500 animate-spin shrink-0" />
                  <span className="text-gray-500 text-sm">Loading question…</span>
                </div>
              )}
              {streamError && (
                <p className="text-red-400 text-sm mt-3">{streamError}</p>
              )}
            </div>

            {/* Progress indicator card */}
            {currentQuestion?.content?.trim() && !loading && (
              <div
                className="rounded-xl p-4"
                style={{ background: '#111827', border: '1px solid #1F2937' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-300 text-xs font-mono font-semibold">
                    Question {questionNumber} of {totalQuestions}
                  </span>
                  <span className="text-blue-400 text-xs font-mono font-bold">
                    {Math.round((questionNumber / totalQuestions) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((questionNumber / totalQuestions) * 100)}%`,
                      background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Collapsible "How to answer well" guide */}
            {currentQuestion?.content?.trim() && !hasAnsweredCurrentQ && !loading && (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid rgba(139,92,246,0.2)' }}
              >
                <button
                  type="button"
                  onClick={() => setGuideOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                  style={{ background: 'rgba(139,92,246,0.06)' }}
                >
                  <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#A78BFA' }}>
                    <Brain size={12} /> How to answer well
                  </span>
                  <span style={{ color: '#6B7280', fontSize: 10 }}>{guideOpen ? '▲' : '▼'}</span>
                </button>
                {guideOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2" style={{ background: 'rgba(139,92,246,0.03)' }}>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 text-xs mt-0.5 shrink-0">✓</span>
                      <p className="text-gray-400 text-xs leading-relaxed">Start with a brief structure — tell the interviewer how you'll approach the answer before diving in.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 text-xs mt-0.5 shrink-0">✓</span>
                      <p className="text-gray-400 text-xs leading-relaxed">Use specific examples and numbers. "I improved performance by 40%" beats "I made it faster."</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-blue-400 text-xs mt-0.5 shrink-0">✓</span>
                      <p className="text-gray-400 text-xs leading-relaxed">Aim for 2–3 minutes of content. Too short signals lack of depth; too long loses the interviewer.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tip — shown before answering, only when question text is visible */}
            {currentQuestion?.content?.trim() && !hasAnsweredCurrentQ && !loading && (
              <div
                className="rounded-xl p-4"
                style={{ background: 'rgba(245,158,11,0.08)', borderLeft: '3px solid #F59E0B', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <p
                  className="text-xs font-semibold flex items-center gap-1.5 mb-2"
                  style={{ color: '#F59E0B' }}
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
                            ? 'linear-gradient(90deg, #3B82F6, #93C5FD)'
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

                {/* What was missing — improvement tip (Pro) */}
                {latestFeedback.missing && (
                  <ProFeatureWrapper
                    userProfile={userProfile}
                    featureName="Improvement Tip"
                    description="Get specific advice to improve your answer next time"
                    compact={true}
                  >
                    <div
                      className="rounded-xl p-4"
                      style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.18)' }}
                    >
                      <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#F59E0B' }}>
                        <Warning size={12} /> What was missing
                      </p>
                      <p className="text-gray-300 text-sm leading-relaxed">{latestFeedback.missing}</p>
                    </div>
                  </ProFeatureWrapper>
                )}

                {/* Ideal answer — correct answer (Pro) */}
                {latestFeedback.ideal && (
                  <ProFeatureWrapper
                    userProfile={userProfile}
                    featureName="Correct Answer"
                    description="See the ideal answer that scores 10 out of 10"
                    compact={false}
                  >
                    <div
                      className="rounded-xl p-4"
                      style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.18)' }}
                    >
                      <p className="text-xs font-semibold flex items-center gap-1.5 mb-2" style={{ color: '#60A5FA' }}>
                        <Lightbulb size={12} /> Ideal answer
                      </p>
                      <p className="text-gray-300 text-sm leading-relaxed">{latestFeedback.ideal}</p>
                    </div>
                  </ProFeatureWrapper>
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
                <CircleNotch size={15} className="animate-spin text-blue-500 shrink-0" />
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
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}
              >
                <CircleNotch size={28} className="text-blue-500 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-lg mb-1">Generating your report…</p>
                <p className="text-gray-500 text-sm">Analyzing all {totalQuestions} answers</p>
              </div>
              <div className="w-56 h-1 rounded-full overflow-hidden" style={{ background: '#1F2937' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
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
              <div>
                <p className="text-white font-semibold text-sm">Your Answer</p>
              </div>

              {/* Textarea + char count */}
              <div className="relative flex-1">
                <div
                  className="rounded-xl overflow-hidden transition-all duration-200 h-full"
                  style={{
                    border: `1px solid ${input.length > 0 ? 'rgba(37,99,235,0.3)' : '#1E2D45'}`,
                    background: '#0B1120',
                    boxShadow: input.length > 0 ? '0 0 0 3px rgba(37,99,235,0.05)' : 'none',
                  }}
                >
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Type your answer here…\n\nBe specific. Use real examples. Think out loud.`}
                    disabled={loading || hasAnsweredCurrentQ}
                    className="w-full h-full min-h-[200px] bg-transparent text-gray-100 px-5 py-4 pb-7 text-sm outline-none resize-none disabled:opacity-50 leading-relaxed placeholder-gray-700"
                    style={{ fontFamily: 'inherit' }}
                  />
                </div>
                {/* Character count — bottom right of textarea */}
                <span
                  className="absolute bottom-2 right-3 font-mono text-xs pointer-events-none select-none"
                  style={{ color: input.length > 1800 ? '#EF4444' : input.length > 50 ? '#4ADE80' : '#374151' }}
                >
                  {input.length} / 2000
                </span>
              </div>

              {error && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <Warning size={12} /> {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !input.trim() || hasAnsweredCurrentQ}
                className="w-full flex items-center justify-center gap-2 font-bold text-sm rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  height: 52,
                  background: loading || !input.trim() || hasAnsweredCurrentQ
                    ? '#1E293B'
                    : '#2563EB',
                  color: loading || !input.trim() || hasAnsweredCurrentQ ? '#475569' : '#fff',
                  boxShadow: !loading && input.trim() && !hasAnsweredCurrentQ
                    ? '0 4px 20px rgba(37,99,235,0.3)'
                    : 'none',
                }}
              >
                {loading ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  <PaperPlaneTilt size={16} />
                )}
                <span>
                  {loading ? 'Evaluating…' : hasAnsweredCurrentQ ? 'Answered' : 'Submit Answer'}
                </span>
                {!loading && !hasAnsweredCurrentQ && (
                  <span
                    className="ml-2 text-[10px] font-mono font-normal opacity-60 hidden sm:inline"
                    style={{ color: input.trim() ? '#fff' : '#475569' }}
                  >
                    Ctrl+Enter
                  </span>
                )}
              </button>
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
            <CircleNotch size={15} className="text-blue-500 animate-spin" />
            <p className="text-gray-400 text-sm">Generating report…</p>
          </div>
        ) : (
          <>
            {error && <p className="text-red-400 text-xs mb-2 flex items-center gap-1"><Warning size={11} /> {error}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer…"
                  disabled={loading || hasAnsweredCurrentQ}
                  rows={3}
                  className="w-full text-white text-sm px-3 py-2.5 pb-6 outline-none resize-none disabled:opacity-50 rounded-xl leading-relaxed placeholder-gray-700"
                  style={{ background: '#111827', border: '1px solid #1E2D45', fontFamily: 'inherit' }}
                />
                <span
                  className="absolute bottom-1.5 right-2.5 font-mono text-[10px] pointer-events-none select-none"
                  style={{ color: input.length > 1800 ? '#EF4444' : input.length > 50 ? '#4ADE80' : '#374151' }}
                >
                  {input.length} / 2000
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-[10px]">Ctrl+Enter to submit</span>
                <button
                  type="submit"
                  disabled={loading || !input.trim() || hasAnsweredCurrentQ}
                  className="flex items-center gap-1.5 text-white font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 text-sm"
                  style={{ background: '#2563EB' }}
                >
                  {loading ? <CircleNotch size={14} className="animate-spin" /> : <PaperPlaneTilt size={14} />}
                  {loading ? 'Evaluating…' : 'Submit'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Exit dialog */}
      {showExit && (
        <div className="fixed inset-0 z-20 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 max-w-sm w-full" style={{ background: '#0F172A', border: '1px solid #1E2D45' }}>
            <h3 className="font-mono font-bold text-white text-base mb-2">Exit interview?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">Your progress will be saved. You can resume this interview later from the dashboard.</p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowExit(false)}
                className="w-full font-semibold py-3 rounded-xl text-sm transition-colors"
                style={{ background: '#2563EB', color: '#fff' }}
                onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
                onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
              >
                Continue Interview
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-full text-gray-400 hover:text-white py-3 rounded-xl text-sm transition-colors"
                style={{ border: '1px solid #374151' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#4B5563'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#374151'}
              >
                Exit and save progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
