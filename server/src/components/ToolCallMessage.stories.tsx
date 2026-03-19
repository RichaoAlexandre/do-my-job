import ToolCallMessage from './ToolCallMessage'

export default { title: 'ToolCallMessage' }

export const JsonInput = () => (
  <div className="max-w-2xl">
    <ToolCallMessage
      toolName="Read"
      input={JSON.stringify({ file_path: '/workspace/src/auth/session.ts' }, null, 2)}
    />
  </div>
)

export const ComplexJson = () => (
  <div className="max-w-2xl">
    <ToolCallMessage
      toolName="Edit"
      input={JSON.stringify(
        {
          file_path: '/workspace/src/auth/session.ts',
          old_string: "import session from 'express-session'\n\nexport function setupAuth(app) {\n  app.use(session({\n    secret: process.env.SESSION_SECRET,\n    resave: false,\n  }))\n}",
          new_string: "import jwt from 'jsonwebtoken'\n\nexport function setupAuth(app) {\n  app.use(verifyToken)\n}",
        },
        null,
        2,
      )}
    />
  </div>
)

export const PlainTextFallback = () => (
  <div className="max-w-2xl">
    <ToolCallMessage toolName="Bash" input="npm test -- --grep payment" />
  </div>
)

export const EmptyInput = () => (
  <div className="max-w-2xl">
    <ToolCallMessage toolName="Bash" input="" />
  </div>
)

export const OverflowingContent = () => (
  <div className="max-w-2xl">
    <ToolCallMessage
      toolName="Write"
      input={JSON.stringify(
        {
          file_path: '/workspace/src/utils/helpers.ts',
          content: Array.from({ length: 50 }, (_, i) => `export function helper${i}() { return ${i} }`).join('\n'),
        },
        null,
        2,
      )}
    />
  </div>
)
