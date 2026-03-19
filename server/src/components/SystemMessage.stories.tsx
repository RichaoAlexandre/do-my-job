import SystemMessage from './SystemMessage'

export default { title: 'SystemMessage' }

export const Init = () => (
  <div className="max-w-2xl">
    <SystemMessage text="Session initialized. Working directory: /workspace" />
  </div>
)

export const Error = () => (
  <div className="max-w-2xl">
    <SystemMessage text="Error: Agent process exited with code 1. Restarting..." />
  </div>
)

export const Multiline = () => (
  <div className="max-w-2xl">
    <SystemMessage
      text={`Agent started. Claude Code v1.0.0\nModel: claude-opus-4-6\nTools: Read, Edit, Write, Bash, Glob, Grep\nWorking directory: /workspace`}
    />
  </div>
)
