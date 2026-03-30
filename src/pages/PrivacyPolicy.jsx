import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'

export default function PrivacyPolicy() {
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
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 40 }}>Last updated: March 2026</p>

        <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, marginBottom: 40 }}>
          InterviewIQ ("we", "our", or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, and safeguard your information
          when you use our platform at getinterviewiq.in.
        </p>

        <Section title="1. Information We Collect">
          <ul style={listStyle}>
            <li><strong style={{ color: '#F8FAFC' }}>Account information:</strong> Your name, email address, and password when you register.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Usage data:</strong> Interview sessions, scores, answers, and progress history.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Resume data:</strong> PDF content you upload for AI-assisted interview preparation.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Payment information:</strong> Payments are processed by Razorpay. We do not store any card or bank details on our servers.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Device data:</strong> Browser type and usage patterns to improve our service.</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul style={listStyle}>
            <li>To provide AI-powered interview preparation tailored to your profile.</li>
            <li>To generate personalised practice questions using the Claude AI engine.</li>
            <li>To track your progress, scores, and weak areas over time.</li>
            <li>To send important service emails (verification, password reset, billing).</li>
            <li>To improve platform features and fix issues.</li>
          </ul>
          <p style={noteStyle}>We never sell, rent, or trade your personal data to third parties.</p>
        </Section>

        <Section title="3. Data Storage and Security">
          <ul style={listStyle}>
            <li>All data is stored on Supabase — a secure, SOC 2 compliant cloud database.</li>
            <li>Row Level Security (RLS) ensures you can only access your own data.</li>
            <li>All connections use HTTPS encryption in transit.</li>
            <li>Resume files are stored in a private Supabase Storage bucket accessible only to your account.</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <p style={paraStyle}>We use the following trusted third-party services to operate InterviewIQ:</p>
          <ul style={listStyle}>
            <li><strong style={{ color: '#F8FAFC' }}>Anthropic Claude API</strong> — AI interview question generation and evaluation.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Razorpay</strong> — Payment processing for Pro subscriptions (India).</li>
            <li><strong style={{ color: '#F8FAFC' }}>Resend</strong> — Transactional email delivery.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Netlify</strong> — Frontend hosting and serverless functions.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Supabase</strong> — Database, authentication, and file storage.</li>
          </ul>
          <p style={paraStyle}>Each of these services has their own privacy policies governing data they handle.</p>
        </Section>

        <Section title="5. Your Rights">
          <ul style={listStyle}>
            <li><strong style={{ color: '#F8FAFC' }}>Access:</strong> You can view all your data from your Dashboard and Profile pages.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Correction:</strong> Update your name and profile details from the Profile page.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Deletion:</strong> Email us to delete your account and all associated data.</li>
            <li><strong style={{ color: '#F8FAFC' }}>Export:</strong> Request an export of your data by emailing us.</li>
          </ul>
          <p style={paraStyle}>To exercise any of these rights, contact us at <a href="mailto:support@getinterviewiq.in" style={linkStyle}>support@getinterviewiq.in</a>.</p>
        </Section>

        <Section title="6. Cookies">
          <p style={paraStyle}>
            We use essential cookies for authentication (Supabase JWT). We do not use
            advertising or tracking cookies.
          </p>
        </Section>

        <Section title="7. Contact Us">
          <p style={paraStyle}>If you have any questions about this Privacy Policy:</p>
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 10, padding: '16px 20px', marginTop: 12 }}>
            <p style={{ color: '#F8FAFC', fontWeight: 600, marginBottom: 4 }}>InterviewIQ</p>
            <p style={{ color: '#94A3B8', fontSize: 14 }}>Pune, Maharashtra, India</p>
            <p style={{ color: '#94A3B8', fontSize: 14 }}>
              Email: <a href="mailto:support@getinterviewiq.in" style={linkStyle}>support@getinterviewiq.in</a>
            </p>
          </div>
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

export function LegalFooter() {
  return (
    <footer style={{ background: '#0F172A', borderTop: '1px solid #1E293B', padding: '24px 40px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <p style={{ fontSize: 13, color: '#4B5563' }}>© 2026 InterviewIQ — Built for India 🇮🇳</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {[
            { to: '/privacy', label: 'Privacy Policy' },
            { to: '/terms', label: 'Terms of Service' },
            { to: '/refund', label: 'Refund Policy' },
            { to: '/contact', label: 'Contact Us' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{ fontSize: 13, color: '#64748B', textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

const listStyle = { paddingLeft: 20, color: '#94A3B8', fontSize: 15, lineHeight: 2, margin: 0 }
const paraStyle = { color: '#94A3B8', fontSize: 15, lineHeight: 1.8, marginTop: 12 }
const noteStyle = { color: '#22C55E', fontSize: 14, lineHeight: 1.7, marginTop: 14, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '10px 14px' }
const linkStyle = { color: '#2563EB', textDecoration: 'none' }
