import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, EnvelopeSimple, MapPin, CaretDown, CaretUp } from '@phosphor-icons/react'
import { LegalFooter } from './PrivacyPolicy'

const SUBJECTS = [
  'General Query',
  'Technical Issue',
  'Payment Issue',
  'Refund Request',
  'Feature Request',
]

const FAQS = [
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to your Profile page and click the "Cancel Subscription" button. Your Pro access continues until the end of the current billing period.',
  },
  {
    q: 'When will I get my refund?',
    a: 'Approved refunds are processed within 5 to 7 business days back to your original payment method.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. All your data is stored securely on Supabase with Row Level Security enabled. Only you can access your interview history and resume.',
  },
  {
    q: 'Can I share my account with someone else?',
    a: 'No. One login per person is allowed as per our Terms of Service. Sharing accounts may result in suspension.',
  },
  {
    q: 'How do I upgrade to Pro?',
    a: 'Click "Upgrade to Pro" from your Dashboard or visit the Upgrade page. Payment is processed securely through Razorpay.',
  },
]

export default function ContactUs() {
  const [form, setForm] = useState({ name: '', email: '', subject: SUBJECTS[0], message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSuccess(true)
      setForm({ name: '', email: '', subject: SUBJECTS[0], message: '' })
    } catch {
      setError('Failed to send message. Please email us directly at support@getinterviewiq.in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', color: '#F8FAFC' }}>

      {/* Header */}
      <header style={{ background: '#0F172A', borderBottom: '1px solid #1E293B', padding: '16px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', textDecoration: 'none', fontSize: 14 }}>
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <span style={{ color: '#1E293B' }}>|</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#2563EB' }}>IQ</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>InterviewIQ</span>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>Contact Us</h1>
        <p style={{ fontSize: 15, color: '#64748B', marginBottom: 40 }}>We typically respond within 24 hours on business days.</p>

        {/* Contact info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
          <div style={infoCard}>
            <EnvelopeSimple size={22} color="#2563EB" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 4px' }}>General Support</p>
            <a href="mailto:support@getinterviewiq.in" style={{ fontSize: 14, color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
              support@getinterviewiq.in
            </a>
          </div>
          <div style={infoCard}>
            <MapPin size={22} color="#2563EB" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 4px' }}>Location</p>
            <p style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 600, margin: 0 }}>Pune, Maharashtra, India</p>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: '28px 28px', marginBottom: 48 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC', marginBottom: 24 }}>Send us a message</h2>

          {success ? (
            <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '20px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#22C55E', marginBottom: 6 }}>Message sent!</p>
              <p style={{ fontSize: 14, color: '#94A3B8' }}>We will reply to your email within 24 hours.</p>
              <button onClick={() => setSuccess(false)} style={{ marginTop: 16, background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94A3B8', padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}>
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Your Name</label>
                  <input
                    type="text"
                    placeholder="Rahul Sharma"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email"
                    placeholder="rahul@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject</label>
                <select
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  placeholder="Describe your issue or question in detail..."
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  style={{ ...inputStyle, minHeight: 140, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {error && <p style={{ color: '#EF4444', fontSize: 13, margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{
                  height: 48, background: loading ? '#1E3A8A' : '#2563EB',
                  border: 'none', borderRadius: 10, color: '#fff',
                  fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>

        {/* FAQ */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 20 }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', background: 'transparent', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC' }}>{faq.q}</span>
                  {openFaq === i
                    ? <CaretUp size={16} color="#64748B" />
                    : <CaretDown size={16} color="#64748B" />}
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 16px', borderTop: '1px solid #1E293B' }}>
                    <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, margin: '12px 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <LegalFooter />
    </div>
  )
}

const infoCard = {
  background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, padding: '20px 20px',
}
const labelStyle = { display: 'block', fontSize: 13, color: '#64748B', marginBottom: 6, fontWeight: 500 }
const inputStyle = {
  width: '100%', background: '#1E293B', border: '1px solid #334155',
  borderRadius: 8, height: 42, padding: '0 14px', color: '#F8FAFC',
  fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
