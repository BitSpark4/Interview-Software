import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Crown, Check, Lightning, Lock, CaretDown, CaretUp } from '@phosphor-icons/react'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import { useAuth } from '../hooks/useAuth'
import { runPayment } from '../lib/razorpay'

const FEATURES = [
  'Unlimited interviews every month',
  'Resume-aware personalised questions',
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
  const [openFaq, setOpenFaq] = useState(null)

  const isPro = userProfile?.plan === 'pro'

  async function handlePayment() {
    if (!user) return
    setError('')
    setLoading(true)
    try {
      await runPayment({ userId: user.id, userEmail: user.email })
      setSuccess(true)
    } catch (err) {
      if (err.message !== '__cancelled__') setError(err.message || 'Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[70vh] px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
              <Crown size={36} className="text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You're Pro now!</h1>
            <p className="text-gray-400 text-sm mb-8">Unlimited interviews unlocked. Go practice.</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl transition-colors">
              <Lightning size={16} /> Go to Dashboard
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-8 max-w-2xl space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown size={24} className="text-amber-400" /> Upgrade to Pro
          </h1>
          <p className="text-gray-500 text-sm mt-1">Unlock unlimited practice and AI-powered coaching</p>
        </div>

        {/* Already Pro banner */}
        {isPro && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 flex items-center gap-3">
            <Crown size={20} className="text-amber-400 shrink-0" />
            <div>
              <p className="text-amber-400 font-semibold">You're already on Pro</p>
              <p className="text-gray-400 text-sm">Enjoy unlimited interviews.</p>
            </div>
          </div>
        )}

        {/* Pricing card */}
        <div className="bg-gray-900 border-2 border-amber-500/50 rounded-xl p-6 relative">
          <div className="absolute -top-3 left-6 bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full font-mono">
            MOST POPULAR
          </div>

          <div className="mb-6">
            <p className="font-mono font-bold text-white text-5xl mb-1">
              ₹199<span className="text-gray-500 text-lg font-normal">/month</span>
            </p>
            <p className="text-gray-500 text-sm">Cancel anytime · No hidden fees · UPI accepted</p>
          </div>

          <ul className="space-y-3 mb-8">
            {FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
                <Check size={16} className="text-blue-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <ErrorMessage message={error} />

          {isPro ? (
            <button type="button" disabled className="w-full bg-gray-800 text-gray-500 cursor-not-allowed font-bold py-4 rounded-xl text-sm">
              Already on Pro ✓
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size={16} color="border-black" /> : <Lightning size={16} />}
              {loading ? 'Processing…' : 'Pay ₹199 — Upgrade Now'}
            </button>
          )}

          <div className="flex items-center justify-center gap-2 mt-4">
            <Lock size={12} className="text-gray-600" />
            <p className="text-gray-600 text-xs">Secured by Razorpay · PCI DSS compliant</p>
          </div>
        </div>

        <p className="text-gray-600 text-sm text-center">Join 1,000+ Indian professionals practicing daily</p>

        {/* FAQ */}
        <div>
          <h2 className="text-white font-semibold mb-3">Frequently Asked</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="border border-gray-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
                >
                  <p className="text-gray-300 text-sm font-medium">{faq.q}</p>
                  {openFaq === i ? <CaretUp size={16} className="text-gray-500 shrink-0" /> : <CaretDown size={16} className="text-gray-500 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 border-t border-gray-800">
                    <p className="text-gray-500 text-sm pt-3">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
