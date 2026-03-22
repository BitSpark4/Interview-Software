import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const token = (event.headers.authorization || '').replace('Bearer ', '')
  if (!token) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  )

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }

  const { data: adminRow } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!adminRow?.is_admin) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) }

  const { to, subject, body, targetUserId } = JSON.parse(event.body || '{}')
  if (!to || !subject || !body) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing to, subject or body' }) }
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'InterviewIQ <noreply@getinterviewiq.in>',
    to: [to],
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        max-width: 600px; margin: 0 auto; background: #0A0F1E;
        color: #F8FAFC; padding: 40px 32px; border-radius: 12px;">

        <div style="margin-bottom: 32px; display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 26px; font-weight: 800; color: #2563EB;">IQ</span>
          <span style="font-size: 18px; font-weight: 700; color: #F8FAFC;">InterviewIQ</span>
        </div>

        <div style="white-space: pre-line; font-size: 15px; line-height: 1.8; color: #94A3B8;">
          ${body}
        </div>

        <div style="margin-top: 40px; padding-top: 24px;
          border-top: 1px solid #1E293B; font-size: 12px; color: #4B5563;">
          InterviewIQ — Built for India 🇮🇳 &nbsp;|&nbsp;
          <a href="https://getinterviewiq.in" style="color: #2563EB;">getinterviewiq.in</a>
        </div>
      </div>
    `,
  })

  // Log to admin_actions
  if (targetUserId) {
    await supabase.from('admin_actions').insert({
      admin_id:       user.id,
      action_type:    'email_sent',
      target_user_id: targetUserId,
      details:        subject,
    })
  }

  return { statusCode: 200, headers, body: JSON.stringify({ success: true }) }
}
