import type { UIMessage } from '@tanstack/ai-client'
import type { clientToolset } from './client-tools'

export type AppTools = typeof clientToolset
export type AppMessage = UIMessage<AppTools>

export interface ProgressEvent {
  eventType: string
  toolCallId?: string
  receivedAt: string
  data: unknown
}

export interface TerminalSnapshot {
  id: string
  command: string
  cwd: string
  status: 'running' | 'exited'
  startedAt: string
  finishedAt?: string
  exitCode?: number | null
  recentOutput: string[]
}
