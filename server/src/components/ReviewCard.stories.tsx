import ReviewCard from "./ReviewCard";

export default { title: "ReviewCard" };

const singleFileDiff = `diff --git a/src/auth.ts b/src/auth.ts
index 1a2b3c4..5d6e7f8 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,10 +10,12 @@ import { verify } from 'jsonwebtoken';

 const SECRET = process.env.JWT_SECRET;

-export function authenticate(token: string) {
-  const session = getSession(token);
-  if (!session) return null;
-  return session.user;
+export async function authenticate(token: string) {
+  const decoded = verifyJWT(token);
+  if (!decoded) return null;
+
+  const user = await getUser(decoded.sub);
+  return user;
 }

 export function generateToken(userId: string) {`;

export const SingleFile = () => (
  <div className="max-w-3xl bg-zinc-950 p-6">
    <ReviewCard
      summary="Migrated authentication from session-based cookies to JWT tokens for improved security."
      diff={singleFileDiff}
    />
  </div>
);

const multiFileDiff = `diff --git a/src/db.ts b/src/db.ts
index aaa1111..bbb2222 100644
--- a/src/db.ts
+++ b/src/db.ts
@@ -1,8 +1,15 @@
-import { createPool } from 'mysql2';
+import { createPool, PoolOptions } from 'mysql2/promise';
+import { retry } from './utils/retry';

-const pool = createPool({ host: 'localhost', user: 'root' });
+const poolConfig: PoolOptions = {
+  host: process.env.DB_HOST,
+  user: process.env.DB_USER,
+  password: process.env.DB_PASS,
+  connectionLimit: 10,
+};
+
+const pool = createPool(poolConfig);

 export async function query(sql: string, params: unknown[]) {
-  const [rows] = await pool.execute(sql, params);
-  return rows;
+  return retry(async () => {
+    const [rows] = await pool.execute(sql, params);
+    return rows;
+  }, { retries: 3, delay: 500 });
 }
diff --git a/src/utils/retry.ts b/src/utils/retry.ts
new file mode 100644
--- /dev/null
+++ b/src/utils/retry.ts
@@ -0,0 +1,18 @@
+type RetryOptions = {
+  retries: number;
+  delay: number;
+};
+
+export async function retry<T>(
+  fn: () => Promise<T>,
+  opts: RetryOptions,
+): Promise<T> {
+  for (let i = 0; i < opts.retries; i++) {
+    try {
+      return await fn();
+    } catch (err) {
+      if (i === opts.retries - 1) throw err;
+      await new Promise((r) => setTimeout(r, opts.delay));
+    }
+  }
+  throw new Error("unreachable");
+}`;

const fullFileContextDiff = `diff --git a/src/server.ts b/src/server.ts
index abc1234..def5678 100644
--- a/src/server.ts
+++ b/src/server.ts
@@ -1,45 +1,52 @@
 import express from 'express';
 import cors from 'cors';
 import helmet from 'helmet';
+import rateLimit from 'express-rate-limit';
 import { createServer } from 'http';
 import { WebSocketServer } from 'ws';
 import { router as apiRouter } from './routes/api';
 import { router as authRouter } from './routes/auth';
 import { connectDB } from './db';
 import { logger } from './lib/logger';

 const app = express();
 const port = process.env.PORT || 3000;

 // Middleware
 app.use(helmet());
 app.use(cors({ origin: process.env.CORS_ORIGIN }));
 app.use(express.json({ limit: '10mb' }));
+app.use(rateLimit({
+  windowMs: 15 * 60 * 1000,
+  max: 100,
+  standardHeaders: true,
+}));

 // Health check
 app.get('/health', (_req, res) => {
   res.json({ status: 'ok', uptime: process.uptime() });
 });

 // Routes
 app.use('/api', apiRouter);
 app.use('/auth', authRouter);

 // Error handler
-app.use((err, _req, res, _next) => {
-  logger.error(err.stack);
-  res.status(500).json({ error: 'Internal server error' });
+app.use((err, _req, res, _next) => {
+  logger.error({ err, url: _req.url, method: _req.method });
+  const status = err.statusCode || 500;
+  res.status(status).json({ error: err.message || 'Internal server error' });
 });

 // Start
 async function main() {
   await connectDB();

   const server = createServer(app);
   const wss = new WebSocketServer({ server });

   wss.on('connection', (ws) => {
     logger.info('WebSocket client connected');
-    ws.on('close', () => logger.info('Client disconnected'));
+    ws.on('close', (code) => logger.info(\`Client disconnected: \${code}\`));
   });

   server.listen(port, () => {
     logger.info(\`Server running on port \${port}\`);
   });
 }

 main().catch((err) => {
   logger.fatal(err);
   process.exit(1);
 });`;

export const FullFileContext = () => (
  <div className="max-w-3xl bg-zinc-950 p-6">
    <ReviewCard
      summary="Added rate limiting middleware and improved error handling with structured logging."
      diff={fullFileContextDiff}
    />
  </div>
);

export const MultipleFiles = () => (
  <div className="max-w-3xl bg-zinc-950 p-6">
    <ReviewCard
      summary="Refactored database connection pooling and added retry logic for transient failures."
      diff={multiFileDiff}
    />
  </div>
);
