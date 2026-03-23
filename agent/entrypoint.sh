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
: "${AGENT_ID:?AGENT_ID is required}"

WORK_DIR="/workspace"
BRANCH_NAME="agent/${AGENT_NAME}"

# Inject token into the clone URL for authentication
AUTH_URL="${REPO_URL/https:\/\//https://${GITHUB_TOKEN}@}"

echo "==> Cloning $REPO_URL (main)..."
git clone "$AUTH_URL" "$WORK_DIR"
cd "$WORK_DIR"

# Configure git identity
git config user.email "${GIT_USER_EMAIL:-agent@do-my-job.local}"
git config user.name "${GIT_USER_NAME:-Do My Job Agent}"

# Copy CLAUDE.md into the workspace root so Claude Code picks it up
cp /CLAUDE.md "$WORK_DIR/CLAUDE.md"

echo "==> Creating branch $BRANCH_NAME..."
git checkout -b "$BRANCH_NAME"

echo "==> Running Claude Code..."
claude \
  --output-format stream-json \
  --verbose \
  --allowedTools "${CLAUDE_ALLOWED_TOOLS}" \
  -p "$INSTRUCTION"

echo "==> Starting follow-up listener..."
node /follow-up.js
