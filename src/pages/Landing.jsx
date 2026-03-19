import { Link } from 'react-router-dom'
import { SectorIcon } from '../components/LottieAnimation'


const TESTIMONIALS = [
  {
    name: 'Priya S.',
    achievement: 'Cleared Razorpay SDE-2',
    text: 'I practiced 12 sessions before my Razorpay system design round. The resume-aware questions were exactly what they asked. Got the offer.',
  },
  {
    name: 'Arjun M.',
    achievement: 'MPSC Prelims cleared',
    text: 'UPSC preparation with Maharashtra-specific questions was exactly what I needed. The current affairs coverage is excellent.',
  },
  {
    name: 'Divya K.',
    achievement: 'IBPS PO selected',
    text: 'IBPS PO interview practice with banking awareness questions boosted my confidence completely. Scored 8.5 on my last mock.',
  },
]

const PREVIEW_MESSAGES = [
  { from: 'ai', text: 'Tell me about a time you had to meet a tight deadline at work. Walk me through what happened.' },
  { from: 'user', text: 'At my last company we had a product launch moved up by two weeks. I re-prioritised the backlog and...' },
  { from: 'ai', text: '7/10 — Good situation setup. Your action steps were clear, but the Result was missing. Quantify the outcome next time.' },
]

const SECTORS = [
  { id: 'it_tech',     title: 'IT and Tech',           sub: 'Software · Cloud · Digital',      count: '4M aspirants',  color: '#2563EB' },
  { id: 'government',  title: 'Government Jobs',        sub: 'UPSC · MPSC · SSC · Railway',     count: '12M aspirants', color: '#7C3AED' },
  { id: 'banking',     title: 'Banking and Finance',    sub: 'IBPS · SBI · RBI · Insurance',    count: '10M aspirants', color: '#F59E0B' },
  { id: 'engineering', title: 'Engineering',            sub: 'Campus placement · PSU · GATE',   count: '1.5M aspirants',color: '#059669' },
  { id: 'medical',     title: 'Medical',                sub: 'NEET · MBBS · Nursing',           count: '2M aspirants',  color: '#DC2626' },
  { id: 'students',    title: 'Students and Freshers',  sub: 'CET · JEE · First job',           count: '15M aspirants', color: '#EA580C' },
  { id: 'business',    title: 'Business and MBA',       sub: 'CAT · IIM · Group Discussion',    count: '500K aspirants',color: '#DB2777' },
]

