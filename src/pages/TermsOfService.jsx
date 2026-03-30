import { Link } from 'react-router-dom'
import { ArrowLeft } from '@phosphor-icons/react'
import { LegalFooter } from './PrivacyPolicy'

export default function TermsOfService() {
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
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#F8FAFC', marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: '#64748B', marginBottom: 40 }}>Last updated: March 2026</p>

        <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.8, marginBottom: 40 }}>
          Please read these Terms of Service carefully before using InterviewIQ.
          By accessing or using our platform, you agree to be bound by these terms.
        </p>

        <Section title="1. Acceptance of Terms">
          <p style={paraStyle}>
            By creating an account or using InterviewIQ at getinterviewiq.in, you confirm
            that you have read, understood, and agree to these Terms of Service.
            If you do not agree, please do not use our platform.
          </p>
        </Section>

        <Section title="2. Service Description">
          <p style={paraStyle}>
            InterviewIQ is an AI-powered interview preparation platform for Indian job seekers.
            It provides:
          </p>
          <ul style={listStyle}>
            <li>AI-generated mock interview questions across 7 job sectors.</li>
            <li>Answer evaluation and scoring using the Claude AI engine.</li>
            <li>Progress tracking, weak area analysis, and performance reports.</li>
            <li>Resume upload and ATS analysis (Pro plan).</li>
          </ul>
          <p style={noteStyle}>
            Questions are AI-generated for practice purposes only. InterviewIQ is not affiliated
            with any government exam body, banking regulator, or private employer.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <ul style={listStyle}>
            <li>You must provide accurate and complete information when registering.</li>
            <li>One account per person — multiple accounts are not permitted.</li>
            <li>You are responsible for keeping your password secure.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must be at least 13 years of age to use this platform.</li>
          </ul>
        </Section>

        <Section title="4. Subscription Plans">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <PlanCard
              title="Free Plan"
              color="#64748B"
              items={['3 sessions per month', 'All 7 sectors', 'Basic score + feedback', 'No credit card required']}
            />
            <PlanCard
              title="Pro Plan — ₹199/month"
              color="#F59E0B"
              items={['Unlimited sessions', 'Resume-aware questions', 'ATS analysis', 'Correct model answers', '5–30 questions per session']}
            />
          </div>
          <ul style={listStyle}>
            <li>Billing is monthly and recurring until cancelled.</li>
            <li>Prices are in Indian Rupees (INR) and inclusive of applicable taxes.</li>
            <li>We reserve the right to update pricing with 30 days notice.</li>
          </ul>
        </Section>

        <Section title="5. Acceptable Use">
          <p style={paraStyle}>You agree NOT to:</p>
          <ul style={listStyle}>
            <li>Share your account credentials with others.</li>
            <li>Attempt to scrape, copy, or reproduce interview content or questions.</li>
            <li>Reverse-engineer or tamper with the platform or its AI systems.</li>
            <li>Use automated bots or scripts to access the platform.</li>
            <li>Upload malicious files or attempt to breach security.</li>
            <li>Use the platform for any unlawful purpose.</li>
          </ul>
          <p style={paraStyle}>Violations may result in immediate account termination without refund.</p>
        </Section>

        <Section title="6. Disclaimer">
          <ul style={listStyle}>
            <li>Questions are AI-generated for practice only — they may not reflect actual exam questions.</li>
            <li>We do not guarantee success in any interview, exam, or job application.</li>
            <li>Always verify facts, current affairs, and exam patterns from official sources.</li>
            <li>InterviewIQ is not affiliated with UPSC, MPSC, SSC, IBPS, or any other exam body.</li>
          </ul>
        </Section>

        <Section title="7. Limitation of Liability">
          <p style={paraStyle}>
            InterviewIQ is provided "as is" without warranties of any kind. We are not liable for:
          </p>
          <ul style={listStyle}>
            <li>Interview or exam outcomes after using our platform.</li>
            <li>Temporary service outages or data loss beyond our control.</li>
            <li>Actions taken based on AI-generated content.</li>
          </ul>
          <p style={paraStyle}>
            Our maximum liability in any circumstance is limited to the subscription amount
            you paid in the last 30 days.
          </p>
        </Section>

        <Section title="8. Governing Law">
          <p style={paraStyle}>
            These Terms are governed by the laws of India. Any disputes shall be subject
            to the exclusive jurisdiction of courts in Pune, Maharashtra, India.
          </p>
        </Section>

        <Section title="9. Contact">
          <p style={paraStyle}>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:support@getinterviewiq.in" style={linkStyle}>support@getinterviewiq.in</a>.
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

function PlanCard({ title, color, items }) {
  return (
    <div style={{ background: '#111827', border: `1px solid ${color}33`, borderRadius: 10, padding: '16px 20px' }}>
      <p style={{ fontSize: 14, fontWeight: 700, color, marginBottom: 12 }}>{title}</p>
      <ul style={{ paddingLeft: 16, margin: 0, color: '#94A3B8', fontSize: 13, lineHeight: 1.9 }}>
        {items.map(item => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

const listStyle = { paddingLeft: 20, color: '#94A3B8', fontSize: 15, lineHeight: 2, margin: '12px 0 0' }
const paraStyle = { color: '#94A3B8', fontSize: 15, lineHeight: 1.8, marginTop: 8 }
const noteStyle = { color: '#F59E0B', fontSize: 14, lineHeight: 1.7, marginTop: 14, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '10px 14px' }
const linkStyle = { color: '#2563EB', textDecoration: 'none' }
