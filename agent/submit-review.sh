#!/bin/bash
set -euo pipefail

SUMMARY="${1:?Usage: submit-review.sh <summary>}"

cd /workspace
git add -A
DIFF=$(git diff --cached -U9999)

curl -s -X POST "${BACKEND_URL}/agents/${AGENT_ID}/review" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg summary "$SUMMARY" --arg diff "$DIFF" '{summary: $summary, diff: $diff}')"
