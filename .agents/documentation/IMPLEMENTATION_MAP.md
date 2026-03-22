# Portable Implementation Map

Use this document when rebuilding the chatbot demo lab in a brand new repository.

It is intentionally generic. Treat the paths below as recommended module responsibilities, not hard requirements.

## Minimum Module Responsibilities

### `server/index.ts`

Owns:

- Express app setup
- JSON parsing
- CORS
- health endpoint
- chat endpoint
- any auxiliary state-inspection endpoints

Should not own:

- domain logic
- persistence logic
- long tool definitions

### `server/demos.ts`

Owns:

- demo ids
- system prompts per demo
- tool composition per demo

This is the correct place to decide which tools are available in:

- plain streaming mode
- server tools mode
- client tools mode
- progress mode
- agent-state mode
- mixed orchestration mode

### `server/tools.ts`

Owns:

- all server-side tool implementations
- server-side wrappers around shared definitions
- Zod parsing of raw tool args

This is where to add:

- business logic tools
- search tools
- planning tools
- progress-emitting tools
- stateful process tools

### `server/state.ts`

Owns:

- in-memory process/session state for demo purposes

This is the first place to replace when moving from demo state to durable state.

### `shared/browser-tools.ts`

Owns:

- tool definitions shared across server and client
- schemas and descriptions for browser-executed tools

Use this module whenever:

- the model must know about a tool
- but execution belongs on the client

### `src/client-tools.ts`

Owns:

- client-side tool implementations via `.client(...)`

Examples:

- browser context
- clipboard
- local notes
- local preferences

### `src/components/DemoPanel.tsx`

Owns:

- `useChat()` setup
- transport selection
- per-demo chat session id
- custom event capture
- optional polling/subscription for side-channel state

This is the best place to inject:

- analytics
- client traces
- latency instrumentation
- UI-only observability

### `src/components/MessageView.tsx`

Owns:

- rendering of TanStack AI message parts
- tool approvals
- tool call state visibility

Do not collapse this into a plain markdown renderer if the goal is to preserve the demo value.

## Required Flows

Every rebuild should support these flows.

### Flow 1: Plain streaming

Input:

- user enters text

Backend:

- `chat()` with no tools

Frontend:

- show streamed text incrementally

### Flow 2: Server tool call

Input:

- user asks for something requiring backend logic

Backend:

- model emits tool call
- server executes tool
- model resumes and synthesizes

Frontend:

- show tool call state and result

### Flow 3: Client tool call

Input:

- user asks for browser-local action

Backend:

- model selects client tool

Frontend:

- TanStack AI requests tool execution
- client executes the tool
- chat resumes

### Flow 4: Progress/status tool

Input:

- user asks for a long-running job

Backend:

- tool emits custom events during execution

Frontend:

- captures and renders those events live

### Flow 5: Stateful agent interaction

Input:

- user asks to start and later inspect background work

Backend:

- process/session state stored in memory or durable store

Frontend:

- optional side panel shows current snapshots

## Durable Storage Swap Plan

If moving beyond a demo, replace these layers in this order:

1. `server/state.ts`
   - replace in-memory map with repository-backed storage

2. chat transcript handling
   - add session/message persistence

3. progress event history
   - persist by `toolCallId`

4. client note storage
   - move local-only writes to server-backed user state if needed

## Suggested Repository Interfaces

If durability is required, create abstractions like:

```ts
interface TerminalSessionRepository {
  create(...)
  update(...)
  getById(...)
  listRecent(...)
  appendOutput(...)
}

interface ChatSessionRepository {
  getSession(...)
  appendMessage(...)
  listMessages(...)
}

interface ToolEventRepository {
  appendEvent(...)
  listEventsByToolCallId(...)
}
```

Build the demo against these interfaces if you know durability will be needed soon.

## Final Rule

If an AI agent is rebuilding this from zero, optimize for the following order of truth:

1. working streaming
2. visible tool state
3. progress events
4. stateful tools
5. polish

If streaming and tool visibility are correct, the rest is additive.
