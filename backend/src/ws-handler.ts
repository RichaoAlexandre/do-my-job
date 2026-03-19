import type { WSContext } from "hono/ws";
import type { ClientMessage, ServerMessage } from "./types.js";
import {
  addAgent,
  getAgent,
  getAllAgents,
  updateAgentStatus,
} from "./agents.js";
import { createAgentContainer, stopAgentContainer } from "./docker.js";

type WS = WSContext<WebSocket>;

// agentId -> Set of subscribed WebSocket clients
const subscriptions = new Map<string, Set<WS>>();
// ws -> Set of agentIds it's subscribed to
const clientSubs = new Map<WS, Set<string>>();

export function broadcastToSubscribers(
  agentId: string,
  message: ServerMessage,
): void {
  const subs = subscriptions.get(agentId);
  if (!subs) {
    return;
  }
  const data = JSON.stringify(message);
  for (const ws of subs) {
    ws.send(data);
  }
}

function subscribe(ws: WS, agentId: string): void {
  if (!subscriptions.has(agentId)) subscriptions.set(agentId, new Set());
  subscriptions.get(agentId)!.add(ws);

  if (!clientSubs.has(ws)) clientSubs.set(ws, new Set());
  clientSubs.get(ws)!.add(agentId);

  const agent = getAgent(agentId);
  if (agent) {
    for (const event of agent.log) {
      ws.send(JSON.stringify({ type: "agent_output", agentId, event }));
    }
    if (agent.review) {
      ws.send(
        JSON.stringify({
          type: "review_ready",
          agentId,
          summary: agent.review.summary,
          diff: agent.review.diff,
        }),
      );
    }
  }
}

function unsubscribe(ws: WS, agentId: string): void {
  subscriptions.get(agentId)?.delete(ws);
  clientSubs.get(ws)?.delete(agentId);
}

export function handleClose(ws: WS): void {
  const subs = clientSubs.get(ws);
  if (subs) {
    for (const agentId of subs) {
      subscriptions.get(agentId)?.delete(ws);
    }
  }
  clientSubs.delete(ws);
}

export async function handleMessage(ws: WS, raw: string): Promise<void> {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
    return;
  }

  switch (msg.type) {
    case "create_agent": {
      const agentId = crypto.randomUUID();
      const env: Record<string, string> = {};
      // Pass through required env vars from backend's environment
      for (const key of [
        "GITHUB_TOKEN",
        "ANTHROPIC_API_KEY",
        "CLAUDE_CODE_USE_BEDROCK",
        "AWS_REGION",
        "AWS_BEARER_TOKEN_BEDROCK",
        "ANTHROPIC_MODEL",
        "ANTHROPIC_SMALL_FAST_MODEL",
        "CLAUDE_ALLOWED_TOOLS",
      ]) {
        if (process.env[key]) env[key] = process.env[key]!;
      }

      const agent = {
        id: agentId,
        name: msg.name,
        repoUrl: msg.repoUrl,
        instruction: msg.instruction,
        status: "solving" as const,
        containerId: "",
        log: [],
        review: null,
        createdAt: new Date().toISOString(),
      };

      try {
        const containerId = await createAgentContainer({
          agentId,
          name: msg.name,
          repoUrl: msg.repoUrl,
          instruction: msg.instruction,
          env,
        });
        agent.containerId = containerId;
        addAgent(agent);

        const created: ServerMessage = { type: "agent_created", agent };
        // Broadcast to all connected clients
        ws.send(JSON.stringify(created));
        // Auto-subscribe creator
        subscribe(ws, agentId);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to create agent";
        ws.send(JSON.stringify({ type: "error", message }));
      }
      break;
    }

    case "stop_agent": {
      const agent = getAgent(msg.agentId);
      if (!agent) {
        ws.send(JSON.stringify({ type: "error", message: "Agent not found" }));
        return;
      }
      try {
        await stopAgentContainer(agent.containerId);
        updateAgentStatus(msg.agentId, "stopped");
        broadcastToSubscribers(msg.agentId, {
          type: "agent_status",
          agentId: msg.agentId,
          status: "stopped",
        });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to stop agent";
        ws.send(JSON.stringify({ type: "error", message }));
      }
      break;
    }

    case "subscribe":
      subscribe(ws, msg.agentId);
      break;

    case "unsubscribe":
      unsubscribe(ws, msg.agentId);
      break;

    case "list_agents": {
      const agents = getAllAgents();
      ws.send(JSON.stringify({ type: "agents_list", agents }));
      break;
    }
  }
}
