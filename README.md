## DO MY JOB ! 

Little project with an interface to track the evolution and needs of your agents

## Architecture

### Overview

A web-based dashboard to visualize and interact with multiple AI agents, each running inside its own Docker container to solve a PR.

### Components

**1. Web Dashboard (Frontend)**
- Single-page app displaying a grid of agent boxes
- Each box represents one agent working on a PR
- Agent states:
  - **Solving** — agent is actively working on the PR
  - **Finished** — agent completed its task
  - **Blocked** — agent is stuck and needs attention
- Clicking a box opens the live chat/log of the Claude Code session running inside that agent's container

**2. Agent Orchestrator (Backend)**
- Manages the lifecycle of agent containers
- When the user adds a new agent, the orchestrator:
  1. Receives a simple objective (e.g. a PR description or issue)
  2. Spins up a new Docker container with Claude Code inside
  3. Passes the objective to the agent
  4. Tracks the agent's state (solving/finished/blocked) and streams its output to the dashboard
- Exposes an API for the frontend to:
  - Add a new agent with an objective
  - List all agents and their current states
  - Retrieve the chat/log stream for a specific agent

**3. Agent Containers (Docker)**
- Each agent runs in an isolated, lightweight Docker container
- The container contains Claude Code configured to solve the given objective
- Containers are ephemeral — spawned on agent creation, destroyed when no longer needed
- The agent communicates its state and chat output back to the orchestrator

### Flow

```
User adds agent with objective
        |
        v
  Orchestrator spawns Docker container
        |
        v
  Claude Code starts solving the PR inside the container
        |
        v
  State + chat output streamed to dashboard
        |
        v
  User monitors progress, clicks into any agent to see its live session
```

## Getting Started

### Prerequisites

- Docker
- A GitHub account
- An Anthropic API key

### Setup

1. Copy the example env file and fill in your secrets:

```bash
cp .env.example .env
```

2. Edit `.env` with your values:

| Variable | Description | Where to get it |
|---|---|---|
| `GITHUB_TOKEN` | GitHub PAT with `repo` scope | [github.com/settings/tokens](https://github.com/settings/tokens) |
| `ANTHROPIC_API_KEY` | Anthropic API key | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |

3. Build the agent image:

```bash
docker build -t do-my-job-agent ./agent
```

4. Run an agent:

```bash
docker run --env-file .env \
  -e REPO_URL="https://github.com/user/repo.git" \
  -e INSTRUCTION="Fix the bug in auth.py" \
  -e AGENT_NAME="fix-auth-bug" \
  do-my-job-agent
```

The agent will clone the repo from main, create a branch `agent/fix-auth-bug`, run Claude Code with the instruction, and output the resulting diff.

## Roadmap

### Step 1 — Agent Container Image

Build a Docker image that can:
- Accept a git repo URL and a branch name as input
- Clone the repo inside the container
- Accept a PR description / instruction as input
- Run Claude Code with the instruction (no tools, just the prompt)
- Output the resulting diff when done

Deliverable: a working Dockerfile + entrypoint script that, given a repo + instruction, produces a diff.

### Step 2 — Backend API

Simple server that can:
- Receive a request to create an agent (repo URL, branch, PR instruction)
- Spawn a Docker container with the inputs from Step 1
- Track the agent's state (`solving` / `finished` / `blocked`)
- Store and serve the agent's chat log (stdout stream from Claude Code)
- Store and serve the final diff produced by the agent
- List all agents and their current state

Deliverable: a running API with endpoints to create agents, list them, get their logs, and get their diffs.

### Step 3 — Frontend Dashboard

Web page that displays:
- A grid of agent cards, one per active agent
- Each card shows: agent name, PR instruction summary, current state
- State is color-coded (solving = blue, finished = green, blocked = red)
- Clicking a card opens a detail view with:
  - The live chat / log stream of the agent
  - The diff produced by the agent (once finished)

Deliverable: a functional dashboard connected to the backend API.

### Step 4 — Agent Creation Flow

Add a form in the dashboard to create a new agent:
- Input fields: repo URL, branch name, PR instruction
- On submit, calls the backend to spawn a new container
- The new agent card appears in the grid immediately in `solving` state

Deliverable: end-to-end flow from the UI — create an agent, watch it work, see the diff.

### Step 5 — Polish and Iteration

- Improve diff display (syntax highlighting, file-by-file view)
- Add ability to stop / restart an agent
- Handle error states and container cleanup
- Support multiple projects simultaneously
