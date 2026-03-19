import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { handleMessage, handleClose } from "./ws-handler.js";
import {
  addAgent,
  getAgent,
  getAllAgents,
  removeAgent,
  updateAgentStatus,
} from "./agents.js";
import { createAgentContainer, stopAgentContainer } from "./docker.js";
import { broadcastToSubscribers } from "./ws-handler.js";

const app = new Hono();
app.use("*", cors());
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get("/health", (c) => c.json({ status: "ok" }));

// REST: list agents
app.get("/agents", (c) => {
  return c.json(getAllAgents());
});

// REST: create agent
app.post("/agents", async (c) => {
  const raw = await c.req.json<{ task: string; repoUrl: string }>();
  const body = {
    task: raw.task.replace(/[\uFEFF]/g, "").trim(),
    repoUrl: raw.repoUrl.replace(/[\uFEFF]/g, "").trim(),
  };
  const agentId = crypto.randomUUID();
  const env: Record<string, string> = {};
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
    name: agentId.slice(0, 8),
    repoUrl: body.repoUrl,
    instruction: body.task,
    status: "solving" as const,
    containerId: "",
    log: [],
    createdAt: new Date().toISOString(),
  };

  try {
    const containerId = await createAgentContainer({
      agentId,
      name: agent.name,
      repoUrl: agent.repoUrl,
      instruction: agent.instruction,
      env,
    });
    agent.containerId = containerId;
    addAgent(agent);
    return c.json(agent, 201);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create agent";
    return c.json({ error: message }, 500);
  }
});

// REST: terminate agent
app.delete("/agents/:id", async (c) => {
  const agentId = c.req.param("id");
  const agent = getAgent(agentId);
  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }
  try {
    await stopAgentContainer(agent.containerId);
    updateAgentStatus(agentId, "stopped");
    broadcastToSubscribers(agentId, {
      type: "agent_status",
      agentId,
      status: "stopped",
    });
    removeAgent(agentId);
    return c.json({ ok: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to stop agent";
    return c.json({ error: message }, 500);
  }
});

// REST: agent submits review (called by MCP server inside container)
app.post("/agents/:id/review", async (c) => {
  const agentId = c.req.param("id");
  const agent = getAgent(agentId);
  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }
  const body = await c.req.json<{ summary: string; diff: string }>();
  broadcastToSubscribers(agentId, {
    type: "review_ready",
    agentId,
    summary: body.summary,
    diff: body.diff,
  });
  return c.json({ ok: true });
});

app.get(
  "/ws",
  upgradeWebSocket(() => ({
    onMessage(evt, ws) {
      const data =
        typeof evt.data === "string" ? evt.data : evt.data.toString();
      handleMessage(ws, data);
    },
    onClose(_, ws) {
      handleClose(ws);
    },
  })),
);

const port = Number(process.env.PORT ?? 3001);
const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend listening on :${port}`);
});

injectWebSocket(server);
