import AssistantMessage from './AssistantMessage'
import ThinkingMessage from './ThinkingMessage'
import ToolCallMessage from './ToolCallMessage'
import ToolResultMessage from './ToolResultMessage'
import SystemMessage from './SystemMessage'
import UserMessage from './UserMessage'

export default { title: 'Conversation' }

export const FullFlow = () => (
  <div className="max-w-2xl space-y-3">
    <SystemMessage text="Session initialized. Working directory: /workspace" />
    <UserMessage text="Please refactor the authentication module to use JWT tokens instead of session cookies." />
    <ThinkingMessage
      text={`The user wants to refactor auth from session cookies to JWT. I should:\n1. Find the current auth implementation\n2. Replace session logic with JWT signing/verification\n3. Update middleware`}
    />
    <ToolCallMessage
      toolName="Read"
      input={JSON.stringify({ file_path: '/workspace/src/auth/session.ts' }, null, 2)}
    />
    <ToolResultMessage
      content={`import session from 'express-session'\n\nexport function setupAuth(app) {\n  app.use(session({\n    secret: process.env.SESSION_SECRET,\n    resave: false,\n    saveUninitialized: false,\n  }))\n}`}
    />
    <AssistantMessage text="I can see the current session-based auth. I'll replace it with JWT token handling." />
    <ToolCallMessage
      toolName="Edit"
      input={JSON.stringify(
        {
          file_path: '/workspace/src/auth/session.ts',
          old_string: "import session from 'express-session'",
          new_string: "import jwt from 'jsonwebtoken'",
        },
        null,
        2,
      )}
    />
    <ToolResultMessage content="File edited successfully." />
    <AssistantMessage text="Done. The auth module now uses JWT tokens. I updated the middleware, login, and verification logic." />
  </div>
)
