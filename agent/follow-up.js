const WebSocket = require("ws");
const { spawn } = require("child_process");

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:3001";
const AGENT_ID = process.env.AGENT_ID;
const WS_URL = BACKEND_URL.replace(/^http/, "ws") + "/ws";

console.log(`[follow-up] connecting to ${WS_URL}`);
const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log("[follow-up] connected, registering agent");
  ws.send(JSON.stringify({ type: "register_agent", agentId: AGENT_ID }));
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());
  if (msg.type !== "user_message") return;

  console.log(`[follow-up] received message, running claude --continue`);
  const child = spawn(
    "claude",
    [
      "--continue",
      "--output-format",
      "stream-json",
      "--verbose",
      "--allowedTools",
      process.env.CLAUDE_ALLOWED_TOOLS || "",
      "-p",
      msg.content,
    ],
    { cwd: "/workspace", stdio: ["ignore", "inherit", "inherit"] }
  );

  child.on("close", (code) => {
    console.log(`[follow-up] claude exited with code ${code}`);
    ws.send(JSON.stringify({ type: "agent_ready", agentId: AGENT_ID }));
  });
});

ws.on("close", () => {
  console.log("[follow-up] WS closed, exiting");
  process.exit(0);
});

ws.on("error", (err) => {
  console.error("[follow-up] WS error:", err.message);
  process.exit(1);
});
