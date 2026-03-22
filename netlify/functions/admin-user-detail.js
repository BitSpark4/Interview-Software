import { createClient } from '@supabase/supabase-js'

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

  const targetUserId = event.queryStringParameters?.userId
  if (!targetUserId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing userId' }) }

  const [{ data: sessions }, { data: weakAreas }, { data: emailHistory }] = await Promise.all([
    supabase
      .from('sessions')
      .select('id, total_score, sector, interview_type, created_at, completed')
      .eq('user_id', targetUserId)
      .eq('completed', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('weak_areas')
      .select('area, avg_score, occurrences')
      .eq('user_id', targetUserId)
      .order('avg_score', { ascending: true }),
    supabase
      .from('admin_actions')
      .select('created_at, details')
      .eq('target_user_id', targetUserId)
      .eq('action_type', 'email_sent')
      .order('created_at', { ascending: false }),
  ])

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      sessions:     sessions     || [],
      weakAreas:    weakAreas    || [],
      emailHistory: emailHistory || [],
    }),
  }
}
