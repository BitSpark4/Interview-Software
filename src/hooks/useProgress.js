import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useProgress(userId) {
  const [sessions, setSessions]   = useState([])
  const [weakAreas, setWeakAreas] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      try {
        const [{ data: sess, error: sErr }, { data: areas, error: aErr }] = await Promise.all([
          supabase
            .from('sessions')
            .select('id, role, interview_type, company_focus, total_score, verdict, completed_at, created_at')
            .eq('user_id', userId)
            .eq('completed', true)
            .order('completed_at', { ascending: false }),
          supabase
            .from('weak_areas')
            .select('area, avg_score, occurrences, updated_at')
            .eq('user_id', userId)
            .order('avg_score', { ascending: true })
            .limit(8),
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

  // Last 10 sessions in chronological order for the chart
  const chartData = [...sessions]
    .slice(0, 10)
    .reverse()
    .map((s, i) => ({
      index: i + 1,
      score: s.total_score ?? 0,
      role: s.role,
      date: s.completed_at,
    }))

  return { sessions, weakAreas, chartData, bestScore, loading, error }
}