const STATS = [
  { value: '35M+', label: 'Exam aspirants in India', color: '#F8FAFC' },
  { value: '₹199', label: 'Less than coaching books', color: '#F59E0B' },
  { value: '7', label: 'Exam sectors covered', color: '#F8FAFC' },
]

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-5 border-b border-gray-800/60 max-w-5xl mx-auto">
        <span className="font-mono font-bold text-blue-400 tracking-tight text-lg">InterviewIQ</span>
        <div className="flex items-center gap-4">
          <Link to="/auth?mode=login" className="text-gray-500 hover:text-white text-sm transition-colors">
            Sign in
          </Link>
          <Link
            to="/auth?mode=signup"
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-4 pt-16 pb-20 overflow-hidden">

        {/* Background layer */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, #1F2937 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.5,
          }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[340px] rounded-full" style={{
            background: 'radial-gradient(ellipse, rgba(37,99,235,0.14) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }} />
          <div className="absolute top-24 -left-20 w-72 h-72 rounded-full" style={{
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
          <div className="absolute top-16 -right-20 w-64 h-64 rounded-full" style={{
            background: 'radial-gradient(ellipse, rgba(37,99,235,0.08) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }} />
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{
            background: 'linear-gradient(to bottom, transparent, #0a0a0f)',
          }} />
        </div>

        {/* Content */}
        <div className="relative max-w-4xl mx-auto text-center">

          {/* Announcement banner */}
          <div className="inline-flex items-center justify-center mb-8"
            style={{
              background: 'rgba(37,99,235,0.15)',
              border: '1px solid rgba(37,99,235,0.3)',
              borderRadius: 20,
              padding: '6px 16px',
            }}
          >
            <span style={{ fontSize: 12, color: '#94A3B8' }}>🇮🇳 Built for India · All Sectors · ₹199/mo</span>
          </div>

          {/* Headline */}
          <h1 className="font-extrabold text-center mb-0" style={{ lineHeight: 1.1 }}>
            <span style={{ display: 'block', fontSize: 56, color: '#F8FAFC' }}>Crack Any Interview.</span>
            <span style={{ display: 'block', fontSize: 56, color: '#2563EB' }}>Any Sector. Any Exam.</span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: 18,
            color: '#94A3B8',
            textAlign: 'center',
            maxWidth: 560,
            margin: '20px auto 40px',
            lineHeight: 1.6,
          }}>
            AI-powered mock interviews for UPSC, Banking, Engineering, Medical, IT and more.
            Resume-aware questions. Honest scoring. Starting at ₹0.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/auth?mode=signup"
              className="w-full sm:w-auto flex items-center justify-center font-bold transition-all duration-200"
              style={{
                background: '#2563EB',
                color: '#fff',
                height: 52,
                padding: '0 32px',
                borderRadius: 10,
                fontSize: 15,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
            >
              Start Free — No Card Needed →
            </Link>
            <Link
              to="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center transition-all duration-200"
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#94A3B8',
                height: 52,
                padding: '0 28px',
                borderRadius: 10,
                fontSize: 15,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              See How It Works
            </Link>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-5">
            {['2 free sessions/month', 'All 7 exam sectors', 'Cancel anytime'].map(t => (
              <span key={t} style={{ fontSize: 13, color: '#64748B' }}>✓ {t}</span>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-0 mt-12 flex-wrap">
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center">
                <div className="text-center px-8">
                  <p className="font-bold" style={{ fontSize: 28, color: s.color }}>{s.value}</p>
                  <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>{s.label}</p>
                </div>
                {i < STATS.length - 1 && (
                  <div style={{ width: 1, height: 40, background: '#1E293B' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sector Showcase */}
      <section className="px-4 py-16 max-w-5xl mx-auto border-t border-gray-800">
        <h2 className="font-bold text-center" style={{ fontSize: 32, color: '#F8FAFC', marginBottom: 12 }}>
          Every Sector. Every Dream.
        </h2>
        <p className="text-center" style={{ fontSize: 16, color: '#64748B', marginBottom: 48 }}>
          Whether you are preparing for UPSC or campus placement, we have got you covered.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}>
          {SECTORS.map(s => (
            <div key={s.title}
              className="transition-all duration-200 cursor-default"
              style={{
                background: '#111827',
                border: '1px solid #1E293B',
                borderTop: `3px solid ${s.color}`,
                borderRadius: 12,
                padding: '20px 16px',
                textAlign: 'center',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#334155'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#1E293B'
                e.currentTarget.style.borderTopColor = s.color
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <SectorIcon sector={s.id} size={36} />
              <p className="font-semibold" style={{ fontSize: 14, color: '#F8FAFC', marginTop: 12 }}>{s.title}</p>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{s.sub}</p>
              <div style={{
                display: 'inline-block',
                marginTop: 12,
                padding: '3px 10px',
                borderRadius: 20,
                background: `${s.color}1A`,
                color: s.color,
                fontSize: 11,
              }}>
                {s.count}
              </div>
            </div>
          ))}
        </div>
        <p className="text-center mt-8" style={{ fontSize: 14, color: '#64748B' }}>
          🇮🇳 35 million+ aspirants across all sectors
        </p>
      </section>

      {/* Live preview */}
      <section className="px-4 py-12 max-w-2xl mx-auto border-t border-gray-800">
        <p className="text-gray-600 text-xs font-mono text-center mb-6 uppercase tracking-widest">What it looks like</p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          {/* Fake session header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-gray-400 text-xs font-mono">Live Interview · Backend Developer · Q2 of 5</span>
            </div>
            <span className="font-mono text-xs text-gray-600">Mixed round</span>
          </div>

          {/* Messages */}
          {PREVIEW_MESSAGES.map((m, i) => (
            <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.from === 'ai' ? (
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <span className="text-blue-400 text-xs">AI</span>
                    </div>
                    <span className="text-gray-600 text-xs font-mono">Claude</span>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl rounded-tl-none px-4 py-3">
                    <p className="text-gray-200 text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[75%] bg-blue-500/10 border border-blue-500/20 rounded-xl rounded-tr-none px-4 py-3">
                  <p className="text-gray-200 text-sm leading-relaxed">{m.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-700 text-xs text-center mt-3">Real feedback. Real scores. No fluff.</p>
      </section>

      {/* Problem vs Solution */}
      <section className="px-4 py-16 max-w-4xl mx-auto border-t border-gray-800">
        <h2 className="font-bold text-center" style={{ fontSize: 32, color: '#F8FAFC', marginBottom: 8 }}>Why other tools fail you</h2>
        <p className="text-center mb-12" style={{ fontSize: 16, color: '#64748B' }}>And why InterviewIQ is different</p>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left — Problems */}
          <div style={{
            background: 'rgba(239,68,68,0.05)',
            border: '1px solid rgba(239,68,68,0.1)',
            borderRadius: 12,
            padding: 24,
          }}>
            <p className="font-semibold flex items-center gap-2 mb-5" style={{ color: '#EF4444', fontSize: 15 }}>
              <span>✗</span> What they do
            </p>
            <ul className="space-y-4">
              {[
                'Only IT sector — ignores UPSC, Banking, Medical students',
                '$20/month — ₹1600+ on Indian salary',
                'Generic questions not from your actual resume',
                'No explanation of what a good answer looks like',
                'Designed for US/UK market, not Indian exam patterns',
              ].map(t => (
                <li key={t} className="flex items-start gap-3" style={{ fontSize: 14, color: '#94A3B8' }}>
                  <span style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }}>✗</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          {/* Right — Solutions */}
          <div style={{
            background: 'rgba(37,99,235,0.05)',
            border: '1px solid rgba(37,99,235,0.1)',
            borderRadius: 12,
            padding: 24,
          }}>
            <p className="font-semibold flex items-center gap-2 mb-5" style={{ color: '#2563EB', fontSize: 15 }}>
              <span>✓</span> What we do
            </p>
            <ul className="space-y-4">
              {[
                'All 7 sectors — IT, Government, Banking, Engineering, Medical and more',
                '₹199/month — less than one coaching class book',
                'Reads your resume and asks about YOUR actual projects',
                'Shows correct answer and exactly what was missing',
                'Built for Indian exam patterns, Maharashtra state questions included',
              ].map(t => (
                <li key={t} className="flex items-start gap-3" style={{ fontSize: 14, color: '#CBD5E1' }}>
                  <span style={{ color: '#2563EB', flexShrink: 0, marginTop: 2 }}>✓</span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-16 max-w-4xl mx-auto border-t border-gray-800">
        <h2 className="font-bold text-center" style={{ fontSize: 32, color: '#F8FAFC', marginBottom: 8 }}>How It Works</h2>
        <p className="text-center mb-12" style={{ fontSize: 16, color: '#64748B' }}>Ready to practice in 60 seconds</p>
        <div className="flex flex-col md:flex-row items-center gap-4">
          {[
            { num: '1', numColor: '#2563EB', icon: '👤', title: 'Create your account', sub: 'Sign up free in 30 seconds. No credit card needed.' },
            { num: '2', numColor: '#F59E0B', icon: '🎯', title: 'Choose your sector and role', sub: 'UPSC, Frontend Developer, IBPS PO, NEET or any of 40+ options' },
            { num: '3', numColor: '#22C55E', icon: '🧠', title: 'Get honest AI feedback', sub: 'Score out of 10. Correct answers. What to improve. Every question.' },
          ].map((step, i) => (
            <div key={i} className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto flex-1">
              <div style={{
                background: '#111827',
                border: '1px solid #1E293B',
                borderRadius: 16,
                padding: '28px 24px',
                textAlign: 'center',
                flex: 1,
                width: '100%',
              }}>
                <div className="flex items-center justify-center mx-auto mb-3" style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: `${step.numColor}22`,
                  border: `2px solid ${step.numColor}`,
                  fontSize: 14, fontWeight: 700, color: step.numColor,
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{step.icon}</div>
                <h3 className="font-semibold" style={{ fontSize: 15, color: '#F8FAFC', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>{step.sub}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:flex items-center justify-center flex-shrink-0" style={{ color: '#334155', fontSize: 24 }}>→</div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center mt-8" style={{ fontSize: 15, color: '#64748B', fontStyle: 'italic' }}>
          Then practice again. And again. Until you are interview ready.
        </p>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-16 max-w-4xl mx-auto border-t border-gray-800">
        <h2 className="font-bold text-center" style={{ fontSize: 32, color: '#F8FAFC', marginBottom: 8 }}>People who got the offer</h2>
        <p className="text-center mb-12" style={{ fontSize: 16, color: '#64748B' }}>Real results from real candidates across different sectors</p>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{
              background: '#111827',
              border: '1px solid #1E293B',
              borderRadius: 16,
              padding: 24,
            }}>
              <div style={{ color: '#F59E0B', fontSize: 14, letterSpacing: 2 }}>★★★★★</div>
              <p style={{ fontSize: 14, color: '#94A3B8', fontStyle: 'italic', lineHeight: 1.7, margin: '12px 0 20px' }}>
                "{t.text}"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-full font-bold" style={{
                  width: 40, height: 40, background: '#2563EB', color: '#fff', fontSize: 14,
                }}>
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: '#2563EB', marginTop: 2 }}>{t.achievement}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-16 border-t border-gray-800">
        <h2 className="font-bold text-center" style={{ fontSize: 32, color: '#F8FAFC', marginBottom: 8 }}>Simple Pricing</h2>
        <p className="text-center mb-12" style={{ fontSize: 16, color: '#64748B' }}>
          No subscription traps. Cancel with one click.
        </p>
        <div className="grid md:grid-cols-2 gap-6 mx-auto" style={{ maxWidth: 800 }}>

          {/* Free card */}
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 32 }}>
            <div className="inline-block mb-4" style={{
              background: '#1E293B', color: '#94A3B8', fontSize: 12, padding: '4px 12px', borderRadius: 20,
            }}>
              Free Forever
            </div>
            <p className="font-extrabold" style={{ fontSize: 48, color: '#F8FAFC', lineHeight: 1 }}>₹0</p>
            <p style={{ fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 24 }}>2 sessions per month</p>
            <ul className="space-y-3 mb-8">
              {[
                { ok: true,  text: '2 sessions every month' },
                { ok: true,  text: 'All 7 exam sectors' },
                { ok: true,  text: 'Basic score and feedback' },
                { ok: true,  text: '5 questions per session' },
                { ok: false, text: 'Correct answers' },
                { ok: false, text: 'Unlimited sessions' },
              ].map(f => (
                <li key={f.text} className="flex items-center gap-2" style={{
                  fontSize: 14,
                  color: f.ok ? '#CBD5E1' : '#4B5563',
                  textDecoration: f.ok ? 'none' : 'line-through',
                }}>
                  <span style={{ color: f.ok ? '#2563EB' : '#4B5563' }}>{f.ok ? '✓' : '🔒'}</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <Link
              to="/auth?mode=signup"
              className="block w-full text-center font-medium transition-colors"
              style={{
                border: '1px solid #334155', color: '#94A3B8', height: 48,
                borderRadius: 10, lineHeight: '48px', fontSize: 14,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1E293B'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Start for Free
            </Link>
          </div>

          {/* Pro card */}
          <div className="relative" style={{
            background: '#111827', border: '2px solid #F59E0B', borderRadius: 16, padding: 32,
          }}>
            <div className="absolute left-1/2 -translate-x-1/2 font-bold" style={{
              top: -14, background: '#F59E0B', color: '#000', fontSize: 12,
              padding: '4px 16px', borderRadius: 20,
            }}>
              Most Popular
            </div>
            <div className="inline-block mb-4" style={{
              background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 12, padding: '4px 12px', borderRadius: 20,
            }}>
              Pro Plan
            </div>
            <div className="flex items-end gap-1">
              <p className="font-extrabold" style={{ fontSize: 48, color: '#F8FAFC', lineHeight: 1 }}>₹199</p>
              <p style={{ fontSize: 16, color: '#64748B', marginBottom: 4 }}>/month</p>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 6, marginBottom: 24 }}>Cancel anytime. UPI accepted.</p>
            <ul className="space-y-3 mb-8">
              {[
                'Unlimited sessions every month',
                'Choose 5 to 30 questions',
                'Correct answers every question',
                'Resume-aware personalized questions',
                'AI career coaching and analysis',
                'STAR method breakdown',
                'Weak area study plan',
                'Company specific questions',
                'Progress tracking and badges',
              ].map(f => (
                <li key={f} className="flex items-center gap-2" style={{ fontSize: 14, color: '#CBD5E1' }}>
                  <span style={{ color: '#F59E0B' }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/upgrade"
              className="block w-full text-center font-bold transition-colors"
              style={{
                background: '#F59E0B', color: '#000', height: 52,
                borderRadius: 10, lineHeight: '52px', fontSize: 15,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#D97706'}
              onMouseLeave={e => e.currentTarget.style.background = '#F59E0B'}
            >
              Upgrade to Pro — ₹199/mo
            </Link>
          </div>
        </div>
        <p className="text-center mt-8" style={{ fontSize: 12, color: '#64748B' }}>
          🛡️ Secure payment via Razorpay · UPI · Cards · NetBanking
        </p>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 border-t border-gray-800">
        <div className="text-center mx-auto" style={{
          background: '#111827',
          border: '1px solid #1E293B',
          borderRadius: 24,
          padding: '60px 40px',
          maxWidth: 700,
          margin: '0 auto',
        }}>
          <h2 className="font-extrabold" style={{ fontSize: 40, lineHeight: 1.2 }}>
            <span style={{ display: 'block', color: '#F8FAFC' }}>Your next interview is</span>
            <span style={{ display: 'block', color: '#2563EB' }}>closer than you think.</span>
          </h2>
          <p style={{ fontSize: 16, color: '#64748B', margin: '16px 0 32px' }}>
            Join thousands of Indian aspirants practicing smarter with AI coaching.
          </p>
          <Link
            to="/auth?mode=signup"
            className="inline-flex items-center justify-center font-bold transition-colors"
            style={{
              background: '#2563EB', color: '#fff', height: 56,
              padding: '0 48px', borderRadius: 12, fontSize: 16,
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
            onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
          >
            Start Practicing Free Now →
          </Link>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 16 }}>
            No credit card · 2 free sessions · All sectors
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0F172A', borderTop: '1px solid #1E293B', padding: '32px 40px' }}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-5xl mx-auto">
          <div>
            <p className="font-bold text-blue-400" style={{ fontSize: 16 }}>InterviewIQ</p>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Built for India 🇮🇳</p>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="transition-colors" style={{ fontSize: 13, color: '#64748B' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>Privacy Policy</a>
            <a href="#" className="transition-colors" style={{ fontSize: 13, color: '#64748B' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>Terms of Service</a>
            <a href="mailto:hello@interviewiq.in" className="transition-colors" style={{ fontSize: 13, color: '#64748B' }}
              onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748B'}>Contact Us</a>
          </div>
          <p style={{ fontSize: 12, color: '#4B5563' }}>© 2026 InterviewIQ</p>
        </div>
      </footer>
    </main>
  )
}
