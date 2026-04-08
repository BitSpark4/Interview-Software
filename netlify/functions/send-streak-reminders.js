/**
 * send-streak-reminders — Netlify scheduled function
 * Schedule: daily at 7 PM IST (1:30 PM UTC)
 * Finds users with streak > 2 who haven't practiced today and haven't been reminded today.
 */
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const EMAIL_SENDER = 'InterviewIQ <noreply@contact.getinterviewiq.in>'

function buildUnsubscribeToken(userId) {
  return Buffer.from(userId).toString('base64')
}

function streakReminderHtml(name, streak, unsubToken, appUrl) {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#F8FAFC;padding:40px 32px;border-radius:16px;">
  <p style="font-size:22px;font-weight:700;margin:0 0 8px 0;color:#F59E0B;">⚡ Your ${streak}-day streak is at risk!</p>
  <p style="font-size:15px;color:#94A3B8;margin:0 0 24px 0;">Hi ${name || 'there'}, you haven't practiced today. Don't break your streak!</p>
  <a href="${appUrl}/interview/setup" style="display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:24px;">Practice Now →</a>
  <p style="font-size:13px;color:#475569;margin-top:32px;border-top:1px solid #1E293B;padding-top:16px;">
    <a href="${appUrl}/unsubscribe?token=${unsubToken}" style="color:#475569;">Unsubscribe from reminders</a>
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

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  try {
    // Find users with streak > 2, last_session_date was yesterday (haven't practiced today)
    const { data: candidates } = await supabase
      .from('users')
      .select('id, name, email, streak_count')
      .gt('streak_count', 2)
      .eq('last_session_date', yesterday)
      .not('email', 'is', null)

    if (!candidates?.length) return { statusCode: 200, body: 'No candidates' }

    let sent = 0
    for (const user of candidates) {
      // Check: not reminded today, not unsubscribed
      const { data: recent } = await supabase
        .from('email_notifications')
        .select('id')
        .eq('user_id', user.id)
        .in('notification_type', ['streak_reminder', 'unsubscribed'])
        .gte('sent_at', `${today}T00:00:00Z`)
        .limit(1)
        .maybeSingle()

      if (recent) continue

      // Also check unsubscribed ever
      const { data: unsub } = await supabase
        .from('email_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('notification_type', 'unsubscribed')
        .limit(1)
        .maybeSingle()
      if (unsub) continue

      await resend.emails.send({
        from: EMAIL_SENDER,
        to: [user.email],
        subject: `⚡ Your ${user.streak_count}-day streak is at risk!`,
        html: streakReminderHtml(user.name, user.streak_count, buildUnsubscribeToken(user.id), APP_URL),
      })

      await supabase.from('email_notifications').insert({ user_id: user.id, notification_type: 'streak_reminder' })
      sent++
    }

    return { statusCode: 200, body: `Sent ${sent} streak reminders` }
  } catch (err) {
    console.error('send-streak-reminders error:', err)
    return { statusCode: 500, body: err.message }
  }
}
