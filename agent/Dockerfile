FROM node:20-slim

# Install git, curl, jq
RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates curl jq && \
    rm -rf /var/lib/apt/lists/*

# Install Claude Code and ws globally
RUN npm install -g @anthropic-ai/claude-code ws
ENV NODE_PATH=/usr/local/lib/node_modules

# Copy submit review script
COPY submit-review.sh /submit-review.sh
RUN chmod +x /submit-review.sh

# Copy CLAUDE.md (will be copied into workspace by entrypoint)
COPY CLAUDE.md /CLAUDE.md

# Copy follow-up WS client
COPY follow-up.js /follow-up.js

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
