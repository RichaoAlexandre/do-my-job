import MessageBubble from './MessageBubble'

interface ToolResultMessageProps {
  content: string
}

export default function ToolResultMessage({ content }: ToolResultMessageProps) {
  return (
    <MessageBubble type="tool_result">
      <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-60">{content}</pre>
    </MessageBubble>
  )
}
