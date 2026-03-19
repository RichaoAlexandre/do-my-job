import type { Agent, AgentStatus } from "../types.js";

const agents = new Map<string, Agent>();

export function getAgent(id: string): Agent | undefined {
  return agents.get(id);
}

export function getAllAgents(): Agent[] {
  return Array.from(agents.values());
}

export function addAgent(agent: Agent): void {
  agents.set(agent.id, agent);
}

export function updateAgentStatus(id: string, status: AgentStatus): void {
  const agent = agents.get(id);
  if (agent) {
    agent.status = status;
  }
}

export function appendAgentLog(id: string, event: unknown): void {
  const agent = agents.get(id);
  if (agent) {
    agent.log.push(event);
  }
}

export function removeAgent(id: string): void {
  agents.delete(id);
}
