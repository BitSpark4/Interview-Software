/**
 * Netlify Function — Send Email Campaign
 * Admin-only. Sends campaign emails in batches of 10 via Resend.
 * Deduplicates: checks email_campaign_logs before each send.
 * Accessible at /.netlify/functions/send-campaign
 */

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
})

const BATCH_SIZE = 10

// ── Build recipient query by audience ────────────────────────────────────────
function buildAudienceFilter(audience) {
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  switch (audience) {
    case 'pro':              return 'plan=eq.pro'
    case 'free':             return 'plan=eq.free'
    case 'inactive_7days':   return `last_active_at=lt.${sevenDaysAgo}`
    case 'inactive_30days':  return `last_active_at=lt.${thirtyDaysAgo}`
    case 'never_practiced':  return 'interviews_used=eq.0'
    default:                 return ''  // 'all' — no filter
  }
}

// ── Replace template variables in email body ─────────────────────────────────
function interpolate(template, user) {
  return template
    .replace(/\{\{name\}\}/g,     user.full_name || user.email?.split('@')[0] || 'there')
    .replace(/\{\{plan\}\}/g,     user.plan || 'free')
    .replace(/\{\{sector\}\}/g,   user.primary_sector || 'IT & Tech')
    .replace(/\{\{sessions\}\}/g, String(user.interviews_used || 0))
}

// ── Sleep helper for rate-limit retry ────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

