import { useEffect, useRef, useState } from 'react'
import { Mic, Square } from 'lucide-react'

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

const VOICE_LABELS: Record<string, { start: string; stop: string; listening: string }> = {
  en: { start: 'Speak', stop: 'Stop', listening: 'Listening…' },
  hi: { start: 'बोलें', stop: 'रोकें', listening: 'सुन रहा है…' },
  bn: { start: 'বলুন', stop: 'থামুন', listening: 'শুনছি…' },
  te: { start: 'మాట్లాడండి', stop: 'ఆపండి', listening: 'వింటోంది…' },
  mr: { start: 'बोला', stop: 'थांबवा', listening: 'ऐकत आहे…' },
  ta: { start: 'பேசுங்கள்', stop: 'நிறுத்து', listening: 'கேட்கிறது…' },
  ur: { start: 'بولیں', stop: 'روکیں', listening: 'سن رہا ہے…' },
  gu: { start: 'બોલો', stop: 'રોકો', listening: 'સાંભળી રહ્યું છે…' },
  kn: { start: 'ಮಾತನಾಡಿ', stop: 'ನಿಲ್ಲಿಸಿ', listening: 'ಕೇಳುತ್ತಿದೆ…' },
  ml: { start: 'സംസാരിക്കുക', stop: 'നിർത്തുക', listening: 'കേൾക്കുന്നു…' },
  pa: { start: 'ਬੋਲੋ', stop: 'ਰੋਕੋ', listening: 'ਸੁਣ ਰਿਹਾ ਹੈ…' },
  or: { start: 'କୁହନ୍ତୁ', stop: 'ବନ୍ଦ କରନ୍ତୁ', listening: 'ଶୁଣୁଛି…' },
}

export function VoiceInput({ onTranscript, onSessionStart, onSessionEnd, disabled = false, language = 'en-IN' }: Props) {
  const recognitionRef = useRef<Recognition | null>(null)
  const transcriptRef = useRef(onTranscript)
  const onSessionStartRef = useRef(onSessionStart)
  const onSessionEndRef = useRef(onSessionEnd)
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)

  useEffect(() => { transcriptRef.current = onTranscript }, [onTranscript])
  useEffect(() => { onSessionStartRef.current = onSessionStart }, [onSessionStart])
  useEffect(() => { onSessionEndRef.current = onSessionEnd }, [onSessionEnd])

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

  const labels = VOICE_LABELS[language.split('-')[0]] ?? VOICE_LABELS.en

  return (
    <button
      type="button"
      onClick={listening ? stopListening : startListening}
      disabled={disabled}
      aria-label={listening ? labels.stop : labels.start}
      className={`
        group relative inline-flex min-w-[104px] items-center justify-center gap-2 overflow-hidden rounded-full px-4 py-2 text-xs font-semibold
        transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40
        ${listening
          ? 'bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-[0_0_0_4px_rgba(244,63,94,0.15),0_8px_20px_-6px_rgba(244,63,94,0.6)]'
          : 'bg-gradient-to-r from-accent to-indigo-500 text-white shadow-[0_4px_14px_-4px_rgba(99,102,241,0.5)] hover:shadow-[0_6px_20px_-4px_rgba(99,102,241,0.7)] hover:-translate-y-0.5 hover:scale-[1.03] active:scale-95'
        }
      `}
    >
      {/* animated ring while listening */}
      {listening && (
        <span className="absolute inset-0 rounded-full">
          <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/50" />
        </span>
      )}

      {/* subtle sheen sweep on hover (idle state) */}
      {!listening && (
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
      )}

      <span className="relative flex items-center justify-center gap-2 whitespace-nowrap">
        {listening ? (
          <>
            <Square className="h-3.5 w-3.5 fill-current" />
            <span className="flex items-center gap-1">
              {labels.listening}
              <span className="flex gap-0.5">
                <span className="h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-white" />
              </span>
            </span>
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            {labels.start}
          </>
        )}
      </span>
    </button>
  )
}