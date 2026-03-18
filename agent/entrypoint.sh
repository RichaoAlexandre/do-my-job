#!/bin/bash
set -euo pipefail

# Required environment variables
: "${REPO_URL:?REPO_URL is required}"
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required}"
# Either ANTHROPIC_API_KEY or Bedrock credentials are required
if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -z "${CLAUDE_CODE_USE_BEDROCK:-}" ]; then
  echo "Error: Set either ANTHROPIC_API_KEY or Bedrock env vars (CLAUDE_CODE_USE_BEDROCK, AWS_REGION, AWS_BEARER_TOKEN_BEDROCK)"
  exit 1
fi
: "${INSTRUCTION:?INSTRUCTION is required}"
: "${AGENT_NAME:?AGENT_NAME is required}"

WORK_DIR="/workspace"
BRANCH_NAME="agent/${AGENT_NAME}"

# Inject token into the clone URL for authentication
# Turns https://github.com/user/repo.git into https://<token>@github.com/user/repo.git
AUTH_URL="${REPO_URL/https:\/\//https://${GITHUB_TOKEN}@}"

# Clone main branch
echo "==> Cloning $REPO_URL (main)..."
git clone "$AUTH_URL" "$WORK_DIR"
cd "$WORK_DIR"

# Create a new branch for this agent
echo "==> Creating branch $BRANCH_NAME..."
git checkout -b "$BRANCH_NAME"

# Run Claude Code with the instruction
echo "==> Running Claude Code with instruction..."
claude --allowedTools "${CLAUDE_ALLOWED_TOOLS}" -p "$INSTRUCTION"

# Output the diff
echo "==> Generating diff..."
git diff
