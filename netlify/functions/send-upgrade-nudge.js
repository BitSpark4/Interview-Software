/**
 * send-upgrade-nudge — triggered from session completion (not scheduled).
 * Called when a free user completes their 2nd session.
 * POST body: { userId, userEmail, userName }
 * Protected by internal service key header.
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const EMAIL_SENDER = 'InterviewIQ <noreply@contact.getinterviewiq.in>'

function buildUnsubscribeToken(userId) {
  return Buffer.from(userId).toString('base64')
}

function upgradeNudgeHtml(name, unsubToken, appUrl) {
  const upgradeUrl = `${appUrl}/upgrade?utm_source=email&utm_medium=nudge&utm_campaign=second_session`
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#F8FAFC;padding:40px 32px;border-radius:16px;">
  <p style="font-size:22px;font-weight:700;margin:0 0 8px 0;color:#F59E0B;">🚀 You're on a roll, ${name || 'there'}!</p>
  <p style="font-size:15px;color:#94A3B8;margin:0 0 16px 0;">You've completed 2 mock interviews. Upgrade to Pro and unlock:</p>
  <ul style="color:#CBD5E1;font-size:14px;margin:0 0 24px 0;padding-left:20px;line-height:2;">
    <li>Unlimited interviews (no monthly cap)</li>
    <li>Up to 30 questions per session</li>
    <li>Correct answers & ideal responses after each question</li>
    <li>Full analytics and progress tracking</li>
  </ul>
  <a href="${upgradeUrl}" style="display:inline-block;background:#F59E0B;color:#000;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:24px;">Upgrade to Pro — ₹199/month →</a>
  <p style="font-size:13px;color:#475569;margin-top:32px;border-top:1px solid #1E293B;padding-top:16px;">
    <a href="${appUrl}/unsubscribe?token=${unsubToken}" style="color:#475569;">Unsubscribe from emails</a>
  </p>
</div>`
}

export const handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const RESEND_KEY   = process.env.RESEND_API_KEY
  const APP_URL      = process.env.URL || 'https://getinterviewiq.in'

  if (!RESEND_KEY) return { statusCode: 500, headers, body: JSON.stringify({ error: 'RESEND_API_KEY not set' }) }

  let body = {}
  try { body = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) } }

  const { userId, userEmail, userName } = body
  if (!userId || !userEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: 'userId and userEmail required' }) }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const resend   = new Resend(RESEND_KEY)
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  try {
    // Check not already sent this month and not unsubscribed
    const [nudgeRes, unsubRes] = await Promise.all([
      supabase.from('email_notifications').select('id').eq('user_id', userId).eq('notification_type', 'upgrade_nudge').gte('sent_at', thisMonth).limit(1).maybeSingle(),
      supabase.from('email_notifications').select('id').eq('user_id', userId).eq('notification_type', 'unsubscribed').limit(1).maybeSingle(),
    ])

    if (nudgeRes.data || unsubRes.data) {
      return { statusCode: 200, headers, body: JSON.stringify({ skipped: true }) }
    }

    await resend.emails.send({
      from: EMAIL_SENDER,
      to: [userEmail],
      subject: `🚀 You're on a roll — unlock unlimited interviews`,
      html: upgradeNudgeHtml(userName, buildUnsubscribeToken(userId), APP_URL),
    })

    await supabase.from('email_notifications').insert({ user_id: userId, notification_type: 'upgrade_nudge' })
    return { statusCode: 200, headers, body: JSON.stringify({ sent: true }) }
  } catch (err) {
    console.error('send-upgrade-nudge error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }
  }
}
