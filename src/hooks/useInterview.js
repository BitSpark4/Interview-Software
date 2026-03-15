import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { startInterview, evaluateAnswer, generateReport } from '../lib/claudeApi'

export function useInterview() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [questionNumber, setQuestionNumber] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [sessionData, setSessionData] = useState(null)
  const [claudeHistory, setClaudeHistory] = useState([])
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamError, setStreamError] = useState('')

  // ── streamFirstQuestion — fire-and-forget, streams Q1 into UI ──
  async function streamFirstQuestion(sessionId, config) {
    setIsStreaming(true)
    setStreamingText('')
    setStreamError('')

    try {
      const response = await startInterview({
        role: config.role,
        interviewType: config.interviewType,
        companyFocus: config.companyFocus,
        resumeText: config.resumeText,
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              fullText += parsed.delta.text
              setStreamingText(fullText)
            }
          } catch { /* skip malformed SSE line */ }
        }
      }

      if (!fullText.trim()) throw new Error('Empty response from AI. Please try again.')

      // Save to DB
      await supabase.from('messages').insert({
        session_id: sessionId,
        question_num: 1,
        sender: 'ai',
        content: fullText,
        is_question: true,
      })

      const initHistory = [
        { role: 'user', content: 'Begin the interview.' },
        { role: 'assistant', content: fullText },
      ]
      sessionStorage.setItem(`ch_${sessionId}`, JSON.stringify(initHistory))
      setClaudeHistory(initHistory)
      setMessages([{
        id: Date.now(),
        session_id: sessionId,
        question_num: 1,
        sender: 'ai',
        content: fullText,
        is_question: true,
      }])
      setQuestionNumber(1)
    } catch (err) {
      setStreamError(err.message || 'Failed to load first question. Please refresh.')
    } finally {
      setIsStreaming(false)
      setStreamingText('')
    }
  }

  // ── createSession ────────────────────────────────────────────
  // Only creates the DB row — Claude call happens in loadSession
  async function createSession(role, interviewType, companyFocus, resumeText) {
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) throw new Error('Not signed in. Please log in and try again.')

    // ── Free plan gate (enforced here, not just in UI) ───────────
    const { data: profile } = await supabase
      .from('users')
      .select('plan, interviews_used')
      .eq('id', user.id)
      .single()

    if (profile && profile.plan !== 'pro' && (profile.interviews_used || 0) >= 3) {
      throw new Error('You have used all 3 free interviews this month. Upgrade to Pro for unlimited access.')
    }
    // ─────────────────────────────────────────────────────────────

    const config = { role, interviewType, companyFocus, resumeText: resumeText || '' }

    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        role,
        interview_type: interviewType,
        company_focus: companyFocus,
        resume_used: !!resumeText,
      })
      .select()
      .single()
    if (error) throw new Error(`Could not create session: ${error.message}`)

    // Store config so loadSession can call Claude on first load
    sessionStorage.setItem(`sd_${session.id}`, JSON.stringify(config))

    return session.id
  }

  // ── loadSession ──────────────────────────────────────────────
  async function loadSession(id) {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw new Error('Session not found.')

    let { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at', { ascending: true })

    const storedData = sessionStorage.getItem(`sd_${id}`)
    const config = storedData
      ? JSON.parse(storedData)
      : { role: session.role, interviewType: session.interview_type, companyFocus: session.company_focus, resumeText: '' }

    setSessionId(id)
    setIsComplete(session.completed)
    setSessionData(config)

    // ── First load: no messages yet — stream Q1 async ────────
    if (!msgs || msgs.length === 0) {
      streamFirstQuestion(id, config) // fire-and-forget; caller returns immediately
      return session
    }

    // ── Returning to existing session ─────────────────────────
    const aiByQ = {}
    ;(msgs || []).forEach(m => {
      if (m.sender === 'ai' && !m.is_question) aiByQ[m.question_num] = m
    })
    const display = (msgs || []).map(m =>
      m.sender === 'user' && aiByQ[m.question_num]
        ? { ...m, feedback: aiByQ[m.question_num].feedback }
        : m
    )
    setMessages(display)

    // Restore or reconstruct claudeHistory
    const storedHistory = sessionStorage.getItem(`ch_${id}`)
    if (storedHistory) {
      setClaudeHistory(JSON.parse(storedHistory))
    } else {
      const history = [{ role: 'user', content: 'Begin the interview.' }]
      ;(msgs || []).forEach(m => {
        if (m.sender === 'ai' && m.is_question) history.push({ role: 'assistant', content: m.content })
        else if (m.sender === 'user') history.push({ role: 'user', content: m.content })
      })
      setClaudeHistory(history)
    }

    // Determine current question number
    const answeredCount = (msgs || []).filter(m => m.sender === 'user').length
    const lastQ = (msgs || []).filter(m => m.is_question).pop()
    setQuestionNumber(answeredCount < 5 ? (lastQ?.question_num ?? 1) : 5)

    return session
  }

  // ── sendAnswer ───────────────────────────────────────────────
  async function sendAnswer(answerText) {
    if (!sessionId || !sessionData) throw new Error('No active session')
    const currentQ = questionNumber

    // 1. Optimistically show user message
    const tempId = Date.now()
    setMessages(prev => [...prev, { id: tempId, sender: 'user', content: answerText, question_num: currentQ }])

    // 2. Save user message to DB
    await supabase.from('messages').insert({
      session_id: sessionId,
      question_num: currentQ,
      sender: 'user',
      content: answerText,
    })

    // 3. Evaluate with Claude
    const feedback = await evaluateAnswer({
      conversationHistory: claudeHistory,
      userAnswer: answerText,
      questionNumber: currentQ,
      interviewType: sessionData.interviewType,
      role: sessionData.role,
      companyFocus: sessionData.companyFocus,
      resumeText: sessionData.resumeText,
    })

    // 4. Save AI feedback message to DB
    await supabase.from('messages').insert({
      session_id: sessionId,
      question_num: currentQ,
      sender: 'ai',
      content: feedback.good || '',
      score: feedback.score,
      feedback,
      is_question: false,
    })

    // Attach feedback to user message in display
    setMessages(prev => prev.map(m => m.id === tempId ? { ...m, feedback } : m))

    const newHistory = [
      ...claudeHistory,
      { role: 'user', content: answerText },
      { role: 'assistant', content: JSON.stringify(feedback) },
    ]

    if (currentQ < 5) {
      // 5a. Save next question
      const nextQuestion = feedback.next_question
      await supabase.from('messages').insert({
        session_id: sessionId,
        question_num: currentQ + 1,
        sender: 'ai',
        content: nextQuestion,
        is_question: true,
      })

      const finalHistory = [...newHistory, { role: 'assistant', content: nextQuestion }]
      setClaudeHistory(finalHistory)
      sessionStorage.setItem(`ch_${sessionId}`, JSON.stringify(finalHistory))

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        content: nextQuestion,
        is_question: true,
        question_num: currentQ + 1,
      }])
      setQuestionNumber(currentQ + 1)
      return { isComplete: false }
    } else {
      // 5b. Final — generate report
      setClaudeHistory(newHistory)
      const report = await generateReport({
        conversationHistory: newHistory,
        role: sessionData.role,
        interviewType: sessionData.interviewType,
      })

      // Update session
      await supabase.from('sessions').update({
        total_score: report.overallScore,
        verdict: report.verdict,
        strengths: report.strengths,
        improvements: report.improvements,
        top_advice: report.top_advice,
        completed: true,
        completed_at: new Date().toISOString(),
      }).eq('id', sessionId)

      // Update user stats + streak
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('users')
        .select('interviews_used, total_sessions, average_score, streak_count, last_session_date')
        .eq('id', user.id)
        .single()

      if (profile) {
        const newTotal = (profile.total_sessions || 0) + 1
        const prevAvg  = parseFloat(profile.average_score) || 0
        const newAvg   = prevAvg
          ? Math.round(((prevAvg * (newTotal - 1) + report.overallScore) / newTotal) * 100) / 100
          : report.overallScore

        // Streak: +1 if last session was yesterday, reset to 1 if gap > 1 day
        const today     = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 864e5).toISOString().split('T')[0]
        const lastDate  = profile.last_session_date
        const newStreak = lastDate === yesterday
          ? (profile.streak_count || 0) + 1
          : lastDate === today
          ? (profile.streak_count || 1)   // already practiced today, keep streak
          : 1                              // gap — restart streak

        await supabase.from('users').update({
          interviews_used: (profile.interviews_used || 0) + 1,
          total_sessions:  newTotal,
          average_score:   newAvg,
          streak_count:    newStreak,
          last_session_date: today,
        }).eq('id', user.id)
      }

      // Upsert weak areas — single query instead of N+1 loop
      if (report.weak_areas?.length) {
        await supabase.from('weak_areas').upsert(
          report.weak_areas.map(area => ({
            user_id: user.id,
            area,
            avg_score: report.overallScore,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: 'user_id,area', ignoreDuplicates: false }
        )
      }

      sessionStorage.removeItem(`ch_${sessionId}`)
      sessionStorage.removeItem(`sd_${sessionId}`)
      setIsComplete(true)
      return { isComplete: true }
    }
  }

  return { messages, loading, setLoading, questionNumber, isComplete, sessionId, sessionData, streamingText, isStreaming, streamError, createSession, sendAnswer, loadSession }
}
