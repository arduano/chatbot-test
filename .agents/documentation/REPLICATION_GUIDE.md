# Fresh Repo Playbook: TanStack AI Chatbot Demo Lab

This document is meant to be copied into a completely new repository and used by an AI agent as the primary build brief.

It describes how to go from an empty folder to a working full-stack chatbot demo environment with:

- Vite + React frontend
- Node/Express backend
- TanStack AI streaming chat
- server-side tools
- client-side tools
- server-side progress/status events
- stateful agent behavior through long-lived background processes
- one-command local startup

It is intentionally written around concepts, patterns, and implementation shapes rather than references to any one repo.

## Product Target

Build a local demo app that lets a developer open a browser and interact with several chatbot demos side by side or via a selector. The demos should prove these capabilities:

1. Plain streaming token output
2. Server-side tool calls
3. Client-side tool calls
4. Server-side tool calls that emit live progress/status
5. Agent state, such as background terminal sessions that persist across turns
6. A mixed orchestration mode that combines several of the above

The final project should start with a single command:

```bash
pnpm dev
```

## Core Technical Decisions

These are the decisions that made the demo work reliably and are worth repeating in future repos.

### 1. Use a simple split architecture

Do not start with a complex framework.

Use:

- `vite` for frontend dev/build
- `react` for UI
- `express` for the backend
- Vite proxying `/api` to the backend during local dev

This gives fast startup, easy debugging, and clear network boundaries.

### 2. Use TanStack AI’s native chat stream format

Do not invent a custom streaming protocol.

Use:

- `useChat()` on the frontend
- `fetchServerSentEvents()` as the transport
- `chat()` on the backend
- `toServerSentEventsStream()` to expose the response

This keeps frontend and backend aligned with TanStack AI’s expected chunk format.

### 3. Treat tools as first-class UI objects

Do not hide tool state behind a plain text response.

Render:

- text parts
- tool call parts
- tool result parts
- approval requests
- progress/status events

This is what turns a generic chatbot into a useful demo lab.

### 4. Separate tool definition from tool execution

Define tool metadata once, then attach execution on the correct side:

- `.server(...)` for server-side tools
- `.client(...)` for browser-side tools

This is especially important for client-side tools, where the model must know the tool exists but execution must happen in the browser.

### 5. Keep initial server state in memory

For a demo, start with in-memory state.

This is enough to prove:

- durable-in-session behavior
- multi-turn agent state
- long-running process ownership

Then document exactly where to replace it with real storage.

## Recommended Project Layout

In a fresh repo, aim for this shape:

```text
.agents/
  documentation/
shared/
  browser-tools.ts
server/
  index.ts
  demos.ts
  tools.ts
  state.ts
  data.ts
src/
  main.tsx
  App.tsx
  demo-data.ts
  client-tools.ts
  types.ts
  components/
    DemoPanel.tsx
    MessageView.tsx
index.html
vite.config.ts
tsconfig.json
package.json
.env
```

This layout is not mandatory, but it works well because it cleanly separates:

- frontend
- backend
- shared tool definitions
- in-memory state
- agent-facing docs

## Packages to Install

### Runtime dependencies

```bash
pnpm add react react-dom express cors dotenv zod @tanstack/ai @tanstack/ai-react @tanstack/ai-client @tanstack/ai-openai
```

### Dev dependencies

```bash
pnpm add -D vite @vitejs/plugin-react typescript tsx concurrently @types/node @types/react @types/react-dom @types/express @types/cors
```

## Required Environment

At minimum:

```env
OPENAI_API_KEY=...
```

The backend should load it with:

```ts
import 'dotenv/config'
```

## Scripts

Use these script shapes:

```json
{
  "scripts": {
    "dev": "concurrently -k -n server,client -c blue,magenta \"tsx watch server/index.ts\" \"vite\"",
    "build": "tsc --noEmit && vite build",
    "start": "tsx server/index.ts"
  }
}
```

