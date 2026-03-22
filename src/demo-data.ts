export type DemoId =
  | 'streaming'
  | 'server-tools'
  | 'client-tools'
  | 'progress-tools'
  | 'agent-state'
  | 'workspace-agent'

export interface DemoDefinition {
  id: DemoId
  title: string
  summary: string
  bullets: string[]
  suggestions: string[]
}

export const demos: DemoDefinition[] = [
  {
    id: 'streaming',
    title: 'Clean Token Streaming',
    summary: 'Baseline streaming chat with no tool calls so you can inspect raw token flow.',
    bullets: [
      'Immediate token-by-token rendering over SSE',
      'Short, low-cost responses by default',
      'Good control case before comparing tool-heavy demos',
    ],
    suggestions: [
      'Give me a six-line product pitch for TanStack AI.',
      'Write a haiku about streaming UIs.',
      'Explain why SSE feels responsive in two sentences.',
    ],
  },
  {
    id: 'server-tools',
    title: 'Server-Side Tools',
    summary: 'Assistant can call async server functions that simulate catalog search, pricing, and scheduling.',
    bullets: [
      'Model decides when to call tools',
      'Tool inputs and outputs are typed',
      'Useful for any server-only integration pattern',
    ],
    suggestions: [
      'Find a setup for a documentation chatbot under $1,500.',
      'Compare two laptop profiles for a dev workstation.',
      'Plan a three-step rollout using the server tools.',
    ],
  },
  {
    id: 'client-tools',
    title: 'Client-Side Tools',
    summary: 'Assistant can read browser context and save approved notes into local storage on the client.',
    bullets: [
      'Runs tool code inside the browser',
      'Includes approval flow for a write action',
      'Shows how to keep sensitive local actions off the server',
    ],
    suggestions: [
      'Tell me about this browser environment, then save a short note about it.',
      'Store a note saying this demo works and include today’s local time.',
      'Ask for approval before saving a preference note.',
    ],
  },
  {
    id: 'progress-tools',
    title: 'Progress + Status Events',
    summary: 'Server tools emit live custom events while long-running async work is in flight.',
    bullets: [
      'Displays per-tool progress updates',
      'Good template for jobs, crawls, indexing, and ETL work',
      'Final answer incorporates the tool result after streaming status',
    ],
    suggestions: [
      'Run a research pipeline for a customer support bot migration.',
      'Simulate a four-step data import for analytics events.',
      'Audit a release checklist and narrate progress.',
    ],
  },
  {
    id: 'agent-state',
    title: 'Agent State + Background Terminals',
    summary: 'Assistant manages persistent background terminal sessions on the server across turns.',
    bullets: [
      'Starts and inspects long-lived shell sessions',
      'State survives between chat messages while the server is running',
      'Demonstrates an agent owning external process state',
    ],
    suggestions: [
      'Start a terminal that counts numbers with a small delay and then inspect it.',
      'Launch `pwd && ls` in a background terminal and summarize the output.',
      'Create two terminal sessions and compare their state.',
    ],
  },
  {
    id: 'workspace-agent',
    title: 'Mixed Workspace Agent',
    summary: 'Combines server tools, client tools, progress events, and terminal state in one orchestrated assistant.',
    bullets: [
      'Best end-to-end demo of the library surface',
      'Useful for product walkthroughs and proof-of-concepts',
      'Can gather local context, run server work, and persist agent state',
    ],
    suggestions: [
      'Inspect the browser, save a note, run a small terminal command, and summarize everything.',
      'Plan a demo environment setup and use tools where helpful.',
      'Do a mini workspace audit with progress updates.',
    ],
  },
]
