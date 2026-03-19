import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Agent {
  id: string
  name: string
  instruction: string
  status: string
  createdAt: string
}

export default function HomePage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [showModal, setShowModal] = useState(false)
  const [task, setTask] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then(setAgents)
      .catch(console.error)
  }, [])

  async function handleCreate() {
    if (!task.trim() || !repoUrl.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task, repoUrl }),
      })
      if (!res.ok) throw new Error('Failed to create agent')
      const agent: Agent = await res.json()
      setAgents((prev) => [...prev, agent])
      setTask('')
      setRepoUrl('')
      setShowModal(false)
      navigate(`/agent/${agent.id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col p-8">
      <div className="flex-1 overflow-auto flex justify-center">
        <div className="grid grid-cols-4 gap-4 w-lg h-fit">
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => navigate(`/agent/${agent.id}`)}
              className="aspect-square rounded-lg bg-zinc-800 border border-zinc-700 p-3 flex flex-col justify-between cursor-pointer hover:border-zinc-500 transition-colors"
            >
              <p className="text-sm text-zinc-300 line-clamp-3">
                {agent.instruction}
              </p>
              <span
                className={`text-xs self-end px-2 py-0.5 rounded-full ${
                  agent.status === 'solving'
                    ? 'bg-yellow-900 text-yellow-300'
                    : agent.status === 'finished'
                      ? 'bg-green-900 text-green-300'
                      : 'bg-red-900 text-red-300'
                }`}
              >
                {agent.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-12 h-12 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-2xl font-mono transition-colors cursor-pointer"
        >
          +
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">New Agent</h2>
            <input
              autoFocus
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Repository URL (https://github.com/...)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-zinc-500 mb-3"
            />
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="Describe the task..."
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white resize-none focus:outline-none focus:border-zinc-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowModal(false)
                  setTask('')
                  setRepoUrl('')
                }}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !task.trim() || !repoUrl.trim()}
                className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
