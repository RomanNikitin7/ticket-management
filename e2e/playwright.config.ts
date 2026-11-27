import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { defineConfig, devices } from "@playwright/test";

// The e2e stack runs on its own ports and database, next to `bun run dev`.
const API_URL = "http://127.0.0.1:3001";
const WEB_URL = "http://localhost:5174";

const serverDir = path.resolve(import.meta.dirname, "../server");
const clientDir = path.resolve(import.meta.dirname, "../client");

const envFile = path.join(serverDir, ".env.test");
if (!existsSync(envFile)) {
  throw new Error("server/.env.test is missing. Copy server/.env.test.example.");
}
const testEnv = parseEnv(readFileSync(envFile, "utf8")) as Record<string, string>;

for (const key of [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "E2E_ADMIN_EMAIL",
  "E2E_ADMIN_PASSWORD",
  "E2E_AGENT_EMAIL",
  "E2E_AGENT_PASSWORD",
]) {
  if (!testEnv[key]) throw new Error(`${key} is not set in server/.env.test.`);
}

// The test database is emptied on every run, so refuse any other database.
if (!new URL(testEnv.DATABASE_URL!).pathname.endsWith("_test")) {
  throw new Error("The database name in server/.env.test must end in _test.");
}

// Lets tests read the test users' credentials from process.env.
Object.assign(process.env, testEnv);

const apiEnv: Record<string, string> = {
  ...(process.env as Record<string, string>),
  ...testEnv,
  PORT: new URL(API_URL).port,
  HOST: new URL(API_URL).hostname,
  BETTER_AUTH_URL: API_URL,
  CLIENT_URL: WEB_URL,
  // NODE_ENV=test or a TEST variable would turn off Better Auth's origin check.
  NODE_ENV: "development",
  TEST: "",
};

export default defineConfig({
  testDir: "./tests",
  // All tests share one database. Raise this only if tests are isolated.
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: WEB_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      name: "API",
      // Migrate and reset before the API starts. --no-env-file keeps
      // the development server/.env out of these processes.
      command: [
        "bunx prisma migrate deploy",
        "bun --no-env-file prisma/reset-test-db.ts",
        "bun --no-env-file src/index.ts",
      ].join(" && "),
      cwd: serverDir,
      env: apiEnv,
      url: `${API_URL}/api/health`,
      // Never reuse: a reused server could be using another database.
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      name: "Web",
      command: `bun run dev --port ${new URL(WEB_URL).port} --strictPort`,
      cwd: clientDir,
      env: { ...(process.env as Record<string, string>), API_URL },
      url: WEB_URL,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
