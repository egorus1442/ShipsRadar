import { useState } from 'react'

function App() {
  const [status] = useState<string>('ready')

  return (
    <div className="min-h-screen bg-app-bg text-app-text">
      <div className="container mx-auto p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">ShipsRadar MVP</h1>
          <p className="text-app-text-secondary text-lg">
            Ship Route Optimization with Weather Data
          </p>
        </header>

        <main className="bg-app-panel rounded-lg border border-app-border p-6">
          <div className="text-center">
            <div className="inline-block px-4 py-2 bg-green-900/20 border border-green-700 rounded-lg mb-4">
              <span className="text-green-400 font-medium">
                Status: {status}
              </span>
            </div>
            
            <h2 className="text-2xl font-semibold mb-4">Frontend Ready</h2>
            <p className="text-app-text-secondary mb-6">
              React + TypeScript + Vite + Tailwind CSS configured successfully
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <div className="bg-app-bg p-4 rounded border border-app-border">
                <h3 className="font-semibold mb-2">⚛️ React 18</h3>
                <p className="text-sm text-app-text-secondary">Modern UI framework</p>
              </div>
              <div className="bg-app-bg p-4 rounded border border-app-border">
                <h3 className="font-semibold mb-2">📘 TypeScript</h3>
                <p className="text-sm text-app-text-secondary">Type-safe development</p>
              </div>
              <div className="bg-app-bg p-4 rounded border border-app-border">
                <h3 className="font-semibold mb-2">⚡ Vite</h3>
                <p className="text-sm text-app-text-secondary">Lightning fast build</p>
              </div>
              <div className="bg-app-bg p-4 rounded border border-app-border">
                <h3 className="font-semibold mb-2">🎨 Tailwind CSS</h3>
                <p className="text-sm text-app-text-secondary">Utility-first styling</p>
              </div>
              <div className="bg-app-bg p-4 rounded border border-app-border">
                <h3 className="font-semibold mb-2">🗺️ Mapbox</h3>
                <p className="text-sm text-app-text-secondary">Coming in Stage 2</p>
              </div>
              <div className="bg-app-bg p-4 rounded border border-app-border">
                <h3 className="font-semibold mb-2">📊 Deck.gl</h3>
                <p className="text-sm text-app-text-secondary">Coming in Stage 7</p>
              </div>
            </div>
          </div>
        </main>

        <footer className="text-center mt-8 text-app-text-secondary text-sm">
          <p>ShipsRadar MVP - Stage 1 Complete ✓</p>
        </footer>
      </div>
    </div>
  )
}

export default App
