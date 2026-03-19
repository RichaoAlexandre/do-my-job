// Content block types within an Anthropic message

export interface TextBlock {
  type: "text"
  text: string
}

export interface ThinkingBlock {
  type: "thinking"
  thinking: string
}

export interface ToolUseBlock {
  type: "tool_use"
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResultBlock {
  type: "tool_result"
  tool_use_id: string
  content: string | { type: string; [key: string]: unknown }[]
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock

// Anthropic API message shape (subset of fields we use)

export interface AnthropicMessage {
  id: string
  type: "message"
  role: "assistant" | "user"
  model: string
  content: ContentBlock[]
  stop_reason: string | null
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens?: number
    cache_read_input_tokens?: number
  }
}

// Claude Code stream-json event types, discriminated on `type`

export interface AssistantEvent {
  type: "assistant"
  uuid: string
  session_id: string
  parent_tool_use_id: string | null
  message: AnthropicMessage
}

export interface UserEvent {
  type: "user"
  uuid: string
  session_id: string
  message: {
    role: "user"
    content: ContentBlock[]
  }
}

export interface SystemEvent {
  type: "system"
  session_id: string
  subtype: string
}

export interface ResultEvent {
  type: "result"
  uuid: string
  session_id: string
  result: string
  is_error: boolean
  duration_ms: number
  duration_api_ms: number
  num_turns: number
  cost_usd: number
}

export type AgentEvent =
  | AssistantEvent
  | UserEvent
  | SystemEvent
  | ResultEvent
  | { type: "text"; text: string }
  | { type: "stderr"; text: string }
