# Ticket Management

AI-powered support ticket system: receives support emails, creates tickets, classifies and summarizes them with AI, and drafts replies from a knowledge base. See `project-scope.md` (requirements), `tech-stack.md` (stack decisions) and `implementation-plan.md` (phases and tasks).

## Structure

Independent projects, no workspaces, each with its own `package.json` and `bun.lock` (`client/`, `server/`, and `e2e/` for tests, see below):

- `client/`: React + TypeScript + React Router + Tailwind CSS + shadcn/ui, built with Vite (dev server on :5173, proxies `/api` to :3000)
- `server/`: Express + TypeScript, run directly by Bun (`src/index.ts`, port from `PORT`, default 3000)

## Commands

Run in two separate terminals:

```
cd server && bun run dev      # API on http://127.0.0.1:3000
cd client && bun run dev      # web on http://localhost:5173
```

- Needs Node 24: Vite, `tsc` and Playwright run under Node. This machine uses nvm and also has Node 12, which fails with "Cannot use import statement outside a module"; run `nvm use 24.18.0`.
- The Vite proxy targets `127.0.0.1:3000` (not `localhost`, which may resolve to `::1`, where the API does not listen). Open the app at `http://localhost:5173`, the origin the API trusts. `API_URL` overrides the proxy target.
- Install dependencies per folder: `bun install` inside `server/`, `client/` and `e2e/`. The root `package.json` is not a project; it provides the `test:e2e` shortcut.
- Typecheck: `bun run typecheck` in each of the three folders
- Build client: `cd client && bun run build`

## E2E tests (Playwright)

`e2e/` is a third independent Bun project. Config: `e2e/playwright.config.ts`; tests go in `e2e/tests/`. Chromium only. Needs a current Node (24).

```
cd e2e && bun install && bunx playwright install chromium   # first time
cd e2e && bun run test        # also: test:ui, test:headed, report, typecheck
bun run test:e2e              # same as `test`, from the repo root
```

- Playwright starts its own API (:3001) and web (:5174, proxying to it through `API_URL`), so `bun run dev` can keep running. It never reuses running servers.
- Separate database `helpdesk_test`, configured in `server/.env.test` (copy `server/.env.test.example`). Each run applies migrations, then `server/prisma/reset-test-db.ts` empties all tables and creates one admin and one agent (`E2E_*` variables, readable from `process.env` in tests). Both the config and the reset script refuse database names not ending in `_test`. The reset happens once per run, not per test, and tests run with 1 worker.
- The test API runs with `--no-env-file`, but any env var the server needs must come from `.env.test` or the config; Prisma CLI still loads `server/.env` without overriding those.
- Do not set `NODE_ENV=test` or `TEST` for the servers: Better Auth would skip its origin check. Rate limiting is off in tests because they do not run in production mode.

## Conventions

- Use Bun, not npm/yarn/pnpm, for installs and scripts.
- UI: shadcn/ui (style `base-nova`, built on Base UI) in `client/src/components/ui/`. Prefer these components over hand-rolled markup. Add more with `cd client && bunx --bun shadcn@latest add <name>`. The `@/` alias maps to `client/src/`.
- After `shadcn add`, check that `client/src/lib/utils.ts` still defines `cn` with `clsx` + `tailwind-merge` (the CLI may regenerate it as `export { cn } from "cn"` and install an unrelated `cn` package; remove it) and that new files import `cn` from `@/lib/utils`.
- Theme: shadcn CSS variables plus project colors (`ink`, `desk`, `paper`, `highlight`, `alert`) live in `client/src/index.css`.
- TypeScript 7: do not set `baseUrl` in `tsconfig.json`; the `@/*` alias uses `paths` only.
- TypeScript strict mode. API routes live under `/api`.
- Ticket statuses: `open`, `resolved`, `closed`. Categories: general question, technical question, refund request. Roles: `admin`, `agent`.

