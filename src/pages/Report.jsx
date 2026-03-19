import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Medal, CheckCircle, XCircle, Lightbulb, PlayCircle, CaretDown, CaretUp, ShareNetwork, Target, ArrowUp, ArrowDown } from '@phosphor-icons/react'
import AppLayout from '../components/AppLayout'
import ProFeatureWrapper from '../components/ProFeatureWrapper'
import Spinner from '../components/Spinner'
import StarBreakdown from '../components/StarBreakdown'
import { verdictColor, scoreColor } from '../utils/scoreHelpers'
import { formatDate } from '../utils/dateHelpers'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const TOPIC_RESOURCES = {
  'History':              { study: 'Focus on ancient medieval and modern Indian history with key events dates and rulers', source: 'NCERT History Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'Medieval History':     { study: 'Study Mughal Maratha Sultanate administration and socio-economic systems', source: 'NCERT History Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'Ancient History':      { study: 'Study Indus Valley Vedic period Maurya and Gupta empires', source: 'NCERT History Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'Geography':            { study: 'Revise physical human and economic geography of India and world', source: 'NCERT Geography Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'Polity':               { study: 'Study Indian constitution fundamental rights directive principles and Parliament structure', source: 'NCERT Political Science Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'Economy':              { study: 'Study Indian economy planning GDP inflation unemployment and government schemes', source: 'Economic Survey of India', url: 'https://finmin.nic.in/economic-survey' },
  'Current Affairs':      { study: 'Read daily news and focus on government schemes international events and policy changes', source: 'Press Information Bureau', url: 'https://pib.gov.in' },
  'Environment':          { study: 'Study biodiversity climate change environmental laws and national parks', source: 'NCERT Class 11-12 Biology', url: 'https://ncert.nic.in/textbook.php' },
  'Science':              { study: 'Revise basic physics chemistry and biology with focus on inventions and discoveries', source: 'NCERT Science textbooks', url: 'https://ncert.nic.in/textbook.php' },
  'Banking Awareness':    { study: 'Study RBI functions banking terms NBFC types of accounts and recent policy changes', source: 'RBI Official Website', url: 'https://rbi.org.in' },
  'RBI Monetary Policy':  { study: 'Memorize repo rate CRR SLR reverse repo and their current values and impact', source: 'RBI Monetary Policy Page', url: 'https://rbi.org.in/scripts/monetarypolicy.aspx' },
  'Quantitative':         { study: 'Practice simplification profit-loss time-work and data interpretation daily', source: 'IBPS Practice Papers', url: 'https://ibps.in' },
  'Reasoning':            { study: 'Solve seating arrangement puzzles syllogisms and coding-decoding problems daily', source: 'IBPS Practice Papers', url: 'https://ibps.in' },
  'English':              { study: 'Practice reading comprehension cloze test and para jumbles with The Hindu editorials', source: 'The Hindu', url: 'https://www.thehindu.com' },
  'Engineering Mathematics': { study: 'Revise linear algebra calculus differential equations and numerical methods', source: 'GATE Study Material', url: 'https://gate2025.iitr.ac.in' },
  'Applied Mechanics':    { study: 'Practice problems on stress strain beams columns and theory of machines', source: 'GATE Mechanical Syllabus', url: 'https://gate2025.iitr.ac.in' },
  'Fluid Thermal':        { study: 'Revise Bernoulli equation heat transfer modes thermodynamic cycles', source: 'GATE Mechanical Syllabus', url: 'https://gate2025.iitr.ac.in' },
  'Medicine':             { study: 'Revise high yield clinical cases pharmacology and recent treatment guidelines', source: 'National Board of Examinations', url: 'https://natboard.edu.in' },
  'Surgery':              { study: 'Focus on surgical anatomy operative steps and post-operative complications', source: 'National Board of Examinations', url: 'https://natboard.edu.in' },
  'Physics':              { study: 'Practice numerical problems in mechanics electricity magnetism and optics', source: 'NCERT Physics Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'Chemistry':            { study: 'Revise organic reactions equilibrium electrochemistry and periodic properties', source: 'NCERT Chemistry Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'Mathematics':          { study: 'Practice calculus algebra trigonometry and coordinate geometry problems', source: 'NCERT Mathematics Class 11-12', url: 'https://ncert.nic.in/textbook.php' },
  'VARC':                 { study: 'Read 2 RC passages daily and practice para jumbles from CAT previous papers', source: 'IIM CAT Official', url: 'https://iimcat.ac.in' },
  'DILR':                 { study: 'Solve 1 DI set and 1 LR puzzle daily focusing on speed and accuracy', source: 'IIM CAT Official', url: 'https://iimcat.ac.in' },
  'QA':                   { study: 'Practice arithmetic algebra and geometry with timed mock tests', source: 'IIM CAT Official', url: 'https://iimcat.ac.in' },
}

function getResource(topic) {
  if (!topic) return null
  const direct = TOPIC_RESOURCES[topic]
  if (direct) return direct
  const key = Object.keys(TOPIC_RESOURCES).find(k => topic.toLowerCase().includes(k.toLowerCase()))
  return key ? TOPIC_RESOURCES[key] : null
}

function PreparationRoadmap({ pairs, overallScore }) {
  const weakPairs = pairs.filter(p => (p.feedback?.score ?? 10) < 6 && (p.feedback?.topic || p.feedback?.feedback?.topic))
  const seen = new Set()
  const weakTopics = weakPairs
    .map(p => ({ topic: p.feedback?.topic || p.feedback?.feedback?.topic, score: p.feedback?.score }))
    .filter(({ topic }) => { if (seen.has(topic)) return false; seen.add(topic); return true })

  const encouragement = overallScore >= 7
    ? 'Excellent performance! You are interview ready. Practice 2 more sessions to build confidence.'
    : overallScore >= 5
    ? 'Good effort! Focus on the topics marked above. You need 2 to 3 weeks more preparation.'
    : 'Keep going! Every expert was once a beginner. Study the suggested topics daily and practice again in 1 week.'

  const encouragementColor = overallScore >= 7 ? 'text-blue-400' : overallScore >= 5 ? 'text-amber-400' : 'text-red-400'
  const encouragementBorder = overallScore >= 7 ? 'border-blue-500/30 bg-blue-500/5' : overallScore >= 5 ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/30 bg-red-500/5'

  return (
    <div className="rounded-xl p-6" style={{ background: '#111827', border: '1px solid #1F2937' }}>
      <h2 className="text-white font-semibold mb-1">Your Preparation Roadmap</h2>
      <p className="text-gray-500 text-xs mb-5">Targeted study plan based on your weak areas</p>

      {weakTopics.length === 0 ? (
        <p className="text-gray-400 text-sm">No weak areas detected — great performance across all topics!</p>
      ) : (
        <div className="space-y-4 mb-6">
          {weakTopics.map(({ topic, score }) => {
            const res = getResource(topic)
            return (
              <div key={topic} className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm">{topic}</span>
                  <span className="font-mono text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">{score}/10</span>
                </div>
                {res ? (
                  <>
                    <p className="text-gray-400 text-xs leading-relaxed mb-2">{res.study}</p>
                    <a href={res.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1">
                      📖 {res.source} →
                    </a>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs">Review this topic from standard study materials for your exam.</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className={`rounded-lg p-4 border ${encouragementBorder}`}>
        <p className={`text-sm font-medium ${encouragementColor}`}>{encouragement}</p>
      </div>
    </div>
  )
}

const SECTOR_META = {
  it_tech:     { label: 'IT & Technology',          emoji: '💻' },
  government:  { label: 'Government Services',       emoji: '🏛️' },
  banking:     { label: 'Banking & Finance',         emoji: '🏦' },
  engineering: { label: 'Engineering',               emoji: '⚙️' },
  medical:     { label: 'Medical & Healthcare',      emoji: '🏥' },
  students:    { label: 'Students & Entrance Exams', emoji: '🎓' },
  business:    { label: 'Business & Management',     emoji: '📊' },
}

function getCareerMilestone(count, avg) {
  if (avg > 8.5) return { label: 'Expert — Interview Ready ✓', color: '#22C55E', next: null }
  if (avg > 7.5) return { label: 'Ready — Interview Confident',  color: '#22C55E', next: 'Improve avg above 8.5 to reach Expert' }
  if (count >= 11) return { label: 'Preparing — Almost There',   color: '#3B82F6', next: 'Improve avg above 7.5 to reach Ready' }
  if (count >= 4)  return { label: 'Learner — Getting Serious',  color: '#F59E0B', next: `${11 - count} more sessions to reach Preparing` }
  if (count >= 1)  return { label: 'Explorer — Building Foundation', color: '#F97316', next: `${4 - count} more sessions to reach Learner` }
  return               { label: 'Beginner — Just Started',       color: '#6B7280', next: 'Complete your first session to start' }
}

export default function Report() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { userProfile } = useAuth()
  const [session, setSession]   = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [openQ, setOpenQ]       = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const [
          { data: { user } },
          { data: s, error: sErr },
          { data: msgs },
        ] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from('sessions')
            .select('id, user_id, role, interview_type, total_score, verdict, strengths, improvements, top_advice, completed, completed_at, created_at')
            .eq('id', id).single(),
          supabase.from('messages')
            .select('id, session_id, sender, content, score, feedback, correct_answer, topic, is_question, question_num, created_at')
            .eq('session_id', id).order('created_at', { ascending: true }),
        ])
        if (sErr || !s) throw new Error('Report not found.')
        if (s.user_id !== user.id) throw new Error('Unauthorised.')
        if (!s.completed) { navigate(`/interview/session?id=${id}`, { replace: true }); return }
        setSession(s)
        setMessages(msgs || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Spinner size={28} color="border-blue-500" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link to="/dashboard" className="text-blue-400 text-sm">← Back to Dashboard</Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const questions  = messages.filter(m => m.is_question)
  const userAnswers = messages.filter(m => m.sender === 'user')
  const feedbacks  = messages.filter(m => m.sender === 'ai' && !m.is_question)
  const pairs      = questions.map(q => ({
    question: q,
    answer:   userAnswers.find(a => a.question_num === q.question_num),
    feedback: feedbacks.find(f => f.question_num === q.question_num),
  }))

  const strengths    = Array.isArray(session.strengths)    ? session.strengths    : []
  const improvements = Array.isArray(session.improvements) ? session.improvements : []
  const linkedInText = encodeURIComponent(
    `I scored ${session.total_score}/10 in a ${session.role} mock interview on InterviewIQ! #InterviewPrep #JobSearch`
  )

  return (
    <AppLayout>
      <div className="p-4 md:p-8 space-y-6 max-w-4xl">

        {/* Header */}
        <div>
          <p className="text-blue-400 text-sm font-mono mb-1 flex items-center gap-1.5">
            <CheckCircle size={14} /> Interview Complete
          </p>
          <h1 className="text-2xl font-bold text-white capitalize">
            {session.role?.replace(/_/g, ' ')} — {session.interview_type}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <p className="text-gray-500 text-xs">{formatDate(session.completed_at)}</p>
            {session.created_at && session.completed_at && (() => {
              const mins = Math.round((new Date(session.completed_at) - new Date(session.created_at)) / 60000)
              if (mins < 1) return null
              return <p className="text-gray-600 text-xs">· Completed in {mins} minute{mins !== 1 ? 's' : ''}</p>
            })()}
          </div>
        </div>

        {/* Score hero + S&I grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <Medal size={28} style={{ color: '#F59E0B' }} className="mb-3" />
            <p className="font-mono font-bold text-white text-6xl mb-2">
              {session.total_score}
              <span className="text-gray-600 text-2xl font-normal">/10</span>
            </p>
            <span className={`inline-block px-4 py-1.5 rounded-full font-mono font-bold text-sm mb-4 ${verdictColor(session.verdict)}`}>
              {session.verdict}
            </span>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(session.total_score / 10) * 100}%` }} />
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-gray-900 border border-gray-800 border-l-4 border-l-green-500 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" /> What you did well
            </h3>
            <ul className="space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-green-400 shrink-0 mt-0.5">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-gray-900 border border-gray-800 border-l-4 border-l-amber-500 rounded-xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <XCircle size={16} className="text-amber-400" /> Areas to improve
            </h3>
            <ul className="space-y-2">
              {improvements.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-300">
                  <span className="text-amber-400 shrink-0 mt-0.5">→</span>{s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Career Goal Progress */}
        <ProFeatureWrapper
          userProfile={userProfile}
          featureName="Career Progress"
          description="See how this session impacts your career goal progress"
          compact={true}
        >
        {userProfile?.primary_sector && (() => {
          const score      = session.total_score ?? 0
          const careerAvg  = userProfile.average_score ? parseFloat(userProfile.average_score) : 0
          const totalSess  = userProfile.total_sessions ?? 0
          const meta       = SECTOR_META[userProfile.primary_sector] ?? { label: userProfile.career_goal ?? userProfile.primary_sector, emoji: '🎯' }
          const milestone  = getCareerMilestone(totalSess, careerAvg)
          const aboveAvg   = careerAvg > 0 && score > careerAvg
          const belowAvg   = careerAvg > 0 && score < careerAvg
          const tip        = score >= 8 ? 'Outstanding! You are getting closer to the Interview Ready milestone.'
            : score >= 6 ? 'Good session. Focus on the weak topics shown below to push your score above 8.'
            : 'This topic needs more attention. Review the correct answers below and practice this sector again tomorrow.'
          const tipColor   = score >= 8 ? '#22C55E' : score >= 6 ? '#F59E0B' : '#EF4444'

          return (
            <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 12, padding: '16px 20px' }}>

              {/* Row 1 — goal label */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <Target size={16} color="#2563EB" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Career Goal Progress</span>
                <span className="text-white font-semibold">{meta.emoji} {meta.label}</span>
              </div>

              {/* Row 2 — this session vs career avg */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <div style={{ background: '#0B0F19', border: '1px solid #1F2937', borderRadius: 8, padding: '8px 14px' }}>
                  <p className="text-xs text-gray-500 mb-0.5">This Session</p>
                  <p className="text-white font-bold text-lg">{score}/10</p>
                </div>
                <span style={{ color: aboveAvg ? '#22C55E' : belowAvg ? '#F59E0B' : '#6B7280' }}>
                  {aboveAvg ? <ArrowUp size={20} /> : belowAvg ? <ArrowDown size={20} /> : '≈'}
                </span>
                <div style={{ background: '#0B0F19', border: '1px solid #1F2937', borderRadius: 8, padding: '8px 14px' }}>
                  <p className="text-xs text-gray-500 mb-0.5">Career Avg</p>
                  <p className="font-bold text-lg" style={{ color: careerAvg ? scoreColor(careerAvg) : '#4B5563' }}>
                    {careerAvg ? careerAvg.toFixed(1) : '—'}
                  </p>
                </div>
                <p className="text-sm" style={{ color: aboveAvg ? '#22C55E' : belowAvg ? '#F59E0B' : '#9CA3AF' }}>
                  {aboveAvg ? 'Above your average — great session!' : belowAvg ? 'Below your average — keep practicing' : 'On par with your average'}
                </p>
              </div>

              {/* Row 3 — milestone */}
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="text-xs font-semibold px-2 py-1 rounded-md" style={{ color: milestone.color, background: `${milestone.color}1A` }}>
                  {milestone.label}
                </span>
                {milestone.next && <span className="text-xs text-gray-500">{milestone.next}</span>}
              </div>

              {/* Row 4 — career tip */}
              <div style={{ background: `${tipColor}0F`, border: `1px solid ${tipColor}33`, borderRadius: 8, padding: '10px 14px' }}>
                <div className="flex items-start gap-2">
                  <Lightbulb size={13} style={{ color: tipColor, marginTop: 2, flexShrink: 0 }} />
                  <p className="text-sm leading-relaxed" style={{ color: tipColor === '#22C55E' ? '#86EFAC' : tipColor === '#F59E0B' ? '#FCD34D' : '#FCA5A5' }}>
                    {tip}
                  </p>
                </div>
              </div>

            </div>
          )
        })()}
        </ProFeatureWrapper>

        {/* Top advice */}
        {session.top_advice && (
          <div className="border border-amber-500/30 bg-amber-500/5 rounded-xl p-5 flex gap-3">
            <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-400 text-xs font-mono uppercase tracking-wider mb-1">Most Important Thing To Work On</p>
              <p className="text-white text-sm leading-relaxed">{session.top_advice}</p>
            </div>
          </div>
        )}

        {/* Question by Question Review */}
        {pairs.length > 0 && (
          <div>
            <h2 className="text-white font-semibold mb-1">Question by Question Review</h2>
            <p className="text-gray-500 text-xs mb-4">See your answers vs correct answers</p>
            <div className="space-y-3">
              {pairs.map((pair, i) => {
                const fb    = pair.feedback?.feedback
                const score = pair.feedback?.score
                const correctAnswer = pair.feedback?.correct_answer || fb?.correct_answer
                const topic = pair.feedback?.topic || fb?.topic
                const tip   = fb?.improvement_tip
                const isOpen = openQ === i
                const scoreBadge = score >= 7
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : score >= 5
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-red-500/10 text-red-400 border-red-500/30'
                return (
                  <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#111827', border: '1px solid #1F2937' }}>
                    <button
                      type="button"
                      onClick={() => setOpenQ(isOpen ? -1 : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-gray-400 text-xs shrink-0 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded">Q{i + 1}</span>
                        {topic && <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full hidden sm:inline shrink-0">{topic}</span>}
                        <p className="text-gray-300 text-sm truncate">{pair.question?.content}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        {score != null && (
                          <span className={`font-mono font-bold text-xs border px-2 py-0.5 rounded-full ${scoreBadge}`}>{score}/10</span>
                        )}
                        {isOpen ? <CaretUp size={16} className="text-gray-500" /> : <CaretDown size={16} className="text-gray-500" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-800 space-y-4 pt-4">
                        <div>
                          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Question</p>
                          <p className="text-white text-sm leading-relaxed">{pair.question?.content}</p>
                        </div>

                        {pair.answer && (
                          <div>
                            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Your Answer</p>
                            <div className="text-sm leading-relaxed px-4 py-2.5 rounded-r-lg" style={{ background: 'rgba(59,130,246,0.05)', borderLeft: '3px solid #3B82F6', color: '#9CA3AF' }}>
                              {pair.answer.content}
                            </div>
                          </div>
                        )}

                        {correctAnswer && (
                          <ProFeatureWrapper
                            userProfile={userProfile}
                            featureName="Correct Answer"
                            description="See the complete correct answer for every question you attempted"
                            compact={false}
                          >
                          <div>
                            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Correct Answer</p>
                            <div className="text-sm leading-relaxed px-4 py-2.5 rounded-r-lg" style={{ background: 'rgba(37,99,235,0.05)', borderLeft: '3px solid #2563EB', color: '#BFDBFE' }}>
                              {correctAnswer}
                            </div>
                          </div>
                          </ProFeatureWrapper>
                        )}

                        {tip && (
                          <ProFeatureWrapper
                            userProfile={userProfile}
                            featureName="Improvement Tips"
                            description="Get specific actionable tips to improve each answer"
                            compact={true}
                          >
                          <div>
                            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Tip for Next Time</p>
                            <p className="text-sm italic flex items-start gap-2" style={{ color: '#F59E0B' }}>
                              <Lightbulb size={14} className="shrink-0 mt-0.5" />{tip}
                            </p>
                          </div>
                          </ProFeatureWrapper>
                        )}

                        {fb && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                              <p className="text-xs text-green-400 mb-1 flex items-center gap-1"><CheckCircle size={12} /> Good</p>
                              <p className="text-gray-300 text-xs leading-relaxed">{fb.good}</p>
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                              <p className="text-xs text-amber-400 mb-1 flex items-center gap-1"><XCircle size={12} /> Missing</p>
                              <p className="text-gray-300 text-xs leading-relaxed">{fb.missing}</p>
                            </div>
                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                              <p className="text-xs text-amber-400 mb-1 flex items-center gap-1"><Lightbulb size={12} /> Ideal</p>
                              <p className="text-gray-300 text-xs leading-relaxed">{fb.ideal}</p>
                            </div>
                          </div>
                        )}
                        {fb?.star_breakdown && <StarBreakdown breakdown={fb.star_breakdown} />}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Preparation Roadmap */}
        <ProFeatureWrapper
          userProfile={userProfile}
          featureName="Study Resources"
          description="Get direct links to official sources to study your weak areas"
          compact={false}
        >
          <PreparationRoadmap pairs={pairs} overallScore={session.total_score} />
        </ProFeatureWrapper>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/interview/setup" className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm transition-colors">
            <PlayCircle size={16} /> Start Another Interview
          </Link>
          <Link to="/progress" className="flex-1 flex items-center justify-center gap-2 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 py-3 rounded-lg text-sm transition-colors">
            View All Progress
          </Link>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=https://interviewiq.in&summary=${linkedInText}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 px-5 py-3 rounded-lg text-sm transition-colors"
          >
            <ShareNetwork size={14} /> Share
          </a>
        </div>

        {/* Upgrade banner — free users only */}
        {userProfile?.plan !== 'pro' && (
          <div style={{ background: '#111827', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 16, padding: 24, marginTop: 8, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#F9FAFB', margin: '0 0 8px' }}>
              Unlock your full report
            </p>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 20px', lineHeight: 1.6 }}>
              You are seeing a limited version. Pro users get correct answers,
              improvement tips, career tracking, and unlimited practice sessions.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
              {['Correct Answers', 'Improvement Tips', 'Career Analysis', 'Unlimited Sessions', 'Study Resources'].map(f => (
                <span key={f} style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563EB', fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>
                  ✓ {f}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate('/upgrade')}
              style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'block', width: '100%', maxWidth: 320, margin: '0 auto' }}
              onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
              onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
            >
              Upgrade to Pro — ₹199/month
            </button>
            <p style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>Cancel anytime · UPI accepted</p>
          </div>
        )}

      </div>
    </AppLayout>
  )
}
