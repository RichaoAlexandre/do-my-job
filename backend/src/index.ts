import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { createNodeWebSocket } from "@hono/node-ws";
import { handleMessage, handleClose } from "./ws-handler.js";

const app = new Hono();
const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

app.get("/health", (c) => c.json({ status: "ok" }));

app.get(
  "/ws",
  upgradeWebSocket(() => ({
    onMessage(evt, ws) {
      const data =
        typeof evt.data === "string" ? evt.data : evt.data.toString();
      handleMessage(ws, data);
    },
    onClose(_, ws) {
      handleClose(ws);
    },
  })),
);

const port = Number(process.env.PORT ?? 3001);
const server = serve({ fetch: app.fetch, port }, () => {
  console.log(`Backend listening on :${port}`);
});

injectWebSocket(server);
