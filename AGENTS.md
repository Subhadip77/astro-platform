# AGENTS.md — Astro Platform

## Approval gate (highest priority)
- Read PROJECT_FLOW.md before any work.
- Start a step ONLY after the owner writes "YES <STEP-ID>".
- Work on one step at a time. Never begin the next step on your own.
- When finished: set status to REVIEW, summarize, list how to test, then STOP.
- If something is unclear or blocked, set BLOCKED and ask. Do not guess.

## Stack
- Frontend: Next.js (App Router), Tailwind, next-intl, PWA.
- Backend: Node.js + Express, JWT, Joi/Zod validation.
- DB: MySQL 8, utf8mb4_unicode_ci. Migrations only; no manual schema edits.
- Cache: Redis. Payments: Razorpay. Email: SendGrid.

## Hard rules
- Never commit secrets. Use .env; keep .env.example updated.
- Only the astro service layer may call AstrologyAPI. Always cache results.
- No hard-coded UI strings; use locale files (en, hi, bn).
- Parameterized queries only. Validate all input. Rate-limit public endpoints.
- Encrypt sensitive birth data fields. Ask consent before storing.
- Astrology copy: no guaranteed outcomes, no fear-based selling, no death/illness/legal predictions.
- Write at least basic tests for each endpoint you add.
- Small commits with clear messages.