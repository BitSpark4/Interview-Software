import { Link } from 'react-router-dom'

const STEPS = [
  { icon: '📄', title: 'Upload your resume', desc: 'Claude reads your actual projects and experience — no generic questions.' },
  { icon: '🎯', title: 'Choose role & round', desc: 'Technical, Behavioral, HR, or Mixed. 6 job roles including PM and Data.' },
  { icon: '📊', title: 'Get brutally honest feedback', desc: 'Score out of 10, STAR breakdown, what to say differently next time.' },
]

const PRO_FEATURES = [
  'Unlimited interviews every month',
  'Resume-aware personalized questions',
  'STAR method coaching on every answer',
  'Progress tracking & weak area analysis',
  'Company-specific question style',
  'Priority support',
]

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    role: 'Got into Razorpay as SDE-2',
    text: 'I practiced 12 interviews before my Razorpay round. The feedback on my system design answers was spot-on. Cleared the interview in the first attempt.',
  },
  {
    name: 'Arjun M.',
    role: 'Selected at a Bengaluru startup',
    text: 'Coming from a service company background, I had no idea how product interviews worked. InterviewIQ made me practice ownership stories until they actually sounded real.',
  },
  {
    name: 'Divya K.',
    role: 'Cracked TCS Digital from a tier-3 college',
    text: 'Scored 8.5/10 on my last mock before the actual interview. The STAR breakdown showed me exactly where my answers were vague.',
  },
]

const PREVIEW_MESSAGES = [
  { from: 'ai', text: 'Tell me about a time you had to meet a tight deadline at work. Walk me through what happened.' },
  { from: 'user', text: 'At my last company we had a product launch moved up by two weeks. I re-prioritised the backlog and...' },
  { from: 'ai', text: '7/10 — Good situation setup. Your action steps were clear, but the Result was missing. Quantify the outcome next time.' },
]

