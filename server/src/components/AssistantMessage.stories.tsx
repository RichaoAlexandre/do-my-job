import AssistantMessage from './AssistantMessage'

export default { title: 'AssistantMessage' }

export const Short = () => (
  <div className="max-w-2xl">
    <AssistantMessage text="Done." />
  </div>
)

export const Long = () => (
  <div className="max-w-2xl">
    <AssistantMessage text="I've analyzed the codebase and found several issues with the current implementation. The authentication module is using deprecated session-based cookies which are vulnerable to CSRF attacks. I recommend migrating to JWT tokens with short-lived access tokens and long-lived refresh tokens stored in HTTP-only cookies. This approach provides better security, scalability across distributed systems, and easier integration with mobile clients." />
  </div>
)

export const Multiline = () => (
  <div className="max-w-2xl">
    <AssistantMessage
      text={`Here's what I found:\n\n1. The database connection pool is exhausted\n2. Queries are not using prepared statements\n3. There's no retry logic for transient failures\n\nI'll fix each of these issues.`}
    />
  </div>
)