export const handler = async (event) => {
  const origin = event.headers?.origin || ''

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(origin), body: '' }
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const SUPABASE_URL        = process.env.SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
  const RESEND_API_KEY      = process.env.RESEND_API_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Server misconfigured' }) }
  }
  if (!RESEND_API_KEY) {
    return { statusCode: 500, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Email service not configured' }) }
  }

  const sbHeaders = {
    'apikey':        SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type':  'application/json',
    'Prefer':        'return=representation',
  }

  // ── Step 1: Validate admin ────────────────────────────────────────────────
  const authHeader = event.headers?.authorization || event.headers?.Authorization || ''
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!jwt) {
    return { statusCode: 401, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${jwt}` },
  })
  if (!userRes.ok) {
    return { statusCode: 401, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Invalid token' }) }
  }
  const { id: adminId } = await userRes.json()

  const adminCheck = await fetch(`${SUPABASE_URL}/rest/v1/users?select=is_admin&id=eq.${adminId}&limit=1`, {
    headers: sbHeaders,
  })
  const adminRows = adminCheck.ok ? await adminCheck.json() : []
  if (!adminRows?.[0]?.is_admin) {
    return { statusCode: 403, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Admin access required' }) }
  }

  // ── Step 2: Load campaign ─────────────────────────────────────────────────
  let body
  try { body = JSON.parse(event.body || '{}') } catch {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Invalid JSON' }) }
  }
  const { campaign_id } = body
  if (!campaign_id) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: 'campaign_id required' }) }
  }

  const campaignRes = await fetch(`${SUPABASE_URL}/rest/v1/email_campaigns?id=eq.${campaign_id}&limit=1`, {
    headers: sbHeaders,
  })
  const campaigns = campaignRes.ok ? await campaignRes.json() : []
  const campaign = campaigns?.[0]
  if (!campaign) {
    return { statusCode: 404, headers: corsHeaders(origin), body: JSON.stringify({ error: 'Campaign not found' }) }
  }
  if (!['draft', 'scheduled'].includes(campaign.status)) {
    return { statusCode: 400, headers: corsHeaders(origin), body: JSON.stringify({ error: `Cannot send campaign in status: ${campaign.status}` }) }
  }

  // ── Step 3: Load recipients ───────────────────────────────────────────────
  const audienceFilter = buildAudienceFilter(campaign.target_audience)
  const recipientUrl   = audienceFilter
    ? `${SUPABASE_URL}/rest/v1/users?select=id,email,full_name,plan,primary_sector,interviews_used&${audienceFilter}&email=not.is.null`
    : `${SUPABASE_URL}/rest/v1/users?select=id,email,full_name,plan,primary_sector,interviews_used&email=not.is.null`

  const recipientsRes = await fetch(recipientUrl, { headers: sbHeaders })
  const recipients    = recipientsRes.ok ? await recipientsRes.json() : []
  if (!recipients.length) {
    return { statusCode: 200, headers: corsHeaders(origin), body: JSON.stringify({ message: 'No recipients matched', total: 0 }) }
  }

  // ── Step 4: Get active sender ─────────────────────────────────────────────
  const senderRes  = await fetch(`${SUPABASE_URL}/rest/v1/email_sender_config?is_active=eq.true&limit=1`, { headers: sbHeaders })
  const senderRows = senderRes.ok ? await senderRes.json() : []
  const sender     = senderRows?.[0] || { sender_email: campaign.sender_email, sender_name: campaign.sender_name }

  // ── Step 5: Mark campaign as sending ─────────────────────────────────────
  await fetch(`${SUPABASE_URL}/rest/v1/email_campaigns?id=eq.${campaign_id}`, {
    method: 'PATCH',
    headers: sbHeaders,
    body: JSON.stringify({ status: 'sending', total_recipients: recipients.length, updated_at: new Date().toISOString() }),
  })

  // ── Step 6: Send emails in batches ───────────────────────────────────────
  // Load already-sent log entries to avoid duplicates
  const logsRes    = await fetch(`${SUPABASE_URL}/rest/v1/email_campaign_logs?campaign_id=eq.${campaign_id}&status=eq.sent&select=email`, { headers: sbHeaders })
  const sentLogs   = logsRes.ok ? await logsRes.json() : []
  const alreadySent = new Set(sentLogs.map(l => l.email))

  let totalSent   = 0
  let totalFailed = 0

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)

    await Promise.all(batch.map(async (user) => {
      if (alreadySent.has(user.email)) return  // deduplicate

      const bodyText = interpolate(campaign.body, user)
      const subject  = interpolate(campaign.subject, user)

      let emailStatus = 'failed'
      let errorMsg    = null
      let sentAt      = null

      try {
        const htmlBody = campaign.image_url
          ? `<img src="${campaign.image_url}" style="max-width:100%;margin-bottom:16px;" /><br/>${bodyText.replace(/\n/g, '<br/>')}`
          : bodyText.replace(/\n/g, '<br/>')

        let resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from:    `${sender.sender_name} <${sender.sender_email}>`,
            to:      [user.email],
            subject,
            html:    htmlBody,
          }),
        })

        // Rate limit: pause 1s and retry once
        if (resendRes.status === 429) {
          await sleep(1000)
          resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: `${sender.sender_name} <${sender.sender_email}>`,
              to:   [user.email],
              subject,
              html: htmlBody,
            }),
          })
        }

        if (resendRes.ok) {
          emailStatus = 'sent'
          sentAt      = new Date().toISOString()
          totalSent++
        } else {
          const err = await resendRes.json().catch(() => ({}))
          errorMsg  = err?.message || `HTTP ${resendRes.status}`
          totalFailed++
        }
      } catch (err) {
        errorMsg = err.message || 'Unknown error'
        totalFailed++
      }

      // Log result
      await fetch(`${SUPABASE_URL}/rest/v1/email_campaign_logs`, {
        method: 'POST',
        headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({
          campaign_id,
          user_id:       user.id,
          email:         user.email,
          status:        emailStatus,
          sent_at:       sentAt,
          error_message: errorMsg,
        }),
      })

      // Update running totals on campaign
      await fetch(`${SUPABASE_URL}/rest/v1/email_campaigns?id=eq.${campaign_id}`, {
        method: 'PATCH',
        headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ total_sent: totalSent, total_failed: totalFailed, updated_at: new Date().toISOString() }),
      })
    }))
  }

  // ── Step 7: Mark campaign sent ────────────────────────────────────────────
  await fetch(`${SUPABASE_URL}/rest/v1/email_campaigns?id=eq.${campaign_id}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      status:      'sent',
      sent_at:     new Date().toISOString(),
      total_sent:  totalSent,
      total_failed: totalFailed,
      updated_at:  new Date().toISOString(),
    }),
  })

  return {
    statusCode: 200,
    headers: corsHeaders(origin),
    body: JSON.stringify({
      message:        'Campaign sent',
      total_recipients: recipients.length,
      total_sent:     totalSent,
      total_failed:   totalFailed,
    }),
  }
}
