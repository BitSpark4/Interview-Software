import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, CheckCircle, XCircle, Eye, EyeSlash } from '@phosphor-icons/react'
import Spinner from '../components/Spinner'
import { supabase } from '../lib/supabase'

function passwordStrength(pw) {
  if (!pw) return { bars: 0, label: '', color: '' }
  if (pw.length < 6)                          return { bars: 1, label: 'Weak',   color: '#EF4444' }
  if (pw.length < 8)                          return { bars: 2, label: 'Fair',   color: '#F97316' }
  if (pw.length < 10)                         return { bars: 3, label: 'Good',   color: '#F59E0B' }
  if (pw.length >= 10 && /\d/.test(pw))       return { bars: 4, label: 'Strong', color: '#22C55E' }
  return                                             { bars: 3, label: 'Good',   color: '#F59E0B' }
}

export default function ResetPassword() {
  const navigate = useNavigate()

  const [status, setStatus]           = useState('loading') // loading | ready | success | error
  const [newPw, setNewPw]             = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [countdown, setCountdown]     = useState(3)

  const strength = passwordStrength(newPw)
  const pwMatch  = confirmPw.length > 0 && newPw === confirmPw
  const pwMismatch = confirmPw.length > 0 && newPw !== confirmPw
  const canSubmit  = newPw.length >= 6 && pwMatch && !loading

  // Listen for PASSWORD_RECOVERY event from Supabase URL token
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setStatus('ready')
      }
    })

    // Fallback: if session already exists (token processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus('ready')
      else setTimeout(() => setStatus(s => s === 'loading' ? 'error' : s), 3000)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Countdown redirect after success
  useEffect(() => {
    if (status !== 'success') return
    if (countdown <= 0) { navigate('/dashboard'); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [status, countdown])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      setStatus('success')
    } catch {
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const CARD = {
    background: '#111827', border: '1px solid #1F2937',
    borderRadius: 16, padding: '40px 36px',
    width: '100%', maxWidth: 420,
  }

  // ── Loading ──
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0F19' }}>
        <div style={CARD} className="flex flex-col items-center gap-4">
          <Spinner size={28} color="border-blue-500" />
          <p style={{ fontSize: 14, color: '#9CA3AF' }}>Verifying reset link…</p>
        </div>
      </div>
    )
  }

  // ── Expired / Invalid ──
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0B0F19' }}>
        <div style={CARD} className="text-center">
          <XCircle size={48} color="#EF4444" style={{ margin: '0 auto 20px' }} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F9FAFB', marginBottom: 12 }}>
            Link expired or invalid
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 28 }}>
            This password reset link has expired or has already been used.
            Reset links are only valid for 1 hour.
          </p>
          <button
            onClick={() => navigate('/auth?mode=forgot')}
            className="w-full flex items-center justify-center font-semibold transition-all duration-200"
            style={{ height: 44, background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            Request new reset link
          </button>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0B0F19' }}>
        <div style={CARD} className="text-center">
          <div style={{ animation: 'scaleIn 0.4s ease' }}>
            <CheckCircle size={64} color="#2563EB" style={{ margin: '0 auto 20px' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', marginBottom: 12 }}>
            Password updated! 🎉
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', lineHeight: 1.7, marginBottom: 8 }}>
            Your password has been successfully updated.
            You are now logged in.
          </p>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>
            Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}…
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center font-semibold transition-all duration-200"
            style={{ height: 44, background: '#2563EB', color: '#fff', fontSize: 14, fontWeight: 600, borderRadius: 10, border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            Go to Dashboard →
          </button>
        </div>
        <style>{`@keyframes scaleIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    )
  }

  // ── New password form ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0B0F19' }}>
      <div style={CARD}>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={28} color="#2563EB" />
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F9FAFB', textAlign: 'center', marginBottom: 8 }}>
          Create new password
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>
          Your new password must be at least 6 characters long.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* New password */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              NEW PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Min 6 characters"
                required
                style={{
                  width: '100%', height: 44, background: '#1F2937',
                  border: `1px solid ${newPw.length > 0 ? '#4B5563' : '#374151'}`,
                  borderRadius: 8, padding: '0 44px 0 14px',
                  fontSize: 14, color: '#F9FAFB', outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = newPw.length > 0 ? '#4B5563' : '#374151'}
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showNew ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength bars */}
            {newPw.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className="flex gap-1" style={{ marginBottom: 4 }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{
                      flex: 1, height: 3, borderRadius: 2,
                      background: i <= strength.bars ? strength.color : '#1F2937',
                      transition: 'background 0.2s',
                    }} />
                  ))}
                </div>
                <p style={{ fontSize: 11, color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
              CONFIRM PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)}
                placeholder="Repeat your password"
                required
                style={{
                  width: '100%', height: 44, background: '#1F2937',
                  border: `1px solid ${pwMismatch ? '#EF4444' : pwMatch ? '#2563EB' : '#374151'}`,
                  borderRadius: 8, padding: '0 44px 0 14px',
                  fontSize: 14, color: '#F9FAFB', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                {showConfirm ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Match indicator */}
            {pwMatch && (
              <div className="flex items-center gap-1" style={{ marginTop: 6 }}>
                <CheckCircle size={14} color="#2563EB" />
                <p style={{ fontSize: 12, color: '#2563EB', margin: 0 }}>Passwords match</p>
              </div>
            )}
            {pwMismatch && (
              <div className="flex items-center gap-1" style={{ marginTop: 6 }}>
                <XCircle size={14} color="#EF4444" />
                <p style={{ fontSize: 12, color: '#EF4444', margin: 0 }}>Passwords do not match</p>
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 transition-all duration-200"
            style={{
              height: 48, borderRadius: 10, border: 'none',
              background: canSubmit ? '#2563EB' : '#374151',
              color: canSubmit ? '#000' : '#6B7280',
              fontSize: 15, fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#1D4ED8' }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#2563EB' }}
          >
            {loading ? <><Spinner size={16} color="border-gray-400" /> Updating password…</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
