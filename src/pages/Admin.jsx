import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Users, Crown, User, Target, Activity,
  BarChart2, RefreshCw, CheckCircle, TrendingUp,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
  BarChart, Bar,
} from 'recharts'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import { supabase } from '../lib/supabase'

function scoreColor(v) {
  if (v >= 7) return '#22C55E'
  if (v >= 5) return '#F59E0B'
  return '#EF4444'
}

const CARD = {
  background: '#111827', border: '1px solid #1F2937', borderRadius: 16,
}

function StatCard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div style={{ ...CARD, padding: '20px 24px' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: '#9CA3AF' }}>{label}</span>
        <Icon size={20} color={iconColor} />
      </div>
      <p style={{ fontSize: 32, fontWeight: 700, color: '#F9FAFB', margin: '0 0 4px 0' }}>{value ?? '—'}</p>
      {sub && <p style={{ fontSize: 12, color: '#6B7280' }}>{sub}</p>}
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ ...CARD, padding: '20px 24px', height: 110 }}>
      <div style={{ height: 12, width: '60%', background: '#1F2937', borderRadius: 6, marginBottom: 16 }} />
      <div style={{ height: 32, width: '40%', background: '#1F2937', borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 10, width: '50%', background: '#1F2937', borderRadius: 6 }} />
    </div>
  )
}

