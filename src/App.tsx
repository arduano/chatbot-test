import { useMemo, useState } from 'react'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card } from './components/ui/card'
import { DemoPanel } from './components/DemoPanel'
import { demos, type DemoId } from './demo-data'
import { Bot, Sparkles } from 'lucide-react'

export default function App() {
  const [selectedDemo, setSelectedDemo] = useState<DemoId>('streaming')

  const selectedDefinition = useMemo(
    () => demos.find((demo) => demo.id === selectedDemo)!,
    [selectedDemo],
  )

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fcfbf7_0%,#f3efe7_45%,#eceff4_100%)] text-stone-900">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-6 lg:py-6">
        <Card className="overflow-hidden border-stone-200/80 bg-white/70">
          <aside className="flex h-full flex-col">
            <div className="border-b border-stone-200/80 px-6 py-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-900 text-stone-50 shadow-sm">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                    TanStack AI + OpenAI
                  </p>
                  <h1 className="font-serif text-2xl font-semibold text-stone-950">Demo Lab</h1>
                </div>
              </div>
              <p className="text-sm leading-6 text-stone-600">
                A tighter proof of concept for streaming chat, typed tools, progress events, and
                stateful agent behavior.
              </p>
            </div>

            <nav className="flex flex-1 flex-col gap-2 p-3">
              {demos.map((demo) => {
                const active = demo.id === selectedDemo
                return (
                  <Button
                    key={demo.id}
                    className="h-auto min-w-0 justify-start rounded-2xl px-4 py-4 text-left"
                    onClick={() => setSelectedDemo(demo.id)}
                    type="button"
                    variant={active ? 'secondary' : 'ghost'}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="break-words text-sm font-semibold text-stone-900">
                        {demo.title}
                      </div>
                      <div className="break-words text-xs leading-5 text-stone-600">
                        {demo.summary}
                      </div>
                    </div>
                  </Button>
                )
              })}
            </nav>
          </aside>
        </Card>

        <main className="space-y-5">
          <Card className="overflow-hidden border-stone-200/80 bg-white/65">
            <header className="flex flex-col gap-4 border-b border-stone-200/80 px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit" variant="outline">
                  <Sparkles className="mr-1 h-3.5 w-3.5" />
                  Selected Demo
                </Badge>
                <div>
                  <h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
                    {selectedDefinition.title}
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                    {selectedDefinition.summary}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedDefinition.bullets.map((bullet) => (
                  <Badge key={bullet} variant="secondary">
                    {bullet}
                  </Badge>
                ))}
              </div>
            </header>
          </Card>

          {demos.map((demo) => (
            <section className={demo.id === selectedDemo ? 'block' : 'hidden'} key={demo.id}>
              <DemoPanel demo={demo} />
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}
