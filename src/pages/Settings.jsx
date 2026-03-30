import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretRight, Lock, Trash, ShieldCheck, FileText, CurrencyInr, Envelope, Copy, Check, Info } from '@phosphor-icons/react'
import AppLayout from '../components/AppLayout'
import { useAuth } from '../hooks/useAuth'

export default function Settings() {
  const { userProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function copyEmail() {
    navigator.clipboard.writeText('support@getinterviewiq.in')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 80px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 32 }}>Manage your account and preferences.</p>

        {/* SECTION 1 — Account */}
        <Section title="Account">
          <SettingRow
            icon={<Lock size={16} color="#64748B" />}
            label="Change Password"
            sublabel="Send a password reset link to your email"
            onClick={() => navigate('/reset-password')}
          />
          <SettingRow
            icon={<Trash size={16} color="#EF4444" />}
            label="Delete Account"
            sublabel="Permanently delete your account and all data"
            labelColor="#EF4444"
            onClick={() => setShowDeleteConfirm(true)}
            showArrow={false}
          />
        </Section>

        {/* SECTION 2 — Legal */}
        <Section title="Legal">
          <SettingRow
            icon={<ShieldCheck size={16} color="#64748B" />}
            label="Privacy Policy"
            sublabel="How we collect and protect your data"
            onClick={() => navigate('/privacy')}
          />
          <SettingRow
            icon={<FileText size={16} color="#64748B" />}
            label="Terms of Service"
            sublabel="Rules and conditions for using InterviewIQ"
            onClick={() => navigate('/terms')}
          />
          <SettingRow
            icon={<CurrencyInr size={16} color="#64748B" />}
            label="Refund Policy"
            sublabel="Our 7-day refund window for Pro subscribers"
            onClick={() => navigate('/refund')}
          />
        </Section>

        {/* SECTION 3 — Support */}
        <Section title="Support">
          <SettingRow
            icon={<Envelope size={16} color="#64748B" />}
            label="Contact Us"
            sublabel="Send us a message — we reply within 24 hours"
            onClick={() => navigate('/contact')}
          />
          <div style={rowStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={iconWrap}><Envelope size={16} color="#64748B" /></div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#F8FAFC', margin: 0 }}>support@getinterviewiq.in</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>Email us directly for any queries</p>
              </div>
            </div>
            <button
              onClick={copyEmail}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: copied ? 'rgba(34,197,94,0.1)' : '#1E293B',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : '#334155'}`,
                borderRadius: 8, padding: '6px 12px',
                fontSize: 12, fontWeight: 600,
                color: copied ? '#22C55E' : '#94A3B8',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
            </button>
          </div>
        </Section>

        {/* SECTION 4 — App Info */}
        <Section title="App Info">
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, background: '#2563EB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>IQ</span>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>InterviewIQ</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>Version 1.0.0</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <InfoRow label="Plan" value={userProfile?.plan === 'pro' ? 'Pro' : 'Free'} valueColor={userProfile?.plan === 'pro' ? '#F59E0B' : '#64748B'} />
              <InfoRow label="Account" value={userProfile?.email || '—'} />
              <InfoRow label="Built for" value="India 🇮🇳" />
              <InfoRow label="Copyright" value="© 2026 InterviewIQ" />
            </div>
          </div>
        </Section>

        {/* Delete confirm modal */}
        {showDeleteConfirm && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}>
            <div style={{ background: '#0F172A', border: '1px solid #374151', borderRadius: 16, padding: 32, maxWidth: 400, width: '100%' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Trash size={22} color="#EF4444" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', textAlign: 'center', marginBottom: 8 }}>Delete Account?</h3>
              <p style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 1.7, marginBottom: 24 }}>
                This will permanently delete all your interview sessions, progress, and data. This action cannot be undone.
              </p>
              <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 24 }}>
                To delete your account, email us at{' '}
                <a href="mailto:support@getinterviewiq.in" style={{ color: '#2563EB', textDecoration: 'none' }}>
                  support@getinterviewiq.in
                </a>
              </p>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ width: '100%', height: 44, background: '#1E293B', border: '1px solid #334155', borderRadius: 10, color: '#F8FAFC', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#4B5563', letterSpacing: '0.06em', marginBottom: 8, paddingLeft: 4 }}>{title}</p>
      <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function SettingRow({ icon, label, sublabel, labelColor, onClick, showArrow = true }) {
  return (
    <button
      onClick={onClick}
      style={{ ...rowStyle, cursor: 'pointer', width: '100%', textAlign: 'left' }}
      onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={iconWrap}>{icon}</div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: labelColor || '#F8FAFC', margin: 0 }}>{label}</p>
          {sublabel && <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{sublabel}</p>}
        </div>
      </div>
      {showArrow && <CaretRight size={16} color="#334155" />}
    </button>
  )
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: '#64748B' }}>{label}</span>
      <span style={{ color: valueColor || '#94A3B8', fontWeight: 500 }}>{value}</span>
    </div>
  )
}

const rowStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 16px', borderBottom: '1px solid #1E293B', background: 'transparent',
  border: 'none', transition: 'background 0.15s',
}
const iconWrap = {
  width: 32, height: 32, borderRadius: 8,
  background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
}
