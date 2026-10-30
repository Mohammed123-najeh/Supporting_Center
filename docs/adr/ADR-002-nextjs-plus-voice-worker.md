# ADR-002: Next.js as the full stack, plus one voice worker process

| Field | Value |
|---|---|
| Status | Accepted for Next.js (owner decision, 2026-10-28). The voice worker is proposed (2026-10-29) and is accepted when the owner approves Block 2. |
| Deciders | Mohamad Saleem (owner) |
| Related | Block 1 §9; Block 2 §2, §6.2; `docs/research/01-stack-and-model-verification.md` §1 |

## Context

- The owner chose Next.js as the full stack, and no Kubernetes.
- Each live call holds a sideband WebSocket to OpenAI for up to 10 minutes. There are up to 50 calls at once.
- The verified research found four problems with running those calls inside Next.js:
  - Next.js has no supported API for long-running work. Its docs say its backend features are "not a full backend replacement".
  - On SIGTERM, Next.js waits only for HTTP requests and `after()` callbacks, then exits with code 143, so every deploy would cut live calls.
  - Its process error handlers only log errors, so a broken session manager would keep running.
  - Module-level state can be duplicated across bundles.
- A custom server is discouraged, cannot be combined with standalone output, and keeps the same problems.

## Decision

One repository and one Docker image, with two entrypoints run as Docker Compose services:

- **`web`** runs Next.js 16 (App Router, Node runtime only). It serves:
  - the dashboard;
  - the widget embed route and loader script;
  - all public APIs;
  - sign-in;
  - SSE;
  - session admission, which includes the SDP policy and the concurrency caps.
- **`voice-worker`** is a plain Node.js and TypeScript process. It owns:
  - OpenAI call creation;
  - the sidebands;
  - running the tools;
  - metering;
  - the call timers and hangup;
  - the pg-boss jobs.

  It has its own crash policy (exit, and Docker restarts it) and its own drain on SIGTERM.

The two processes talk over an internal HTTP API signed with HMAC (web to worker) and Postgres rows plus `NOTIFY` (worker to web). Shared code lives in `packages/shared`.

## Consequences

- **Good:**
  - Deploying the web app never touches a live call.
  - Each process has clear failure behaviour.
  - Everything is one language and one image.
- **Bad:**
  - Two processes to deploy and monitor.
  - Shared code and configuration must stay in sync.
  - An extra internal hop when a call starts.
  - A worker deploy needs a drain or a blue/green swap (Block 1 §6.2).

## Alternatives considered

| Option | Why not |
|---|---|
| Live calls inside the Next.js process | Deploys and restarts cut calls; no supported API; unreliable process state |
| A Next.js custom server | Discouraged; no standalone output; the same problems remain |
| A separate Fastify backend plus Next.js for the UI (the v0.1 plan) | The owner chose Next.js as the full stack; the worker covers the one thing Next.js cannot do |

## Revisit when

- Next.js ships a supported API for long-running background work with graceful drain.
- Scale needs several worker instances, which is a design topic for Block 11.
