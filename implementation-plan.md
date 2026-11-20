# Implementation plan

Based on `project-scope.md` and `tech-stack.md`. Each task is sized to be roughly a few hours to a day. Phases are ordered so every phase ends with something runnable.

**Working assumptions** (resolve the open questions before the phase that needs them):

- AI drafts replies for agent approval; auto-send is a flag, off by default (Phase 7).
- Email via SendGrid Inbound Parse or Mailgun Routes, abstracted behind an interface so the choice is swappable.
- Status transitions: student reply reopens a resolved ticket; closing is manual (auto-close optional, Phase 9).

---

## Phase 0: Decisions and project setup

Goal: unblock design choices and get a working repo.

- [ ] 0.1 Decide: AI autonomy (draft-only vs auto-send; refunds always human?)
- [ ] 0.2 Decide: email provider (SendGrid vs Mailgun) and hosting target
- [ ] 0.3 Decide: privacy sign-off for sending student emails to the LLM; retention policy
- [ ] 0.4 Decide: status-transition rules and routing/assignment rule
- [ ] 0.5 Init git repo, monorepo layout (`apps/web`, `apps/api`, `packages/shared`), npm workspaces
- [ ] 0.6 TypeScript, ESLint, Prettier configs shared across packages
- [ ] 0.7 Docker Compose with local Postgres (with `pgvector`)
- [ ] 0.8 Env var handling with Zod validation; `.env.example`
- [ ] 0.9 CI pipeline: lint, typecheck, test

## Phase 1: Backend foundation and data model

Goal: API skeleton with the database in place.

- [ ] 1.1 Express app skeleton: routing, error handler, request logging, health endpoint
- [ ] 1.2 Prisma setup and first migration
- [ ] 1.3 Schema: `User` (role, active flag), `Session`
- [ ] 1.4 Schema: `Ticket` (status, category, assignee, summary), `Message` (direction, Message-ID, In-Reply-To, body), `Attachment` metadata
- [ ] 1.5 Schema: `KnowledgeChunk` (with pgvector embedding), `AuditLog`
- [ ] 1.6 Shared Zod schemas and enums (status, category, role) in `packages/shared`
- [ ] 1.7 Vitest setup with a test database and helpers/factories

## Phase 2: Authentication and user management

Goal: admin can log in and manage agents.

- [ ] 2.1 Password hashing (argon2) and session creation/lookup/deletion
- [ ] 2.2 Login / logout / current-user endpoints; cookie settings (`HttpOnly`, `Secure`, `SameSite=Lax`)
- [ ] 2.3 Auth middleware (sliding expiry) and role-check middleware
- [ ] 2.4 CSRF protection (origin check or tokens) on state-changing routes
- [ ] 2.5 Login rate limiting
- [ ] 2.6 Seed initial admin from env vars on deploy
- [ ] 2.7 Admin-only user endpoints: create, list, update, deactivate/delete agent (also deletes sessions)
- [ ] 2.8 Admin password reset / agent password change
- [ ] 2.9 pg-boss setup and periodic expired-session cleanup job
- [ ] 2.10 Tests: auth flows, role enforcement, revocation

## Phase 3: Frontend foundation, login and admin UI

Goal: usable shell with login and user management.

- [ ] 3.1 Vite + React + Tailwind + React Router scaffold
- [ ] 3.2 API client with typed requests and error handling
- [ ] 3.3 Auth context, login page, protected routes by role
- [ ] 3.4 App layout (nav, user menu, logout)
- [ ] 3.5 Admin: users list page
- [ ] 3.6 Admin: create/edit/deactivate user forms
- [ ] 3.7 Empty/loading/error state components

## Phase 4: Email ingestion and ticket core

Goal: inbound email creates tickets; agents can see and manage them.

- [ ] 4.1 Email provider interface (`parseInbound`, `send`) with chosen provider implementation
- [ ] 4.2 Inbound webhook endpoint with signature verification
- [ ] 4.3 Parse sender, subject, body (strip quoted text/signatures), attachments
- [ ] 4.4 Threading: match In-Reply-To/References to existing ticket, else create new ticket
- [ ] 4.5 Student reply reopens resolved ticket (per transition rules); closed handling per decision
- [ ] 4.6 Idempotency: ignore duplicate webhook deliveries by Message-ID
- [ ] 4.7 Ticket API: list (filter by status/category/assignee, search, sort, pagination), get detail
- [ ] 4.8 Ticket API: update status, assign agent, internal notes
- [ ] 4.9 Outbound reply endpoint: agent sends reply, stored as message, correct threading headers
- [ ] 4.10 Tests: webhook parsing, threading, status transitions, duplicates

## Phase 5: Dashboard and ticket detail UI

Goal: agents can work tickets end to end (manually).

