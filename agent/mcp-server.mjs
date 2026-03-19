#!/usr/bin/env node
import { execSync } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const AGENT_ID = process.env.AGENT_ID;
const BACKEND_URL = process.env.BACKEND_URL;

const server = new McpServer({
  name: "do-my-job-tools",
  version: "1.0.0",
});

server.tool(
  "submit_review",
  "Submit your code changes for review. Call this when you are done making all code changes. It will generate a diff of all your modifications and send it to the user for review.",
  { summary: z.string().describe("A brief summary of the changes you made and why.") },
  async ({ summary }) => {
    try {
      execSync("git add -A", { cwd: "/workspace", stdio: "pipe" });
      const diff = execSync("git diff --cached", {
        cwd: "/workspace",
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
      });

      const res = await fetch(`${BACKEND_URL}/agents/${AGENT_ID}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary, diff }),
      });

      if (!res.ok) {
        throw new Error(`Backend responded ${res.status}`);
      }

      return {
        content: [{ type: "text", text: "Review submitted successfully. The user has been notified." }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: `Failed to submit review: ${err.message}` }],
        isError: true,
      };
    }
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