## Build Order

An agent building this from zero should do the work in this order:

1. Create the Vite React TypeScript shell
2. Add the Express server
3. Add the Vite proxy for `/api`
4. Implement one streaming chat endpoint
5. Implement one frontend chat panel using `useChat()`
6. Verify plain streaming works
7. Add one server tool
8. Add one client tool
9. Add one progress-emitting server tool
10. Add one stateful agent tool surface
11. Add a mixed orchestration demo
12. Only after that, polish the UI and write documentation

Do not start with the mixed orchestration demo. Prove each layer independently first.

## Backend Pattern

### Endpoint shape

Use one chat endpoint that selects behavior by demo id:

```ts
POST /api/chat/:demoId
```

Also expose utility endpoints as needed, for example:

```ts
GET /api/health
GET /api/state/terminals
```

### Backend chat flow

The chat route should:

1. Validate that `demoId` exists
2. Ensure `OPENAI_API_KEY` exists
3. Create an `AbortController`
4. Call `chat()` with:
   - an adapter such as `openaiText('gpt-4.1-mini')`
   - prior messages from the request
   - a demo-specific system prompt
   - a demo-specific tool set
   - low-ish token limits to keep the demo cheap
5. Convert the async stream to SSE with `toServerSentEventsStream()`
6. Write the stream to the response

### Important abort detail

Wire stream cancellation like this:

```ts
response.on('close', () => {
  abortController.abort()
})
```

Do not use `request.on('close')` for this specific streaming path unless you have confirmed the behavior in your own server setup. In this demo pattern, aborting off the request side caused the stream to terminate early and emit only `[DONE]`.

### Model choice

For low-cost demos, use a cheaper model such as:

```ts
openaiText('gpt-4.1-mini')
```

This is a practical default for interactive local demos.

## Frontend Pattern

### Main chat hook

Each demo panel should create its own `useChat()` instance:

```ts
const chat = useChat({
  connection: fetchServerSentEvents(`/api/chat/${demo.id}`, {
    body: { sessionId },
  }),
  tools: clientToolset,
  onCustomEvent(eventType, data, context) {
    // collect progress/status events here
  },
})
```

### Why give each demo its own session id

Use a unique session id per panel/demo instance so:

- chats do not bleed into each other
- stateful sessions can be reasoned about independently
- the mixed demo does not pollute the baseline demo

### Message rendering requirements

The UI renderer must handle at least:

- text
- tool-call
- tool-result
- thinking

For tool-call parts, also show:

- tool name
- parsed input
- current state
- output if available
- approval buttons if required

If you omit tool rendering, you lose most of the instructional value of the app.

## Tool Architecture

## Principle

The best structure is:

1. shared definition
2. side-specific execution

### Shared definition pattern

Create a shared file for any tool that may need to exist on both frontend and backend:

```ts
import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

export const browserContextToolDefinition = toolDefinition({
  name: 'get_browser_context',
  description: 'Read browser metadata such as user agent, viewport, timezone, and URL.',
  outputSchema: z.object({
    userAgent: z.string(),
    language: z.string(),
    viewport: z.string(),
    timezone: z.string(),
    url: z.string(),
    platform: z.string(),
  }),
})
```

### Client-side implementation pattern

On the frontend:

```ts
export const clientToolset = clientTools(
  browserContextToolDefinition.client(async () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      url: window.location.href,
      platform: navigator.platform,
    }
  }),
)
```

### Server-side implementation pattern

On the backend:

- include the shared tool definition in the tool list
- do not attach `.server(...)` if execution must remain on the client

This tells the model the tool exists, and TanStack AI will hand off execution to the client.

## Strict TypeScript Tool Pattern

In practice, tool execution args may arrive as `unknown`.

Do not weaken TypeScript globally. Parse raw args explicitly:

