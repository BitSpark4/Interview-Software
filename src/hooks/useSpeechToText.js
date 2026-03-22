// Speech recognition only works on:
//   https:// domains (production)
//   localhost / 127.0.0.1 (local dev via netlify dev)
//   NOT on 192.168.x.x local network IP
// If testing locally always use: netlify dev (not npm run dev with network IP)

import { useState, useRef, useCallback } from 'react'

const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript]   = useState('')
  const [error, setError]             = useState(null)
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )

  const recognitionRef = useRef(null)

  const startListening = useCallback(async (onTranscript, lang = 'en-IN') => {

    // FIX 1 — Reject non-secure contexts (192.168.x.x, plain HTTP)
    const isSecureContext =
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (!isSecureContext) {
      setError('Microphone requires HTTPS. Voice input works on getinterviewiq.in or via netlify dev on localhost.')
      return
    }

    // FIX 2 — Request mic permission explicitly via getUserMedia first
    // This reliably triggers Chrome's permission popup before starting recognition
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone blocked. Click the lock icon in address bar → Site settings → Microphone → Allow → Refresh page.')
        return
      }
      if (err.name === 'NotFoundError') {
        setError('No microphone found on this device.')
        return
      }
      setError('Could not access microphone. Please check your device settings.')
      return
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
      setError('Use Chrome or Edge for voice input.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    recognitionRef.current.continuous     = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang           = lang || localStorage.getItem('interviewiq-speech-lang') || 'en-IN'
    recognitionRef.current.maxAlternatives = 1

    let finalTranscript = ''

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      setError(null)
      finalTranscript = ''
    }

    recognitionRef.current.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t + ' '
        } else {
          interim += t
        }
      }
      const full = finalTranscript + interim
      setTranscript(full)
      if (onTranscript) onTranscript(full)
    }

    recognitionRef.current.onerror = (e) => {
      console.error('SpeechRecognition error:', e.error)
      setIsListening(false)
      if (e.error === 'not-allowed') {
        setError('Permission denied. Click the lock icon in address bar → Microphone → Allow → Refresh.')
      } else if (e.error === 'no-speech') {
        setError('No speech heard. Please speak clearly.')
      } else if (e.error === 'audio-capture') {
        setError('Microphone not accessible. Check browser settings.')
      } else if (e.error === 'network') {
        setError('Network error. Check your internet connection and try again.')
      } else if (e.error === 'aborted') {
        setError(null)
      } else {
        setError(`Error: ${e.error}. Please try again.`)
      }
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error('SpeechRecognition start failed:', err)
      setError('Could not start microphone. Please refresh the page and try again.')
      setIsListening(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop()
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return { isListening, transcript, error, isSupported, startListening, stopListening, resetTranscript }
}

export default useSpeechToText
