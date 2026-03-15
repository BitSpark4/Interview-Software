import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { runPayment } from '../lib/razorpay'

const FEATURES = [
  'Unlimited interviews every month',
  'Resume-aware personalized questions',
  'STAR method coaching on every answer',
  'Progress tracking & weak area analysis',
  'Company-specific question style (TCS, startups, product)',
  'Priority support',
]

const FAQS = [
  { q: 'When will I be charged?',   a: 'Only after you complete payment on the Razorpay screen. No surprise charges.' },
  { q: 'Can I cancel anytime?',     a: 'Yes. Cancel before next billing date — no questions asked.' },
  { q: 'Is UPI accepted?',          a: 'Yes. Razorpay accepts UPI, cards, net banking, and wallets.' },
  { q: 'Is my card data safe?',     a: 'We never see your card details. Razorpay is PCI DSS Level 1 certified.' },
]

export default function Upgrade() {
  const { user, userProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState(false)

  async function handlePayment() {
    if (!user) return
    setError('')
    setLoading(true)

    try {
      await runPayment({ userId: user.id, userEmail: user.email })
      setSuccess(true)
    } catch (err) {
      if (err.message !== '__cancelled__') {
        setError(err.message || 'Payment failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="font-mono font-bold text-white text-2xl mb-2">You're Pro now!</h1>
          <p className="text-gray-400 text-sm mb-8">
            Unlimited interviews unlocked. Go practice.
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-3.5 rounded-lg transition-colors"
          >
            Go to Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  const isPro = userProfile?.plan === 'pro'

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <Link to="/dashboard" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← Go back
        </Link>

        <div className="mt-6 text-center mb-8">
          <p className="text-4xl mb-3">🚀</p>
          <h1 className="font-mono font-bold text-white text-2xl mb-1">Upgrade to Pro</h1>
          <p className="text-gray-500 text-sm">Unlock unlimited practice</p>
        </div>

        {/* Already Pro */}
        {isPro && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 mb-6 text-center">
            <p className="text-emerald-400 font-mono font-bold mb-1">You're already on Pro ✓</p>
            <p className="text-gray-400 text-sm">Enjoy unlimited interviews.</p>
          </div>
        )}

        {/* Pricing card */}
        <div className="bg-gray-900 border border-emerald-500/50 rounded-xl p-6 mb-6 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full font-mono">
            MOST POPULAR
          </div>
          <p className="font-mono font-bold text-white text-4xl mb-1">
            ₹199<span className="text-gray-500 text-base font-normal">/month</span>
          </p>
          <p className="text-gray-600 text-xs mb-6">Cancel anytime · No hidden fees · UPI accepted</p>

          <ul className="space-y-3 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-emerald-400 shrink-0 mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <ErrorMessage message={error} />

          {isPro ? (
            <button
              type="button"
              disabled
              className="w-full bg-gray-800 text-gray-500 cursor-not-allowed font-bold py-4 rounded-lg text-sm"
            >
              Already on Pro ✓
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 min-h-11"
            >
              {loading && <Spinner size={16} color="border-black" />}
              {loading ? 'Processing…' : 'Pay ₹199 — Upgrade Now'}
            </button>
          )}

          <div className="flex items-center justify-center gap-3 mt-4">
            <img
              src="https://razorpay.com/assets/razorpay-glyph.svg"
              alt="Razorpay"
              className="h-4 opacity-40"
              onError={e => { e.target.style.display = 'none' }}
            />
            <p className="text-gray-600 text-xs">Secured by Razorpay · PCI DSS compliant</p>
          </div>
        </div>

        {/* Trust */}
        <p className="text-gray-600 text-sm text-center mb-8">
          Join 1,000+ Indian professionals practicing daily
        </p>

        {/* FAQ */}
        <div className="space-y-3">
          <h2 className="font-mono font-bold text-white text-sm mb-4">Frequently Asked</h2>
          {FAQS.map(faq => (
            <div key={faq.q} className="border border-gray-800 rounded-lg p-4">
              <p className="text-gray-300 text-sm font-medium mb-1">{faq.q}</p>
              <p className="text-gray-500 text-sm">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
