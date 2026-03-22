import { useEffect, useMemo, useState } from 'react'
import { fetchServerSentEvents } from '@tanstack/ai-client'
import { useChat } from '@tanstack/ai-react'
import { Activity, LoaderCircle, PanelRightOpen, TerminalSquare, WandSparkles } from 'lucide-react'
import { clientToolset } from '../client-tools'
import type { DemoDefinition } from '../demo-data'
import type { ProgressEvent, TerminalSnapshot } from '../types'
import { MessageView } from './MessageView'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'

interface DemoPanelProps {
  demo: DemoDefinition
}

function createSessionId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function DemoPanel({ demo }: DemoPanelProps) {
  const [draft, setDraft] = useState('')
  const [events, setEvents] = useState<ProgressEvent[]>([])
  const [terminalSnapshots, setTerminalSnapshots] = useState<TerminalSnapshot[]>([])
  const [sessionId] = useState(() => createSessionId(demo.id))

  const connection = useMemo(
    () =>
      fetchServerSentEvents(`/api/chat/${demo.id}`, {
        body: {
          sessionId,
        },
      }),
    [demo.id, sessionId],
  )

  const chat = useChat({
    connection,
    tools: clientToolset,
    onCustomEvent(eventType, data, context) {
      setEvents((current) =>
        [
          {
            eventType,
            data,
            toolCallId: context.toolCallId,
            receivedAt: new Date().toISOString(),
          },
          ...current,
        ].slice(0, 20),
      )
    },
  })

  useEffect(() => {
    if (demo.id !== 'agent-state' && demo.id !== 'workspace-agent') {
      return
    }

    let active = true

    async function loadTerminals() {
      const response = await fetch('/api/state/terminals')
      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as { terminals: TerminalSnapshot[] }
      if (active) {
        setTerminalSnapshots(payload.terminals)
      }
    }

    void loadTerminals()
    const timer = window.setInterval(() => {
      void loadTerminals()
    }, 1500)

    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [demo.id])

  async function handleSubmit() {
    const value = draft.trim()
    if (!value || chat.isLoading) {
      return
    }

    setDraft('')
    await chat.sendMessage(value)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
      <Card className="border-stone-200/80 bg-white/75">
        <CardHeader className="border-b border-stone-200/80 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle>{demo.title}</CardTitle>
              <CardDescription>{demo.summary}</CardDescription>
            </div>
            <Badge variant={chat.isLoading ? 'warning' : 'success'}>
              {chat.isLoading ? (
                <LoaderCircle className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="mr-1 h-3.5 w-3.5" />
              )}
              {chat.isLoading ? 'Streaming response' : 'Ready for input'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="max-h-[58vh] min-h-[420px] space-y-3 overflow-auto pr-1">
          {chat.messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50/80 px-6 py-12 text-center">
              <p className="text-sm text-stone-600">
                Try one of the prompt starters or type your own.
              </p>
            </div>
          ) : null}

          {chat.messages.map((message) => (
            <MessageView
              addToolApprovalResponse={chat.addToolApprovalResponse}
              key={message.id}
              message={message}
            />
          ))}
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
            {demo.suggestions.map((suggestion) => (
              <Button
                className="h-auto rounded-full px-3 py-2 text-left text-xs leading-5"
                key={suggestion}
                onClick={() => setDraft(suggestion)}
                type="button"
                variant="outline"
              >
                {suggestion}
              </Button>
            ))}
            </div>

            <Textarea
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  void handleSubmit()
                }
              }}
              placeholder="Send a prompt. Cmd/Ctrl+Enter to submit."
              rows={4}
              value={draft}
            />

            <div className="flex flex-col gap-3 border-t border-stone-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-stone-500">
                Session: <span className="font-mono text-stone-700">{sessionId}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => chat.clear()} type="button" variant="ghost">
              Clear
                </Button>
                <Button onClick={() => chat.stop()} type="button" variant="outline">
              Stop
                </Button>
                <Button onClick={() => void handleSubmit()} type="button">
              Send
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <aside className="space-y-5">
        <Card className="border-stone-200/80 bg-white/75">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <WandSparkles className="h-4 w-4 text-stone-500" />
              <CardTitle className="text-lg">Progress Events</CardTitle>
            </div>
            <CardDescription>Live custom events emitted by server-side tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
          {events.length === 0 ? (
            <p className="text-sm text-stone-500">No custom tool events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <article
                  className="rounded-xl border border-stone-200 bg-stone-50/70 p-4"
                  key={`${event.receivedAt}-${index}`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge variant="outline">{event.eventType}</Badge>
                    <span className="truncate font-mono text-[11px] text-stone-500">
                      {event.toolCallId ?? 'no tool id'}
                    </span>
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs leading-5 text-stone-700">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </article>
              ))}
            </div>
          )}
          </CardContent>
        </Card>

        <Card className="border-stone-200/80 bg-white/75">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TerminalSquare className="h-4 w-4 text-stone-500" />
              <CardTitle className="text-lg">Background Terminals</CardTitle>
            </div>
            <CardDescription>Stateful sessions owned by the agent-side tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
          {terminalSnapshots.length === 0 ? (
            <p className="text-sm text-stone-500">No background terminal sessions.</p>
          ) : (
            <div className="space-y-3">
              {terminalSnapshots.map((terminal) => (
                <article className="rounded-xl border border-stone-200 bg-stone-50/70 p-4" key={terminal.id}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs font-semibold text-stone-800">{terminal.id}</span>
                    <Badge variant={terminal.status === 'running' ? 'warning' : 'success'}>
                      {terminal.status}
                    </Badge>
                  </div>
                  <div className="mb-1 flex items-center gap-2 text-xs text-stone-500">
                    <PanelRightOpen className="h-3.5 w-3.5" />
                    <code className="truncate">{terminal.command}</code>
                  </div>
                  <div className="mb-3 truncate font-mono text-[11px] text-stone-500">
                    {terminal.cwd || '(default cwd)'}
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-white p-3 text-xs leading-5 text-stone-700">
                    {terminal.recentOutput.join('\n') || '(no output yet)'}
                  </pre>
                </article>
              ))}
            </div>
          )}
          </CardContent>
        </Card>
      </aside>
    </div>
  )
}
