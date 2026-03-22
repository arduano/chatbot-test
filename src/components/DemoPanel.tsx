import { useEffect, useMemo, useState } from 'react'
import { fetchServerSentEvents } from '@tanstack/ai-client'
import { useChat } from '@tanstack/ai-react'
import { clientToolset } from '../client-tools'
import type { DemoDefinition } from '../demo-data'
import type { ProgressEvent, TerminalSnapshot } from '../types'
import { MessageView } from './MessageView'

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
    <div className="demo-grid">
      <div className="chat-card">
        <div className="card-header">
          <div>
            <h3>{demo.title}</h3>
            <p>{demo.summary}</p>
          </div>
          <div className="status-block">
            <span className={`status-dot ${chat.isLoading ? 'busy' : 'idle'}`} />
            <span>{chat.isLoading ? 'Streaming' : 'Ready'}</span>
          </div>
        </div>

        <div className="message-list">
          {chat.messages.length === 0 ? (
            <div className="empty-state">
              <p>Try one of the prompt starters or type your own.</p>
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

        <div className="composer">
          <div className="suggestion-row">
            {demo.suggestions.map((suggestion) => (
              <button
                className="suggestion"
                key={suggestion}
                onClick={() => setDraft(suggestion)}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>

          <textarea
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

          <div className="composer-actions">
            <button onClick={() => chat.clear()} type="button">
              Clear
            </button>
            <button onClick={() => chat.stop()} type="button">
              Stop
            </button>
            <button className="primary" onClick={() => void handleSubmit()} type="button">
              Send
            </button>
          </div>
        </div>
      </div>

      <aside className="inspector-column">
        <div className="inspector-card">
          <h3>Progress Events</h3>
          {events.length === 0 ? (
            <p className="muted">No custom tool events yet.</p>
          ) : (
            <div className="event-list">
              {events.map((event, index) => (
                <article className="event-item" key={`${event.receivedAt}-${index}`}>
                  <strong>{event.eventType}</strong>
                  <span>{event.toolCallId ?? 'no tool id'}</span>
                  <pre>{JSON.stringify(event.data, null, 2)}</pre>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="inspector-card">
          <h3>Background Terminals</h3>
          {terminalSnapshots.length === 0 ? (
            <p className="muted">No background terminal sessions.</p>
          ) : (
            <div className="terminal-list">
              {terminalSnapshots.map((terminal) => (
                <article className="terminal-item" key={terminal.id}>
                  <div className="terminal-title">
                    <strong>{terminal.id}</strong>
                    <span>{terminal.status}</span>
                  </div>
                  <code>{terminal.command}</code>
                  <small>{terminal.cwd}</small>
                  <pre>{terminal.recentOutput.join('\n') || '(no output yet)'}</pre>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
