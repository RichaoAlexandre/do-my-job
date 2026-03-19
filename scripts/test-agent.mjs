import WebSocket from "ws";

const WS_URL = process.env.WS_URL || "ws://localhost:3001/ws";

const ws = new WebSocket(WS_URL);

ws.on("open", () => {
  console.log(`Connected to ${WS_URL}\n`);

  ws.send(
    JSON.stringify({
      type: "create_agent",
      name: "cv-template",
      repoUrl: "https://github.com/anthropics/claude-code",
      instruction:
        "Create a fake CV template in HTML+CSS inside a cv/ folder at the root of the repo. The CV should include sections for: personal info, professional summary, work experience (2 fake jobs), education, skills, and languages. Use a clean modern design with a sidebar layout. The file should be cv/index.html with inline CSS. Use placeholder data for a fictional software engineer named Alex Martin.",
    })
  );

  console.log("Agent created, waiting for output...\n");
});

ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());

  switch (msg.type) {
    case "agent_created":
      console.log(`[CREATED] Agent ${msg.agent.id} (${msg.agent.name})`);
      console.log(`  Container: ${msg.agent.containerId.slice(0, 12)}`);
      console.log(`  Status: ${msg.agent.status}\n`);
      break;

    case "agent_output":
      if (msg.event?.type === "stderr") {
        console.log(`[STDERR] ${msg.event.text.trim()}`);
      } else if (msg.event?.type === "text") {
        console.log(`[OUTPUT] ${msg.event.text}`);
      } else {
        console.log(`[EVENT]`, JSON.stringify(msg.event));
      }
      break;

    case "agent_status":
      console.log(`\n[STATUS] Agent ${msg.agentId}: ${msg.status}`);
      if (msg.status === "finished" || msg.status === "error") {
        console.log("\nDone. Closing connection.");
        ws.close();
      }
      break;

    case "error":
      console.error(`[ERROR] ${msg.message}`);
      ws.close();
      break;
  }
});

ws.on("error", (err) => {
  console.error("WebSocket error:", err.message);
  process.exit(1);
});

ws.on("close", () => {
  console.log("Disconnected.");
  process.exit(0);
});
