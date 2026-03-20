import type { ContentBlock } from "../types/messages.types";
import { BlockTypes } from "../types/messages.types";
import { toolResultToString } from "../lib/toolResultToString";
import AssistantMessage from "./AssistantMessage";
import ThinkingMessage from "./ThinkingMessage";
import ToolCallMessage from "./ToolCallMessage";
import ToolResultMessage from "./ToolResultMessage";

type ContentBlockMessageProps = {
  block: ContentBlock;
};

export default function ContentBlockMessage({
  block,
}: ContentBlockMessageProps) {
  switch (block.type) {
    case BlockTypes.text:
      return <AssistantMessage text={block.text} />;
    case BlockTypes.thinking:
      return <ThinkingMessage text={block.thinking} />;
    case BlockTypes.tool_use:
      return (
        <ToolCallMessage
          toolName={block.name}
          input={JSON.stringify(block.input, null, 2)}
        />
      );
    case BlockTypes.tool_result:
      return <ToolResultMessage content={toolResultToString(block.content)} />;
  }
}
