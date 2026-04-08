import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  EnvelopeSimple, PaperPlaneTilt, Users, At,
  Eye, PencilSimple, ArrowRight, Copy, Trash, X,
  ArrowLeft, Warning,
} from '@phosphor-icons/react'
import AppLayout from '../components/AppLayout'
import Spinner from '../components/Spinner'
import { supabase } from '../lib/supabase'
import CampaignForm from '../components/CampaignForm'
import SenderSettings from '../components/SenderSettings'

// ── Helpers ──────────────────────────────────────────────────────────────────
const AUDIENCE_LABELS = {
  all: 'All Users', pro: 'Pro Users', free: 'Free Users',
  inactive_7days: 'Inactive 7d', inactive_30days: 'Inactive 30d',
  never_practiced: 'Never Practiced', custom: 'Custom',
}
const AUDIENCE_COLORS = {
  all: '#2563EB', pro: '#F59E0B', free: '#6B7280',
  inactive_7days: '#D97706', inactive_30days: '#D97706',
  never_practiced: '#DC2626', custom: '#7C3AED',
}
const STATUS_COLORS = {
  draft: '#6B7280', scheduled: '#2563EB', sending: '#D97706',
  sent: '#10B981', paused: '#DC2626',
}

function Badge({ label, color, pulse = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: `${color}20`, color, border: `1px solid ${color}40`,
    }}>
      {pulse && <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color,
        animation: 'pulse 1.5s infinite',
      }} />}
      {label}
    </span>
  )
}

function StatCard({ icon: Icon, color, label, value }) {
  return (
    <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} weight="duotone" color={color} />
      </div>
      <div>
        <p style={{ color: '#6B7280', fontSize: 12, margin: 0 }}>{label}</p>
        <p style={{ color: '#F9FAFB', fontSize: 20, fontWeight: 700, margin: 0 }}>{value ?? '—'}</p>
      </div>
    </div>
  )
}

