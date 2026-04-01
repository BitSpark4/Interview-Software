/**
 * POST /.netlify/functions/razorpay-order
 * Creates a Razorpay order server-side.
 * Body: { userId: string }
 * Returns: { orderId, amount, currency, keyId }
 *
 * Env vars needed (set in Netlify Dashboard → Environment Variables):
 *   RAZORPAY_KEY_ID     — rzp_test_... or rzp_live_...
 *   RAZORPAY_KEY_SECRET — secret key
 */

const AMOUNT   = 19900          // ₹199 in paise
const CURRENCY = 'INR'

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

  const KEY_ID     = process.env.RAZORPAY_KEY_ID
  const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

  if (!KEY_ID || !KEY_SECRET) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Razorpay keys not configured' }) }
  }

  try {
    const { userId } = JSON.parse(event.body || '{}')
    if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId required' }) }

    const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        amount:   AMOUNT,
        currency: CURRENCY,
        receipt:  `receipt_${userId.slice(0, 8)}_${Date.now()}`,
        notes:    { userId },
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.description || 'Razorpay order creation failed')
    }

    const order = await response.json()

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId:    KEY_ID,
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    }
  }
}
