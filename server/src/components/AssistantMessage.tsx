import MessageBubble from './MessageBubble'

interface AssistantMessageProps {
  text: string
}

export default function AssistantMessage({ text }: AssistantMessageProps) {
  return (
    <MessageBubble type="assistant">
      <p className="whitespace-pre-wrap">{text}</p>
    </MessageBubble>
  )
}
