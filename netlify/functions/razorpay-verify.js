/**
 * POST /.netlify/functions/razorpay-verify
 * Verifies Razorpay payment signature, then upgrades user plan to 'pro'.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId }
 * Returns: { success: true }
 *
 * Env vars needed:
 *   RAZORPAY_KEY_SECRET    — secret key (same as order function)
 *   SUPABASE_URL           — e.g. https://xxx.supabase.co
 *   SUPABASE_SERVICE_KEY   — service_role key from Supabase Dashboard → Settings → API
 */

import { createHmac } from 'crypto'

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const KEY_SECRET      = process.env.RAZORPAY_KEY_SECRET
  const SUPABASE_URL    = process.env.SUPABASE_URL            || process.env.VITE_SUPABASE_URL
  const SUPABASE_KEY    = process.env.SUPABASE_SERVICE_KEY

  if (!KEY_SECRET || !SUPABASE_URL) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) }
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = JSON.parse(event.body || '{}')

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) }
    }

    // ── Step 1: Verify HMAC signature ──────────────────────────────────────
    const expected = createHmac('sha256', KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expected !== razorpay_signature) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid payment signature' }) }
    }

    // ── Step 2: Update user plan to 'pro' in Supabase ──────────────────────
    // If SUPABASE_SERVICE_KEY is available (recommended for production),
    // it bypasses RLS. Otherwise falls back to anon key (works if user is logged in
    // at the time of the call, but not ideal).
    const authKey = SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey':        authKey,
          'Authorization': `Bearer ${authKey}`,
          'Content-Type':  'application/json',
          'Prefer':        'return=minimal',
        },
        body: JSON.stringify({ plan: 'pro' }),
      }
    )

    if (!updateRes.ok) {
      const text = await updateRes.text()
      throw new Error(`Supabase update failed: ${text}`)
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Verification failed' }),
    }
  }
}
