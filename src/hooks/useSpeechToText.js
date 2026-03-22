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

    // Explicitly request mic permission first — this triggers Chrome's native popup
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately — we only needed it to get permission
      stream.getTracks().forEach(t => t.stop())
      setError(null)
    } catch (permErr) {
      if (permErr.name === 'NotAllowedError' || permErr.name === 'PermissionDeniedError') {
        setError('Microphone blocked. Click the 🔒 icon in your browser address bar → Site settings → Allow Microphone, then try again.')
      } else {
        setError('Could not access microphone. Please check your device settings.')
      }
      return
    }

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
      setIsListening(false)
      if (event.error === 'not-allowed') {
        setError('Microphone blocked. Click the 🔒 icon in your address bar → Allow Microphone.')
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else {
        setError('Speech recognition error. Please try again.')
      }
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    try {
      recognitionRef.current.start()
    } catch {
      setError('Could not start microphone.')
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
