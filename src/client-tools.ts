import { clientTools } from '@tanstack/ai-client'
import {
  browserContextToolDefinition,
  browserNoteInputSchema,
  browserNoteToolDefinition,
} from '../shared/browser-tools'

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
  browserNoteToolDefinition.client(async (rawArgs) => {
    const { key, note } = browserNoteInputSchema.parse(rawArgs)
    const savedAt = new Date().toISOString()
    localStorage.setItem(`tanstack-ai-demo:${key}`, JSON.stringify({ note, savedAt }))

    return {
      key,
      savedAt,
      preview: note.slice(0, 80),
    }
  }),
)
