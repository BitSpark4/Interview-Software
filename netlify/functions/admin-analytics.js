/**
 * admin-analytics.js — Business Analytics for Admin Dashboard
 * Lazy-loaded only when analytics tab is opened.
 * All queries use service role key (bypasses RLS).
 */
import { createClient } from '@supabase/supabase-js'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const authHeader = event.headers.authorization || ''
  const userToken  = authHeader.replace('Bearer ', '')
  if (!userToken) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  )

  // Verify admin
  const { data: { user }, error: authErr } = await supabase.auth.getUser(userToken)
  if (authErr || !user) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) }

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // ── Run all queries in parallel ────────────────────────────────────────
    const [
      proRes,
      newProRes,
      allSessionsRes,
      dauRes,
      sectorRes,
      signupsRes,
      practicedRes,
      healthRes,
    ] = await Promise.all([
      // Total Pro users
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
      // New Pro users this month (approximated by updated_at — or use created_at if plan tracking is different)
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('plan', 'pro').gte('updated_at', monthStart),
      // All-time sessions
      supabase.from('sessions').select('id', { count: 'exact', head: true }),
      // DAU last 30 days — raw rows, group client-side
      supabase.from('sessions').select('user_id, created_at').gte('created_at', thirtyDaysAgo),
      // Sector popularity last 30 days
      supabase.from('sessions').select('sector').gte('created_at', thirtyDaysAgo).not('sector', 'is', null),
      // Funnel: signups last 30 days
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
      // Funnel: practiced (distinct users with ≥1 session last 30 days)
      supabase.from('sessions').select('user_id').gte('created_at', thirtyDaysAgo),
      // Health: avg score + completion rate
      supabase.from('sessions').select('total_score, completed, sector'),
    ])

    const totalPro = proRes.count || 0
    const newProMonth = newProRes.count || 0
    const allTimeSessions = allSessionsRes.count || 0

    // ── DAU: group by day ──────────────────────────────────────────────────
    const dauMap = {}
    ;(dauRes.data || []).forEach(row => {
      const day = row.created_at?.slice(0, 10)
      if (!day) return
      if (!dauMap[day]) dauMap[day] = new Set()
      dauMap[day].add(row.user_id)
    })
    // Fill last 30 days including zeros
    const dau = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      const key = d.toISOString().slice(0, 10)
      dau.push({ day: key, count: dauMap[key]?.size || 0 })
    }

    // ── Sector popularity ──────────────────────────────────────────────────
    const sectorMap = {}
    ;(sectorRes.data || []).forEach(r => {
      sectorMap[r.sector] = (sectorMap[r.sector] || 0) + 1
    })
    const sector_popularity = Object.entries(sectorMap)
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)

    // ── Conversion funnel ──────────────────────────────────────────────────
    const signups = signupsRes.count || 0
    const practicedUsers = new Set((practicedRes.data || []).map(r => r.user_id))
    const practiced = practicedUsers.size
    const funnel = { signups, practiced, pro: totalPro }

    // ── Interview health ───────────────────────────────────────────────────
    const sessions = healthRes.data || []
    const scores = sessions.map(s => s.total_score).filter(v => v != null && v > 0)
    const avg_score = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
    const completed = sessions.filter(s => s.completed).length
    const completion_rate = sessions.length ? Math.round((completed / sessions.length) * 100) : 0
    const topSectorMap = {}
    sessions.forEach(s => { if (s.sector) topSectorMap[s.sector] = (topSectorMap[s.sector] || 0) + 1 })
    const top_sector = Object.entries(topSectorMap).sort((a, b) => b[1] - a[1])[0]?.[0] || null

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        mrr: totalPro * 199,
        total_pro: totalPro,
        new_pro_month: newProMonth,
        all_time_sessions: allTimeSessions,
        dau,
        sector_popularity,
        funnel,
        health: {
          avg_score: Math.round(avg_score * 10) / 10,
          completion_rate,
          top_sector,
        },
      }),
    }
  } catch (err) {
    console.error('admin-analytics error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Analytics query failed' }) }
  }
}
