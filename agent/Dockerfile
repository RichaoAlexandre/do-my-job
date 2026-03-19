FROM node:20-slim

# Install git, curl, jq
RUN apt-get update && \
    apt-get install -y --no-install-recommends git ca-certificates curl jq && \
    rm -rf /var/lib/apt/lists/*

# Install Claude Code globally
RUN npm install -g @anthropic-ai/claude-code

# Copy submit review script
COPY submit-review.sh /submit-review.sh
RUN chmod +x /submit-review.sh

# Copy CLAUDE.md (will be copied into workspace by entrypoint)
COPY CLAUDE.md /CLAUDE.md

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
