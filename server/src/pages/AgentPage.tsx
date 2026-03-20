import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "../lib/cn";
import EventMessage from "../components/EventMessage";
import ReviewCard from "../components/ReviewCard";
import type { AgentEvent } from "../types/messages.types";
import { deleteAgent } from "../connectors/api";

type Review = {
  summary: string;
  diff: string;
};

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
    if (!id) {
      return;
    }
    setTerminating(true);
    try {
      await deleteAgent(id);
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
          {events.map((event, i) => (
            <EventMessage key={i} event={event} />
          ))}

          {review && (
            <ReviewCard summary={review.summary} diff={review.diff} />
          )}

          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
