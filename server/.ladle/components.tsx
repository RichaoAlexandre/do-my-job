import type { GlobalProvider } from '@ladle/react'
import '../src/index.css'

export const Provider: GlobalProvider = ({ children }) => (
  <div className="bg-zinc-950 min-h-screen p-6">{children}</div>
)
