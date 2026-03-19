import MessageBubble from './MessageBubble'

interface SystemMessageProps {
  text: string
}

export default function SystemMessage({ text }: SystemMessageProps) {
  return (
    <MessageBubble type="system">
      <p className="whitespace-pre-wrap text-xs">{text}</p>
    </MessageBubble>
  )
}
