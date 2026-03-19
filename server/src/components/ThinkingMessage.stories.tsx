import ThinkingMessage from './ThinkingMessage'

export default { title: 'ThinkingMessage' }

export const Short = () => (
  <div className="max-w-2xl">
    <ThinkingMessage text="Let me check the file structure." />
  </div>
)

export const StepByStep = () => (
  <div className="max-w-2xl">
    <ThinkingMessage
      text={`The user wants to refactor auth from session cookies to JWT. I should:\n1. Find the current auth implementation\n2. Replace session logic with JWT signing/verification\n3. Update middleware\n4. Add token refresh endpoint\n5. Update tests`}
    />
  </div>
)

export const Long = () => (
  <div className="max-w-2xl">
    <ThinkingMessage text="This is a complex request. The user wants to migrate the entire authentication system. I need to consider backwards compatibility, existing sessions, database schema changes, and the impact on all downstream services. The current session store is Redis-backed, so I also need to plan the deprecation of that dependency. Let me start by mapping all the affected files and endpoints." />
  </div>
)
