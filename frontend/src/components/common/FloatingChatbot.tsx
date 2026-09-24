import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Loader2, MessageCircle, Send, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useI18n } from '../../i18n'
import { sendChatMessage } from '../../services/chatApi'
import type { ChatStandardRef, ChatTurn } from '../../types/chat'

interface DisplayMessage extends ChatTurn {
  id: string
  standards?: ChatStandardRef[]
  failed?: boolean
}

const WELCOME: DisplayMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! Ask me about any BIS standard — IS number, title, status, aspect, department, ministry, validity, or amendments. I only answer from the verified dataset.",
}

const MAX_HISTORY_SENT = 8

export function FloatingChatbot() {
  const { lang } = useI18n()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<DisplayMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [messages, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return

    const userMsg: DisplayMessage = { id: crypto.randomUUID(), role: 'user', content: text }
    const history: ChatTurn[] = [...messages, userMsg]
      .filter((m) => m.id !== 'welcome')
      .slice(-MAX_HISTORY_SENT)
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    try {
      const res = await sendChatMessage({ message: text, history, lang })
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: res.reply,
          standards: res.standards,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: "Sorry, I couldn't reach the server just now. Please try again.",
          failed: true,
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close chat' : 'Open standards Q&A chat'}
        className={cn(
          'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-accent text-white shadow-glow transition-transform hover:scale-105 hover:bg-accent-hover',
          'active:scale-95',
        )}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div
          className={cn(
            'fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col',
            'overflow-hidden rounded-2xl border border-hairline bg-surface shadow-panel animate-scale-in sm:w-96',
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-hairline bg-surface-2 px-4 py-3">
            <Bot className="h-5 w-5 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-100">Standards Assistant</p>
              <p className="truncate text-xs text-slate-500">Grounded in the BIS dataset</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-surface hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m) => (
              <ChatBubble key={m.id} message={m} />
            ))}
            {sending && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                Checking the dataset…
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-hairline bg-surface-2 p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about an IS number, title, dept…"
                className={cn(
                  'max-h-24 flex-1 resize-none rounded-xl border border-hairline bg-surface px-3 py-2',
                  'text-sm text-slate-200 placeholder:text-slate-500 focus:border-accent focus:outline-none',
                )}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                aria-label="Send message"
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white',
                  'transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ChatBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'rounded-br-sm bg-accent text-white'
            : message.failed
              ? 'rounded-bl-sm border border-red-500/30 bg-red-500/10 text-red-300'
              : 'rounded-bl-sm border border-hairline bg-surface-2 text-slate-200',
        )}
      >
        {message.content}
      </div>
      {!!message.standards?.length && (
        <div className="mt-1.5 flex max-w-[85%] flex-wrap gap-1.5">
          {message.standards.map((s) => (
            <Link
              key={s.id}
              to={`/standards/${s.id}`}
              className="rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-accent hover:text-accent"
              title={s.title}
            >
              {s.is_number}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
