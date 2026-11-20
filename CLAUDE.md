# Ticket Management

AI-powered support ticket system: receives support emails, creates tickets, classifies and summarizes them with AI, and drafts replies from a knowledge base. See `project-scope.md` (requirements), `tech-stack.md` (stack decisions) and `implementation-plan.md` (phases and tasks).

## Structure

Two independent projects, no workspaces, each with its own `package.json` and `bun.lock`:

- `client/`: React + TypeScript + React Router + Tailwind CSS, built with Vite (dev server on :5173, proxies `/api` to :3000)
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
- TypeScript strict mode. API routes live under `/api`.
- Ticket statuses: `open`, `resolved`, `closed`. Categories: general question, technical question, refund request. Roles: `admin`, `agent`.

## Documentation: use Context7

Always use the Context7 MCP server to fetch current documentation before writing or changing code that depends on a library, framework, SDK, API or CLI tool (Express, React, React Router, Vite, Tailwind, Bun, Zod, Prisma, the Anthropic SDK, etc.). This applies to API syntax, configuration, setup, version migration and library-specific debugging, even for well-known libraries, because training data may be out of date.

1. Call `resolve-library-id` with the library name and what to look up (skip if the user gives an exact `/org/project` ID).
2. Pick the best match by name, reputation and benchmark score; use a version-specific ID when the project pins a version.
3. Call `query-docs` with that ID and a specific question, one concept per call.

Do not use it for general programming concepts or code that does not depend on a library API.
