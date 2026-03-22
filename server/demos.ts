import type { ServerTool, ToolDefinitionInstance } from '@tanstack/ai'
import {
  inspectTerminalToolServer,
  listTerminalToolServer,
  pricingToolServer,
  progressPipelineToolServer,
  serverCatalogToolServer,
  sharedClientToolDefinitions,
  startTerminalToolServer,
} from './tools'

type DemoTool = ServerTool | ToolDefinitionInstance

export interface ServerDemoConfig {
  systemPrompt: string
  tools: DemoTool[]
}

export const demoConfig: Record<string, ServerDemoConfig> = {
  streaming: {
    systemPrompt:
      'You are a concise streaming assistant for a demo app. Answer clearly, avoid tool calls, and keep replies under 120 words unless asked for depth.',
    tools: [],
  },
  'server-tools': {
    systemPrompt:
      'You are a product solutions assistant. Use tools when the user asks for planning, searching, pricing, or schedules. After a tool call, synthesize the result instead of dumping raw JSON.',
    tools: [serverCatalogToolServer, pricingToolServer],
  },
  'client-tools': {
    systemPrompt:
      'You are a browser-aware assistant. Prefer get_browser_context when local browser details matter. Use save_browser_note only when the user explicitly asks to save a note or preference, and explain that approval is required.',
    tools: [...sharedClientToolDefinitions],
  },
  'progress-tools': {
    systemPrompt:
      'You are an operations assistant. Use run_progress_pipeline for any user request about multi-step async work so the UI can show live progress. Summarize the pipeline artifacts after it completes.',
    tools: [progressPipelineToolServer],
  },
  'agent-state': {
    systemPrompt:
      'You are a stateful agent with access to background terminal sessions. Use start_background_terminal to launch long-running work, inspect_background_terminal to check progress, and list_background_terminals when context is unclear. Prefer safe, local shell commands.',
    tools: [startTerminalToolServer, inspectTerminalToolServer, listTerminalToolServer],
  },
  'workspace-agent': {
    systemPrompt:
      'You are an orchestration agent for a demo lab. You may use server search/planning tools, browser tools, progress tools, and background terminal tools. Use tools only when they materially help. Keep the final answer organized and action-oriented.',
    tools: [
      serverCatalogToolServer,
      pricingToolServer,
      progressPipelineToolServer,
      startTerminalToolServer,
      inspectTerminalToolServer,
      listTerminalToolServer,
      ...sharedClientToolDefinitions,
    ],
  },
}
