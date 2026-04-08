import { useState, useEffect, useCallback } from 'react'
import { X, Image, Eye } from '@phosphor-icons/react'
import Spinner from './Spinner'
import { supabase } from '../lib/supabase'

const AUDIENCE_OPTIONS = [
  { value: 'all',              label: 'All Users' },
  { value: 'pro',              label: 'Pro Users Only' },
  { value: 'free',             label: 'Free Users Only' },
  { value: 'inactive_7days',   label: 'Inactive 7 days' },
  { value: 'inactive_30days',  label: 'Inactive 30 days' },
  { value: 'never_practiced',  label: 'Never Practiced' },
]

const VARIABLES = ['{{name}}','{{plan}}','{{sector}}','{{sessions}}']
const SAMPLE    = { name: 'Vishal', plan: 'pro', sector: 'IT & Tech', sessions: '12' }

function interpolatePreview(text) {
  return text
    .replace(/\{\{name\}\}/g, SAMPLE.name)
    .replace(/\{\{plan\}\}/g, SAMPLE.plan)
    .replace(/\{\{sector\}\}/g, SAMPLE.sector)
    .replace(/\{\{sessions\}\}/g, SAMPLE.sessions)
}

const inputStyle = {
  width: '100%', background: '#0F172A', border: '1px solid #374151',
  borderRadius: 8, color: '#F9FAFB', fontSize: 14, padding: '10px 12px',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle = { color: '#9CA3AF', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }
const sectionStyle = { marginBottom: 28 }

export default function CampaignForm({ campaign, onClose, onSaved }) {
  const isEdit = !!campaign

  const [senders, setSenders]         = useState([])
  const [recipientCount, setRecipientCount] = useState(null)
  const [countLoading, setCountLoading] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const [form, setForm] = useState({
    name:            campaign?.name || '',
    sender_email:    campaign?.sender_email || '',
    sender_name:     campaign?.sender_name || 'InterviewIQ',
    target_audience: campaign?.target_audience || 'all',
    subject:         campaign?.subject || '',
    body:            campaign?.body || '',
    image_url:       campaign?.image_url || '',
    schedule_mode:   'draft',
    scheduled_at:    '',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // Load senders
  useEffect(() => {
    supabase.from('email_sender_config').select('*').eq('is_verified', true).then(({ data }) => {
      setSenders(data || [])
      const active = data?.find(s => s.is_active)
      if (active && !isEdit) {
        set('sender_email', active.sender_email)
        set('sender_name', active.sender_name)
      }
    })
  }, [isEdit])

  // Live recipient count
  const fetchCount = useCallback(async (audience) => {
    setCountLoading(true)
    let q = supabase.from('users').select('*', { count: 'exact', head: true })
    if (audience === 'pro')             q = q.eq('plan', 'pro')
    else if (audience === 'free')       q = q.eq('plan', 'free')
    else if (audience === 'never_practiced') q = q.eq('interviews_used', 0)
    else if (audience === 'inactive_7days') {
      const d = new Date(Date.now() - 7 * 86400000).toISOString()
      q = q.lt('last_active_at', d)
    } else if (audience === 'inactive_30days') {
      const d = new Date(Date.now() - 30 * 86400000).toISOString()
      q = q.lt('last_active_at', d)
    }
    const { count } = await q
    setRecipientCount(count ?? 0)
    setCountLoading(false)
  }, [])

  useEffect(() => { fetchCount(form.target_audience) }, [form.target_audience, fetchCount])

  // Image upload
  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB'); return }
    setImageUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `campaign-images/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('resumes').upload(path, file, { upsert: true })
    if (upErr) { setError('Image upload failed'); setImageUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(path)
    set('image_url', publicUrl)
    setImageUploading(false)
  }

  async function handleSave(status) {
    setError('')
    if (!form.name.trim())    { setError('Campaign name is required'); return }
    if (!form.subject.trim()) { setError('Subject line is required'); return }
    if (!form.body.trim())    { setError('Email body is required'); return }

    setSaving(true)
    const payload = {
      name: form.name, subject: form.subject, body: form.body,
      sender_email: form.sender_email, sender_name: form.sender_name,
      target_audience: form.target_audience, status,
      image_url: form.image_url || null,
      scheduled_at: status === 'scheduled' && form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    }

    const { error: saveErr } = isEdit
      ? await supabase.from('email_campaigns').update(payload).eq('id', campaign.id)
      : await supabase.from('email_campaigns').insert(payload)

    setSaving(false)
    if (saveErr) { setError(saveErr.message); return }
    onSaved()
  }

  const senderForEmail = senders.find(s => s.sender_email === form.sender_email)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, overflowY: 'auto', padding: '32px 16px' }}>
      <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, maxWidth: 680, margin: '0 auto', padding: 28 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, margin: 0 }}>{isEdit ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {error && <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '10px 14px', color: '#F87171', fontSize: 13, marginBottom: 20 }}>{error}</div>}

        {/* Section 1 — Basics */}
        <p style={{ color: '#2563EB', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>1 — Campaign Basics</p>

        <div style={sectionStyle}>
          <label style={labelStyle}>Campaign Name *</label>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Monthly Pro Offer May 2026" />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Sender Email</label>
          <select style={inputStyle} value={form.sender_email} onChange={e => {
            const s = senders.find(s => s.sender_email === e.target.value)
            set('sender_email', e.target.value)
            if (s) set('sender_name', s.sender_name)
          }}>
            {senders.map(s => <option key={s.id} value={s.sender_email}>{s.sender_name} &lt;{s.sender_email}&gt;</option>)}
            {senders.length === 0 && <option value="">No verified senders</option>}
          </select>
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Target Audience</label>
          <select style={inputStyle} value={form.target_audience} onChange={e => set('target_audience', e.target.value)}>
            {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#0F172A', borderRadius: 6, fontSize: 12, color: '#9CA3AF' }}>
            {countLoading ? 'Counting…' : `Estimated recipients: `}
            {!countLoading && <strong style={{ color: '#F9FAFB' }}>{recipientCount ?? '—'} users</strong>}
          </div>
        </div>

        {/* Section 2 — Content */}
        <p style={{ color: '#2563EB', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>2 — Email Content</p>

        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Subject Line *</label>
            <span style={{ fontSize: 11, color: form.subject.length > 90 ? '#F59E0B' : '#6B7280' }}>{form.subject.length}/100</span>
          </div>
          <input style={inputStyle} value={form.subject} onChange={e => set('subject', e.target.value.slice(0, 100))} placeholder="Your interview prep update" />
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Banner Image (optional · JPG/PNG/GIF/WebP · 2MB max)</label>
          {form.image_url ? (
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <img src={form.image_url} alt="Banner" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />
              <button onClick={() => set('image_url', '')} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '20px 16px', border: '2px dashed #374151', borderRadius: 8, cursor: 'pointer' }}>
              {imageUploading ? <Spinner size={18} color="border-blue-500" /> : <><Image size={24} color="#374151" /><span style={{ color: '#6B7280', fontSize: 12 }}>Click to upload image</span></>}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={imageUploading} />
            </label>
          )}
        </div>

        <div style={sectionStyle}>
          <label style={labelStyle}>Email Body *</label>
          <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical', fontFamily: 'inherit' }}
            value={form.body} onChange={e => set('body', e.target.value)}
            placeholder="Hi {{name}},&#10;&#10;Write your email here..." />
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {VARIABLES.map(v => (
              <button key={v} onClick={() => set('body', form.body + v)}
                style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 6, color: '#60A5FA', fontSize: 11, padding: '2px 8px', cursor: 'pointer', fontFamily: 'monospace' }}>
                {v}
              </button>
            ))}
            <span style={{ color: '#4B5563', fontSize: 11, alignSelf: 'center' }}>click to insert</span>
          </div>
          <button onClick={() => setShowPreview(p => !p)} style={{ marginTop: 10, background: 'none', border: '1px solid #374151', borderRadius: 6, color: '#9CA3AF', fontSize: 12, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Eye size={13} /> {showPreview ? 'Hide preview' : 'Preview email'}
          </button>
          {showPreview && (
            <div style={{ marginTop: 10, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, padding: 16 }}>
              <p style={{ color: '#6B7280', fontSize: 11, marginBottom: 8 }}>Preview (sample: {SAMPLE.name})</p>
              {form.image_url && <img src={form.image_url} alt="" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 10 }} />}
              <p style={{ color: '#D1D5DB', fontSize: 13, whiteSpace: 'pre-wrap', margin: 0 }}>{interpolatePreview(form.body)}</p>
            </div>
          )}
        </div>

        {/* Section 3 — Schedule */}
        <p style={{ color: '#2563EB', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>3 — Schedule</p>
        <div style={sectionStyle}>
          {[['draft','Save as draft'],['immediate','Send immediately'],['scheduled','Schedule for later']].map(([val, lbl]) => (
            <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
              <input type="radio" name="schedule_mode" value={val} checked={form.schedule_mode === val} onChange={() => set('schedule_mode', val)} style={{ accentColor: '#2563EB' }} />
              <span style={{ color: '#D1D5DB', fontSize: 14 }}>{lbl}</span>
            </label>
          ))}
          {form.schedule_mode === 'scheduled' && (
            <div style={{ marginTop: 8 }}>
              <label style={labelStyle}>Date &amp; Time (IST)</label>
              <input type="datetime-local" style={inputStyle} value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} />
            </div>
          )}
        </div>

        {/* Section 4 — Review */}
        <p style={{ color: '#2563EB', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>4 — Review</p>
        <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, padding: 16, marginBottom: 24 }}>
          {[
            ['From',      `${form.sender_name} <${form.sender_email}>`],
            ['To',        `${AUDIENCE_OPTIONS.find(o=>o.value===form.target_audience)?.label} (${recipientCount ?? '?'} users)`],
            ['Subject',   form.subject || '—'],
            ['Scheduled', form.schedule_mode === 'scheduled' && form.scheduled_at ? new Date(form.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : form.schedule_mode === 'immediate' ? 'Immediately' : 'Draft'],
          ].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1E293B' }}>
              <span style={{ color: '#6B7280', fontSize: 13 }}>{k}</span>
              <span style={{ color: '#F9FAFB', fontSize: 13, fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => handleSave(form.schedule_mode === 'immediate' ? 'draft' : form.schedule_mode === 'scheduled' ? 'scheduled' : 'draft')}
            disabled={saving}
            style={{ flex: 1, height: 44, background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save as Draft'}
          </button>
          <button onClick={() => handleSave(form.schedule_mode === 'scheduled' ? 'scheduled' : 'draft')}
            disabled={saving}
            style={{ flex: 2, height: 44, background: '#2563EB', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? <Spinner size={16} color="border-white" /> : 'Confirm & Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
