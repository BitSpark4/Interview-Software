import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import RoleCard from '../components/RoleCard'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import { useInterview } from '../hooks/useInterview'
import { useResume } from '../hooks/useResume'
import { useAuth } from '../hooks/useAuth'
import { checkRateLimit } from '../lib/rateLimiter'

const ROLES = [
  { id: 'frontend',  icon: '💻', label: 'Frontend Developer' },
  { id: 'backend',   icon: '⚙️', label: 'Backend Developer' },
  { id: 'fullstack', icon: '🔗', label: 'Full Stack Developer' },
  { id: 'data',      icon: '📊', label: 'Data Engineer' },
  { id: 'pm',        icon: '📋', label: 'Product Manager' },
  { id: 'hr',        icon: '👥', label: 'HR & People' },
]

const INTERVIEW_TYPES = [
  { id: 'technical',  label: 'Technical',  sub: 'Algorithms, system design, architecture', tag: null },
  { id: 'behavioral', label: 'Behavioral', sub: 'STAR method, past experience, teamwork',  tag: null },
  { id: 'hr',         label: 'HR Round',   sub: 'Salary expectations, career goals, culture fit', tag: null },
  { id: 'mixed',      label: 'Mixed',      sub: 'A mix of all types — like a real interview', tag: 'Recommended' },
]

const COMPANIES = [
  { id: 'general', icon: '🌐', label: 'General (any company)' },
  { id: 'service', icon: '🏢', label: 'IT Services (TCS, Infosys, Wipro, HCL)' },
  { id: 'startup', icon: '🚀', label: 'Startup (fast-paced, ownership)' },
  { id: 'product', icon: '💎', label: 'Product Company (Amazon, Google, Microsoft)' },
  { id: 'bfsi',    icon: '🏦', label: 'BFSI (banking, insurance, finance)' },
]

export default function InterviewSetup() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createSession }                                             = useInterview()
  const { resumeText, resumeFile, uploading, uploadDone, error: resumeError, processResume, clearResume } = useResume()

  const [step, setStep]               = useState(1)
  const [role, setRole]               = useState('')
  const [interviewType, setInterviewType] = useState('')
  const [companyFocus, setCompanyFocus]   = useState('general')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  // Parse PDF as soon as the user selects it — instant feedback, no wait on Start
  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      return
    }

    try {
      await processResume(file)
    } catch {
      // error already set inside useResume
    }
  }

  async function handleStart() {
    if (!role || !interviewType) return
    if (uploading) return

    const rl = checkRateLimit(user?.id || 'anon', 'interview_start')
    if (!rl.allowed) { setError(rl.message); return }

    setError('')
    setLoading(true)
    try {
      const sessionId = await createSession(role, interviewType, companyFocus, resumeText)
      navigate(`/interview/session?id=${sessionId}`)
    } catch (err) {
      setError(err.message || 'Failed to start interview. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canProceed = step < 4
    ? (step === 1 ? !!role : step === 2 ? !!interviewType : true)
    : (!!role && !!interviewType && !uploading)

  const combinedError = error || resumeError

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← Back to Dashboard
        </Link>
        <h1 className="font-mono font-bold text-white text-2xl mt-4 mb-1">Set Up Your Interview</h1>
        <p className="text-gray-500 text-sm mb-6">Takes 30 seconds</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                s === step ? 'bg-emerald-500 text-black'
                : s < step  ? 'bg-emerald-500/30 text-emerald-400'
                : 'bg-gray-800 text-gray-600'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 4 && <div className={`h-px w-6 ${s < step ? 'bg-emerald-500/50' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Role */}
        {step === 1 && (
          <div>
            <p className="text-gray-300 text-sm font-medium mb-4">What role are you preparing for?</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map(r => (
                <RoleCard key={r.id} role={r} selected={role === r.id} onClick={() => setRole(r.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Interview type */}
        {step === 2 && (
          <div>
            <p className="text-gray-300 text-sm font-medium mb-4">What type of interview?</p>
            <div className="space-y-3">
              {INTERVIEW_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setInterviewType(t.id)}
                  className={`w-full flex items-start justify-between p-4 rounded-lg border text-left transition-all ${
                    interviewType === t.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <div>
                    <p className={`font-medium text-sm ${interviewType === t.id ? 'text-white' : 'text-gray-300'}`}>
                      {t.label}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{t.sub}</p>
                  </div>
                  {t.tag && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono shrink-0 ml-2">
                      {t.tag}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Company */}
        {step === 3 && (
          <div>
            <p className="text-gray-300 text-sm font-medium mb-4">
              Any specific company type? <span className="text-gray-600">(optional)</span>
            </p>
            <div className="space-y-2">
              {COMPANIES.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCompanyFocus(c.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all min-h-11 ${
                    companyFocus === c.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-gray-800 bg-gray-900 hover:border-gray-600'
                  }`}
                >
                  <span>{c.icon}</span>
                  <span className={`text-sm ${companyFocus === c.id ? 'text-white' : 'text-gray-300'}`}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Resume */}
        {step === 4 && (
          <div>
            <p className="text-gray-300 text-sm font-medium mb-1">
              Upload your resume <span className="text-gray-600 font-normal">(optional)</span>
            </p>
            <p className="text-gray-600 text-xs mb-4">
              Claude will ask about YOUR actual projects and experience
            </p>

            <label
              htmlFor="resume-upload"
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                uploadDone
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : uploading
                  ? 'border-gray-600 bg-gray-900/50 cursor-wait'
                  : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
              }`}
            >
              {uploading ? (
                <>
                  <Spinner size={24} color="border-emerald-500" />
                  <p className="text-gray-400 text-sm">Reading your resume…</p>
                  <p className="text-gray-600 text-xs">Extracting text for Claude</p>
                </>
              ) : uploadDone ? (
                <>
                  <span className="text-3xl">✅</span>
                  <p className="text-emerald-400 text-sm font-medium">{resumeFile?.name}</p>
                  <p className="text-gray-600 text-xs">
                    {resumeText.length} characters extracted · Click to change
                  </p>
                </>
              ) : (
                <>
                  <span className="text-3xl">📄</span>
                  <p className="text-gray-400 text-sm">Tap to select your resume</p>
                  <p className="text-gray-600 text-xs">PDF only · Max 5MB</p>
                </>
              )}
              <input
                id="resume-upload"
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                disabled={uploading}
                onChange={handleFileChange}
              />
            </label>

            {uploadDone && (
              <button
                type="button"
                onClick={clearResume}
                className="text-gray-600 hover:text-gray-400 text-xs mt-2 transition-colors"
              >
                Remove — use generic questions instead
              </button>
            )}
          </div>
        )}

        <ErrorMessage message={combinedError} />

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 py-3 rounded-lg text-sm transition-colors min-h-11"
            >
              ← Back
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors min-h-11"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={loading || uploading || !role || !interviewType}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 min-h-11"
            >
              {(loading || uploading) && <Spinner size={16} color="border-black" />}
              {uploading ? 'Processing resume…' : loading ? 'Starting…' : resumeText ? 'Start Personalised Interview →' : 'Start Interview →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