```ts
const inputSchema = z.object({
  query: z.string(),
  maxMonthlyCost: z.number().optional(),
})

export const serverCatalogTool = toolDefinition({
  name: 'search_demo_catalog',
  description: 'Search a small local catalog of products.',
  inputSchema,
  outputSchema: z.object({
    matches: z.array(z.object({
      sku: z.string(),
      name: z.string(),
    })),
  }),
}).server(async (rawArgs) => {
  const args = inputSchema.parse(rawArgs)
  return runCatalogSearch(args)
})
```

Use this pattern everywhere for predictable strict-mode behavior.

## Demo Catalog

A good fresh-repo implementation should include the following demo modes.

### Demo 1: Plain Streaming

Purpose:

- prove token streaming works
- verify the transport before tools complicate the flow

Implementation:

- no tools
- short system prompt
- low token limit

### Demo 2: Server Tools

Purpose:

- prove the model can call backend functions
- prove tool chaining

Good demo tool types:

- fake catalog search
- fake pricing/rollout estimate
- fake scheduling helper

Use a small local dataset. Do not make this demo depend on external APIs unless the project explicitly needs that.

### Demo 3: Client Tools

Purpose:

- prove browser-side execution
- prove approval-based writes

Good client tools:

- read browser context
- save a local note or preference

If a tool changes client-side state, mark it:

```ts
needsApproval: true
```

Then render approval buttons in the UI and call:

```ts
addToolApprovalResponse({ id, approved: true })
```

### Demo 4: Progress + Status

Purpose:

- prove a long-running server tool can emit live events mid-execution

Use:

```ts
context?.emitCustomEvent('progress', {...})
context?.emitCustomEvent('status', {...})
```

Good fake workloads:

- indexing
- ETL
- content audit
- migration checklist
- research pipeline

The actual async function can be simulated with sleeps plus generated artifacts.

### Demo 5: Agent State

Purpose:

- prove tool-accessible state can persist across turns
- mimic an agent owning long-lived external processes

A strong demo pattern is background terminal sessions:

- start a process
- store its id and metadata
- inspect it later
- list all active sessions

This is much more convincing than a toy counter because it demonstrates persistent external state.

### Demo 6: Mixed Workspace Agent

Purpose:

- prove orchestration across:
  - server tools
  - client tools
  - progress events
  - stateful processes

This should be the most capable mode and the last one added.

## Stateful Agent Pattern

## Why background terminals work well

They demonstrate:

- tool-triggered side effects
- state across messages
- asynchronous work that can be revisited
- a natural bridge to future durable infrastructure

### Minimal in-memory state shape

Use an in-memory map:

```ts
const terminalSessions = new Map<string, TerminalSession>()
```

Each session should store:

- `id`
- `command`
- `cwd`
- `status`
- `startedAt`
- `finishedAt`
- `exitCode`
- output buffer
- child process handle

### Suggested tools

- `start_background_terminal`
- `inspect_background_terminal`
- `list_background_terminals`

### Practical implementation notes

- spawn `bash -lc <command>`
- capture both `stdout` and `stderr`
- keep a bounded output buffer
- normalize optional `cwd` values so empty strings/null do not cause validation churn

## Progress Event Pattern

When implementing a long-running server tool, emit events between steps:

```ts
for (let step = 1; step <= steps; step += 1) {
  context?.emitCustomEvent('progress', {
    step,
    steps,
    label: `Step ${step} of ${steps}`,
  })

  await sleep(450)

  context?.emitCustomEvent('status', {
    step,
    percent: Math.round((step / steps) * 100),
  })
}
```

The frontend should store these in component state and render them in a side panel.

This is the correct way to demo “any real async function happening under a tool call”.

## UI Design Guidance

This demo benefits from a UI that exposes system behavior rather than hiding it.

Recommended screen structure:

- left or top navigation of demo modes
- main chat panel
- side inspector panel for:
  - progress events
  - background state snapshots

Useful UX details:

