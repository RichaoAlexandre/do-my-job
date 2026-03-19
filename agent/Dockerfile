FROM node:20-slim

# Install git and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates curl && \
    rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Install MCP SDK dependencies
RUN npm install -g @modelcontextprotocol/sdk zod

# Copy MCP server and config
COPY mcp-server.mjs /mcp-server.mjs
COPY mcp.json /mcp.json

# Copy CLAUDE.md (will be copied into workspace by entrypoint)
COPY CLAUDE.md /CLAUDE.md

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
