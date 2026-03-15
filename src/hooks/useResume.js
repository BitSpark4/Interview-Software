import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { parsePdf } from '../utils/pdfParser'

/**
 * Handles the full resume flow:
 *  1. Parse PDF → extract text in browser (pdfjs-dist)
 *  2. Upload PDF file to Supabase Storage (bucket: resumes)
 *  3. Save resume_url + resume_text to users table
 *
 * Returns resumeText for passing directly to Claude.
 */
export function useResume() {
  const [resumeText, setResumeText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [error, setError]           = useState('')

  async function processResume(file) {
    setError('')
    setUploading(true)
    setUploadDone(false)
    setResumeFile(file)

    try {
      // Step 1 — extract text in browser
      const text = await parsePdf(file)

      // Step 2 — upload PDF to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser()
      const fileName = `${user.id}/resume.pdf`   // overwrite on re-upload

      const { error: uploadErr } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, { upsert: true, contentType: 'application/pdf' })

      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      // Step 3 — persist to user profile (cap text at 5000 chars to stay within DB limits)
      await supabase
        .from('users')
        .update({ resume_url: publicUrl, resume_text: text.slice(0, 5000) })
        .eq('id', user.id)

      setResumeText(text)
      setUploadDone(true)
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

  function clearResume() {
    setResumeText('')
    setResumeFile(null)
    setUploadDone(false)
    setError('')
  }

  return { resumeText, resumeFile, uploading, uploadDone, error, processResume, clearResume }
}
