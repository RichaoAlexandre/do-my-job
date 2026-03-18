# Plan: Stream Claude Code Output to Frontend

## Context

The project needs real-time bidirectional streaming of Claude Code output from Docker containers to a web dashboard. Currently, the agent container runs `claude -p` and dumps output at the end — there's no backend API, no streaming, and the frontend is a Vite starter template. This plan implements Steps 2-4 of the roadmap.

## Architecture

```
docker-compose.yml
├── frontend (Vite + React + Tailwind) :5173
├── backend  (Hono + hono/ws + Dockerode) :3001
└── shared network: do-my-job-net
        └── agent containers (spawned dynamically by backend)
```

- **Hono** (`@hono/node-server` + `hono/ws`) as the backend framework — lightweight, TypeScript-first, built-in WebSocket
- **WebSocket** for bidirectional frontend ↔ backend communication
- **Docker API** (via Dockerode) for spawning/attaching to agent containers
- **`claude --output-format stream-json`** for structured line-delimited JSON on stdout
- Backend mounts `/var/run/docker.sock` to create sibling containers on the same network
- **`docker compose up`** starts everything with a single command

## Implementation Steps

### 1. Modify agent entrypoint (`agent/entrypoint.sh`)
- Change line 33: add `--output-format stream-json` flag to the `claude` command
- This makes Claude output structured JSON events (one per line) to stdout

### 2. Create backend service (`backend/`)
- **Stack**: Hono + `@hono/node-server` + `hono/ws` + Dockerode + TypeScript
- **Package manager**: pnpm
- **Key files**:
  - `src/index.ts` — Hono app + WebSocket upgrade on `/ws` via `hono/ws`
  - `src/docker.ts` — Dockerode: create containers, attach to stdout, stop/remove
  - `src/agents.ts` — In-memory agent state store (`Map<string, Agent>`)
  - `src/ws-handler.ts` — WebSocket event routing + subscription management
  - `src/types.ts` — Shared types (Agent, WebSocket messages)
  - `Dockerfile` — Node 20, pnpm, builds TypeScript

**Docker attachment flow**:
- `container.attach({ stream: true, stdout: true, stderr: true })`
- Demux with `container.modem.demuxStream()`
- Parse line-delimited JSON from stdout
- Forward parsed events to subscribed WebSocket clients

**WebSocket protocol**:
| Direction | Event | Purpose |
|-----------|-------|---------|
| C→S | `create_agent` | Spawn new container |
| C→S | `stop_agent` | Stop container |
| C→S | `subscribe` / `unsubscribe` | Stream output for an agent |
| C→S | `list_agents` | Get all agents |
| S→C | `agent_created` | New agent broadcast |
| S→C | `agent_output` | Streamed Claude event |
| S→C | `agent_status` | Status change (solving/finished/error) |
| S→C | `agents_list` | Response to list_agents |

**Log replay**: When a client subscribes, backend replays all accumulated events for that agent.

### 3. Convert frontend to React dashboard (`server/`)
- Create `vite.config.ts` with React plugin + WebSocket proxy to backend
- Rewrite `main.ts` → `main.tsx` as React entry point
- Delete Vite template files (counter.ts, template assets)
- **Key components**: `App.tsx`, `AgentGrid`, `AgentCard`, `AgentDetail`, `StreamLog`, `CreateAgentForm`
- **Hooks**: `useWebSocket` (connection + reconnect), `useAgents` (state management)
- `StreamLog` renders Claude stream-json events in a terminal-like view, auto-scrolls
- Create `server/Dockerfile` for Vite dev server in Docker

### 4. Create `docker-compose.yml` (project root)
- `frontend` service: builds `server/`, exposes `:5173`
- `backend` service: builds `backend/`, exposes `:3001`, mounts Docker socket
- Shared network `do-my-job-net` that dynamic agent containers also join
- Backend discovers network name at runtime via `docker.listNetworks()`

### 5. Agent lifecycle
1. **Create**: client → `create_agent` → backend creates container, attaches to stdout, status = `solving`
2. **Stream**: stdout lines parsed as JSON → stored in agent log → forwarded to subscribers
3. **Complete**: `container.wait()` resolves → status = `finished` (exit 0) or `error`
4. **Stop**: client → `stop_agent` → `container.stop()` + `container.remove()`
5. **Reconnect**: `subscribe` triggers full log replay then live stream

## Verification
1. `docker compose up` — all services start, frontend accessible at `:5173`
2. Create an agent via the dashboard form
3. Verify agent card appears in grid with "solving" status
4. Click card → see live Claude output streaming in real-time
5. Wait for completion → status changes to "finished", diff is shown
6. Test stop button mid-run → container stops, status updates
7. Refresh page → agent list persists (in memory), subscribe replays logs
