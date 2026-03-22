# TanStack AI Demo Lab

This repository is an AI-generated proof of concept focused on TanStack AI chat implementations.

It is intentionally narrow in scope:

- show how to build a full-stack local chat app around TanStack AI
- demonstrate multiple chat/tool interaction patterns
- keep the code simple enough to inspect and reuse

It is not intended to be a production-ready starter. It is a reference implementation for experimentation, replication, and future adaptation.

## What It Demonstrates

- clean token streaming over SSE
- server-side tool calls
- client-side tool calls
- server-side tool calls with live progress/status events
- agent-like state via background terminal sessions
- a mixed orchestration demo that combines several of the above

## Run

The only required environment variable is:

```env
OPENAI_API_KEY=...
```

Start the app with:

```bash
pnpm dev
```

This starts:

- Vite on `http://localhost:5173`
- the Express API server on `http://localhost:3001`

## Replication Guide

If you want to recreate this experience in a fresh repository, start with:

- `.agents/documentation/REPLICATION_GUIDE.md`
- `.agents/documentation/IMPLEMENTATION_MAP.md`

These documents were written to be portable to a brand new repo, not just this one.

## Key Files

### Replication and agent docs

- `.agents/documentation/REPLICATION_GUIDE.md`
  - fresh-repo build playbook
  - architecture, build order, tool patterns, durable storage guidance

- `.agents/documentation/IMPLEMENTATION_MAP.md`
  - concise module responsibility map
  - extension points and replacement points

- `.agents/notes/progress.md`
  - chronological build log for this PoC

### Frontend

- `src/App.tsx`
  - overall app shell and demo selection UI

- `src/demo-data.ts`
  - demo catalog, descriptions, and prompt starters

- `src/client-tools.ts`
  - browser-side TanStack AI tool implementations

- `src/components/DemoPanel.tsx`
  - `useChat()` setup, SSE connection, custom event handling, terminal polling

- `src/components/MessageView.tsx`
  - rendering for text, tool calls, tool results, and approval flows

- `src/index.css`
  - presentation layer for the PoC UI

### Backend

- `server/index.ts`
  - Express server, health endpoint, state endpoint, streaming chat endpoint

- `server/demos.ts`
  - demo-specific system prompts and tool composition

- `server/tools.ts`
  - server-side tools, progress emitters, and stateful terminal tools

- `server/state.ts`
  - in-memory state for background terminal sessions
  - this is a demo-only state layer, not durable storage

- `server/data.ts`
  - local fake data for low-cost server tool demos

### Shared cross-side definitions

- `shared/browser-tools.ts`
  - shared tool definitions used by both backend and frontend for client-executed tools

### Project setup

- `package.json`
  - scripts and dependency surface

- `vite.config.ts`
  - Vite config and `/api` proxy

- `tsconfig.json`
  - TypeScript setup

## Durable Storage

This PoC does not implement real durable backend storage.

Current state is intentionally lightweight:

- background terminal sessions live in memory in `server/state.ts`
- browser note writes use `localStorage`
- chat transcripts are not persisted to a backend store

If you want to productionize this pattern, the first replacement point is `server/state.ts`, followed by transcript persistence and progress-event persistence. The replication documents describe those swap points in more detail.

## Practical Notes

- Background terminal sessions are local server processes intended only for demo purposes.
- The app uses `gpt-4.1-mini` to keep token usage modest.
- The primary goal is clarity of integration, not framework completeness.