- [ ] 5.1 Dashboard table: status, category, subject, sender, assignee, updated time
- [ ] 5.2 Filters, search, sorting, pagination (URL-synced)
- [ ] 5.3 Ticket detail page: conversation thread, metadata sidebar
- [ ] 5.4 Status and assignee controls
- [ ] 5.5 Reply composer with send
- [ ] 5.6 Internal notes UI
- [ ] 5.7 Polling or refresh so new tickets appear without reload
- [ ] 5.8 Playwright e2e: login, view ticket, reply, change status

## Phase 6: AI classification and summaries

Goal: every new ticket is auto-classified and summarized.

- [ ] 6.1 Anthropic SDK wrapper: retries, timeouts, token/cost logging
- [ ] 6.2 pg-boss job: `process-ticket`, enqueued by the webhook, with retry/backoff and dead-letter handling
- [ ] 6.3 Classification prompt with structured output (Zod enum: general / technical / refund); store category and confidence
- [ ] 6.4 Summary prompt; store on ticket, regenerate on new messages
- [ ] 6.5 Prompt-injection hardening: treat email as untrusted data, delimit content, never act on instructions in it
- [ ] 6.6 Show category and summary in dashboard and ticket detail; agent can override category
- [ ] 6.7 Evaluation set (~50 labeled sample emails) and a script to measure classification accuracy
- [ ] 6.8 Tests with mocked LLM responses; failure path leaves ticket usable with no AI fields

## Phase 7: Knowledge base and AI replies

Goal: AI drafts personalized replies grounded in the KB.

- [ ] 7.1 Decide KB source and owner; define document format
- [ ] 7.2 Ingestion pipeline: chunk, embed, store in pgvector
- [ ] 7.3 Admin/agent UI or CLI to add, update, delete KB documents and re-index
- [ ] 7.4 Retrieval: top-k similarity search per ticket (with score threshold)
- [ ] 7.5 Reply-generation prompt (Sonnet): tone guidelines, student-specific context, KB chunks, citations of sources used
- [ ] 7.6 "Insufficient knowledge" path: no draft, flag for human instead of hallucinating
- [ ] 7.7 Store draft as suggested reply linked to ticket and KB chunks used
- [ ] 7.8 UI: suggested reply in composer; accept, edit, regenerate, discard
- [ ] 7.9 Refund requests: always draft-only, flagged for human review
- [ ] 7.10 Auto-send flag per category (default off); sends via email provider and logs it
- [ ] 7.11 Tests and sample-based review of reply quality

## Phase 8: Routing and assignment

Goal: tickets reach the right agent.

- [ ] 8.1 Implement chosen assignment rule (e.g. round-robin, least-loaded, or unassigned queue)
- [ ] 8.2 Auto-assign on ticket processing; respect inactive agents
- [ ] 8.3 Manual reassignment and "assigned to me" dashboard filter
- [ ] 8.4 Escalation flag for refunds and low-confidence classifications
- [ ] 8.5 Tests for assignment logic

## Phase 9: Hardening, privacy and observability

Goal: safe to run with real student data.

- [ ] 9.1 Audit log for user changes, status changes, AI-sent replies
- [ ] 9.2 PII handling: redact sensitive fields before LLM calls where required; retention/purge job
- [ ] 9.3 Webhook and API rate limiting; attachment size/type limits
- [ ] 9.4 Structured logging, error tracking, job-failure alerts
- [ ] 9.5 Metrics: first-response time, % auto-resolved, AI draft acceptance rate, agent time saved
- [ ] 9.6 Dashboard stats widget for the metrics above
- [ ] 9.7 Optional: auto-close resolved tickets after N days (pg-boss scheduled job)
- [ ] 9.8 Security review (auth, CSRF, webhook verification, injection)
- [ ] 9.9 Playwright e2e for full flow: inbound email, AI processing, agent reply

## Phase 10: Deployment and launch

Goal: running in production.

- [ ] 10.1 Dockerfiles for API and web; production build config
- [ ] 10.2 Provision host and managed Postgres (with pgvector); run migrations on deploy
- [ ] 10.3 Configure secrets, domain, TLS
- [ ] 10.4 Configure email provider: domain verification (SPF/DKIM), inbound route to webhook
- [ ] 10.5 Seed initial admin; smoke test
- [ ] 10.6 Backups and restore test
- [ ] 10.7 Pilot: run draft-only with a few agents on real traffic; review accuracy and metrics
- [ ] 10.8 Documentation: runbook, admin guide, KB maintenance guide
- [ ] 10.9 Go-live; later enable auto-send per category based on measured quality

---

## Suggested order and dependencies

- Phases 0 → 1 → 2 are sequential.
- Phase 3 (frontend) can run in parallel with Phase 4 once Phase 2 is done.
- Phase 5 needs 3 and 4. Phase 6 needs 4. Phase 7 needs 6. Phase 8 needs 6.
- Phase 9 can start incrementally from Phase 4 onward; finish before launch.

**Milestones:** M1 (end of Phase 3) admin and agent login; M2 (Phase 5) manual helpdesk works; M3 (Phase 7) AI-assisted drafts; M4 (Phase 10) production pilot.
