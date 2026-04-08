import { useState, useEffect } from 'react'
import { X, CheckCircle, Warning } from '@phosphor-icons/react'
import Spinner from './Spinner'
import { supabase } from '../lib/supabase'

export default function SenderSettings({ onClose }) {
  const [senders, setSenders]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [confirmSwitch, setConfirmSwitch] = useState(null) // sender to activate
  const [switching, setSwitching]     = useState(false)
  const [error, setError]             = useState('')

  const [newForm, setNewForm] = useState({ sender_name: '', sender_email: '', notes: '' })
  const [adding, setAdding]   = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('email_sender_config').select('*').order('created_at')
    setSenders(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleActivate(sender) {
    setSwitching(true)
    // Deactivate all, then activate selected
    await supabase.from('email_sender_config').update({ is_active: false }).neq('id', 'none')
    await supabase.from('email_sender_config').update({ is_active: true }).eq('id', sender.id)
    setConfirmSwitch(null)
    setSwitching(false)
    load()
  }

  async function handleDelete(id) {
    await supabase.from('email_sender_config').delete().eq('id', id)
    load()
  }

  async function handleAdd() {
    setError('')
    if (!newForm.sender_name.trim() || !newForm.sender_email.trim()) {
      setError('Name and email are required')
      return
    }
    setAdding(true)
    await supabase.from('email_sender_config').insert({
      sender_name: newForm.sender_name,
      sender_email: newForm.sender_email,
      notes: newForm.notes || null,
      is_active: false,
      is_verified: false,
    })
    setNewForm({ sender_name: '', sender_email: '', notes: '' })
    setShowAddForm(false)
    setAdding(false)
    load()
  }

  const inputStyle = {
    width: '100%', background: '#0F172A', border: '1px solid #374151',
    borderRadius: 8, color: '#F9FAFB', fontSize: 13, padding: '8px 12px',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <>
      {/* Confirm switch dialog */}
      {confirmSwitch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%' }}>
            <Warning size={28} color="#F59E0B" />
            <h3 style={{ color: '#F9FAFB', fontSize: 16, fontWeight: 700, margin: '12px 0 8px' }}>Switch active sender?</h3>
            <p style={{ color: '#9CA3AF', fontSize: 14, margin: '0 0 20px' }}>
              Switch to <strong style={{ color: '#F9FAFB' }}>{confirmSwitch.sender_email}</strong>?
              All future campaigns will use this sender.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleActivate(confirmSwitch)} disabled={switching}
                style={{ flex: 1, height: 38, background: '#2563EB', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: switching ? 0.6 : 1 }}>
                {switching ? 'Switching…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmSwitch(null)} disabled={switching}
                style={{ flex: 1, height: 38, background: 'transparent', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main modal */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', overflowY: 'auto' }}>
        <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, width: '100%', maxWidth: 620, padding: 28 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, margin: 0 }}>Email Sender Configuration</h2>
              <p style={{ color: '#6B7280', fontSize: 13, margin: '4px 0 0' }}>Manage which email sends your campaigns</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 4 }}>
              <X size={20} />
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '8px 12px', color: '#F87171', fontSize: 13, marginBottom: 16 }}>{error}</div>
          )}

          {/* Senders table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}><Spinner size={20} color="border-blue-500" /></div>
          ) : (
            <div style={{ overflowX: 'auto', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1E293B' }}>
                    {['Sender Name','Email','Status','Active','Actions'].map(h => (
                      <th key={h} style={{ color: '#6B7280', fontWeight: 500, padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {senders.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #1E293B' }}>
                      <td style={{ padding: '10px', color: '#F9FAFB', fontWeight: 500 }}>{s.sender_name}</td>
                      <td style={{ padding: '10px', color: '#9CA3AF' }}>{s.sender_email}</td>
                      <td style={{ padding: '10px' }}>
                        {s.is_verified ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10B981', fontSize: 12, fontWeight: 600 }}>
                            <CheckCircle size={13} weight="fill" /> Verified
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#F59E0B', fontSize: 12, fontWeight: 600 }}>
                            <Warning size={13} weight="fill" /> Unverified
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px' }}>
                        {/* Toggle */}
                        <button
                          onClick={() => !s.is_active && s.is_verified && setConfirmSwitch(s)}
                          title={!s.is_verified ? 'Verify in Resend first' : s.is_active ? 'Currently active' : 'Make active'}
                          style={{
                            width: 36, height: 20, borderRadius: 99, border: 'none', cursor: s.is_active || !s.is_verified ? 'default' : 'pointer',
                            background: s.is_active ? '#2563EB' : '#374151', position: 'relative', transition: 'background 200ms',
                          }}>
                          <span style={{
                            position: 'absolute', top: 2, left: s.is_active ? 18 : 2,
                            width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 200ms',
                          }} />
                        </button>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!s.is_active && (
                            <button onClick={() => handleDelete(s.id)}
                              style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontSize: 12, padding: '2px 6px', borderRadius: 4 }}
                              onMouseEnter={e => e.currentTarget.style.background = '#1F2937'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {senders.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#4B5563' }}>No senders configured</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Add new sender */}
          <button onClick={() => setShowAddForm(v => !v)}
            style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: 8, color: '#9CA3AF', fontSize: 13, fontWeight: 600, padding: '8px 16px', cursor: 'pointer', marginBottom: showAddForm ? 16 : 0 }}>
            {showAddForm ? '— Hide form' : '+ Add New Sender'}
          </button>

          {showAddForm && (
            <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 4 }}>Sender Name</label>
                  <input style={inputStyle} value={newForm.sender_name} onChange={e => setNewForm(f => ({ ...f, sender_name: e.target.value }))} placeholder="InterviewIQ Team" />
                </div>
                <div>
                  <label style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 4 }}>Sender Email</label>
                  <input style={inputStyle} value={newForm.sender_email} onChange={e => setNewForm(f => ({ ...f, sender_email: e.target.value }))} placeholder="team@getinterviewiq.in" type="email" />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: '#9CA3AF', fontSize: 12, display: 'block', marginBottom: 4 }}>Notes (optional)</label>
                <input style={inputStyle} value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal note about this sender" />
              </div>
              <button onClick={handleAdd} disabled={adding}
                style={{ background: '#2563EB', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 20px', cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1 }}>
                {adding ? 'Adding…' : 'Add Sender'}
              </button>
              <p style={{ color: '#4B5563', fontSize: 11, marginTop: 10 }}>
                New sender email must be verified in Resend before it can be used for campaigns.
                Visit <span style={{ color: '#60A5FA' }}>resend.com</span> to verify your domain.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
