// Content block types within an Anthropic message

export const BlockTypes = {
  text: "text",
  thinking: "thinking",
  tool_use: "tool_use",
  tool_result: "tool_result",
} as const;

export type BlockType = keyof typeof BlockTypes;

export type TextBlock = {
  type: "text";
  text: string;
};

export type ThinkingBlock = {
  type: "thinking";
  thinking: string;
};

export type ToolUseBlock = {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type ToolResultBlock = {
  type: "tool_result";
  tool_use_id: string;
  content: string | { type: string; [key: string]: unknown }[];
};

export type ContentBlock =
  | TextBlock
  | ThinkingBlock
  | ToolUseBlock
  | ToolResultBlock;

export type AnthropicMessage = {
  id: string;
  type: "message";
  role: "assistant" | "user";
  model: string;
  content: ContentBlock[];
  stop_reason: string | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
};

// Claude Code stream-json event types, discriminated on `type`

export type AssistantEvent = {
  type: "assistant";
  uuid: string;
  session_id: string;
  parent_tool_use_id: string | null;
  message: AnthropicMessage;
};

export type UserEvent = {
  type: "user";
  uuid: string;
  session_id: string;
  message: {
    role: "user";
    content: ContentBlock[];
  };
};

export type SystemEvent = {
  type: "system";
  session_id: string;
  subtype: string;
};

export type ResultEvent = {
  type: "result";
  uuid: string;
  session_id: string;
  result: string;
  is_error: boolean;
  duration_ms: number;
  duration_api_ms: number;
  num_turns: number;
  cost_usd: number;
};

export type AgentEvent =
  | AssistantEvent
  | UserEvent
  | SystemEvent
  | ResultEvent
  | { type: "text"; text: string }
  | { type: "stderr"; text: string };
