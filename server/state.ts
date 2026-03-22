import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'

export interface TerminalSession {
  id: string
  command: string
  cwd: string
  status: 'running' | 'exited'
  startedAt: string
  finishedAt?: string
  exitCode?: number | null
  output: string[]
  process: ChildProcessWithoutNullStreams
}

const terminalSessions = new Map<string, TerminalSession>()

function pushLine(session: TerminalSession, chunk: string) {
  const lines = chunk
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)

  if (lines.length === 0) {
    return
  }

  session.output.push(...lines)
  if (session.output.length > 200) {
    session.output.splice(0, session.output.length - 200)
  }
}

export function createTerminalSession(command: string, cwd: string) {
  const id = `term_${Math.random().toString(36).slice(2, 8)}`
  const child = spawn('bash', ['-lc', command], {
    cwd,
    env: process.env,
    stdio: 'pipe',
  })

  const session: TerminalSession = {
    id,
    command,
    cwd,
    status: 'running',
    startedAt: new Date().toISOString(),
    output: [],
    process: child,
  }

  child.stdout.on('data', (data: Buffer) => pushLine(session, data.toString()))
  child.stderr.on('data', (data: Buffer) => pushLine(session, data.toString()))
  child.on('close', (code) => {
    session.status = 'exited'
    session.finishedAt = new Date().toISOString()
    session.exitCode = code
  })

  terminalSessions.set(id, session)

  return {
    id: session.id,
    command: session.command,
    cwd: session.cwd,
    status: session.status,
    startedAt: session.startedAt,
  }
}

export function readTerminalSession(id: string, tailLines = 20) {
  const session = terminalSessions.get(id)
  if (!session) {
    return null
  }

  return {
    id: session.id,
    command: session.command,
    cwd: session.cwd,
    status: session.status,
    startedAt: session.startedAt,
    finishedAt: session.finishedAt,
    exitCode: session.exitCode,
    recentOutput: session.output.slice(-tailLines),
  }
}

export function listTerminalSessions() {
  return Array.from(terminalSessions.values())
    .map((session) => readTerminalSession(session.id, 12)!)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}
