import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  // Verify caller is admin via their JWT
  const authHeader = event.headers.authorization || ''
  const userToken  = authHeader.replace('Bearer ', '')

  if (!userToken) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  // Use service role key for full data access
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  )

  // Verify the requesting user is admin
  const { data: { user }, error: authErr } = await supabase.auth.getUser(userToken)
  if (authErr || !user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid token' }) }
  }

  const { data: profile } = await supabase
    .from('users').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) {
    return { statusCode: 403, headers, body: JSON.stringify({ error: 'Forbidden' }) }
  }

  try {
    // Run all queries in parallel
    const [
      { count: totalUsers },
      { count: proUsers },
      { count: freeUsers },
      { count: totalSessions },
      { count: sessionsToday },
      { count: newUsersToday },
      { count: newUsersWeek },
      { count: completedSessions },
      { data: avgData },
      { data: roleData },
      { data: typeData },
      { data: growthData },
      { data: recentUsers },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
      supabase.from('sessions').select('*', { count: 'exact', head: true }),
      supabase.from('sessions').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
      supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('completed', true),
      supabase.from('sessions').select('total_score').eq('completed', true),
      supabase.from('sessions').select('role').eq('completed', true),
      supabase.from('sessions').select('interview_type').eq('completed', true),
      supabase.from('users').select('created_at')
        .gte('created_at', new Date(Date.now() - 14 * 86400000).toISOString())
        .order('created_at', { ascending: true }),
      supabase.from('users')
        .select('id, name, email, plan, created_at, total_sessions, average_score, streak_count')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    // Avg score
    const avgScore = avgData?.length
      ? (avgData.reduce((s, r) => s + (parseFloat(r.total_score) || 0), 0) / avgData.length).toFixed(1)
      : 0

    // Role counts
    const roleCounts = {}
    roleData?.forEach(r => { roleCounts[r.role] = (roleCounts[r.role] || 0) + 1 })

    // Type counts
    const typeCounts = {}
    typeData?.forEach(r => { typeCounts[r.interview_type] = (typeCounts[r.interview_type] || 0) + 1 })

    // Growth chart — signups per day last 14 days
    const growthMap = {}
    growthData?.forEach(r => {
      const day = r.created_at?.split('T')[0]
      if (day) growthMap[day] = (growthMap[day] || 0) + 1
    })
    const growthChart = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      growthChart.push({ date: d, count: growthMap[d] || 0 })
    }

    // Tag each recent user
    const now = Date.now()
    const taggedUsers = recentUsers?.map(u => {
      const joinedMs = new Date(u.created_at).getTime()
      const status = (now - joinedMs) < 86400000 ? 'New'
        : u.total_sessions > 0 ? 'Active' : 'Inactive'
      return { ...u, status }
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        stats: {
          total_users: totalUsers,
          pro_users: proUsers,
          free_users: freeUsers,
          total_sessions: totalSessions,
          sessions_today: sessionsToday,
          new_users_today: newUsersToday,
          new_users_week: newUsersWeek,
          completed_sessions: completedSessions,
          avg_score: avgScore,
          mrr: (proUsers || 0) * 199,
          conversion: totalUsers ? (((proUsers || 0) / totalUsers) * 100).toFixed(1) : 0,
        },
        role_distribution: roleCounts,
        type_distribution: typeCounts,
        growth_chart: growthChart,
        recent_users: taggedUsers || [],
      }),
    }
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }
  }
}
