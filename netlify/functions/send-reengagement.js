/**
 * send-reengagement — Netlify scheduled function
 * Schedule: daily at 10 AM IST (4:30 AM UTC)
 * Targets users inactive for 7+ days, no reengagement in last 30 days.
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const EMAIL_SENDER = 'InterviewIQ <noreply@contact.getinterviewiq.in>'

function buildUnsubscribeToken(userId) {
  return Buffer.from(userId).toString('base64')
}

function reengagementHtml(name, careerGoal, sector, unsubToken, appUrl) {
  const goal = careerGoal || 'your interview goals'
  const prep = sector ? `You were preparing for ${sector.replace('_', ' ')} interviews.` : ''
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#F8FAFC;padding:40px 32px;border-radius:16px;">
  <p style="font-size:22px;font-weight:700;margin:0 0 8px 0;color:#F9FAFB;">We miss you, ${name || 'there'} 👋</p>
  <p style="font-size:15px;color:#94A3B8;margin:0 0 8px 0;">You haven't practiced in a while. ${prep}</p>
  <p style="font-size:15px;color:#94A3B8;margin:0 0 24px 0;">Keep working towards ${goal} — every practice session counts.</p>
  <a href="${appUrl}/interview/setup" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:24px;">Resume Practice →</a>
  <p style="font-size:13px;color:#475569;margin-top:32px;border-top:1px solid #1E293B;padding-top:16px;">
    <a href="${appUrl}/unsubscribe?token=${unsubToken}" style="color:#475569;">Unsubscribe from emails</a>
  </p>
</div>`
}

export const handler = async () => {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  const RESEND_KEY   = process.env.RESEND_API_KEY
  const APP_URL      = process.env.URL || 'https://getinterviewiq.in'

  if (!RESEND_KEY) return { statusCode: 500, body: 'RESEND_API_KEY not set' }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
  const resend   = new Resend(RESEND_KEY)

  const sevenDaysAgo   = new Date(Date.now() - 7  * 86400000).toISOString()
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 86400000).toISOString()

  try {
    // Users inactive for 7+ days
    const { data: candidates } = await supabase
      .from('users')
      .select('id, name, email, career_goal, last_active_sector, primary_sector')
      .lt('last_active_at', sevenDaysAgo)
      .not('email', 'is', null)
      .limit(100)

    if (!candidates?.length) return { statusCode: 200, body: 'No candidates' }

    let sent = 0
    for (const user of candidates) {
      // Check: no reengagement in last 30 days, not unsubscribed
      const { data: recent } = await supabase
        .from('email_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('notification_type', 'reengagement')
        .gte('sent_at', thirtyDaysAgo)
        .limit(1)
        .maybeSingle()
      if (recent) continue

      const { data: unsub } = await supabase
        .from('email_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('notification_type', 'unsubscribed')
        .limit(1)
        .maybeSingle()
      if (unsub) continue

      const sector = user.last_active_sector || user.primary_sector
      await resend.emails.send({
        from: EMAIL_SENDER,
        to: [user.email],
        subject: `We miss you, ${user.name || 'there'} 👋`,
        html: reengagementHtml(user.name, user.career_goal, sector, buildUnsubscribeToken(user.id), APP_URL),
      })

      await supabase.from('email_notifications').insert({ user_id: user.id, notification_type: 'reengagement' })
      sent++
    }

    return { statusCode: 200, body: `Sent ${sent} reengagement emails` }
  } catch (err) {
    console.error('send-reengagement error:', err)
    return { statusCode: 500, body: err.message }
  }
}
