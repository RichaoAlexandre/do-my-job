import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type MessageType =
  | "assistant"
  | "thinking"
  | "tool_call"
  | "tool_result"
  | "system"
  | "user";

const styles = {
  assistant: {
    border: "border-zinc-700",
    label: "Assistant",
    labelColor: "text-zinc-400",
    bg: "bg-zinc-900",
    text: "text-zinc-200",
  },
  thinking: {
    border: "border-zinc-800",
    label: "Thinking",
    labelColor: "text-zinc-500",
    bg: "bg-zinc-950",
    text: "text-zinc-500",
  },
  tool_call: {
    border: "border-zinc-700",
    label: "Tool",
    labelColor: "text-blue-400",
    bg: "bg-zinc-900",
    text: "text-zinc-300",
  },
  tool_result: {
    border: "border-zinc-700",
    label: "Result",
    labelColor: "text-green-400",
    bg: "bg-zinc-900",
    text: "text-zinc-300",
  },
  system: {
    border: "border-zinc-800",
    label: "System",
    labelColor: "text-yellow-400",
    bg: "bg-zinc-950",
    text: "text-zinc-500",
  },
  user: {
    border: "border-zinc-700",
    label: "User",
    labelColor: "text-cyan-400",
    bg: "bg-zinc-900",
    text: "text-zinc-300",
  },
};

interface MessageBubbleProps {
  type: MessageType;
  children: ReactNode;
  label?: string;
}

export default function MessageBubble({
  type,
  children,
  label,
}: MessageBubbleProps) {
  const s = styles[type];

  return (
    <div className={cn("rounded-lg border px-4 py-3", s.border, s.bg)}>
      <span
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide block mb-1.5",
          s.labelColor,
        )}
      >
        {label ?? s.label}
      </span>
      <div className={cn("text-sm font-mono", s.text)}>{children}</div>
    </div>
  );
}
