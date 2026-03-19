import UserMessage from './UserMessage'

export default { title: 'UserMessage' }

export const Short = () => (
  <div className="max-w-2xl">
    <UserMessage text="Fix the tests." />
  </div>
)

export const Detailed = () => (
  <div className="max-w-2xl">
    <UserMessage text="Please refactor the authentication module to use JWT tokens instead of session cookies. Make sure to handle token refresh, add proper error messages for expired tokens, and update all the related tests." />
  </div>
)

export const Multiline = () => (
  <div className="max-w-2xl">
    <UserMessage
      text={`I need you to:\n1. Add input validation to the API endpoints\n2. Write unit tests for the validation logic\n3. Update the OpenAPI spec`}
    />
  </div>
)
