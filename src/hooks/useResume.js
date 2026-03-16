import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { parsePdf } from '../utils/pdfParser'
import { analyzeResume, analyzeResumeATS } from '../lib/claudeApi'
import { useAuth } from './useAuth'

export function useResume(userPlan) {
  const { refreshProfile } = useAuth()
  const [resumeText, setResumeText]     = useState('')
  const [resumeFile, setResumeFile]     = useState(null)
  const [uploading, setUploading]       = useState(false)
  const [uploadDone, setUploadDone]     = useState(false)
  const [error, setError]               = useState('')
  const [savedResume, setSavedResume]   = useState(null) // { filename, text, uploadedAt } or null
  const [loadingProfile, setLoadingProfile] = useState(true)

  // Load saved resume from DB on mount
  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from('users')
          .select('resume_text, resume_filename, resume_uploaded_at')
          .eq('id', user.id)
          .single()

        if (data?.resume_text) {
          setSavedResume({
            text:       data.resume_text,
            filename:   data.resume_filename || 'resume.pdf',
            uploadedAt: data.resume_uploaded_at,
          })
          setResumeText(data.resume_text)
          setUploadDone(true)
        }
      } catch { /* not signed in yet — ignore */ }
      finally { setLoadingProfile(false) }
    }
    load()
  }, [])

  async function processResume(file) {
    setError('')
    setUploading(true)
    setUploadDone(false)
    setResumeFile(file)

    try {
      // 1 — extract text in browser
      const text = await parsePdf(file)

      // 2 — upload PDF to Supabase Storage (overwrite if exists)
      const { data: { user } } = await supabase.auth.getUser()
      const filePath = `${user.id}/resume.pdf`

      const { error: uploadErr } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true, contentType: 'application/pdf' })

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)

      // 3 — save to users table
      const now = new Date().toISOString()
      await supabase.from('users').update({
        resume_url:          filePath,
        resume_text:         text.slice(0, 5000),
        resume_filename:     file.name,
        resume_uploaded_at:  now,
      }).eq('id', user.id)

      const saved = { text, filename: file.name, uploadedAt: now }
      setResumeText(text)
      setSavedResume(saved)
      setUploadDone(true)

      // 4 — skill analysis in background (fire-and-forget)
      analyzeResume(text).then(async skills => {
        if (skills) {
          await supabase.from('users').update({ skills }).eq('id', user.id)
          refreshProfile?.()
        }
      }).catch(() => {})

      // 5 — ATS analysis for Pro users only (fire-and-forget)
      if (userPlan === 'pro') {
        analyzeResumeATS(text).then(async ats => {
          if (ats) {
            await supabase.from('users').update({
              ats_score:       ats.score,
              ats_feedback:    ats,
              ats_analyzed_at: new Date().toISOString(),
            }).eq('id', user.id)
            refreshProfile?.()
          }
        }).catch(() => {})
      }

      return text
    } catch (err) {
      setError(err.message || 'Failed to process resume. Please try again.')
      setResumeText('')
      setResumeFile(null)
      throw err
    } finally {
      setUploading(false)
    }
  }

  // Clear local state only — does NOT delete from DB
  function clearResume() {
    setResumeText('')
    setResumeFile(null)
    setUploadDone(false)
    setSavedResume(null)
    setError('')
  }

  return {
    resumeText, resumeFile, uploading, uploadDone, error,
    savedResume, loadingProfile,
    processResume, clearResume,
  }
}
