import MessageBubble from './MessageBubble'

interface ToolCallMessageProps {
  toolName: string
  input: string
}

function FormatInput({ input }: { input: string }) {
  try {
    const parsed = JSON.parse(input)
    return (
      <pre className="mt-2 text-xs text-zinc-500 whitespace-pre-wrap overflow-auto max-h-60">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    )
  } catch {
    return <span className="text-xs text-zinc-500">{input}</span>
  }
}

export default function ToolCallMessage({ toolName, input }: ToolCallMessageProps) {
  return (
    <MessageBubble type="tool_call" label={toolName}>
      {input && <FormatInput input={input} />}
    </MessageBubble>
  )
}
