import type { Agent } from "../types/agent.type";

export async function getAgents(): Promise<Agent[]> {
  const res = await fetch("/api/agents");
  return res.json();
}

export async function createAgent(
  task: string,
  repoUrl: string,
): Promise<Agent> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ task, repoUrl }),
  });
  if (!res.ok) {
    throw new Error("Failed to create agent");
  }
  return res.json();
}

export async function deleteAgent(id: string): Promise<void> {
  await fetch(`/api/agents/${id}`, { method: "DELETE" });
}
