import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useInterview } from '../hooks/useInterview'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import MessageBubble from '../components/MessageBubble'
import { validators } from '../utils/validators'

export default function InterviewSession() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const sessionId = params.get('id')

  const { messages, loading, setLoading, questionNumber, isComplete, sessionData, streamError, loadSession, sendAnswer } = useInterview()

  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [showExit, setShowExit] = useState(false)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [initLoading, setInitLoading] = useState(true)
  const chatEndRef = useRef(null)

  // Load session on mount
  useEffect(() => {
    if (!sessionId) { navigate('/dashboard'); return }

    async function init() {
      try {
        const session = await loadSession(sessionId)
        if (session.completed) {
          navigate(`/report/${sessionId}`, { replace: true })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setInitLoading(false)
      }
    }
    init()
  }, [sessionId])

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Redirect when report is ready
  useEffect(() => {
    if (isComplete) navigate(`/report/${sessionId}`, { replace: true })
  }, [isComplete])

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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── Loading skeleton ─────────────────────────────────────────
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

  const roleLabel = sessionData?.role?.replace(/([A-Z])/g, ' $1') || 'Interview'
  const typeLabel = sessionData?.interviewType || ''

  return (
    <div className="bg-[#0a0a0f] flex flex-col" style={{ height: '100dvh', overflow: 'hidden' }}>

      {/* ── Sticky top bar ────────────────────────────────────── */}
      <header className="shrink-0 h-14 bg-[#0a0a0f] border-b border-gray-800 flex items-center justify-between px-4 z-10">
        <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1.5 rounded-full font-mono truncate max-w-40">
          {roleLabel} · {typeLabel}
        </span>

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
          <span className="text-gray-600 text-xs ml-1 font-mono">Q{questionNumber}/5</span>
        </div>

        <button
          type="button"
          onClick={() => setShowExit(true)}
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          Exit
        </button>
      </header>

      {/* ── Chat area ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pt-4 pb-4 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages
            .filter(m => !(m.sender === 'ai' && !m.is_question))
            .map(msg => <MessageBubble key={msg.id} message={msg} />)
          }

          {/* Stream error */}
          {streamError && (
            <p className="text-red-400 text-sm">{streamError}</p>
          )}

          {/* AI thinking indicator */}
          {loading && !generatingReport && (
            <div className="flex items-start">
              <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-2">
                {[0, 0.15, 0.3].map((delay, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-gray-500 inline-block"
                    style={{ animation: `pulse-dot 1.2s ${delay}s ease-in-out infinite` }}
                  />
                ))}
                <span className="text-gray-600 text-xs ml-1">AI is evaluating…</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ── Sticky input area / generating state ─────────────── */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto">
          {generatingReport ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full animate-[progress_3s_ease-in-out_forwards]" style={{ width: '90%' }} />
              </div>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <Spinner size={14} color="border-emerald-500" />
                Generating your interview report…
              </p>
            </div>
          ) : (
            <>
              <ErrorMessage message={error} />
              <form onSubmit={handleSubmit} className="flex gap-3 items-end mt-1">
                <div className="flex-1 relative">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your answer here…"
                    disabled={loading}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors resize-none disabled:opacity-50"
                  />
                  <span className="absolute bottom-2 right-3 text-gray-700 text-xs">{input.length}</span>
                </div>
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold px-5 py-3 rounded-lg flex items-center gap-2 transition-colors min-h-11 shrink-0"
                >
                  {loading ? <Spinner size={16} color="border-black" /> : 'Send'}
                </button>
              </form>
              <p className="text-gray-700 text-xs mt-1">Ctrl+Enter to submit</p>
            </>
          )}
        </div>
      </div>

      {/* ── Exit dialog ───────────────────────────────────────── */}
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
