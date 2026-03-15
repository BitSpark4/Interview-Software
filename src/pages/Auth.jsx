import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ErrorMessage from '../components/ErrorMessage'
import Spinner from '../components/Spinner'

// ── Left brand panel (desktop only) ──────────────────────────
function BrandPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between w-2/5 bg-gray-900 border-r border-gray-800 p-10">
      <span className="font-mono font-bold text-emerald-400 text-lg tracking-tight">InterviewIQ</span>
      <div>
        <p className="font-mono font-bold text-white text-2xl leading-snug mb-4">
          Practice until<br />you're ready.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed border-l-2 border-emerald-500 pl-4">
          "I failed 4 interviews before using InterviewIQ. After 2 weeks of
          practice, I got an offer from a product company."
          <br /><br />
          <span className="text-gray-600">— Arjun S., got hired at Razorpay</span>
        </p>
      </div>
      <p className="text-gray-700 text-xs">3 free interviews every month</p>
    </div>
  )
}

// ── "Check your email" screen shown after successful signup ───
function EmailSentScreen({ email, onBackToLogin }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <BrandPanel />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-6">📬</div>

          <h1 className="font-mono font-bold text-white text-2xl mb-2">
            Thank you for signing up!
          </h1>

          <p className="text-gray-400 text-sm leading-relaxed mb-2">
            We've sent a verification link to:
          </p>
          <p className="font-mono text-emerald-400 text-sm mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
            {email}
          </p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left space-y-3 mb-8">
            <p className="text-gray-300 text-sm font-medium">Next steps:</p>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-mono text-xs mt-0.5 shrink-0">01</span>
              <p className="text-gray-400 text-sm">Open your email inbox and find the message from <span className="text-white">InterviewIQ</span></p>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-mono text-xs mt-0.5 shrink-0">02</span>
              <p className="text-gray-400 text-sm">Click the <span className="text-white">"Verify your email"</span> button inside the email</p>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-mono text-xs mt-0.5 shrink-0">03</span>
              <p className="text-gray-400 text-sm">You'll be brought back here to sign in and start practicing</p>
            </div>
          </div>

          <p className="text-gray-600 text-xs mb-6">
            Can't find the email? Check your spam folder.<br />
            The link expires in 24 hours.
          </p>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white py-3 rounded-lg text-sm transition-colors"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Auth page ────────────────────────────────────────────
export default function Auth() {
  const [params, setParams] = useSearchParams()
  const mode = params.get('mode') === 'login' ? 'login' : 'signup'
  const isVerified = params.get('verified') === 'true'
  const { signUp, signIn } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupDone, setSignupDone] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  function switchMode() {
    setError('')
    setParams({ mode: mode === 'login' ? 'signup' : 'login' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'signup' && name.trim().length < 2) {
      setError('Please enter your full name.')
      return
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(name.trim(), email, password)
        setSignupEmail(email)
        setSignupDone(true)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Show "check your email" screen after successful signup
  if (signupDone) {
    return (
      <EmailSentScreen
        email={signupEmail}
        onBackToLogin={() => {
          setSignupDone(false)
          setParams({ mode: 'login' })
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <BrandPanel />

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="mb-4 md:hidden">
            <span className="font-mono font-bold text-emerald-400">InterviewIQ</span>
          </div>

          {/* Email verified banner — shown after clicking verification link */}
          {isVerified && mode === 'login' && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 mb-6">
              <span className="text-emerald-400 text-lg shrink-0">✓</span>
              <div>
                <p className="text-emerald-400 text-sm font-medium">Email verified successfully!</p>
                <p className="text-gray-500 text-xs mt-0.5">Sign in below to start practicing.</p>
              </div>
            </div>
          )}

          <h1 className="font-mono font-bold text-white text-2xl mb-1">
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {mode === 'signup' ? 'Start practicing in 2 minutes' : 'Sign in to continue practicing'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Rahul Sharma"
                  required
                  minLength={2}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors min-h-11"
                />
              </div>
            )}

            <div>
              <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={mode === 'signup' ? 'rahul@gmail.com' : 'your@email.com'}
                required
                className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors min-h-11"
              />
            </div>

            <div>
              <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                  required
                  minLength={6}
                  className="w-full bg-gray-800 border border-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-lg px-4 py-3 pr-12 text-sm outline-none transition-colors min-h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <ErrorMessage message={error} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-11"
            >
              {loading && <Spinner size={16} color="border-black" />}
              {loading
                ? (mode === 'signup' ? 'Creating account…' : 'Signing in…')
                : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p className="text-gray-600 text-sm mt-6 text-center">
            {mode === 'signup' ? (
              <>Already have an account?{' '}
                <button type="button" onClick={switchMode} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Sign in
                </button>
              </>
            ) : (
              <>New here?{' '}
                <button type="button" onClick={switchMode} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  Create free account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
