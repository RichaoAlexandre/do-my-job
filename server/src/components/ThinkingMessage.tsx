import MessageBubble from './MessageBubble'

interface ThinkingMessageProps {
  text: string
}

export default function ThinkingMessage({ text }: ThinkingMessageProps) {
  return (
    <MessageBubble type="thinking">
      <p className="whitespace-pre-wrap text-xs italic">{text}</p>
    </MessageBubble>
  )
}
