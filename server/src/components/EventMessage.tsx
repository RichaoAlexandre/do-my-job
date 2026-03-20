import { toolResultToString } from "../lib/toolResultToString";
import ContentBlockMessage from "./ContentBlockMessage";
import ToolResultMessage from "./ToolResultMessage";
import SystemMessage from "./SystemMessage";
import UserMessage from "./UserMessage";
import type { AgentEvent } from "../types/messages.types";

type EventMessageProps = {
  event: AgentEvent;
};

export default function EventMessage({ event }: EventMessageProps) {
  switch (event.type) {
    case "assistant":
      return event.message.content.map((block, j) => (
        <ContentBlockMessage key={j} block={block} />
      ));
    case "user":
      return event.message.content.map((block, j) => {
        if (block.type === "text") {
          return <UserMessage key={j} text={block.text} />;
        }
        if (block.type === "tool_result") {
          return (
            <ToolResultMessage
              key={j}
              content={toolResultToString(block.content)}
            />
          );
        }
        return <ContentBlockMessage key={j} block={block} />;
      });
    case "system":
      return <SystemMessage text={`Session started (${event.subtype})`} />;
    case "result":
      return (
        <SystemMessage
          text={
            event.is_error
              ? `Error: ${event.result}`
              : `Done — ${event.num_turns} turns, ${event.duration_ms}ms`
          }
        />
      );
    case "text":
    case "stderr":
      return event.text.trim() ? <SystemMessage text={event.text} /> : null;
    default:
      return null;
  }
}
