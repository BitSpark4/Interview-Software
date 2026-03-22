import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldStar, Users, Crown, UserCircle, Target, ChartLineUp,
  ChartBar, ArrowCounterClockwise, CheckCircle,
  MagnifyingGlass, ArrowDown, CaretLeft, CaretRight, X,
} from '@phosphor-icons/react'
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

function getLastActive(lastActiveAt, lastLoginAt) {
  console.log('last_active_at:', lastActiveAt, '| last_login_at:', lastLoginAt)
  // Use last_active_at first, fall back to last_login_at for users who joined before tracking
  const ts = lastActiveAt || lastLoginAt
  if (!ts) return { label: 'Never', color: '#EF4444' }
  const diffMs    = Date.now() - new Date(ts)
  const diffMins  = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays  = Math.floor(diffHours / 24)
  if (diffMins < 5)   return { label: 'Online now', color: '#22C55E', pulse: true }
  if (diffMins < 60)  return { label: `${diffMins}m ago`, color: '#2563EB' }
  if (diffHours < 24) return { label: `${diffHours}h ago`, color: '#2563EB' }
  if (diffDays === 1) return { label: 'Yesterday', color: '#64748B' }
  if (diffDays < 7)   return { label: `${diffDays}d ago`, color: '#64748B' }
  return {
    label: new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    color: '#EF4444',
  }
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
  const [fetchError, setFetchError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  // ── User Management state ──────────────────────────────────────────────────
  const [allUsers, setAllUsers]         = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch]     = useState('')
  const [userFilter, setUserFilter]     = useState('all')
  const [userPage, setUserPage]         = useState(0)
  const [userPageSize, setUserPageSize] = useState(10)
  const [confirmModal, setConfirmModal] = useState(null)   // { user, newPlan }
  const [confirmLoading, setConfirmLoading] = useState(false)
  const [toast, setToast]               = useState(null)   // { msg }

  const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setFetchError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      // Use netlify dev port 8888 in local dev, relative path in production
      const fnUrl = isLocalDev
        ? `http://localhost:8888/.netlify/functions/admin-stats`
        : '/.netlify/functions/admin-stats'

      const res = await fetch(fnUrl, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (err) {
      setFetchError(err.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [isLocalDev])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // ── User Management fetch ──────────────────────────────────────────────────
  const fetchAllUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const { data: rows, error } = await supabase.rpc('get_all_users_for_admin')
      if (error) throw error
      setAllUsers(rows || [])
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setUsersLoading(false)
    }
  }, [])

  useEffect(() => { fetchAllUsers() }, [fetchAllUsers])

  const filteredUsers = useMemo(() => {
    let list = allUsers
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase()
      list = list.filter(u =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      )
    }
    const now = Date.now()
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)
    const oneDayAgo    = new Date(now - 24 * 60 * 60 * 1000)
    if (userFilter === 'pro')          list = list.filter(u => u.plan === 'pro')
    else if (userFilter === 'free')        list = list.filter(u => u.plan !== 'pro')
    else if (userFilter === 'active_today') list = list.filter(u => u.last_active_at && new Date(u.last_active_at) >= oneDayAgo)
    else if (userFilter === 'active_week')  list = list.filter(u => u.last_active_at && new Date(u.last_active_at) >= sevenDaysAgo)
    else if (userFilter === 'never')        list = list.filter(u => !u.last_active_at)
    return list
  }, [allUsers, userSearch, userFilter])

  const totalUserPages = Math.ceil(filteredUsers.length / userPageSize)
  const pagedUsers = filteredUsers.slice(userPage * userPageSize, (userPage + 1) * userPageSize)

  const handlePlanChange = async () => {
    if (!confirmModal) return
    setConfirmLoading(true)
    try {
      const { user, newPlan } = confirmModal

      // Use SECURITY DEFINER RPC — bypasses RLS so admin can update any user
      const { error: planError } = await supabase.rpc('admin_change_user_plan', {
        target_user_id: user.id,
        new_plan: newPlan,
      })
      if (planError) throw planError

      // Log audit entry
      const { data: { session: authSession } } = await supabase.auth.getSession()
      await supabase.from('admin_actions').insert({
        admin_id: authSession?.user?.id,
        action_type: 'plan_change',
        target_user_id: user.id,
        details: `Changed from ${user.plan} to ${newPlan}`,
      })

      // Refresh list so badge updates immediately
      await fetchAllUsers()

      setConfirmModal(null)
      setToast({
        type: newPlan === 'pro' ? 'success' : 'info',
        msg: newPlan === 'pro'
          ? `✓ ${user.name || user.email} upgraded to Pro`
          : `✓ ${user.name || user.email} downgraded to Free`,
      })
      setTimeout(() => setToast(null), 4000)
    } catch (err) {
      console.error('Plan change failed:', err)
      setToast({ type: 'error', msg: `Failed: ${err.message}` })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setConfirmLoading(false)
    }
  }

  const s = data?.stats
  const growthChart = data?.growth_chart || []
  const roleChart   = Object.entries(data?.role_distribution || {})
    .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
    .sort((a, b) => b.count - a.count)
  const typeChart   = Object.entries(data?.type_distribution || {})
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  const pieData = s ? [
    { name: 'Pro', value: s.pro_users, color: '#F59E0B' },
    { name: 'Free', value: s.free_users, color: '#1F2937' },
  ] : []

  return (
    <AppLayout>
      <div style={{ background: '#0B0F19', minHeight: '100vh', padding: 32 }}>

        {/* Header */}
        <div className="flex items-start justify-between" style={{ marginBottom: 28 }}>
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
              <ShieldStar size={24} color="#F59E0B" />
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
              <ArrowCounterClockwise size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Local dev / fetch error banner */}
        {fetchError && (
          <div style={{
            marginBottom: 24, padding: '14px 18px', borderRadius: 10,
            background: isLocalDev ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
            border: `1px solid ${isLocalDev ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: isLocalDev ? '#F59E0B' : '#EF4444', margin: '0 0 4px 0' }}>
              {isLocalDev ? '⚠ Local dev: Netlify functions not available' : '⚠ Failed to load stats'}
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
              {isLocalDev
                ? 'Run netlify dev instead of npm run dev to serve functions locally. Error: ' + fetchError
                : fetchError}
            </p>
          </div>
        )}

        {/* Row 1 — 6 stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4" style={{ marginBottom: 24 }}>
          {loading && !data ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (<>
            <StatCard icon={Users}    iconColor="#3B82F6" label="Total Users"          value={s?.total_users}     sub={`+${s?.new_users_week} this week`} />
            <StatCard icon={Crown}    iconColor="#F59E0B" label="Pro Users"            value={s?.pro_users}       sub={`₹${(s?.mrr || 0).toLocaleString('en-IN')} MRR`} />
            <StatCard icon={UserCircle} iconColor="#6B7280" label="Free Users"          value={s?.free_users}      sub={`${s?.conversion}% conversion`} />
            <StatCard icon={Target}   iconColor="#2563EB" label="Total Interviews"     value={s?.total_sessions}  sub={`${s?.completed_sessions} completed`} />
            <StatCard icon={ChartLineUp} iconColor="#8B5CF6" label="Sessions Today"       value={s?.sessions_today}  sub={`${s?.new_users_today} new users today`} />
            <StatCard icon={ChartBar} iconColor="#F97316" label="Avg Interview Score" value={s?.avg_score}       sub="Across all sessions" />
          </>)}
        </div>

        {/* Row 2 — Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5" style={{ marginBottom: 24 }}>

          {/* User growth line chart */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>User Registrations</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>New signups over last 14 days</p>
            {loading && !data ? (
              <div className="flex justify-center" style={{ height: 180 }}><Spinner size={20} color="border-blue-500" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={growthChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6B7280', fontSize: 10 }}
                    tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#9CA3AF' }} itemStyle={{ color: '#2563EB' }} />
                  <Line type="monotone" dataKey="count" stroke="#2563EB" strokeWidth={2}
                    dot={{ fill: '#2563EB', r: 3 }} activeDot={{ r: 5 }}
                    fill="rgba(37,99,235,0.1)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Plan distribution donut */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>User Plans</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Pro vs Free distribution</p>
            {loading && !data ? (
              <div className="flex justify-center" style={{ height: 160 }}><Spinner size={20} color="border-blue-500" /></div>
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
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
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
              <div className="flex justify-center" style={{ height: 160 }}><Spinner size={20} color="border-blue-500" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={roleChart} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: '#2563EB' }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Types */}
          <div style={{ ...CARD, padding: 24 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 4 }}>Interview Types</p>
            <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 20 }}>Sessions by type</p>
            {loading && !data ? (
              <div className="flex justify-center" style={{ height: 160 }}><Spinner size={20} color="border-blue-500" /></div>
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

        {/* Row 4 — System health */}
        <div style={{ ...CARD, padding: 24 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#F9FAFB', marginBottom: 16 }}>System Status</p>
          <div className="flex flex-wrap gap-6">
            {[
              { icon: CheckCircle, color: '#2563EB', label: 'App Online',      sub: 'getinterviewiq.in' },
              { icon: CheckCircle, color: '#2563EB', label: 'Database Online', sub: `${s?.total_users || 0} users` },
              { icon: CheckCircle, color: '#2563EB', label: 'AI Online',       sub: 'Claude API' },
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

        {/* ═══ USER MANAGEMENT SECTION ═══════════════════════════════════ */}
        <div style={{ ...CARD, marginTop: 24, overflow: 'hidden' }}>

          {/* Section header */}
          <div className="flex flex-wrap items-start justify-between gap-3" style={{ padding: '20px 24px 0' }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', margin: '0 0 2px 0' }}>User Management</p>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Search, change plans and manage users</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Total pill */}
              <button onClick={() => { setUserFilter('all'); setUserPage(0) }} style={{
                fontSize: 12, color: userFilter === 'all' ? '#F8FAFC' : '#94A3B8',
                background: '#1E293B', border: `1px solid ${userFilter === 'all' ? '#F8FAFC' : '#334155'}`,
                borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                opacity: userFilter === 'all' ? 1 : 0.5, transition: 'all 150ms',
              }}>
                Total: {allUsers.length}
              </button>
              {/* Pro pill */}
              <button onClick={() => { setUserFilter('pro'); setUserPage(0) }} style={{
                fontSize: 12, fontWeight: 600,
                color: userFilter === 'pro' ? '#F8FAFC' : '#F59E0B',
                background: 'rgba(245,158,11,0.12)',
                border: `1px solid ${userFilter === 'pro' ? '#F8FAFC' : 'rgba(245,158,11,0.25)'}`,
                borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                opacity: userFilter === 'pro' ? 1 : 0.5, transition: 'all 150ms',
              }}>
                Pro: {allUsers.filter(u => u.plan === 'pro').length}
              </button>
              {/* Free pill */}
              <button onClick={() => { setUserFilter('free'); setUserPage(0) }} style={{
                fontSize: 12, color: userFilter === 'free' ? '#F8FAFC' : '#64748B',
                background: '#1E293B', border: `1px solid ${userFilter === 'free' ? '#F8FAFC' : '#334155'}`,
                borderRadius: 6, padding: '3px 10px', cursor: 'pointer',
                opacity: userFilter === 'free' ? 1 : 0.5, transition: 'all 150ms',
              }}>
                Free: {allUsers.filter(u => u.plan !== 'pro').length}
              </button>
            </div>
          </div>

          {/* Search + filter row */}
          <div className="flex flex-wrap gap-3" style={{ padding: '14px 24px' }}>
            {/* Search input */}
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <MagnifyingGlass size={15} color="#64748B" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={e => { setUserSearch(e.target.value); setUserPage(0) }}
                style={{
                  width: '100%', height: 40, background: '#1E293B', border: '1px solid #334155',
                  borderRadius: 8, padding: '0 14px 0 34px', color: '#F8FAFC', fontSize: 14,
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#334155'}
              />
            </div>
            {/* Filter dropdown */}
            <select
              value={userFilter}
              onChange={e => { setUserFilter(e.target.value); setUserPage(0) }}
              style={{ width: 140, height: 40, background: '#1E293B', border: '1px solid #334155', borderRadius: 8, color: '#94A3B8', fontSize: 13, padding: '0 10px', outline: 'none' }}
            >
              <option value="all">All Users</option>
              <option value="pro">Pro Users</option>
              <option value="free">Free Users</option>
              <option value="active_today">Active Today</option>
              <option value="active_week">Active This Week</option>
              <option value="never">Never Active</option>
            </select>
            {/* Refresh */}
            <button
              onClick={fetchAllUsers}
              disabled={usersLoading}
              style={{ width: 40, height: 40, background: '#1E293B', border: '1px solid #334155', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <ArrowCounterClockwise size={16} color="#64748B" className={usersLoading ? 'animate-spin' : ''} />
            </button>
          </div>

          {usersLoading && allUsers.length === 0 ? (
            <div className="flex justify-center" style={{ padding: 40 }}><Spinner size={20} color="border-blue-500" /></div>
          ) : filteredUsers.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center" style={{ padding: '40px 24px' }}>
              <MagnifyingGlass size={40} color="#374151" />
              <p style={{ fontSize: 14, color: '#64748B', margin: '12px 0 6px 0' }}>
                {userSearch ? `No users matching "${userSearch}"` : 'No users found'}
              </p>
              {userSearch && (
                <button onClick={() => setUserSearch('')} style={{ fontSize: 13, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              {/* ── DESKTOP TABLE ── */}
              <div className="hidden md:block" style={{ background: '#111827', borderTop: '1px solid #1E293B' }}>
                {/* Table header */}
                <div style={{ display: 'flex', alignItems: 'center', background: '#0F172A', padding: '10px 20px', gap: 8 }}>
                  {[['USER', 2], ['PLAN', 1], ['SESSIONS', 1], ['AVG SCORE', 1], ['JOINED', 1], ['LAST ACTIVE', 1], ['ACTIONS', 1]].map(([label, flex]) => (
                    <p key={label} style={{ flex, fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{label}</p>
                  ))}
                </div>
                {/* Rows */}
                {pagedUsers.map(u => {
                  const avg = u.average_score ? parseFloat(u.average_score) : null
                  const avgColor = avg === null ? '#64748B' : avg > 7 ? '#22C55E' : avg >= 5 ? '#2563EB' : '#EF4444'
                  const isPro = u.plan === 'pro'
                  return (
                    <div key={u.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #1E293B', gap: 8, transition: 'background 150ms' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {/* USER */}
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{(u.name || u.email || '?')[0].toUpperCase()}</span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC', margin: 0 }} className="truncate">{u.name || '—'}</p>
                          <p style={{ fontSize: 12, color: '#64748B', margin: 0 }} className="truncate">{u.email}</p>
                        </div>
                      </div>
                      {/* PLAN */}
                      <div style={{ flex: 1 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 9px', borderRadius: 6,
                          background: isPro ? 'rgba(245,158,11,0.12)' : '#1E293B',
                          border: `1px solid ${isPro ? 'rgba(245,158,11,0.25)' : '#334155'}`,
                          color: isPro ? '#F59E0B' : '#64748B',
                        }}>{isPro ? 'Pro' : 'Free'}</span>
                      </div>
                      {/* SESSIONS */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, color: '#F8FAFC', margin: 0 }}>{u.total_sessions || 0}</p>
                        <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>sessions</p>
                      </div>
                      {/* AVG SCORE */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: avgColor, margin: 0 }}>
                          {avg !== null ? avg.toFixed(1) : '—'}
                        </p>
                      </div>
                      {/* JOINED */}
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                          {new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      {/* LAST ACTIVE */}
                      <div style={{ flex: 1 }}>
                        {(() => {
                          const la = getLastActive(u.last_active_at, u.last_login_at)
                          return (
                            <div className="flex items-center gap-1.5">
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                background: la.color,
                                boxShadow: la.pulse ? `0 0 0 0 ${la.color}` : 'none',
                                animation: la.pulse ? 'pulse 1.5s infinite' : 'none',
                              }} />
                              <span style={{ fontSize: 12, color: la.color }}>{la.label}</span>
                            </div>
                          )
                        })()}
                      </div>
                      {/* ACTIONS */}
                      <div style={{ flex: 1 }}>
                        {isPro ? (
                          <button onClick={() => setConfirmModal({ user: u, newPlan: 'free' })} style={{
                            fontSize: 12, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444',
                          }}>Downgrade to Free</button>
                        ) : (
                          <button onClick={() => setConfirmModal({ user: u, newPlan: 'pro' })} style={{
                            fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B',
                          }}>Upgrade to Pro</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── MOBILE CARDS ── */}
              <div className="md:hidden" style={{ padding: '0 12px 12px', borderTop: '1px solid #1E293B' }}>
                {pagedUsers.map(u => {
                  const avg = u.average_score ? parseFloat(u.average_score) : null
                  const avgColor = avg === null ? '#64748B' : avg > 7 ? '#22C55E' : avg >= 5 ? '#2563EB' : '#EF4444'
                  const isPro = u.plan === 'pro'
                  return (
                    <div key={u.id} style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 10, padding: '14px 16px', marginTop: 8 }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{(u.name || u.email || '?')[0].toUpperCase()}</span>
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', margin: 0 }} className="truncate">{u.name || '—'}</p>
                            <p style={{ fontSize: 11, color: '#64748B', margin: 0 }} className="truncate">{u.email}</p>
                          </div>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5, flexShrink: 0,
                          background: isPro ? 'rgba(245,158,11,0.12)' : '#1E293B',
                          border: `1px solid ${isPro ? 'rgba(245,158,11,0.25)' : '#334155'}`,
                          color: isPro ? '#F59E0B' : '#64748B',
                        }}>{isPro ? 'Pro' : 'Free'}</span>
                      </div>
                      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
                        <div>
                          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px 0' }}>
                            Sessions: {u.total_sessions || 0} · Avg: <span style={{ color: avgColor }}>{avg !== null ? avg.toFixed(1) : '—'}</span>
                          </p>
                          <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                            Last active: {getLastActive(u.last_active_at, u.last_login_at).label}
                          </p>
                        </div>
                        {isPro ? (
                          <button onClick={() => setConfirmModal({ user: u, newPlan: 'free' })} style={{
                            fontSize: 11, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#EF4444',
                          }}>Downgrade</button>
                        ) : (
                          <button onClick={() => setConfirmModal({ user: u, newPlan: 'pro' })} style={{
                            fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#F59E0B',
                          }}>Upgrade</button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* ── PAGINATION ── */}
              <div className="flex flex-wrap items-center justify-between gap-3" style={{ padding: '14px 20px', borderTop: '1px solid #1E293B' }}>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  Showing {userPage * userPageSize + 1}–{Math.min((userPage + 1) * userPageSize, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setUserPage(p => Math.max(0, p - 1))} disabled={userPage === 0}
                    style={{ height: 32, padding: '0 10px', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, cursor: userPage === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: userPage === 0 ? 0.4 : 1 }}>
                    <CaretLeft size={14} color="#94A3B8" />
                  </button>
                  {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                    const start = Math.max(0, Math.min(userPage - 2, totalUserPages - 5))
                    const pg = start + i
                    if (pg >= totalUserPages) return null
                    return (
                      <button key={pg} onClick={() => setUserPage(pg)}
                        style={{ height: 32, minWidth: 32, padding: '0 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: pg === userPage ? 600 : 400, background: pg === userPage ? '#2563EB' : 'transparent', color: pg === userPage ? '#fff' : '#64748B' }}>
                        {pg + 1}
                      </button>
                    )
                  })}
                  <button onClick={() => setUserPage(p => Math.min(totalUserPages - 1, p + 1))} disabled={userPage >= totalUserPages - 1}
                    style={{ height: 32, padding: '0 10px', background: '#1E293B', border: '1px solid #334155', borderRadius: 6, cursor: userPage >= totalUserPages - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', opacity: userPage >= totalUserPages - 1 ? 0.4 : 1 }}>
                    <CaretRight size={14} color="#94A3B8" />
                  </button>
                </div>
                <select value={userPageSize} onChange={e => { setUserPageSize(Number(e.target.value)); setUserPage(0) }}
                  style={{ height: 32, background: '#1E293B', border: '1px solid #334155', borderRadius: 6, color: '#94A3B8', fontSize: 12, padding: '0 8px', outline: 'none' }}>
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </>
          )}
        </div>
        {/* ═══ END USER MANAGEMENT ════════════════════════════════════════════ */}

      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {confirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 24, width: '100%', maxWidth: 380 }}>
            <div className="flex justify-end">
              <button onClick={() => setConfirmModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>
            <div className="flex flex-col items-center" style={{ textAlign: 'center', marginTop: 4 }}>
              {confirmModal.newPlan === 'pro' ? (
                <Crown size={36} color="#F59E0B" style={{ marginBottom: 12 }} />
              ) : (
                <ArrowDown size={36} color="#EF4444" style={{ marginBottom: 12 }} />
              )}
              <p style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: '0 0 10px 0' }}>
                {confirmModal.newPlan === 'pro'
                  ? `Upgrade ${confirmModal.user.name || confirmModal.user.email} to Pro?`
                  : `Downgrade ${confirmModal.user.name || confirmModal.user.email} to Free?`}
              </p>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px 0', lineHeight: 1.6 }}>
                {confirmModal.newPlan === 'pro'
                  ? 'This user will get unlimited sessions and all Pro features immediately.'
                  : 'This user will lose Pro features and return to free limits.'}
              </p>
              <button onClick={handlePlanChange} disabled={confirmLoading} style={{
                width: '100%', height: 44, borderRadius: 10, border: 'none', cursor: confirmLoading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: confirmModal.newPlan === 'pro' ? '#F59E0B' : '#EF4444',
                color: confirmModal.newPlan === 'pro' ? '#000' : '#fff',
              }}>
                {confirmLoading ? <Spinner size={16} color={confirmModal.newPlan === 'pro' ? 'border-black' : 'border-white'} /> : (confirmModal.newPlan === 'pro' ? 'Upgrade to Pro' : 'Downgrade to Free')}
              </button>
              <button onClick={() => setConfirmModal(null)} style={{ width: '100%', height: 40, marginTop: 8, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14, color: '#64748B' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (() => {
        const styles = {
          success: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  color: '#22C55E' },
          info:    { bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.3)', color: '#94A3B8' },
          error:   { bg: 'rgba(239,68,68,0.10)',   border: 'rgba(239,68,68,0.3)',   color: '#EF4444' },
        }
        const t = styles[toast.type] || styles.success
        return (
          <div style={{
            position: 'fixed', top: 20, right: 20, zIndex: 1100,
            background: t.bg, border: `1px solid ${t.border}`,
            borderRadius: 10, padding: '12px 18px', color: t.color,
            fontSize: 13, fontWeight: 600, maxWidth: 340,
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}>
            {toast.msg}
          </div>
        )
      })()}

    </AppLayout>
  )
}
