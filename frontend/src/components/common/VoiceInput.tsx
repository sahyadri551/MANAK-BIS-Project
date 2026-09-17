import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'
import { useI18n } from '../../i18n'

type Props = {
  onTranscript: (text: string) => void
  onSessionStart?: () => void
  onSessionEnd?: () => void
  disabled?: boolean
  language?: string
}

type Recognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
  onresult: ((event: any) => void) | null
}

type RecognitionConstructor = new () => Recognition

type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor
  webkitSpeechRecognition?: RecognitionConstructor
}

export function VoiceInput({ onTranscript, onSessionStart, onSessionEnd, disabled = false, language = 'en-IN' }: Props) {
  const { t } = useI18n()
  const recognitionRef = useRef<Recognition | null>(null)
  const transcriptRef = useRef(onTranscript)
  const onSessionStartRef = useRef(onSessionStart)
  const onSessionEndRef = useRef(onSessionEnd)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    transcriptRef.current = onTranscript
  }, [onTranscript])

  useEffect(() => {
    onSessionStartRef.current = onSessionStart
  }, [onSessionStart])

  useEffect(() => {
    onSessionEndRef.current = onSessionEnd
  }, [onSessionEnd])

  useEffect(() => {
    const speechWindow = window as SpeechWindow
    const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setListening(true)
      onSessionStartRef.current?.()
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim()
      if (transcript) transcriptRef.current(transcript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      onSessionEndRef.current?.()
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
      recognitionRef.current = null
    }
  }, [language])

  function startListening() {
    if (!recognitionRef.current || disabled || listening) return
    try {
      recognitionRef.current.start()
    } catch (error) {
      console.error('Speech recognition start error:', error)
    }
  }

  function stopListening() {
    recognitionRef.current?.stop()
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      aria-label={listening ? t('voice.stop') : t('voice.start')}
      className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-surface-2/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-accent/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {listening ? (
        <>
          <Square className="h-3.5 w-3.5" />
          {t('voice.listening')}
        </>
      ) : (
        <>
          <Mic className="h-3.5 w-3.5" />
          {t('voice.startShort')}
        </>
      )}
    </button>
  )
}
