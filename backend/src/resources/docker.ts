import { PassThrough } from "node:stream";
import Dockerode from "dockerode";
import { appendAgentLog, updateAgentStatus } from "./agents.js";
import { broadcastToSubscribers } from "../connectors/ws-handler.js";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

const AGENT_IMAGE = "do-my-job-agent";

async function getNetworkName(): Promise<string> {
  const networks = await docker.listNetworks();
  const net = networks.find((n) => n.Name?.includes("do-my-job"));
  return net?.Name ?? "do-my-job-net";
}

export async function createAgentContainer(opts: {
  agentId: string;
  name: string;
  repoUrl: string;
  instruction: string;
  env: Record<string, string>;
}): Promise<string> {
  const networkName = await getNetworkName();

  const envVars = [
    `REPO_URL=${opts.repoUrl}`,
    `INSTRUCTION=${opts.instruction}`,
    `AGENT_NAME=${opts.name}`,
    `AGENT_ID=${opts.agentId}`,
    `BACKEND_URL=http://backend:3001`,
    ...Object.entries(opts.env).map(([k, v]) => `${k}=${v}`),
  ];

  const container = await docker.createContainer({
    Image: AGENT_IMAGE,
    name: `agent-${opts.name}-${opts.agentId.slice(0, 8)}`,
    Env: envVars,
    HostConfig: {
      NetworkMode: networkName,
    },
  });

  await container.start();
  const streamDone = attachToContainer(container, opts.agentId);
  waitForContainer(container, opts.agentId, streamDone);

  return container.id;
}

function attachToContainer(
  container: Dockerode.Container,
  agentId: string,
): Promise<void> {
  return container
    .attach({ stream: true, stdout: true, stderr: true })
    .then((stream) => {
      return new Promise<void>((resolve) => {
        const stdout = new PassThrough();
        const stderr = new PassThrough();
        container.modem.demuxStream(stream, stdout, stderr);

        function processLine(line: string) {
          if (!line.trim()) return;
          let event: unknown;
          try {
            event = JSON.parse(line);
          } catch {
            event = { type: "text", text: line };
          }
          console.log("line is ", line);
          appendAgentLog(agentId, event);
          broadcastToSubscribers(agentId, {
            type: "agent_output",
            agentId,
            event,
          });
        }

        let buffer = "";
        stdout.on("data", (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) processLine(line);
        });

        stdout.on("end", () => {
          if (buffer.trim()) processLine(buffer);
          resolve();
        });

        stderr.on("data", (chunk: Buffer) => {
          const text = chunk.toString();
          const event = { type: "stderr", text };
          appendAgentLog(agentId, event);
          broadcastToSubscribers(agentId, {
            type: "agent_output",
            agentId,
            event,
          });
        });
      });
    })
    .catch((err) => {
      console.error(`[${agentId}] attach error:`, err);
    });
}

function waitForContainer(
  container: Dockerode.Container,
  agentId: string,
  streamDone: Promise<void>,
) {
  container
    .wait()
    .then(async (result) => {
      await streamDone;
      const status = result.StatusCode === 0 ? "finished" : "error";
      updateAgentStatus(agentId, status);
      broadcastToSubscribers(agentId, {
        type: "agent_status",
        agentId,
        status,
      });
    })
    .catch((err) => {
      console.error(`[${agentId}] wait error:`, err);
      updateAgentStatus(agentId, "error");
      broadcastToSubscribers(agentId, {
        type: "agent_status",
        agentId,
        status: "error",
      });
    });
}

export async function stopAgentContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId);
  await container.stop().catch(() => {});
  await container.remove().catch(() => {});
}