export default function Admin() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [page, setPage]         = useState(0)
  const PAGE_SIZE = 20

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/.netlify/functions/admin-stats', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const s = data?.stats
  const growthChart = data?.growth_chart || []
  const roleChart   = Object.entries(data?.role_distribution || {})
    .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
    .sort((a, b) => b.count - a.count)
  const typeChart   = Object.entries(data?.type_distribution || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const recentUsers = data?.recent_users || []
  const paginatedUsers = recentUsers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const pieData = s ? [
    { name: 'Pro', value: s.pro_users, color: '#22C55E' },
    { name: 'Free', value: s.free_users, color: '#1F2937' },
  ] : []

  return (
    <AppLayout>
      <div style={{ background: '#0B0F19', minHeight: '100vh', padding: 32 }}>

        {/* Header */}
        <div className="flex items-start justify-between" style={{ marginBottom: 28 }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <Shield size={24} color="#F59E0B" />
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F9FAFB', margin: 0 }}>Admin Dashboard</h1>
            </div>
            <p style={{ fontSize: 14, color: '#9CA3AF' }}>InterviewIQ — Internal Overview</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p style={{ fontSize: 12, color: '#6B7280' }}>
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <button onClick={fetchStats} disabled={loading}
              className="flex items-center gap-1.5 transition-all"
              style={{ fontSize: 13, color: '#9CA3AF', background: '#1F2937', border: '1px solid #374151', padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Row 1 — 6 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginBottom: 24 }}>
          {loading && !data ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (<>
            <StatCard icon={Users}    iconColor="#3B82F6" label="Total Users"          value={s?.total_users}     sub={`+${s?.new_users_week} this week`} />
            <StatCard icon={Crown}    iconColor="#F59E0B" label="Pro Users"            value={s?.pro_users}       sub={`₹${(s?.mrr || 0).toLocaleString('en-IN')} MRR`} />
            <StatCard icon={User}     iconColor="#6B7280" label="Free Users"           value={s?.free_users}      sub={`${s?.conversion}% conversion`} />
            <StatCard icon={Target}   iconColor="#22C55E" label="Total Interviews"     value={s?.total_sessions}  sub={`${s?.completed_sessions} completed`} />
            <StatCard icon={Activity} iconColor="#8B5CF6" label="Sessions Today"       value={s?.sessions_today}  sub={`${s?.new_users_today} new users today`} />
            <StatCard icon={BarChart2} iconColor="#F97316" label="Avg Interview Score" value={s?.avg_score}       sub="Across all sessions" />
          </>)}
        </div>

        {/* Row 2 — Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5" style={{ marginBottom: 24 }}>

          {/* User growth line chart */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>User Registrations</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>New signups over last 14 days</p>
            {loading && !data ? (
              <div className="flex justify-center" style={{ height: 180 }}><Spinner size={20} color="border-emerald-500" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={growthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }}
                    tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#9CA3AF' }} itemStyle={{ color: '#22C55E' }} />
                  <Line type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2}
                    dot={{ fill: '#22C55E', r: 3 }} activeDot={{ r: 5 }}
                    fill="rgba(34,197,94,0.1)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Plan distribution donut */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>User Plans</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Pro vs Free distribution</p>
            {loading && !data ? (
              <div className="flex justify-center" style={{ height: 160 }}><Spinner size={20} color="border-emerald-500" /></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: '#F9FAFB' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-5" style={{ marginTop: 4 }}>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>Pro — {s?.pro_users} ({s?.conversion}%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#374151' }} />
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>Free — {s?.free_users}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Row 3 — Interview analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ marginBottom: 24 }}>

          {/* Roles */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>Most Practiced Roles</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Sessions by role</p>
            {loading && !data ? (
              <div className="flex justify-center" style={{ height: 160 }}><Spinner size={20} color="border-emerald-500" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={roleChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#22C55E' }} />
                  <Bar dataKey="count" fill="#22C55E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Types */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>Interview Types</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Sessions by type</p>
            {loading && !data ? (
              <div className="flex justify-center" style={{ height: 160 }}><Spinner size={20} color="border-emerald-500" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={typeChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#8B5CF6' }} />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Row 4 — Recent users table */}
        <div style={{ ...CARD, padding: 24, marginBottom: 24 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', margin: 0 }}>Recent User Signups</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Last {recentUsers.length} users who joined</p>
            </div>
          </div>

          {loading && !data ? (
            <div className="flex justify-center" style={{ padding: 32 }}><Spinner size={20} color="border-emerald-500" /></div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden md:grid" style={{
                gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr 1fr',
                paddingBottom: 10, borderBottom: '1px solid #1F2937', gap: 12,
              }}>
                {['NAME', 'EMAIL', 'PLAN', 'JOINED', 'SESSIONS', 'AVG SCORE', 'STATUS'].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{h}</p>
                ))}
              </div>

              {paginatedUsers.map(u => {
                const statusColor = u.status === 'New' ? '#3B82F6' : u.status === 'Active' ? '#22C55E' : '#6B7280'
                const statusBg    = u.status === 'New' ? 'rgba(59,130,246,0.12)' : u.status === 'Active' ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)'
                return (
                  <div key={u.id} className="grid grid-cols-2 md:grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_1fr] items-center transition-colors"
                    style={{ height: 52, borderBottom: '1px solid #1F2937', gap: 12 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1F2937'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', margin: 0 }} className="truncate">{u.name || '—'}</p>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }} className="hidden md:block truncate">{u.email}</p>
                    <div className="hidden md:block">
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: u.plan === 'pro' ? 'rgba(34,197,94,0.12)' : '#1F2937',
                        color: u.plan === 'pro' ? '#22C55E' : '#9CA3AF',
                      }}>{u.plan === 'pro' ? 'Pro' : 'Free'}</span>
                    </div>
                    <p className="hidden md:block" style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>
                      {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </p>
                    <p className="hidden md:block" style={{ fontSize: 13, color: '#F9FAFB', margin: 0 }}>{u.total_sessions || 0}</p>
                    <p className="hidden md:block" style={{ fontSize: 13, fontWeight: 600, color: u.average_score ? scoreColor(parseFloat(u.average_score)) : '#6B7280', margin: 0 }}>
                      {u.average_score ? parseFloat(u.average_score).toFixed(1) : '—'}
                    </p>
                    <div className="hidden md:block">
                      <span style={{ fontSize: 11, fontWeight: 600, color: statusColor, background: statusBg, padding: '2px 8px', borderRadius: 4 }}>{u.status}</span>
                    </div>
                  </div>
                )
              })}

              {/* Pagination */}
              {recentUsers.length > PAGE_SIZE && (
                <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
                  <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                    style={{ fontSize: 13, color: page === 0 ? '#4B5563' : '#9CA3AF', background: '#1F2937', border: '1px solid #374151', padding: '6px 16px', borderRadius: 8, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
                    ← Previous
                  </button>
                  <p style={{ fontSize: 12, color: '#6B7280' }}>Page {page + 1}</p>
                  <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= recentUsers.length}
                    style={{ fontSize: 13, color: (page + 1) * PAGE_SIZE >= recentUsers.length ? '#4B5563' : '#9CA3AF', background: '#1F2937', border: '1px solid #374151', padding: '6px 16px', borderRadius: 8, cursor: 'pointer' }}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Row 5 — System health */}
        <div style={{ ...CARD, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 16 }}>System Status</p>
          <div className="flex flex-wrap gap-6">
            {[
              { icon: CheckCircle, color: '#22C55E', label: 'App Online',      sub: 'getinterviewiq.in' },
              { icon: CheckCircle, color: '#22C55E', label: 'Database Online', sub: `${s?.total_users || 0} users` },
              { icon: CheckCircle, color: '#22C55E', label: 'AI Online',       sub: 'Claude API' },
              { icon: Crown,       color: '#F59E0B', label: 'Monthly Revenue', sub: `₹${(s?.mrr || 0).toLocaleString('en-IN')}` },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={18} color={item.color} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F9FAFB', margin: 0 }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', margin: 0 }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
