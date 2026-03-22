import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { chat, toServerSentEventsStream, type ModelMessage } from '@tanstack/ai'
import { openaiText } from '@tanstack/ai-openai'
import { demoConfig } from './demos'
import { listTerminalSessions } from './state'

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY),
  })
})

app.get('/api/state/terminals', (_request, response) => {
  response.json({
    terminals: listTerminalSessions(),
  })
})

app.post('/api/chat/:demoId', async (request, response) => {
  const config = demoConfig[request.params.demoId]

  if (!config) {
    response.status(404).json({ error: 'Unknown demo id' })
    return
  }

  if (!process.env.OPENAI_API_KEY) {
    response.status(500).json({ error: 'OPENAI_API_KEY is missing from environment.' })
    return
  }

  const abortController = new AbortController()
  response.on('close', () => {
    abortController.abort()
  })

  try {
    const body = request.body as {
      messages?: ModelMessage[]
      sessionId?: string
    }

    const stream = chat({
      adapter: openaiText('gpt-4.1-mini'),
      messages: (body.messages ?? []) as never,
      systemPrompts: [config.systemPrompt],
      tools: config.tools,
      maxTokens: 280,
      temperature: 0.5,
      conversationId: body.sessionId ?? request.params.demoId,
      abortController,
      metadata: {
        demoId: request.params.demoId,
      },
    })

    response.status(200)
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')

    const reader = toServerSentEventsStream(stream, abortController).getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      response.write(Buffer.from(value))
    }

    response.end()
  } catch (error) {
    if (response.headersSent) {
      response.write(
        `data: ${JSON.stringify({
          type: 'RUN_ERROR',
          timestamp: Date.now(),
          error: {
            message: error instanceof Error ? error.message : 'Unknown server error',
          },
        })}\n\n`,
      )
      response.end()
      return
    }

    response.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown server error',
    })
  }
})

app.listen(port, () => {
  console.log(`TanStack AI demo server running on http://localhost:${port}`)
})
