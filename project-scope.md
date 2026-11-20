# AI-powered ticket management system

## Problem

We receive hundreds of support emails daily. Our agents manually read, classify, and respond to each ticket, which is slow and leads to impersonal, canned responses.

## Solution

Build a ticket management system that uses AI to automatically classify, respond to, and route support tickets, delivering faster, more personalized responses to students while freeing up agents for complex issues.

## Features

- Receive support emails and create tickets
- Auto-generate human-friendly responses using a knowledge base
- Ticket detail view
- AI-powered ticket classification
- AI summaries
- AI-suggested replies
- User management (admin only)
- Dashboard to view and manage all tickets

## Ticket model

### Statuses

A ticket has exactly one status:

| Status     | Meaning                                  |
| ---------- | ---------------------------------------- |
| `open`     | New or in progress; needs attention      |
| `resolved` | An answer has been given / issue handled |
| `closed`   | Finished; no further action expected     |

### Categories

A ticket belongs to a single category:

- General question
- Technical question
- Refund request

AI classification assigns one of these three categories to each incoming ticket.

## Users and roles

- **Admin**: the system is deployed with an initial admin account (seeded at deployment).
- **Agent**: created by the admin. Agents work tickets but cannot manage users.
- Only the admin can create, view and manage users (the "user management" feature).
- Students are not users of the system; they interact only via email.

## Open questions

Still to be decided (see review notes):

1. **AI autonomy**: does the AI send replies automatically, or draft them for agent approval? Are refund requests always routed to a human?
2. **Email provider**: how are emails received and sent (IMAP polling, inbound webhook, SMTP/API)? How are student replies threaded onto existing tickets?
3. **Knowledge base**: what is the source (docs, FAQ, past tickets), and who maintains it?
4. **Status transitions**: what moves a ticket between open, resolved and closed? Does a student reply reopen a resolved or closed ticket? Is closing automatic after a period?
5. **Routing**: with three categories and agents without teams, does "routing" mean assignment to a specific agent, and by what rule?
6. **Authentication**: email/password, SSO, or invite link for new agents? Admin password reset process?
7. **Privacy**: is sending student emails to a third-party LLM acceptable? Retention and audit-log needs?
8. **Success metrics**: e.g. % auto-resolved, first-response time, agent time saved.
9. **Tech stack, hosting, timeline**.
