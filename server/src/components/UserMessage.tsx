import MessageBubble from './MessageBubble'

interface UserMessageProps {
  text: string
}

export default function UserMessage({ text }: UserMessageProps) {
  return (
    <MessageBubble type="user">
      <p className="whitespace-pre-wrap">{text}</p>
    </MessageBubble>
  )
}
