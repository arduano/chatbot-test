import { toolDefinition } from '@tanstack/ai'
import { z } from 'zod'

export const browserContextToolDefinition = toolDefinition({
  name: 'get_browser_context',
  description:
    'Read lightweight browser context such as user agent, language, viewport size, timezone, and current URL.',
  outputSchema: z.object({
    userAgent: z.string(),
    language: z.string(),
    viewport: z.string(),
    timezone: z.string(),
    url: z.string(),
    platform: z.string(),
  }),
})

export const browserNoteInputSchema = z.object({
  key: z.string().min(1).max(40),
  note: z.string().min(1).max(400),
})

export const browserNoteToolDefinition = toolDefinition({
  name: 'save_browser_note',
  description:
    'Save a short note to browser localStorage. Requires approval because it writes client-side state.',
  needsApproval: true,
  inputSchema: browserNoteInputSchema,
  outputSchema: z.object({
    key: z.string(),
    savedAt: z.string(),
    preview: z.string(),
  }),
})
