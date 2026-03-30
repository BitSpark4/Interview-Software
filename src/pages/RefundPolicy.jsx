import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, EnvelopeSimple } from '@phosphor-icons/react'
import { LegalFooter } from './PrivacyPolicy'

export default function RefundPolicy() {
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

      {/* Content */}
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>Refund Policy</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 40 }}>Effective Date: March 2026</p>

        <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, marginBottom: 40 }}>
          We want you to be satisfied with InterviewIQ. This policy explains when refunds
          are applicable and how to request one.
        </p>

        <Section title="1. Free Plan">
          <p style={paraStyle}>
            The Free plan has no charges. No refund is applicable.
          </p>
        </Section>

        <Section title="2. Pro Plan Subscription">
          <p style={paraStyle}>Monthly subscription at <strong style={{ color: '#F8FAFC' }}>₹199/month</strong>, billed via Razorpay.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
            {/* Eligible */}
            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle size={18} color="#22C55E" />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#22C55E', margin: 0 }}>Eligible for Refund</p>
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, color: '#94A3B8', fontSize: 13, lineHeight: 1.9 }}>
                <li>Request within 7 days of payment</li>
                <li>Service was completely unavailable</li>
                <li>Technical issues preventing any usage</li>
                <li>Duplicate payment charged</li>
              </ul>
            </div>

            {/* Not eligible */}
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <XCircle size={18} color="#EF4444" />
                <p style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', margin: 0 }}>Not Eligible</p>
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, color: '#94A3B8', fontSize: 13, lineHeight: 1.9 }}>
                <li>Change of mind after 7 days</li>
                <li>Partial month usage</li>
                <li>Forgetting to cancel subscription</li>
                <li>Dissatisfaction with AI answers</li>
              </ul>
            </div>
          </div>
        </Section>

        <Section title="3. How to Request a Refund">
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 10, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <EnvelopeSimple size={20} color="#2563EB" />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>Send us an email</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Row label="Email" value={<a href="mailto:support@getinterviewiq.in" style={linkStyle}>support@getinterviewiq.in</a>} />
              <Row label="Subject" value="Refund Request — [your registered email]" />
              <Row label="Include" value="Payment ID from your Razorpay receipt" />
              <Row label="Response time" value="Within 2 business days" />
              <Row label="Processing time" value="5 to 7 business days to original payment method" />
            </div>
          </div>
        </Section>

        <Section title="4. Cancellation">
          <ul style={listStyle}>
            <li>You can cancel your Pro subscription anytime from your Profile page.</li>
            <li>After cancellation, you retain Pro access until the end of the current billing period.</li>
            <li>No future charges will be made after cancellation.</li>
            <li>Your interview history and data are preserved after cancellation.</li>
          </ul>
        </Section>

        <Section title="5. Contact">
          <p style={paraStyle}>
            For all refund and billing queries, email us at{' '}
            <a href="mailto:support@getinterviewiq.in" style={linkStyle}>support@getinterviewiq.in</a>.
            We respond within 24 hours on business days.
          </p>
        </Section>
      </main>

      <LegalFooter />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #1E293B' }}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, fontSize: 14 }}>
      <span style={{ color: '#64748B', minWidth: 140 }}>{label}:</span>
      <span style={{ color: '#94A3B8' }}>{value}</span>
    </div>
  )
}

const listStyle = { paddingLeft: 20, color: '#94A3B8', fontSize: 15, lineHeight: 2, margin: '8px 0 0' }
const paraStyle = { color: '#94A3B8', fontSize: 15, lineHeight: 1.8, marginTop: 8 }
const linkStyle = { color: '#2563EB', textDecoration: 'none' }
