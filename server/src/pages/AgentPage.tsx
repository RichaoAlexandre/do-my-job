import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

interface AgentEvent {
  type: string
  text?: string
  [key: string]: unknown
}

interface Review {
  summary: string
  diff: string
}

export default function AgentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<AgentEvent[]>([])
  const [status, setStatus] = useState<string>('solving')
  const [review, setReview] = useState<Review | null>(null)
  const [terminating, setTerminating] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', agentId: id }))
    }

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data)
      if (msg.type === 'agent_output' && msg.agentId === id) {
        setMessages((prev) => [...prev, msg.event as AgentEvent])
      }
      if (msg.type === 'agent_status' && msg.agentId === id) {
        setStatus(msg.status)
      }
      if (msg.type === 'review_ready' && msg.agentId === id) {
        setReview({ summary: msg.summary, diff: msg.diff })
      }
    }

    return () => {
      ws.close()
    }
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleTerminate() {
    if (!id) return
    setTerminating(true)
    try {
      await fetch(`/api/agents/${id}`, { method: 'DELETE' })
      navigate('/')
    } catch (err) {
      console.error(err)
      setTerminating(false)
    }
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            &larr; Back
          </button>
          <h1 className="text-sm font-mono text-zinc-400">
            Agent {id?.slice(0, 8)}
          </h1>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              status === 'solving'
                ? 'bg-yellow-900 text-yellow-300'
                : status === 'finished'
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
            }`}
          >
            {status}
          </span>
        </div>
        <button
          onClick={handleTerminate}
          disabled={terminating || status !== 'solving'}
          className="px-4 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-red-200 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {terminating ? 'Terminating...' : 'Terminate'}
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        {review && (
          <div className="border-b border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                Review Ready
              </span>
            </div>
            <p className="text-sm text-zinc-300 mb-4">{review.summary}</p>
            <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-auto text-xs leading-relaxed">
              {review.diff.split('\n').map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith('+') && !line.startsWith('+++')
                      ? 'text-green-400'
                      : line.startsWith('-') && !line.startsWith('---')
                        ? 'text-red-400'
                        : line.startsWith('@@')
                          ? 'text-blue-400'
                          : 'text-zinc-500'
                  }
                >
                  {line}
                </div>
              ))}
            </pre>
          </div>
        )}

        <div className="p-6 font-mono text-sm">
          {messages.map((msg, i) => (
            <div key={i} className="py-0.5">
              {msg.type === 'text' || msg.type === 'stderr' ? (
                <span
                  className={
                    msg.type === 'stderr' ? 'text-red-400' : 'text-zinc-300'
                  }
                >
                  {msg.text}
                </span>
              ) : (
                <span className="text-zinc-500">
                  {JSON.stringify(msg)}
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  )
}
