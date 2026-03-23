export type AgentStatus = "solving" | "finished" | "error" | "stopped";

export interface Agent {
  id: string;
  name: string;
  repoUrl: string;
  instruction: string;
  status: AgentStatus;
  containerId: string;
  log: unknown[];
  review: { summary: string; diff: string } | null;
  createdAt: string;
}

export type ClientMessage =
  | { type: "create_agent"; name: string; repoUrl: string; instruction: string }
  | { type: "stop_agent"; agentId: string }
  | { type: "subscribe"; agentId: string }
  | { type: "unsubscribe"; agentId: string }
  | { type: "send_message"; agentId: string; content: string }
  | { type: "register_agent"; agentId: string }
  | { type: "agent_ready"; agentId: string }
  | { type: "list_agents" };

export type ServerMessage =
  | { type: "agent_created"; agent: Agent }
  | { type: "agent_output"; agentId: string; event: unknown }
  | { type: "agent_status"; agentId: string; status: AgentStatus }
  | { type: "agents_list"; agents: Agent[] }
  | { type: "review_ready"; agentId: string; summary: string; diff: string }
  | { type: "error"; message: string };
