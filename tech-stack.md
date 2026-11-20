# Tech stack

TypeScript end to end, optimized for a small team and a few hundred tickets per day.

| Layer | Choice | Why |
| --- | --- | --- |
| **Frontend** | React + TypeScript, React Router, Tailwind CSS (built with Vite) | The dashboard and ticket detail view are standard CRUD and tables. React Router handles the dashboard, ticket detail and admin pages, with protected routes by role. |
| **Backend** | Node.js + Express + TypeScript | One language across the stack, with mature libraries for email parsing and queues. |
| **Database** | PostgreSQL + Prisma | Relational data fits tickets, users and messages. `pgvector` covers the knowledge base without a separate vector DB. |
| **Auth** | Database sessions (see below) | Email and password; the admin creates agents. Roles: `admin`, `agent`. |
| **Email in/out** | SendGrid (Inbound Parse) or Mailgun (Routes); same provider for sending | Both deliver incoming email to a webhook as parsed fields, and Message-ID / In-Reply-To headers give threading. Simpler than IMAP polling. Final choice still open. |
| **Background jobs** | pg-boss (Postgres-backed queue) | Classification, summarization and reply generation run asynchronously with retries. No Redis needed. |
| **AI** | Claude API via the Anthropic SDK | Haiku 5.5 for classification and summaries; Sonnet 5.5 for reply generation. Structured output enforces the category enum. |
| **Knowledge base / RAG** | pgvector + an embeddings API | Chunk and embed KB docs, retrieve top-k chunks, pass them to the reply prompt. |
| **Validation** | Zod, shared between frontend and backend | One schema for API contracts and AI structured output. |
| **Testing** | Vitest + Playwright | Unit and integration tests, plus a few end-to-end flows. |
| **Deployment** | Docker on Railway / Render / Fly.io with managed Postgres | Low ops overhead. The first admin is seeded from environment variables at deploy time. |

## Authentication: database sessions

Sessions are stored server-side in Postgres, not in stateless JWTs.

- **Flow:** on login, verify the email and password hash (argon2 or bcrypt), create a `Session` row, and send its random ID in an `HttpOnly`, `Secure`, `SameSite=Lax` cookie.
- **Session table:** `id` (random, unguessable token; store only a hash), `userId`, `expiresAt`, `createdAt`, and optionally `userAgent` and `ip`.
- **Each request:** middleware looks up the session, rejects it if missing or expired, and loads the user and role.
- **Revocation:** deleting the row logs the user out immediately. Deactivating or deleting an agent also deletes their sessions, so the admin's changes take effect at once.
- **Expiry:** use a sliding expiration (for example 7 days, extended on activity) and clean up expired rows periodically with a pg-boss job.
- **Authorization:** role checks (`admin` vs `agent`) happen in middleware on every route. User-management routes are admin only.
- **Bootstrapping:** the first admin is seeded from environment variables on deploy. The admin then creates agents.
- **Library:** Better Auth or Lucia can handle this on Prisma, or it can be hand-rolled with a small session table.
- **CSRF:** with cookie auth, use `SameSite` cookies plus CSRF tokens (or an origin check) on state-changing requests.

## AI pipeline

1. The email webhook creates a ticket and enqueues a job.
2. The job classifies the ticket (general question, technical question or refund request), summarizes it, retrieves knowledge-base chunks and drafts a reply.
3. The draft is stored as a suggested reply. Auto-send is a flag, so it can start draft-only and be enabled per category later.

## Alternatives considered

- **Next.js full-stack:** simpler to deploy as one app, but long-running jobs and webhooks fit less naturally. Not chosen, since the frontend uses React Router with a separate Express API.
- **Python (FastAPI) backend:** loses shared types with the frontend. Not chosen.
- **Supabase:** less backend code to write, at the cost of lock-in. Not chosen.

## Open decisions

- SendGrid vs Mailgun (compare pricing, inbound parsing, and deliverability setup).
- Hosting preference or constraints (e.g. university infrastructure).
- Whether student emails may be sent to a third-party LLM under the privacy policy.
