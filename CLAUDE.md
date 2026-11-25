# Ticket Management

AI-powered support ticket system: receives support emails, creates tickets, classifies and summarizes them with AI, and drafts replies from a knowledge base. See `project-scope.md` (requirements), `tech-stack.md` (stack decisions) and `implementation-plan.md` (phases and tasks).

## Structure

Two independent projects, no workspaces, each with its own `package.json` and `bun.lock`:

- `client/`: React + TypeScript + React Router + Tailwind CSS + shadcn/ui, built with Vite (dev server on :5173, proxies `/api` to :3000)
- `server/`: Express + TypeScript, run directly by Bun (`src/index.ts`, port from `PORT`, default 3000)

## Commands

Run in two separate terminals:

```
cd server && bun run dev      # API on http://localhost:3000
cd client && bun run dev      # web on http://localhost:5173
```

- Install dependencies per folder: `bun install` inside `server/` and `client/`
- Typecheck: `bun run typecheck` in each folder
- Build client: `cd client && bun run build`

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
- Public sign-up is disabled (`disableSignUp: true`). Accounts are created only by the seed script (first admin) or, later, by an admin through user management.
- `user.role` (`admin` | `agent`, default `agent`) and `user.active` (default `true`) are extra fields with `input: false`, so clients can never set them. `active` is not enforced anywhere yet.
- First admin: set `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` in `server/.env`, then `cd server && bun run db:seed` (idempotent). Other env vars (see `server/.env.example`): `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_URL` (trusted origin, default `http://localhost:5173`).
- `GET /api/me` returns the current session or 401; use `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` to protect new API routes.
- Client: `client/src/lib/auth-client.ts` (`authClient`, same origin via the Vite proxy). `ProtectedRoute` redirects unauthenticated users to `/login`; the login page (`client/src/pages/Login.tsx`) uses react-hook-form + Zod and redirects signed-in users to `/`. `Layout` hides the header on `/login`.
- Admin-only features (user management) must check `role === "admin"` on the server; hiding UI is not enough.
- `/users` (`client/src/pages/Users.tsx`) is admin-only. `AdminRoute` (`client/src/components/AdminRoute.tsx`, nested inside `ProtectedRoute` in `App.tsx`) redirects non-admins to `/`, and `Layout` shows the "Users" nav link only to admins. This is client-side only; any future user-management API must enforce the role on the server.
- `authClient` uses `inferAdditionalFields` (`client/src/lib/auth-client.ts`) so `session.user.role` is typed. When adding extra user fields on the server, mirror them there.

## Keeping docs current

After a change that affects architecture, auth, routes, commands, env vars or conventions, update the relevant section of this file in the same change. Do not log routine edits or things visible in the code.

## Documentation: use Context7

Always use the Context7 MCP server to fetch current documentation before writing or changing code that depends on a library, framework, SDK, API or CLI tool (Express, React, React Router, Vite, Tailwind, Bun, Zod, Prisma, the Anthropic SDK, etc.). This applies to API syntax, configuration, setup, version migration and library-specific debugging, even for well-known libraries, because training data may be out of date.

1. Call `resolve-library-id` with the library name and what to look up (skip if the user gives an exact `/org/project` ID).
2. Pick the best match by name, reputation and benchmark score; use a version-specific ID when the project pins a version.
3. Call `query-docs` with that ID and a specific question, one concept per call.

Do not use it for general programming concepts or code that does not depend on a library API.
