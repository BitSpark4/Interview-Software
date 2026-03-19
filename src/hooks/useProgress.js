import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

export function useProgress(userId) {
  const [sessions, setSessions]     = useState([])
  const [weakAreas, setWeakAreas]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [chartFilter, setChartFilter] = useState('all') // 'all' | '30d' | '7d'

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      try {
        const [{ data: sess, error: sErr }, { data: areas, error: aErr }] = await Promise.all([
          supabase
            .from('sessions')
            .select('id, role, interview_type, company_focus, total_score, verdict, completed_at, created_at, sector, question_count')
            .eq('user_id', userId)
            .eq('completed', true)
            .order('completed_at', { ascending: false }),
          supabase
            .from('weak_areas')
            .select('area, avg_score, occurrences, updated_at')
            .eq('user_id', userId)
            .order('avg_score', { ascending: true })
            .limit(12),
        ])

        if (sErr) throw sErr
        if (aErr) throw aErr

        setSessions(sess || [])
        setWeakAreas(areas || [])
      } catch (err) {
        setError(err.message || 'Failed to load progress.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  const bestScore = sessions.length
    ? Math.max(...sessions.map(s => s.total_score ?? 0))
    : null

  // Split into strengths and weaknesses
  const strongAreas = useMemo(() => weakAreas.filter(a => a.avg_score >= 7), [weakAreas])
  const focusAreas  = useMemo(() => weakAreas.filter(a => a.avg_score < 7),  [weakAreas])

  // Readiness score: 0-100 based on average_score
  const readinessScore = useMemo(() => {
    const scores = sessions.map(s => s.total_score).filter(Boolean)
    if (!scores.length) return 0
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round(avg * 10)
  }, [sessions])

  // Sessions in last 7 days
  const weeklyCount = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    return sessions.filter(s => s.completed_at && new Date(s.completed_at) >= cutoff).length
  }, [sessions])

  // Filtered chart data
  const filteredChartData = useMemo(() => {
    let pool = [...sessions]
    if (chartFilter === '30d') {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      pool = pool.filter(s => s.completed_at && new Date(s.completed_at) >= cutoff)
    } else if (chartFilter === '7d') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      pool = pool.filter(s => s.completed_at && new Date(s.completed_at) >= cutoff)
    }
    return pool
      .slice(0, 20)
      .reverse()
      .map((s, i) => ({
        index: i + 1,
        id: s.id,
        score: s.total_score ?? 0,
        role: s.role,
        sector: s.sector,
        date: s.completed_at,
      }))
  }, [sessions, chartFilter])

  // Sector-grouped analysis data
  const sectorGroups = useMemo(() => {
    const map = {}
    for (const s of sessions) {
      if (!s.sector) continue
      if (!map[s.sector]) map[s.sector] = []
      map[s.sector].push(s)
    }
    return Object.entries(map).map(([sector, sess]) => {
      const scores  = sess.map(s => s.total_score ?? 0).filter(v => v > 0)
      const count   = sess.length
      const avg     = scores.length ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : null
      const best    = scores.length ? Math.max(...scores) : null
      const miniChart = [...sess]
        .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
        .slice(-5)
        .map((s, i) => ({ i: i + 1, score: s.total_score ?? 0, id: s.id }))
      return { sector, count, avg, best, miniChart }
    }).sort((a, b) => b.count - a.count)
  }, [sessions])

  // Legacy chartData (all sessions, last 10, for backwards compat)
  const chartData = useMemo(() =>
    [...sessions].slice(0, 10).reverse().map((s, i) => ({
      index: i + 1,
      score: s.total_score ?? 0,
      role: s.role,
      date: s.completed_at,
    }))
  , [sessions])

  return {
    sessions,
    weakAreas: focusAreas,
    strongAreas,
    allAreas: weakAreas,
    chartData,
    filteredChartData,
    chartFilter,
    setChartFilter,
    bestScore,
    readinessScore,
    weeklyCount,
    sectorGroups,
    loading,
    error,
  }
}
