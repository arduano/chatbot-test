import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'
import { browserContextToolDefinition, browserNoteToolDefinition } from '../shared/browser-tools'
import { catalog, meetingSlots } from './data'
import { createTerminalSession, listTerminalSessions, readTerminalSession } from './state'

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export const serverCatalogTool = toolDefinition({
  name: 'search_demo_catalog',
  description:
    'Search the local demo catalog for sample AI products by use case, budget, or category.',
  inputSchema: z.object({
    query: z.string(),
    maxMonthlyCost: z.number().optional(),
  }),
  outputSchema: z.object({
    matches: z.array(
      z.object({
        sku: z.string(),
        name: z.string(),
        category: z.string(),
        monthlyCost: z.number(),
        setupDays: z.number(),
        strengths: z.array(z.string()),
      }),
    ),
  }),
})

const serverCatalogInputSchema = z.object({
  query: z.string(),
  maxMonthlyCost: z.number().optional(),
})

export const serverCatalogToolServer = serverCatalogTool.server(async (rawArgs) => {
  const { query, maxMonthlyCost } = serverCatalogInputSchema.parse(rawArgs)
  await sleep(350)

  const normalized = query.toLowerCase()
  const matches = catalog.filter((item) => {
    const haystack = `${item.name} ${item.category} ${item.strengths.join(' ')}`.toLowerCase()
    const budgetMatch = maxMonthlyCost === undefined || item.monthlyCost <= maxMonthlyCost
    return budgetMatch && haystack.includes(normalized)
  })

  return { matches }
})

export const pricingTool = toolDefinition({
  name: 'estimate_rollout_plan',
  description:
    'Estimate a rollout budget and schedule for a proposed AI setup using local demo assumptions.',
  inputSchema: z.object({
    seats: z.number().min(1).max(1000),
    automationLevel: z.enum(['light', 'medium', 'heavy']),
  }),
  outputSchema: z.object({
    estimatedMonthlyCost: z.number(),
    implementationDays: z.number(),
    recommendedSlot: z.string(),
  }),
})

const pricingInputSchema = z.object({
  seats: z.number().min(1).max(1000),
  automationLevel: z.enum(['light', 'medium', 'heavy']),
})

export const pricingToolServer = pricingTool.server(async (rawArgs) => {
  const { seats, automationLevel } = pricingInputSchema.parse(rawArgs)
  await sleep(450)

  const multiplier = automationLevel === 'light' ? 18 : automationLevel === 'medium' ? 29 : 43
  const implementationDays = automationLevel === 'light' ? 5 : automationLevel === 'medium' ? 12 : 18

  return {
    estimatedMonthlyCost: seats * multiplier,
    implementationDays,
    recommendedSlot: meetingSlots[(seats + implementationDays) % meetingSlots.length]!,
  }
})

export const progressPipelineTool = toolDefinition({
  name: 'run_progress_pipeline',
  description:
    'Run a simulated long-running async pipeline with live progress events for status UIs.',
  inputSchema: z.object({
    objective: z.string(),
    steps: z.number().min(2).max(6).default(4),
  }),
  outputSchema: z.object({
    objective: z.string(),
    completedSteps: z.number(),
    artifacts: z.array(z.string()),
  }),
})

const progressPipelineInputSchema = z.object({
  objective: z.string(),
  steps: z.number().min(2).max(6).default(4),
})

export const progressPipelineToolServer = progressPipelineTool.server(async (rawArgs, context) => {
  const { objective, steps } = progressPipelineInputSchema.parse(rawArgs)
  const artifacts: string[] = []

  for (let step = 1; step <= steps; step += 1) {
    context?.emitCustomEvent('progress', {
      label: `Step ${step} of ${steps}`,
      step,
      steps,
      objective,
      status: step === 1 ? 'starting' : 'running',
    })

    await sleep(450)
    artifacts.push(`Artifact ${step}: ${objective} checkpoint ${step}`)

    context?.emitCustomEvent('status', {
      label: `Completed step ${step}`,
      step,
      steps,
      objective,
      percent: Math.round((step / steps) * 100),
    })
  }

  return {
    objective,
    completedSteps: steps,
    artifacts,
  }
})

export const startTerminalTool = toolDefinition({
  name: 'start_background_terminal',
  description:
    'Start a background terminal session on the server and return its session id for later inspection.',
  inputSchema: z.object({
    command: z.string(),
    cwd: z.string().optional(),
  }),
  outputSchema: z.object({
    id: z.string(),
    command: z.string(),
    cwd: z.string(),
    status: z.enum(['running', 'exited']),
    startedAt: z.string(),
  }),
})

const startTerminalInputSchema = z.object({
  command: z.string(),
  cwd: z.preprocess(
    (value) => {
      if (value === null || value === '') {
        return undefined
      }
      return value
    },
    z.string().optional(),
  ),
})

export const startTerminalToolServer = startTerminalTool.server(async (rawArgs) => {
  const { command, cwd } = startTerminalInputSchema.parse(rawArgs)
  return createTerminalSession(command, cwd ?? process.cwd())
})

export const inspectTerminalTool = toolDefinition({
  name: 'inspect_background_terminal',
  description:
    'Inspect a previously started background terminal session and read its recent output.',
  inputSchema: z.object({
    id: z.string(),
    tailLines: z.number().min(1).max(60).default(20),
  }),
  outputSchema: z.object({
    id: z.string(),
    command: z.string(),
    cwd: z.string(),
    status: z.enum(['running', 'exited']),
    startedAt: z.string(),
    finishedAt: z.string().optional(),
    exitCode: z.number().nullable().optional(),
    recentOutput: z.array(z.string()),
  }),
})

const inspectTerminalInputSchema = z.object({
  id: z.string(),
  tailLines: z.number().min(1).max(60).default(20),
})

export const inspectTerminalToolServer = inspectTerminalTool.server(async (rawArgs) => {
  const { id, tailLines } = inspectTerminalInputSchema.parse(rawArgs)
  const session = readTerminalSession(id, tailLines)
  if (!session) {
    throw new Error(`No terminal session found for ${id}`)
  }

  return session
})

export const listTerminalTool = toolDefinition({
  name: 'list_background_terminals',
  description: 'List known background terminal sessions and their current status.',
  outputSchema: z.object({
    terminals: z.array(
      z.object({
        id: z.string(),
        command: z.string(),
        cwd: z.string(),
        status: z.enum(['running', 'exited']),
        startedAt: z.string(),
        finishedAt: z.string().optional(),
        exitCode: z.number().nullable().optional(),
        recentOutput: z.array(z.string()),
      }),
    ),
  }),
})

export const listTerminalToolServer = listTerminalTool.server(async () => {
  return {
    terminals: listTerminalSessions(),
  }
})

export const sharedClientToolDefinitions = [browserContextToolDefinition, browserNoteToolDefinition] as const
