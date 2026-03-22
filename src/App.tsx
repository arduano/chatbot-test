import { useMemo, useState } from 'react'
import { DemoPanel } from './components/DemoPanel'
import { demos, type DemoId } from './demo-data'

export default function App() {
  const [selectedDemo, setSelectedDemo] = useState<DemoId>('streaming')

  const selectedDefinition = useMemo(
    () => demos.find((demo) => demo.id === selectedDemo)!,
    [selectedDemo],
  )

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <p className="eyebrow">TanStack AI + OpenAI</p>
          <h1>Demo Lab</h1>
          <p className="sidebar-copy">
            Streaming chat, tool calls, custom progress events, and stateful agents in one Vite
            app.
          </p>
        </div>

        <nav className="demo-nav">
          {demos.map((demo) => (
            <button
              key={demo.id}
              className={`demo-nav-item ${demo.id === selectedDemo ? 'active' : ''}`}
              onClick={() => setSelectedDemo(demo.id)}
              type="button"
            >
              <span>{demo.title}</span>
              <small>{demo.summary}</small>
            </button>
          ))}
        </nav>
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <div>
            <p className="eyebrow">Selected Demo</p>
            <h2>{selectedDefinition.title}</h2>
          </div>
          <div className="pill-row">
            {selectedDefinition.bullets.map((bullet) => (
              <span className="pill" key={bullet}>
                {bullet}
              </span>
            ))}
          </div>
        </header>

        {demos.map((demo) => (
          <section
            className={demo.id === selectedDemo ? 'panel-visible' : 'panel-hidden'}
            key={demo.id}
          >
            <DemoPanel demo={demo} />
          </section>
        ))}
      </main>
    </div>
  )
}
