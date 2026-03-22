import type { UIMessage } from '@tanstack/ai-client'
import type { AppTools } from '../types'

interface MessageViewProps {
  message: UIMessage<AppTools>
  addToolApprovalResponse: (response: { id: string; approved: boolean }) => Promise<void>
}

export function MessageView({ message, addToolApprovalResponse }: MessageViewProps) {
  return (
    <article className={`message message-${message.role}`}>
      <header>
        <span>{message.role}</span>
      </header>

      <div className="message-parts">
        {message.parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <p className="text-part" key={index}>
                {part.content}
              </p>
            )
          }

          if (part.type === 'thinking') {
            return (
              <pre className="thinking-part" key={index}>
                {part.content}
              </pre>
            )
          }

          if (part.type === 'tool-result') {
            return (
              <div className="tool-card" key={index}>
                <strong>Tool Result</strong>
                <span>{part.toolCallId}</span>
                <pre>{part.content}</pre>
              </div>
            )
          }

          if (part.type === 'tool-call') {
            return (
              <div className="tool-card" key={index}>
                <div className="tool-card-header">
                  <strong>{part.name}</strong>
                  <span>{part.state}</span>
                </div>
                <pre>{JSON.stringify(part.input ?? part.arguments, null, 2)}</pre>

                {'output' in part && part.output !== undefined ? (
                  <pre>{JSON.stringify(part.output, null, 2)}</pre>
                ) : null}

                {part.approval?.needsApproval && part.state === 'approval-requested' ? (
                  <div className="approval-actions">
                    <button
                      onClick={() =>
                        void addToolApprovalResponse({
                          id: part.approval!.id,
                          approved: false,
                        })
                      }
                      type="button"
                    >
                      Reject
                    </button>
                    <button
                      className="primary"
                      onClick={() =>
                        void addToolApprovalResponse({
                          id: part.approval!.id,
                          approved: true,
                        })
                      }
                      type="button"
                    >
                      Approve
                    </button>
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
