/**
 * All Razorpay calls go through this file.
 *
 * Two modes:
 *  - Production (netlify dev / deployed): createOrder → server → verify → server
 *  - Dev fallback (npm run dev): opens checkout directly with VITE_ test key,
 *    updates Supabase from frontend after payment (test mode only, no server needed)
 */

import { supabase } from './supabase'

/** Dynamically loads the Razorpay checkout script. */
export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

/** Safe JSON read — never crashes on empty/HTML responses. */
async function safeJson(res) {
  const text = await res.text()
  if (!text.trim()) return null
  try { return JSON.parse(text) } catch { return null }
}

/**
 * Full payment flow — handles both server and direct (dev fallback) modes.
 * Returns when payment + plan upgrade are confirmed.
 * Throws on failure or cancellation (message '__cancelled__' = user closed modal).
 */
export async function runPayment({ userId, userEmail }) {
  const loaded = await loadRazorpayScript()
  if (!loaded) throw new Error('Could not load Razorpay. Check your internet connection.')

  // ── Try server-side order creation (production / netlify dev) ────────────
  let keyId    = null
  let orderId  = null
  let amount   = 19900   // ₹199 in paise
  let useServer = false

  try {
    const res  = await fetch('/.netlify/functions/razorpay-order', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId }),
    })
    const data = await safeJson(res)
    if (res.ok && data?.orderId) {
      keyId     = data.keyId
      orderId   = data.orderId
      amount    = data.amount
      useServer = true
    }
  } catch { /* fall through to direct mode */ }

  // ── Direct mode fallback (npm run dev with VITE_ keys) ───────────────────
  if (!useServer) {
    keyId = import.meta.env.VITE_RAZORPAY_TEST_API_KEY
    if (!keyId) throw new Error('VITE_RAZORPAY_TEST_API_KEY missing from .env.local')
  }

  // ── Open Razorpay checkout ───────────────────────────────────────────────
  await new Promise((resolve, reject) => {
    const options = {
      key:         keyId,
      amount,
      currency:    'INR',
      name:        'InterviewIQ',
      description: 'Pro Plan — Monthly',
      image:       '/icon.svg',
      prefill:     { email: userEmail },
      theme:       { color: '#10b981' },
      handler: async (response) => {
        try {
          if (useServer && response.razorpay_signature) {
            // Production: verify signature server-side, update DB there
            const vRes  = await fetch('/.netlify/functions/razorpay-verify', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                userId,
              }),
            })
            const vData = await safeJson(vRes)
            if (!vRes.ok) throw new Error(vData?.error || 'Verification failed')
          } else {
            // Dev/test fallback: Razorpay called the handler so payment succeeded —
            // update plan directly via Supabase client (test mode only)
            const { error } = await supabase
              .from('users')
              .update({ plan: 'pro' })
              .eq('id', userId)
            if (error) throw new Error(error.message)
          }
          resolve()
        } catch (err) { reject(err) }
      },
      modal: { ondismiss: () => reject(new Error('__cancelled__')) },
    }

    if (orderId) options.order_id = orderId

    const rzp = new window.Razorpay(options)
    rzp.on('payment.failed', (r) =>
      reject(new Error(r.error?.description || 'Payment failed. Please try again.'))
    )
    rzp.open()
  })
}
