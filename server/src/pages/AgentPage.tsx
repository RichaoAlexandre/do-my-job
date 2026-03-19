import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";
import AssistantMessage from "../components/AssistantMessage";
import ThinkingMessage from "../components/ThinkingMessage";
import ToolCallMessage from "../components/ToolCallMessage";
import ToolResultMessage from "../components/ToolResultMessage";
import SystemMessage from "../components/SystemMessage";
import UserMessage from "../components/UserMessage";
import {
  type AgentEvent,
  type AssistantEvent,
  type UserEvent,
  type ContentBlock,
  BlockTypes,
} from "../types/messages.types";

type Review = {
  summary: string;
  diff: string;
};

function toolResultToString(
  content: string | { type: string; [key: string]: unknown }[],
): string {
  if (typeof content === "string") return content;
  return content
    .map((part) => ("text" in part ? String(part.text) : JSON.stringify(part)))
    .join("\n");
}

function renderContentBlock(block: ContentBlock, key: string) {
  switch (block.type) {
    case BlockTypes.text:
      return <AssistantMessage key={key} text={block.text} />;
    case BlockTypes.thinking:
      return <ThinkingMessage key={key} text={block.thinking} />;
    case BlockTypes.tool_use:
      return (
        <ToolCallMessage
          key={key}
          toolName={block.name}
          input={JSON.stringify(block.input, null, 2)}
        />
      );
    case BlockTypes.tool_result:
      return (
        <ToolResultMessage
          key={key}
          content={toolResultToString(block.content)}
        />
      );
  }
}

function renderEvent(event: AgentEvent, index: number) {
  switch (event.type) {
    case "assistant": {
      const evt = event as AssistantEvent;
      return evt.message.content.map((block, j) =>
        renderContentBlock(block, `${index}-${j}`),
      );
    }
    case "user": {
      const evt = event as UserEvent;
      return evt.message.content.map((block, j) => {
        if (block.type === "text") {
          return <UserMessage key={`${index}-${j}`} text={block.text} />;
        }
        if (block.type === "tool_result") {
          return (
            <ToolResultMessage
              key={`${index}-${j}`}
              content={toolResultToString(block.content)}
            />
          );
        }
        return renderContentBlock(block, `${index}-${j}`);
      });
    }
    case "system":
      return (
        <SystemMessage
          key={index}
          text={`Session started (${event.subtype})`}
        />
      );
    case "result":
      return (
        <SystemMessage
          key={index}
          text={
            event.is_error
              ? `Error: ${event.result}`
              : `Done — ${event.num_turns} turns, ${event.duration_ms}ms`
          }
        />
      );
    case "text":
    case "stderr":
      return event.text.trim() ? (
        <AssistantMessage key={index} text={event.text} />
      ) : null;
    default:
      return null;
  }
}

export default function AgentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [status, setStatus] = useState<string>("solving");
  const [review, setReview] = useState<Review | null>(null);
  const [terminating, setTerminating] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", agentId: id }));
    };

    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.type === "agent_output" && msg.agentId === id) {
        setEvents((prev) => [...prev, msg.event as AgentEvent]);
      }
      if (msg.type === "agent_status" && msg.agentId === id) {
        setStatus(msg.status);
      }
      if (msg.type === "review_ready" && msg.agentId === id) {
        setReview({ summary: msg.summary, diff: msg.diff });
      }
    };

    return () => {
      ws.close();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  async function handleTerminate() {
    if (!id) return;
    setTerminating(true);
    try {
      await fetch(`/api/agents/${id}`, { method: "DELETE" });
      navigate("/");
    } catch (err) {
      console.error(err);
      setTerminating(false);
    }
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            &larr; Back
          </button>
          <h1 className="text-sm font-mono text-zinc-400">
            Agent {id?.slice(0, 8)}
          </h1>
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              status === "solving" && "bg-yellow-900 text-yellow-300",
              status === "finished" && "bg-green-900 text-green-300",
              status !== "solving" &&
                status !== "finished" &&
                "bg-red-900 text-red-300",
            )}
          >
            {status}
          </span>
        </div>
        <button
          onClick={handleTerminate}
          disabled={terminating || status !== "solving"}
          className="px-4 py-2 rounded-lg bg-red-900 hover:bg-red-800 text-red-200 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {terminating ? "Terminating..." : "Terminate"}
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-3 font-mono text-sm">
          {events.map((event, i) => renderEvent(event, i))}

          {review && (
            <div className="border border-zinc-800 rounded-lg p-6 mt-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-900 text-green-300">
                  Review Ready
                </span>
              </div>
              <p className="text-sm text-zinc-300 mb-4">{review.summary}</p>
              <pre className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-auto text-xs leading-relaxed">
                {review.diff.split("\n").map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith("+") && !line.startsWith("+++")
                        ? "text-green-400"
                        : line.startsWith("-") && !line.startsWith("---")
                          ? "text-red-400"
                          : line.startsWith("@@")
                            ? "text-blue-400"
                            : "text-zinc-500"
                    }
                  >
                    {line}
                  </div>
                ))}
              </pre>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