- prompt starter chips for every demo
- clear stop button
- clear button
- visible “streaming vs ready” indicator
- explicit approval controls

## Verification Plan

An agent building this should verify in stages.

### Stage 1: Build

```bash
pnpm build
```

### Stage 2: Health

```bash
curl http://localhost:3001/api/health
```

### Stage 3: Streaming endpoint

Use a small chat request and inspect SSE chunks:

```bash
curl -N -X POST http://localhost:3001/api/chat/streaming ...
```

You should see:

- `RUN_STARTED`
- `TEXT_MESSAGE_START`
- multiple `TEXT_MESSAGE_CONTENT`
- `RUN_FINISHED`

### Stage 4: Server tool path

Hit the server-tool demo and confirm:

- `TOOL_CALL_START`
- `TOOL_CALL_ARGS`
- `TOOL_CALL_END`
- follow-up assistant text

### Stage 5: Progress tool path

Confirm custom events appear:

- `CUSTOM` with `progress`
- `CUSTOM` with `status`

### Stage 6: Client tool handoff

From a terminal-only smoke test, confirm at least that the server emits the client-execution handoff. Then verify the actual browser execution path in the UI.

## Durable Storage and Injection Points

This demo pattern should start with in-memory state but be explicit about where to replace it.

### Durable storage is not built in by default

A minimal demo can use:

- in-memory maps for backend process state
- browser `localStorage` for local notes/preferences

This is acceptable for a demo but is not durable.

### Where durable storage should be added

#### 1. Backend agent/process state

Replace the in-memory terminal session registry with a repository backed by:

- Postgres
- Redis
- SQLite
- another application store

Persist at least:

- session metadata
- process status
- ownership/user context
- output logs or pointers to logs

#### 2. Chat transcripts

If conversations must survive reloads or be inspectable later:

- persist by `sessionId`
- store messages and tool events separately

Suggested tables/collections:

- `chat_sessions`
- `chat_messages`
- `tool_events`

#### 3. Client-side notes/preferences

If the client-side note tool should sync across devices:

- replace or supplement `localStorage`
- route writes through a backend API

#### 4. Progress event history

If a long-running job must be resumable:

- persist progress events by `toolCallId`
- let reconnecting clients fetch past events

## Injection Points

These are the most useful locations for future project-specific customization.

### Model/provider injection

Create a dedicated adapter factory module and put model selection there.

Use it for:

- changing the OpenAI model
- switching providers
- routing by environment or tenant

### Auth/user-context injection

Add request middleware before chat routes.

Pass request context into:

- metadata
- prompt composition
- tool-access policies
- persistence ownership fields

### Prompt injection

Keep system prompts in a dedicated config layer. Compose them from:

- global policy
- demo-specific instructions
- tenant/product context

### Domain tool injection

Add new tools by:

1. defining schemas and descriptions
2. choosing server or client execution
3. registering them in the relevant demo mode

### Observability injection

Add analytics or tracing in:

- frontend `onCustomEvent`
- backend route handlers
- tool execution wrappers

## Common Failure Modes

### Only `[DONE]` arrives from SSE

Likely cause:

- aborting the stream too early

Fix:

- verify the close handler is on `response`

### Client tools never run

Likely causes:

- server knows the tool exists but frontend did not register it in `tools`
- approval flow is missing

### Tool execution fails in strict TypeScript

Likely cause:

- raw args inferred as `unknown`

Fix:

- explicitly parse with Zod before use

### Agent-state tool wastes turns correcting bad args

Likely cause:

- the schema rejects null/empty optional values

Fix:

- preprocess optional values before validation

## What to Keep Stable Across Projects

If an agent wants to recreate this experience quickly, preserve these invariants:

- one-command local startup
- Vite frontend + small Node backend
- TanStack AI native stream format
- demo modes with distinct tool sets
- explicit tool and event rendering
- shared tool definitions for cross-side tools
- documented replacement points for durable state

Those are the design choices that make this pattern portable.
