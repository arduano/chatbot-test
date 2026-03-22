import type { UIMessage } from '@tanstack/ai-client'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import type { AppTools } from '../types'
import { Bot, BrainCircuit, Hammer, UserRound } from 'lucide-react'

interface MessageViewProps {
  message: UIMessage<AppTools>
  addToolApprovalResponse: (response: { id: string; approved: boolean }) => Promise<void>
}

export function MessageView({ message, addToolApprovalResponse }: MessageViewProps) {
  const isAssistant = message.role === 'assistant'
  const isUser = message.role === 'user'

  return (
    <article
      className={[
        'rounded-2xl border p-4',
        isAssistant
          ? 'border-sky-200/80 bg-sky-50/70'
          : isUser
            ? 'border-amber-200/80 bg-amber-50/70'
            : 'border-stone-200 bg-stone-50/70',
      ].join(' ')}
    >
      <header className="mb-3 flex items-center gap-2">
        <div
          className={[
            'flex h-8 w-8 items-center justify-center rounded-full',
            isAssistant ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700',
          ].join(' ')}
        >
          {isAssistant ? <Bot className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
          {message.role}
        </span>
      </header>

      <div className="space-y-3">
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <p className="whitespace-pre-wrap text-sm leading-7 text-stone-800" key={index}>
                {part.content}
              </p>
            )
          }

          if (part.type === 'thinking') {
            return (
              <div className="rounded-xl border border-stone-200 bg-white/80 p-4" key={index}>
                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-stone-500">
                  <BrainCircuit className="h-3.5 w-3.5" />
                  Thinking
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6 text-stone-700">
                {part.content}
                </pre>
              </div>
            )
          }

          if (part.type === 'tool-result') {
            return (
              <div className="rounded-xl border border-stone-200 bg-white/90 p-4" key={index}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Badge variant="secondary">Tool Result</Badge>
                  <span className="font-mono text-[11px] text-stone-500">{part.toolCallId}</span>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-700">
                  {part.content}
                </pre>
              </div>
            )
          }

          if (part.type === 'tool-call') {
            return (
              <div className="rounded-xl border border-stone-200 bg-white/90 p-4" key={index}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                      <Hammer className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-stone-900">{part.name}</div>
                      <div className="font-mono text-[11px] text-stone-500">{part.id}</div>
                    </div>
                  </div>
                  <Badge variant="outline">{part.state}</Badge>
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-700">
                  {JSON.stringify(part.input ?? part.arguments, null, 2)}
                </pre>

                {'output' in part && part.output !== undefined ? (
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-xs leading-5 text-stone-700">
                    {JSON.stringify(part.output, null, 2)}
                  </pre>
                ) : null}

                {part.approval?.needsApproval && part.state === 'approval-requested' ? (
                  <div className="mt-3 flex gap-2">
                    <Button
                      onClick={() =>
                        void addToolApprovalResponse({
                          id: part.approval!.id,
                          approved: false,
                        })
                      }
                      type="button"
                      variant="outline"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() =>
                        void addToolApprovalResponse({
                          id: part.approval!.id,
                          approved: true,
                        })
                      }
                      type="button"
                    >
                      Approve
                    </Button>
                  </div>
                ) : null}
              </div>
            )
          }

          return null
        })}
      </div>
    </article>
  )
}