## Authentication

Better Auth (email + password) with Prisma/PostgreSQL. Config in `server/src/auth.ts`; handler mounted at `/api/auth/*splat` in `server/src/index.ts`.

- Sessions are stored in the database (no cookie cache or secondary storage); they last 7 days and are extended at most once a day.
- Rate limiting is enabled only when `NODE_ENV=production` (3 requests per 10s on sign-in). `bun run start` sets it; any other way of running in production must set it too. The client IP comes from `x-client-ip`, which `index.ts` sets from the socket address. This assumes direct connections (or the local Vite proxy); behind a reverse proxy, reconfigure it or all users share one limit.
- The API listens on `127.0.0.1` unless `HOST` is set. The error handler at the end of `index.ts` must stay after all routes so errors never expose internals.
- Public sign-up is disabled (`disableSignUp: true`). Accounts are created only by scripts (the first-admin seed and the e2e database reset) or, later, by an admin through user management. Scripts use `createUser` in `server/prisma/create-user.ts`, which does not check password strength.
- `user.role` (`admin` | `agent`, default `agent`) and `user.active` (default `true`) are extra fields with `input: false`, so clients can never set them. `active` is checked only by `requireAuth`: sign-in, `/api/auth/*` and `/api/me` do not enforce it yet.
- First admin: set `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` in `server/.env`, then `cd server && bun run db:seed` (idempotent). Other env vars (see `server/.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_URL` (trusted origin, default `http://localhost:5173`), `HOST` and `PORT`.
- `GET /api/me` returns the current session or 401. Protect new API routes with the middleware in `server/src/middleware/`: `requireAuth` (401 without a session, 403 if `user.active` is false, sets `req.user`), then `requireAdmin` (403 unless admin) for admin routes: `app.get(path, requireAuth, requireAdmin, handler)`.
- Client: `client/src/lib/auth-client.ts` (`authClient`, same origin via the Vite proxy). `ProtectedRoute` redirects unauthenticated users to `/login`; the login page (`client/src/pages/Login.tsx`) uses react-hook-form + Zod and redirects signed-in users to `/`. `Layout` hides the header on `/login`.
- Admin-only features (user management) must check `role === "admin"` on the server; hiding UI is not enough.
- `/users` (`client/src/pages/Users.tsx`) is admin-only. `AdminRoute` (`client/src/components/AdminRoute.tsx`, nested inside `ProtectedRoute` in `App.tsx`) redirects non-admins to `/`, and `Layout` shows the "Users" nav link only to admins. This is client-side only; any future user-management API must enforce the role on the server.
- `authClient` uses `inferAdditionalFields` (`client/src/lib/auth-client.ts`) so `session.user.role` is typed. When adding extra user fields on the server, mirror them there.

## Security

- `.claude/agents/security-reviewer.md` is a report-only subagent for security reviews.
- Known gaps: `/api/me` returns the whole session, including its token (it does not use `requireAuth` yet), and `user.active` is only partly enforced (see Authentication).

## Keeping docs current

After a change that affects architecture, auth, routes, commands, env vars or conventions, update the relevant section of this file in the same change. Do not log routine edits or things visible in the code.

## Documentation: use Context7

Always use the Context7 MCP server to fetch current documentation before writing or changing code that depends on a library, framework, SDK, API or CLI tool (Express, React, React Router, Vite, Tailwind, Bun, Zod, Prisma, the Anthropic SDK, etc.). This applies to API syntax, configuration, setup, version migration and library-specific debugging, even for well-known libraries, because training data may be out of date.

1. Call `resolve-library-id` with the library name and what to look up (skip if the user gives an exact `/org/project` ID).
2. Pick the best match by name, reputation and benchmark score; use a version-specific ID when the project pins a version.
3. Call `query-docs` with that ID and a specific question, one concept per call.

Do not use it for general programming concepts or code that does not depend on a library API.