// ── Campaign Detail Modal ─────────────────────────────────────────────────────
function DetailModal({ campaign, onClose }) {
  const [logs, setLogs]         = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [page, setPage]         = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const PAGE_SIZE = 20

  useEffect(() => {
    async function load() {
      setLogsLoading(true)
      let q = supabase
        .from('email_campaign_logs')
        .select('*', { count: 'exact' })
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      if (statusFilter !== 'all') q = q.eq('status', statusFilter)
      const { data } = await q
      setLogs(data || [])
      setLogsLoading(false)
    }
    load()
  }, [campaign.id, page, statusFilter])

  const successRate = campaign.total_recipients > 0
    ? Math.round((campaign.total_sent / campaign.total_recipients) * 100)
    : 0
  const progress = campaign.total_recipients > 0
    ? (campaign.total_sent + campaign.total_failed) / campaign.total_recipients
    : 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
      <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, width: '100%', maxWidth: 700, padding: 28 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, margin: 0 }}>{campaign.name}</h2>
            <div style={{ marginTop: 6 }}>
              <Badge label={campaign.status} color={STATUS_COLORS[campaign.status]} pulse={['sending','scheduled'].includes(campaign.status)} />
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Sent', value: campaign.total_sent },
            { label: 'Failed', value: campaign.total_failed },
            { label: 'Success Rate', value: `${successRate}%` },
            { label: 'Sent At', value: campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString('en-IN') : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1F2937', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ color: '#6B7280', fontSize: 11, margin: '0 0 2px' }}>{s.label}</p>
              <p style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {campaign.status === 'sending' && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#9CA3AF', fontSize: 12 }}>Sending progress</span>
              <span style={{ color: '#F9FAFB', fontSize: 12, fontWeight: 600 }}>{Math.round(progress * 100)}%</span>
            </div>
            <div style={{ height: 6, background: '#1F2937', borderRadius: 99 }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: '#2563EB', borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          </div>
        )}

        {/* Filter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p style={{ color: '#9CA3AF', fontSize: 13, margin: 0 }}>Recipient log</p>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0) }}
            style={{ background: '#1F2937', border: '1px solid #374151', color: '#D1D5DB', fontSize: 12, padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>
            {['all','sent','failed','pending','opened'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Logs table */}
        {logsLoading ? <div style={{ textAlign: 'center', padding: 24 }}><Spinner size={20} color="border-blue-500" /></div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  {['Email','Status','Sent At','Error'].map(h => (
                    <th key={h} style={{ color: '#6B7280', fontWeight: 500, padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 10px', color: '#E5E7EB' }}>{log.email}</td>
                    <td style={{ padding: '8px 10px' }}><Badge label={log.status} color={STATUS_COLORS[log.status] || '#6B7280'} /></td>
                    <td style={{ padding: '8px 10px', color: '#9CA3AF' }}>{log.sent_at ? new Date(log.sent_at).toLocaleTimeString('en-IN') : '—'}</td>
                    <td style={{ padding: '8px 10px', color: '#F87171', fontSize: 11 }}>{log.error_message || '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: '#4B5563' }}>No records</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF', padding: '4px 12px', borderRadius: 6, cursor: page === 0 ? 'not-allowed' : 'pointer', opacity: page === 0 ? 0.4 : 1 }}>Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={logs.length < PAGE_SIZE}
            style={{ background: '#1F2937', border: '1px solid #374151', color: '#9CA3AF', padding: '4px 12px', borderRadius: 6, cursor: logs.length < PAGE_SIZE ? 'not-allowed' : 'pointer', opacity: logs.length < PAGE_SIZE ? 0.4 : 1 }}>Next</button>
        </div>
      </div>
    </div>
  )
}

// ── Send Confirmation Dialog ──────────────────────────────────────────────────
function SendConfirm({ campaign, onConfirm, onCancel, sending }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 28, maxWidth: 400, width: '100%' }}>
        <Warning size={32} color="#F59E0B" />
        <h3 style={{ color: '#F9FAFB', fontSize: 17, fontWeight: 700, margin: '12px 0 8px' }}>Send this campaign?</h3>
        <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 20px' }}>
          <strong style={{ color: '#F9FAFB' }}>{campaign.name}</strong> will be sent to <strong style={{ color: '#F9FAFB' }}>{AUDIENCE_LABELS[campaign.target_audience]}</strong>. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onConfirm} disabled={sending}
            style={{ flex: 1, height: 40, background: '#2563EB', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.6 : 1 }}>
            {sending ? 'Sending…' : 'Yes, send now'}
          </button>
          <button onClick={onCancel} disabled={sending}
            style={{ flex: 1, height: 40, background: 'transparent', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmailCampaigns() {
  const [campaigns, setCampaigns]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [stats, setStats]               = useState({})
  const [detailCampaign, setDetailCampaign] = useState(null)
  const [sendTarget, setSendTarget]     = useState(null)
  const [sending, setSending]           = useState(false)
  const [sendError, setSendError]       = useState('')
  const [showForm, setShowForm]         = useState(false)
  const [editCampaign, setEditCampaign] = useState(null)
  const [showSenders, setShowSenders]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: camps } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    setCampaigns(camps || [])

    // Stats
    const today = new Date().toISOString().split('T')[0]
    const { count: sentToday } = await supabase
      .from('email_campaign_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .eq('status', 'sent')

    const totalReached = (camps || []).reduce((sum, c) => sum + (c.total_sent || 0), 0)

    const { data: senderRows } = await supabase
      .from('email_sender_config')
      .select('sender_email')
      .eq('is_active', true)
      .limit(1)

    setStats({
      total: camps?.length || 0,
      sentToday: sentToday || 0,
      totalReached,
      activeSender: senderRows?.[0]?.sender_email || '—',
    })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSend() {
    if (!sendTarget) return
    setSending(true)
    setSendError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const url = isLocalDev
        ? 'http://localhost:8888/.netlify/functions/send-campaign'
        : '/.netlify/functions/send-campaign'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ campaign_id: sendTarget.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Send failed')
      }
      setSendTarget(null)
      load()
    } catch (err) {
      setSendError(err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDuplicate(c) {
    await supabase.from('email_campaigns').insert({
      name: `${c.name} (copy)`, subject: c.subject, body: c.body,
      sender_email: c.sender_email, sender_name: c.sender_name,
      target_audience: c.target_audience, status: 'draft',
    })
    load()
  }

  async function handleDelete(id) {
    await supabase.from('email_campaigns').delete().eq('id', id)
    load()
  }

  const C = { background: '#111827', border: '1px solid #1E293B' }

  return (
    <AppLayout>
      <div style={{ padding: '24px 24px 48px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Back + Header */}
        <Link to="/admin" style={{ color: '#6B7280', fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Admin
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ color: '#F9FAFB', fontSize: 22, fontWeight: 700, margin: 0 }}>Email Campaign Manager</h1>
            <p style={{ color: '#6B7280', fontSize: 14, margin: '4px 0 0' }}>Send and manage email campaigns</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowSenders(true)}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Sender Settings
            </button>
            <button onClick={() => { setEditCampaign(null); setShowForm(true) }}
              style={{ padding: '8px 16px', background: '#2563EB', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              + New Campaign
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
          <StatCard icon={EnvelopeSimple} color="#2563EB" label="Total Campaigns"       value={stats.total} />
          <StatCard icon={PaperPlaneTilt} color="#10B981" label="Emails Sent Today"    value={stats.sentToday} />
          <StatCard icon={Users}          color="#2563EB" label="Total Recipients Reached" value={stats.totalReached?.toLocaleString()} />
          <StatCard icon={At}             color="#F59E0B" label="Active Sender"         value={stats.activeSender} />
        </div>

        {sendError && (
          <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#F87171', fontSize: 13 }}>
            {sendError}
          </div>
        )}

        {/* Campaigns table */}
        <div style={{ ...C, borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center' }}><Spinner size={24} color="border-blue-500" /></div>
          ) : campaigns.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <EnvelopeSimple size={40} color="#374151" weight="duotone" />
              <p style={{ color: '#4B5563', marginTop: 12 }}>No campaigns yet. Create your first one.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    {['Campaign','Subject','Audience','Status','Recipients','Sent','Date','Actions'].map(h => (
                      <th key={h} style={{ color: '#6B7280', fontWeight: 500, padding: '12px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '12px 14px', color: '#F9FAFB', fontWeight: 600, maxWidth: 180 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9CA3AF', maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject.slice(0, 40)}{c.subject.length > 40 ? '…' : ''}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Badge label={AUDIENCE_LABELS[c.target_audience] || c.target_audience} color={AUDIENCE_COLORS[c.target_audience] || '#6B7280'} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <Badge label={c.status} color={STATUS_COLORS[c.status]} pulse={['sending','scheduled'].includes(c.status)} />
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9CA3AF' }}>{c.total_recipients || 0}</td>
                      <td style={{ padding: '12px 14px', color: '#10B981', fontWeight: 600 }}>{c.total_sent || 0}</td>
                      <td style={{ padding: '12px 14px', color: '#6B7280', whiteSpace: 'nowrap' }}>
                        {c.sent_at
                          ? new Date(c.sent_at).toLocaleDateString('en-IN')
                          : c.scheduled_at
                            ? new Date(c.scheduled_at).toLocaleDateString('en-IN')
                            : '—'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ActionBtn icon={Eye}          title="View"   onClick={() => setDetailCampaign(c)} />
                          {c.status === 'draft' && <ActionBtn icon={PencilSimple} title="Edit"   onClick={() => { setEditCampaign(c); setShowForm(true) }} />}
                          {['draft','scheduled'].includes(c.status) && <ActionBtn icon={ArrowRight} title="Send" color="#10B981" onClick={() => { setSendError(''); setSendTarget(c) }} />}
                          <ActionBtn icon={Copy}         title="Duplicate" onClick={() => handleDuplicate(c)} />
                          {c.status === 'draft' && <ActionBtn icon={Trash} title="Delete" color="#DC2626" onClick={() => handleDelete(c.id)} />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {detailCampaign && <DetailModal campaign={detailCampaign} onClose={() => setDetailCampaign(null)} />}
      {sendTarget && <SendConfirm campaign={sendTarget} onConfirm={handleSend} onCancel={() => setSendTarget(null)} sending={sending} />}
      {showForm && <CampaignForm campaign={editCampaign} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}
      {showSenders && <SenderSettings onClose={() => { setShowSenders(false); load() }} />}
    </AppLayout>
  )
}

function ActionBtn({ icon: Icon, title, color = '#6B7280', onClick }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background: 'none', border: 'none', color, cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
      onMouseEnter={e => e.currentTarget.style.background = '#1F2937'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      <Icon size={15} weight="bold" />
    </button>
  )
}
