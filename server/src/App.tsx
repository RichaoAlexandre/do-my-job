import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col p-8">
      <div className="flex-1 overflow-auto flex justify-center">
        <div className="grid grid-cols-4 gap-4 w-lg h-fit">
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-zinc-800 border border-zinc-700"
            />
          ))}
        </div>
      </div>

      <div className="flex gap-4 justify-center pt-4">
        <button
          onClick={() => setCount((c) => Math.max(0, c - 1))}
          className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-2xl font-mono transition-colors cursor-pointer"
        >
          -
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-2xl font-mono transition-colors cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default App