const STATS = [
  { value: '2,400+', label: 'Interviews Practiced' },
  { value: '₹199', label: 'vs $20 competitors charge' },
  { value: '4.8★', label: 'Average User Rating' },
]

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-5 border-b border-gray-800/60 max-w-5xl mx-auto">
        <span className="font-mono font-bold text-emerald-400 tracking-tight text-lg">InterviewIQ</span>
        <div className="flex items-center gap-4">
          <Link to="/auth?mode=login" className="text-gray-500 hover:text-white text-sm transition-colors">
            Sign in
          </Link>
          <Link
            to="/auth?mode=signup"
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Start Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-20 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-xs font-mono">
          🇮🇳 Built for Indian Job Seekers
        </div>

        <h1 className="font-mono font-bold text-3xl sm:text-4xl md:text-5xl leading-tight mb-5">
          Stop Freezing in Interviews.<br />
          <span className="text-emerald-400">Start Getting Offers.</span>
        </h1>

        <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          AI mock interviews that read your actual resume, ask questions like TCS, Infosys, startups and product companies, and tell you exactly what to fix.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/auth?mode=signup"
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-3.5 rounded-lg transition-colors text-center min-h-11 flex items-center justify-center gap-2"
          >
            Start Free — No Card Needed
          </Link>
          <Link
            to="/auth?mode=login"
            className="w-full sm:w-auto border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white px-6 py-3.5 rounded-lg transition-colors text-center text-sm min-h-11 flex items-center justify-center"
          >
            Sign in →
          </Link>
        </div>

        <p className="text-gray-600 text-xs mt-4">3 free interviews every month · No credit card · Cancel anytime</p>
      </section>

      {/* Stats */}
      <section className="px-4 py-8 max-w-2xl mx-auto">
        <div className="grid grid-cols-3 gap-4 border border-gray-800 rounded-xl bg-gray-900/50 p-6">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="font-mono font-bold text-white text-xl sm:text-2xl">{s.value}</p>
              <p className="text-gray-600 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live preview */}
      <section className="px-4 py-12 max-w-2xl mx-auto border-t border-gray-800">
        <p className="text-gray-600 text-xs font-mono text-center mb-6 uppercase tracking-widest">What it looks like</p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          {/* Fake session header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-400 text-xs">AI</span>
                    </div>
                    <span className="text-gray-600 text-xs font-mono">Claude</span>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded-xl rounded-tl-none px-4 py-3">
                    <p className="text-gray-200 text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-[75%] bg-emerald-500/10 border border-emerald-500/20 rounded-xl rounded-tr-none px-4 py-3">
                  <p className="text-gray-200 text-sm leading-relaxed">{m.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="text-gray-700 text-xs text-center mt-3">Real feedback. Real scores. No fluff.</p>
      </section>

      {/* Problem */}
      <section className="px-4 py-12 max-w-2xl mx-auto border-t border-gray-800">
        <h2 className="font-mono font-bold text-xl text-white mb-4">Why existing tools fail Indian candidates</h2>
        <div className="space-y-3">
          {[
            { problem: 'Designed for US/UK market', fix: 'We cover TCS, Infosys, Wipro, HCL, Razorpay, Zepto, and more' },
            { problem: '$20/month — unaffordable on an Indian salary', fix: 'Starts at ₹0. Pro is ₹199 — less than a movie ticket' },
            { problem: 'Generic questions that ignore your resume', fix: 'Claude reads your actual projects and asks follow-up questions about them' },
            { problem: 'No explanation of what a good answer looks like', fix: 'STAR breakdown on every answer — see exactly what was missing' },
          ].map(({ problem, fix }) => (
            <div key={problem} className="grid grid-cols-[1fr_1fr] gap-3">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg px-4 py-3 flex items-start gap-2">
                <span className="text-red-400 text-xs mt-0.5 shrink-0">✗</span>
                <p className="text-gray-400 text-sm">{problem}</p>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-4 py-3 flex items-start gap-2">
                <span className="text-emerald-400 text-xs mt-0.5 shrink-0">✓</span>
                <p className="text-gray-300 text-sm">{fix}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-12 max-w-3xl mx-auto border-t border-gray-800">
        <h2 className="font-mono font-bold text-xl text-center text-white mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {STEPS.map((step, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 relative">
              <div className="absolute -top-3 -left-2 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <span className="text-black text-xs font-mono font-bold">{i + 1}</span>
              </div>
              <div className="text-3xl mb-3 mt-1">{step.icon}</div>
              <h3 className="font-mono font-bold text-white text-sm mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-4 py-12 max-w-3xl mx-auto border-t border-gray-800">
        <h2 className="font-mono font-bold text-xl text-center text-white mb-2">People who got the offer</h2>
        <p className="text-gray-600 text-sm text-center mb-10">Real results from real candidates</p>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <p className="text-gray-300 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-white text-sm font-medium">{t.name}</p>
                <p className="text-emerald-400 text-xs font-mono mt-0.5">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-12 max-w-3xl mx-auto border-t border-gray-800">
        <h2 className="font-mono font-bold text-xl text-center text-white mb-2">Simple Pricing</h2>
        <p className="text-gray-600 text-sm text-center mb-10">No subscriptions traps. Cancel in one click.</p>
        <div className="grid md:grid-cols-2 gap-6">

          {/* Free */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm font-mono mb-2">Free Forever</p>
            <p className="text-white font-mono font-bold text-4xl mb-1">₹0</p>
            <p className="text-gray-600 text-xs mb-6">No credit card required</p>
            <ul className="space-y-2.5 mb-6">
              {[
                { ok: true,  text: '3 interviews per month' },
                { ok: true,  text: 'All 6 job roles' },
                { ok: true,  text: 'Score + feedback on every answer' },
                { ok: false, text: 'Resume-aware questions' },
                { ok: false, text: 'Progress tracking & weak areas' },
                { ok: false, text: 'Unlimited interviews' },
              ].map(f => (
                <li key={f.text} className={`flex items-center gap-2 text-sm ${f.ok ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className={f.ok ? 'text-emerald-400' : ''}>{f.ok ? '✓' : '✗'}</span>
                  {f.text}
                </li>
              ))}
            </ul>
            <Link
              to="/auth?mode=signup"
              className="block w-full border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 py-3 rounded-lg text-center text-sm transition-colors"
            >
              Start for Free
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gray-900 border border-emerald-500/50 rounded-xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full font-mono">
              MOST POPULAR
            </div>
            <p className="text-emerald-400 text-sm font-mono mb-2">Pro</p>
            <p className="text-white font-mono font-bold text-4xl mb-1">
              ₹199<span className="text-gray-500 text-base font-normal">/month</span>
            </p>
            <p className="text-gray-600 text-xs mb-6">Cancel anytime. No hidden fees.</p>
            <ul className="space-y-2.5 mb-6">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                  <span className="text-emerald-400">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/upgrade"
              className="block w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 rounded-lg text-center text-sm transition-colors"
            >
              Upgrade to Pro — ₹199/mo
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 text-center max-w-xl mx-auto border-t border-gray-800">
        <h2 className="font-mono font-bold text-2xl text-white mb-3">
          Your next interview is closer than you think.
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Start practicing today. 3 free interviews. No card.
        </p>
        <Link
          to="/auth?mode=signup"
          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-8 py-4 rounded-lg transition-colors text-base"
        >
          Start Free Now →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-4 py-8 text-center text-gray-600 text-sm">
        <p className="font-mono font-bold text-gray-500 mb-3">InterviewIQ — Built for India 🇮🇳</p>
        <div className="flex items-center justify-center gap-6 text-xs">
          <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
          <a href="mailto:hello@interviewiq.in" className="hover:text-gray-400 transition-colors">Contact</a>
        </div>
        <p className="text-gray-800 text-xs mt-4">© 2025 InterviewIQ. All rights reserved.</p>
      </footer>
    </main>
  )
}
