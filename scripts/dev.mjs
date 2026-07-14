// Dev orchestrator: starts the Go API on :8080 and the Vite dev server on
// :3000 (which proxies /api -> :8080). Both run until the process is killed.
import { spawn } from "node:child_process";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GO_PORT = process.env.GO_PORT || "8080";

const goEnv = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgres://moonbug:moonbug@localhost:5432/moonbug?sslmode=disable",
  PORT: GO_PORT,
  APP_ENV: process.env.APP_ENV || "development",
  STATIC_DIR: process.env.STATIC_DIR || path.join(root, "dist"),
};

const go = spawn("go", ["run", "./backend"], {
  cwd: root,
  env: goEnv,
  stdio: ["ignore", "pipe", "pipe"],
});

const goLog = (data) => process.stdout.write(`[go] ${data}`);
go.stdout.on("data", goLog);
go.stderr.on("data", goLog);
go.on("exit", (code) => {
  if (code && code !== 0) process.stdout.write(`[go] exited with code ${code}\n`);
});

const vite = spawn("npx", ["vite"], {
  cwd: root,
  env: { ...process.env, PORT: "3000" },
  stdio: ["ignore", "pipe", "pipe"],
});

const viteLog = (data) => process.stdout.write(`[vite] ${data}`);
vite.stdout.on("data", viteLog);
vite.stderr.on("data", viteLog);

let shuttingDown = false;
const shutdown = () => {
  if (shuttingDown) return;
  shuttingDown = true;
  go.kill("SIGTERM");
  vite.kill("SIGTERM");
  setTimeout(() => process.exit(0), 500);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

vite.on("exit", (code) => {
  process.stdout.write(`[vite] exited with code ${code}\n`);
  shutdown();
});
