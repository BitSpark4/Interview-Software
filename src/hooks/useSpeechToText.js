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
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false)
      setError('Speech recognition not supported in this browser. Use Chrome or Edge.')
      return
    }

    // Check mic permission state without requesting it
    // If already denied → tell user how to fix in settings
    // If granted or prompt → proceed (SpeechRecognition handles its own popup)
    try {
      const permission = await navigator.permissions.query({ name: 'microphone' })
      if (permission.state === 'denied') {
        setError('Microphone is blocked. Click the 🔒 icon in your address bar → Site settings → Microphone → Allow.')
        return
      }
    } catch {
      // permissions API not supported in this browser — just proceed
    }

    setError(null)

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()

    recognitionRef.current.continuous      = true
    recognitionRef.current.interimResults  = true
    recognitionRef.current.lang            = lang
    recognitionRef.current.maxAlternatives = 1

    let finalTranscript = ''

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      setError(null)
      finalTranscript = ''
    }

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += t + ' '
        } else {
          interimTranscript += t
        }
      }
      const fullText = finalTranscript + interimTranscript
      setTranscript(fullText)
      if (onTranscript) onTranscript(fullText)
    }

    recognitionRef.current.onerror = (event) => {
      console.error('SpeechRecognition error:', event.error)
      setIsListening(false)
      if (event.error === 'not-allowed') {
        setError('Microphone is blocked. Click the 🔒 icon in your address bar → Site settings → Microphone → Allow.')
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else if (event.error === 'network') {
        setError('Network error. Check your internet connection and try again.')
      } else if (event.error === 'aborted') {
        // User stopped it — not an error
        setError(null)
      } else {
        setError(`Error: ${event.error}. Please try again.`)
      }
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    try {
      recognitionRef.current.start()
    } catch (err) {
      console.error('SpeechRecognition start error:', err)
      setError('Could not start microphone. Please refresh the page and try again.')
      setIsListening(false)
    }
  }, [])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return { isListening, transcript, error, isSupported, startListening, stopListening, resetTranscript }
}

export default useSpeechToText
