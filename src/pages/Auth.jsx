import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Envelope, EnvelopeSimple, Warning, CheckCircle, CaretLeft, Key, Clock } from '@phosphor-icons/react'
import { useAuth } from '../hooks/useAuth'
import Spinner from '../components/Spinner'
import { SuccessCheckAnimation } from '../components/LottieAnimation'
import Toast from '../components/Toast'
import { supabase } from '../lib/supabase'
import { checkRateLimit } from '../lib/rateLimiter'
import { validators } from '../utils/validators'
import { getErrorMessage } from '../utils/errorHandler'

// ── Left brand panel (desktop only) ──────────────────────────
function BrandPanel() {
  return (
    <div className="hidden md:flex flex-col justify-between w-2/5 bg-gray-900 border-r border-gray-800 p-10">
      <span className="font-mono font-bold text-blue-400 text-lg tracking-tight">InterviewIQ</span>
      <div>
        <p className="font-mono font-bold text-white text-2xl leading-snug mb-4">
          Practice until<br />you're ready.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed border-l-2 border-blue-500 pl-4">
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

// ── Success screen shown after signup ────────────────────────
function SignupSuccessScreen({ email, onBack }) {
  const [resending, setResending]   = useState(false)
  const [resent, setResent]         = useState(false)
  const [countdown, setCountdown]   = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleResend() {
    if (resending || countdown > 0) return
    setResending(true)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setResent(true)
      setCountdown(60)
    } catch {
      // ignore — resend is best-effort
    } finally {
      setResending(false)
    }
  }

  const STEPS = [
    { n: 1, text: <span>Open your email app</span> },
    { n: 2, text: <span>Check Inbox AND <strong style={{ color: '#F9FAFB' }}>Spam/Junk</strong> folder</span> },
    { n: 3, text: <span>Click the verification link in the email</span> },
    { n: 4, text: <span>You will be automatically logged in</span> },
  ]

  return (
    <div className="w-full max-w-sm mx-auto text-center">

      {/* Success animation */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
        <SuccessCheckAnimation size={80} />
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', marginBottom: 12 }}>
        Check your email! 📬
      </h1>

      {/* Subtitle + email pill */}
      <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>
        We sent a verification link to:
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <span style={{
          fontSize: 14, fontWeight: 600, color: '#F9FAFB',
          background: '#1F2937', border: '1px solid #374151',
          borderRadius: 8, padding: '8px 16px', display: 'inline-block',
        }}>
          {email}
        </span>
      </div>

      {/* Spam warning box */}
      <div style={{
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 12, padding: '16px 20px',
        marginBottom: 24, textAlign: 'left',
      }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Warning size={18} color="#F59E0B" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F59E0B' }}>Check your Spam folder</span>
        </div>
        <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>
          Verification emails sometimes land in spam. If you don't see it in inbox,
          please check your <strong style={{ color: '#F9FAFB' }}>Spam or Junk</strong> folder.
        </p>
      </div>

      {/* Steps */}
      <div style={{ textAlign: 'left', marginBottom: 24 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', marginBottom: 12 }}>
          Follow these steps:
        </p>
        {STEPS.map(s => (
          <div key={s.n} className="flex items-center gap-3" style={{ marginBottom: 10 }}>
            <span style={{
              width: 22, height: 22, borderRadius: '50%',
              background: '#2563EB', color: '#fff',
              fontSize: 11, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {s.n}
            </span>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>{s.text}</p>
          </div>
        ))}
      </div>

      {/* Resend button */}
      <button
        onClick={handleResend}
        disabled={resending || countdown > 0}
        className="w-full flex items-center justify-center gap-2 transition-all duration-150"
        style={{
          height: 40, borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: 'transparent',
          border: `1px solid ${resent ? 'rgba(37,99,235,0.3)' : '#374151'}`,
          color: resent ? '#2563EB' : countdown > 0 ? '#4B5563' : '#9CA3AF',
          cursor: resending || countdown > 0 ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (!resending && !countdown) { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' } }}
        onMouseLeave={e => { if (!resending && !countdown) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = resent ? '#2563EB' : '#9CA3AF' } }}
      >
        {resending ? (
          <><Spinner size={14} color="border-gray-400" /> Sending…</>
        ) : resent && countdown > 0 ? (
          `✓ Email resent! Resend again in ${countdown}s`
        ) : countdown > 0 ? (
          `Resend again in ${countdown}s`
        ) : (
          "Didn't receive email? Resend"
        )}
      </button>

      {/* Back link */}
      <button
        onClick={onBack}
        style={{ fontSize: 13, color: '#6B7280', marginTop: 12, cursor: 'pointer', background: 'none', border: 'none' }}
        onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
        onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}
      >
        ← Back to Sign Up
      </button>
    </div>
  )
}

// ── Unverified email warning box (shown on login error) ──────
function UnverifiedEmailBox({ email }) {
  const [resending, setResending] = useState(false)
  const [resent, setResent]       = useState(false)

  async function handleResend() {
    if (resending || resent) return
    setResending(true)
    try {
      await supabase.auth.resend({ type: 'signup', email })
      setResent(true)
    } catch { /* ignore */ } finally {
      setResending(false)
    }
  }

  return (
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 10, padding: '14px 16px', marginBottom: 16,
    }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
        <Warning size={16} color="#F59E0B" />
        <span style={{ fontSize: 14, fontWeight: 600, color: '#F59E0B' }}>Please verify your email first</span>
      </div>
      <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, margin: '0 0 10px 0' }}>
        Check your inbox and spam folder for the verification email from InterviewIQ.
        Click the link in that email to activate your account.
      </p>
      <button
        onClick={handleResend}
        disabled={resending}
        style={{
          fontSize: 13, fontWeight: 500, color: resent ? '#9CA3AF' : '#2563EB',
          background: 'none', border: 'none', cursor: resending ? 'default' : 'pointer', padding: 0,
        }}
        className="hover:underline"
      >
        {resending ? 'Sending…' : resent ? '✓ Verification email resent' : 'Resend verification email →'}
      </button>
    </div>
  )
}

// ── Forgot password success screen ───────────────────────────
function ForgotSuccessScreen({ email, onBack }) {
  const [resending, setResending] = useState(false)
  const [resent, setResent]       = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  async function handleResend() {
    if (resending || countdown > 0) return
    setResending(true)
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://getinterviewiq.in/reset-password',
      })
      setResent(true)
      setCountdown(60)
    } catch { /* ignore */ } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      {/* Icon */}
      <div className="flex items-center justify-center mx-auto mb-5"
        style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
        <EnvelopeSimple size={28} color="#2563EB" />
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', marginBottom: 10 }}>Check your email! 📬</h1>
      <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 8 }}>We sent a password reset link to:</p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#F9FAFB', background: '#1F2937', border: '1px solid #374151', borderRadius: 8, padding: '8px 16px' }}>
          {email}
        </span>
      </div>

      {/* Spam warning */}
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, textAlign: 'left' }}>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Warning size={16} color="#F59E0B" />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#F59E0B' }}>Check your Spam folder too</span>
        </div>
        <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6, margin: 0 }}>
          The reset email sometimes lands in spam. Check inbox AND <strong style={{ color: '#F9FAFB' }}>spam/junk</strong> folder.
        </p>
      </div>

      {/* Expires notice */}
      <div className="flex items-center justify-center gap-1.5" style={{ marginBottom: 20 }}>
        <Clock size={14} color="#6B7280" />
        <span style={{ fontSize: 13, color: '#6B7280' }}>This link expires in 1 hour</span>
      </div>

      {/* Resend */}
      <button
        onClick={handleResend}
        disabled={resending || countdown > 0}
        className="w-full flex items-center justify-center gap-2 transition-all duration-150"
        style={{
          height: 40, borderRadius: 8, fontSize: 13, fontWeight: 500, background: 'transparent',
          border: `1px solid ${resent ? 'rgba(37,99,235,0.3)' : '#374151'}`,
          color: resent ? '#2563EB' : countdown > 0 ? '#4B5563' : '#9CA3AF',
          cursor: resending || countdown > 0 ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={e => { if (!resending && !countdown) { e.currentTarget.style.background = '#1F2937'; e.currentTarget.style.color = '#F9FAFB' } }}
        onMouseLeave={e => { if (!resending && !countdown) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = resent ? '#2563EB' : '#9CA3AF' } }}
      >
        {resending ? <><Spinner size={13} color="border-gray-400" /> Sending…</> :
         resent && countdown > 0 ? `✓ Resent! Resend again in ${countdown}s` :
         countdown > 0 ? `Resend again in ${countdown}s` : 'Resend reset email'}
      </button>

      <button onClick={onBack}
        style={{ fontSize: 13, color: '#6B7280', marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', display: 'block', width: '100%' }}
        onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
        onMouseLeave={e => e.currentTarget.style.color = '#6B7280'}>
        ← Back to Sign In
      </button>
    </div>
  )
}

// ── Forgot password form ──────────────────────────────────────
function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [done, setDone]       = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { setError('Please enter your email address'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return }
    setError(''); setLoading(true)
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'https://getinterviewiq.in/reset-password',
      })
      // Always show success — prevents email enumeration
      setSentEmail(email.trim())
      setDone(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) return <ForgotSuccessScreen email={sentEmail} onBack={onBack} />

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Back link */}
      <button onClick={onBack} className="flex items-center gap-1 transition-colors"
        style={{ fontSize: 13, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = '#F9FAFB'}
        onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}>
        <CaretLeft size={16} /> Back to Sign In
      </button>

      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Key size={28} color="#3B82F6" />
        </div>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', textAlign: 'center', marginTop: 16, marginBottom: 12 }}>Reset your password</h1>
      <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
        Enter your email address and we will send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
          EMAIL ADDRESS
        </label>
        <input
          type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
          placeholder="your@email.com" required
          style={{
            width: '100%', height: 44, background: '#1F2937',
            border: `1px solid ${error ? '#EF4444' : '#374151'}`, borderRadius: 8,
            padding: '0 14px', fontSize: 14, color: '#F9FAFB', outline: 'none', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#2563EB'}
          onBlur={e => e.target.style.borderColor = error ? '#EF4444' : '#374151'}
        />
        {error && <p style={{ fontSize: 13, color: '#EF4444', marginTop: 6 }}>{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 transition-all duration-200"
          style={{
            height: 48, marginTop: 16, borderRadius: 10, border: 'none',
            background: loading ? '#374151' : '#2563EB',
            color: loading ? '#6B7280' : '#000',
            fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#16A34A' }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#2563EB' }}
        >
          {loading ? <><Spinner size={16} color="border-gray-400" /> Sending…</> : 'Send Reset Link'}
        </button>
      </form>
    </div>
  )
}

// ── Main Auth page ────────────────────────────────────────────
export default function Auth() {
  const [params, setParams] = useSearchParams()
  const rawMode    = params.get('mode')
  const mode       = rawMode === 'login' ? 'login' : rawMode === 'forgot' ? 'forgot' : 'signup'
  const isVerified = params.get('verified') === 'true'
  const { signUp, signIn } = useAuth()

  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [isUnverified, setIsUnverified] = useState(false)
  const [signupDone, setSignupDone]   = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [showToast, setShowToast]     = useState(false)

  function switchMode() {
    setError(''); setIsUnverified(false)
    setParams({ mode: mode === 'login' ? 'signup' : 'login' })
  }

  if (mode === 'forgot') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex">
        <BrandPanel />
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <ForgotPasswordScreen onBack={() => setParams({ mode: 'login' })} />
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setIsUnverified(false)

    const rl = checkRateLimit(email, 'auth_attempts')
    if (!rl.allowed) { setError(rl.message); return }

    const emailErr = validators.email(email)
    if (emailErr) { setError(emailErr); return }

    const passErr = validators.password(password)
    if (passErr) { setError(passErr); return }

    if (mode === 'signup') {
      const nameErr = validators.name(name)
      if (nameErr) { setError(nameErr); return }
    }

    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(validators.sanitize(name), email, password)
        setSignupEmail(email)
        setShowToast(true)
        setSignupDone(true)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      const msg = err?.message || String(err || '')
      if (msg.includes('Email not confirmed') || msg.includes('not confirmed')) {
        setIsUnverified(true)
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <BrandPanel />

      {/* Toast */}
      {showToast && (
        <Toast
          message="Account created successfully!"
          subText="Verification email sent to your inbox"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">

        {signupDone ? (
          <SignupSuccessScreen
            email={signupEmail}
            onBack={() => {
              setSignupDone(false)
              setParams({ mode: 'signup' })
            }}
          />
        ) : (
          <div className="w-full max-w-sm">

            {/* Mobile logo */}
            <div className="mb-4 md:hidden">
              <span className="font-mono font-bold text-blue-400">InterviewIQ</span>
            </div>

            {/* Email verified banner */}
            {isVerified && mode === 'login' && (
              <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 mb-6">
                <CheckCircle size={18} color="#2563EB" className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-400 text-sm font-medium">Email verified successfully!</p>
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

            {/* Unverified email warning */}
            {isUnverified && <UnverifiedEmailBox email={email} />}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Rahul Sharma" required minLength={2}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors min-h-11"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder={mode === 'signup' ? 'rahul@gmail.com' : 'your@email.com'} required
                  className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white rounded-lg px-4 py-3 text-sm outline-none transition-colors min-h-11"
                />
              </div>

              <div>
                <label className="block text-gray-500 text-xs uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                    required minLength={6}
                    className="w-full bg-gray-800 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white rounded-lg px-4 py-3 pr-12 text-sm outline-none transition-colors min-h-11"
                  />
                  <button
                    type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Forgot password link — login only */}
              {mode === 'login' && (
                <div className="flex justify-end" style={{ marginTop: -8 }}>
                  <button type="button" onClick={() => setParams({ mode: 'forgot' })}
                    className="hover:underline transition-colors"
                    style={{ fontSize: 13, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Forgot password?
                  </button>
                </div>
              )}

              {error && <p style={{ fontSize: 13, color: '#EF4444', margin: '4px 0 0' }}>{error}</p>}

              <button
                type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors min-h-11"
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
                  <button type="button" onClick={switchMode} className="text-blue-400 hover:text-blue-300 transition-colors">
                    Sign in
                  </button>
                </>
              ) : (
                <>New here?{' '}
                  <button type="button" onClick={switchMode} className="text-blue-400 hover:text-blue-300 transition-colors">
                    Create free account
                  </button>
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
