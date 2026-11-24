# Ticket Management

AI-powered support ticket system. Express + Prisma + PostgreSQL backend (`server/`), React + Vite frontend (`client/`).

## Requirements

- [Bun](https://bun.sh) (`npm i -g bun`)
- PostgreSQL running locally (default port 5432)

## Setup after cloning

Secrets are not in Git. Each developer creates their own `.env`.

1. Install dependencies (also generates the Prisma client):
   ```
   cd server && bun install
   cd ../client && bun install
   ```
2. Create `server/.env` from the template and fill in your own values:
   ```
   cd server
   copy .env.example .env        # Windows (PowerShell/cmd)
   cp .env.example .env          # macOS/Linux/Git Bash
   ```
   Then edit `server/.env` (see the comments in `.env.example`):
   ```
   PORT=3000
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/helpdesk?schema=public"
   BETTER_AUTH_SECRET="<output of: openssl rand -base64 32>"
   BETTER_AUTH_URL="http://localhost:3000"
   CLIENT_URL="http://localhost:5173"
   ADMIN_EMAIL="you@example.com"
   ADMIN_NAME="Admin"
   ADMIN_PASSWORD="a-strong-password"
   ```
   Special characters in the password must be URL-encoded (`@` is `%40`, `#` is `%23`).
3. Create the database and tables (Prisma creates the `helpdesk` database if it does not exist):
   ```
   cd server
   bun run db:migrate
   ```
4. Create the first admin (public sign-up is disabled; safe to re-run):
   ```
   bun run db:seed
   ```

## Run

Two terminals:

```
cd server && bun run dev     # http://localhost:3000
cd client && bun run dev     # http://localhost:5173
```

Check http://localhost:3000/api/health: it should return `{"status":"ok","db":"connected"}`.

## Useful commands (in `server/`)

| Command | What it does |
| --- | --- |
| `bun run db:migrate` | Apply schema changes in development (creates a migration) |
| `bun run db:deploy` | Apply existing migrations (production) |
| `bun run db:seed` | Create the first admin from `ADMIN_*` in `.env` |
| `bun run db:studio` | Open Prisma Studio to browse tables |
| `bun run typecheck` | Typecheck the server |

## Secrets

Never commit `.env`. Only `.env.example` (with placeholders) is tracked.

## Authentication (Better Auth)

Email + password with sessions stored in Postgres (HttpOnly cookie, 7 days). Mounted at `/api/auth/*`. Public sign-up is disabled (`/api/auth/sign-up/email` returns 400); the first admin comes from `bun run db:seed`.

- `POST /api/auth/sign-in/email` with `{ email, password }`
- `POST /api/auth/sign-out`
- `GET /api/me` returns the current session, or 401
