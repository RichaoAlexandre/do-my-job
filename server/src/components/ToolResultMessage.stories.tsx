import ToolResultMessage from './ToolResultMessage'

export default { title: 'ToolResultMessage' }

export const Short = () => (
  <div className="max-w-2xl">
    <ToolResultMessage content="File edited successfully." />
  </div>
)

export const TestOutput = () => (
  <div className="max-w-2xl">
    <ToolResultMessage
      content={`PASS src/payment.test.ts
  Payment Processing
    ✓ processes valid payment (45ms)
    ✓ rejects expired card (12ms)
    ✓ handles concurrent requests (8ms)
    ✓ validates card number format (3ms)
    ✗ handles network timeout (102ms)

      Expected: "timeout_error"
      Received: undefined

4 passed, 1 failed`}
    />
  </div>
)

export const LongOutput = () => (
  <div className="max-w-2xl">
    <ToolResultMessage
      content={Array.from({ length: 40 }, (_, i) => `${i + 1}: import { module${i} } from './module${i}'`).join('\n')}
    />
  </div>
)

export const CodeBlock = () => (
  <div className="max-w-2xl">
    <ToolResultMessage
      content={`import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET

export function signToken(payload: Record<string, unknown>) {
  return jwt.sign(payload, SECRET, { expiresIn: '15m' })
}

export function verifyToken(token: string) {
  return jwt.verify(token, SECRET)
}`}
    />
  </div>
)
