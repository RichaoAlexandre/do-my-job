import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface AgentEvent {
  type: string;
  [key: string]: unknown;
}

interface Review {
  summary: string;
  diff: string;
}

interface ContentBlock {
  type: "text" | "thinking" | "tool_use";
  text: string;
  toolName?: string;
  toolInput?: string;
}

function buildContentBlocks(events: AgentEvent[]): ContentBlock[] {
  const blocks: Map<number, ContentBlock> = new Map();

  for (const evt of events) {
    // Plain text lines from entrypoint (non-JSON output)
    if (evt.type === "text" || evt.type === "stderr") {
      const text = (evt.text as string) || "";
      blocks.set(blocks.size, { type: "text", text });
      continue;
    }

    if (evt.type !== "stream_event") {
      continue;
    }
    const inner = evt.event as Record<string, unknown>;
    if (!inner) continue;

    if (inner.type === "content_block_start") {
      const idx = inner.index as number;
      const block = inner.content_block as Record<string, unknown>;
      if (block.type === "thinking") {
        blocks.set(idx, { type: "thinking", text: "" });
      } else if (block.type === "tool_use") {
        blocks.set(idx, {
          type: "tool_use",
          text: "",
          toolName: (block.name as string) || "",
          toolInput: "",
        });
      } else {
        blocks.set(idx, { type: "text", text: "" });
      }
    }

    if (inner.type === "content_block_delta") {
      const idx = inner.index as number;
      const delta = inner.delta as Record<string, unknown>;
      const block = blocks.get(idx);
      if (!block) continue;

      if (delta.type === "text_delta") {
        block.text += delta.text as string;
      } else if (delta.type === "thinking_delta") {
        block.text += delta.thinking as string;
      } else if (delta.type === "input_json_delta") {
        block.toolInput =
          (block.toolInput || "") + (delta.partial_json as string);
      }
    }
  }

  return Array.from(blocks.values());
}

function ToolInput({ input }: { input: string }) {
  try {
    const parsed = JSON.parse(input);
    return (
      <pre className="mt-1 text-xs text-zinc-500 whitespace-pre-wrap">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    );
  } catch {
    return <span className="text-xs text-zinc-500">{input}</span>;
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
      console.log("message is ", msg);
      if (msg.type === "agent_output" && msg.agentId === id) {
        console.log("setting msg queue");
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

  const blocks = buildContentBlocks(events);

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
            className={`text-xs px-2 py-0.5 rounded-full ${
              status === "solving"
                ? "bg-yellow-900 text-yellow-300"
                : status === "finished"
                  ? "bg-green-900 text-green-300"
                  : "bg-red-900 text-red-300"
            }`}
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
        {review && (
          <div className="border-b border-zinc-800 p-6">
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

        <div className="p-6 space-y-3 font-mono text-sm">
          {blocks.map((block, i) => {
            if (block.type === "thinking") {
              return (
                <div key={i} className="border-l-2 border-purple-800 pl-3">
                  <span className="text-xs text-purple-400 block mb-1">
                    Thinking
                  </span>
                  <p className="text-zinc-500 whitespace-pre-wrap text-xs">
                    {block.text}
                  </p>
                </div>
              );
            }
            if (block.type === "tool_use") {
              return (
                <div key={i} className="border-l-2 border-blue-800 pl-3">
                  <span className="text-xs text-blue-400">
                    {block.toolName}
                  </span>
                  {block.toolInput && <ToolInput input={block.toolInput} />}
                </div>
              );
            }
            return (
              <div key={i} className="text-zinc-300 whitespace-pre-wrap">
                {block.text}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
