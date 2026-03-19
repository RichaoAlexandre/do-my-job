import MessageBubble from './MessageBubble'

export default { title: 'MessageBubble' }

export const CustomLabel = () => (
  <div className="max-w-2xl space-y-3">
    <MessageBubble type="tool_call" label="CustomLabel">
      <p>MessageBubble with a custom label override</p>
    </MessageBubble>
    <MessageBubble type="assistant">
      <p>MessageBubble with default label</p>
    </MessageBubble>
  </div>
)

export const AllTypes = () => (
  <div className="max-w-2xl space-y-3">
    <MessageBubble type="assistant"><p>assistant</p></MessageBubble>
    <MessageBubble type="thinking"><p>thinking</p></MessageBubble>
    <MessageBubble type="tool_call"><p>tool_call</p></MessageBubble>
    <MessageBubble type="tool_result"><p>tool_result</p></MessageBubble>
    <MessageBubble type="system"><p>system</p></MessageBubble>
    <MessageBubble type="user"><p>user</p></MessageBubble>
  </div>
)
