# Supporting_Center: session log and handover

Read this first in every new session. It records:

- what has been decided;
- which files exist;
- what is pending, in order.

Update it at the end of each session.

**How to resume in a new session:** say *"Read docs/SESSION-LOG.md and continue from 'Next steps'."*

---

## 1. The project in one paragraph

Supporting_Center is a multi-tenant SaaS: an AI voice receptionist for **clinics in the UAE**.

- A patient taps a button on the clinic's website and talks to the agent in **Gulf Arabic or English**, including mixing the two.
- The agent answers questions about the clinic, and **books, reschedules and cancels appointments** in our own scheduler.
- Clinic staff use a dashboard.
- We meter each clinic's usage and AI cost.

The owner is a solo developer working with AI coding agents. We are still **planning, block by block**; no product code exists yet. `landing/` holds a parked landing page from another session and is not part of the product.

## 2. Decisions so far

| Date | Decision | Where |
|---|---|---|
| 2026-10-28 | Markets and languages: UAE only; Arabic (natural Gulf) and English, with switching | Block 1 §0, A-2 |
| 2026-10-28 | Channel: a **voice widget on the clinic's website only**. No phone numbers, forwarding or WhatsApp; the owner's words: "a normal voice assistant that takes actions through the website". | Block 1 §4 |
| 2026-10-28 | Vertical: **clinic appointment booking only**. Other verticals later. | Block 1 §4 |
| 2026-10-28 | Appointments are stored in our platform, with a staff dashboard. No external integrations yet. | Block 1 §5.3–5.4 |
| 2026-10-28 | Scale: about 100 clinics. Concurrency target 50 sessions across the platform and 3 per clinic. | Block 1 §6.2 |
| 2026-10-28 | Business model: monthly subscription. Usage is metered now; there is no billing system yet. | Block 1 §5.6 |
| 2026-10-28 | **OpenAI is the only AI and voice provider** | Block 1 §8 |
| 2026-10-28 | Inbound only. A callback request replaces live transfer. | Block 1 A-8 |
| 2026-10-28 | Privacy first: recording off, synthetic patient data until the legal gates pass, no medical advice | Block 1 §7 |
| 2026-10-28 | **Model: `gpt-realtime-2.1-mini`**, with `gpt-realtime-2.1` as a per-clinic fallback | Block 1 §8.1 |
| 2026-10-28 | **Next.js as the full stack**, plus one small **voice-worker** process from the same codebase, which holds the live calls | Block 1 §9; ADR-002 |
| 2026-10-28 | **No Kubernetes.** One server with Docker Compose. | Block 1 §9.6 |

**Stack** (Block 1 §9.3):

- TypeScript; Next.js 16 (self-hosted, Node runtime) plus a Node voice worker.
- PostgreSQL 18 with row-level security; Drizzle 0.45.x; pg-boss.
- Better Auth; next-intl (Arabic, right to left); Zod; Turnstile.
- Vitest and Playwright; Docker Compose.
- `@openai/agents` 0.21.0, pinned, on the server sideband.
- The browser connects to OpenAI over WebRTC. The worker creates each call with `POST /v1/realtime/calls` and controls it over a sideband WebSocket (ADR-001, ADR-003).

## 3. Key findings to remember

1. **Real patients cannot go live on OpenAI without legal clearance.**
   - OpenAI processes Realtime and audio only in the US or the EU.
   - UAE Federal Law No. 2 of 2019 Art. 13 restricts health data leaving the UAE, with fines of AED 500k–700k (Art. 24).
   - Dubai's DHA policy (clause 4.5.3) forbids cloud storage outside the UAE, backups included, and Abu Dhabi's ADHICS is strict too.
   - So we build and demo with synthetic data. Go-live depends on gates G-1 to G-9 (Block 1 §7.6), and the 11 questions for a UAE lawyer are in Block 1 §7.5.
2. **Gulf Arabic quality on OpenAI is unproven.** Phase 0 tests it first, and can stop the project early (Block 2 §10).
3. **Cost:** about $0.041 a minute on mini with live captions. That is about $7,300 a month for 100 clinics at 20 conversations a day each, or about $50–75 per clinic a month.
4. **The OpenAI SDK overwrites call settings with its defaults, and can turn tracing on permanently.** Set every field explicitly, and set `tracingDisabled: true` (Block 2 §3).
5. **The latency target N-2** (a median turn of 1.3 s or less) is at risk. Phase 0 measures it (Block 2 §8).
6. **The text-to-speech models for synthetic test callers shut down on 6 January 2027.** Generate the test library before then (Block 2 §10.4).

## 4. Files

| File | What it is | Status |
|---|---|---|
| `docs/research/00-research-baseline.md` | The broad research baseline: markets, vendors, costs | Done (2026-10-28). Some of its leanings were later replaced by owner decisions (Block 1 §1). |
| `docs/01-vision-and-requirements.md` | **Block 1**: vision, MVP scope, requirements, compliance, architecture, cost, defaults, risks, the plan | v0.2, reviewed by 3 agents. **A few edits pending to match Block 2** (§6 below). |
| `docs/research/01-stack-and-model-verification.md` | Verification of Next.js, mini, the Agents SDK and the data/auth stack (8 agents) | Done |
| `docs/02-voice-runtime-and-openai.md` | **Block 2**: call lifecycle, OpenAI settings, tools and guardrails, failures, widget audio, latency, metering, the Phase 0 plan with 24 checks and gates E-1 to E-9 | v0.2, with fixes from the 3-agent review applied |
| `docs/research/02-voice-runtime-verification.md` | Block 2 research (12 agents, 236 findings) | Done |
| `docs/adr/ADR-001-voice-path.md` | Browser WebRTC to OpenAI, plus server sideband control | Proposed. **Small edits pending.** |
| `docs/adr/ADR-002-nextjs-plus-voice-worker.md` | Next.js plus the voice worker | Next.js part accepted; worker proposed |
| `docs/adr/ADR-003-agents-sdk-on-the-sideband.md` | Agents SDK on the sideband, pinned and wrapped | Proposed. **Small edits pending.** |
| `docs/SESSION-LOG.md` | This file | Kept current |
| `.claude/skills/` | Project skills: doc-coauthoring, frontend-design, webapp-testing, mcp-builder (pinned to anthropics/skills `dbd4588`) | Installed |
| `landing/` | A parked landing page, separate Next.js 15.5 app from another session | Not part of the product |

## 5. The 12 planning blocks

| # | Block | Status |
|---|---|---|
| 1 | Vision and MVP requirements | v0.2, waiting for the owner's review |
| 2 | Voice runtime and OpenAI integration | v0.2, waiting for the owner's review |
| 3 | Domain model and multi-tenancy | **Next** |
| 4 | Scheduling engine | — |
| 5 | Agent design: conversation, prompts, tools, guardrails | — |
| 6 | Application architecture and stack (ADRs, version pins) | — |
| 7 | Widget and dashboard UX/UI (ui-ux-pro-max, frontend-design) | — |
| 8 | Security, privacy and compliance design | — |
| 9 | Observability, testing and evaluations | — |
| 10 | Usage metering, cost model and plans | — |
| 11 | Infrastructure and environments | — |
| 12 | Phased build plan for coding agents | — |

Phase 0 (the technical spike and the Arabic probe) can start once Block 2 is approved, while Blocks 3–4 are being written.

## 6. Next steps, in order

### 6.1 First: small alignment edits (Block 2's review found these)

**In `docs/01-vision-and-requirements.md`:**

1. **N-9.** Change it to: "within 5 s when OpenAI answers with an error; at most 20 s after the tap if it does not answer" (Block 2 VR-24).
2. **§8.2, steps 3–6.** Align with Block 2 §2.2:
   - the state is `reserved`, not `admitting`;
   - the call-creation body is minimal;
   - the answer goes back to the browser only after the sideband passes the readiness check.

   Alternatively, replace the steps with a pointer to Block 2 §2.2.
3. **The §8.3 note.**
   - The count is 24 checks, not 23.
   - Phase 0 decides **provisionally** at Stage B, and Stage C confirms before the pilot.
   - Scored calls use human audio.
4. **§0 finding 2 and §15.1 Phase 0 "Done when".** Say that the decision is provisional at Stage B.
5. **§12 item 14.** Phase 0 tests 4–5 voices, not 2–3.
6. **§14 item 2.** Pass marks are judged by the Block 2 §10.5 rule. Add E-8 (safety red-team) and E-9 (cost per minute).

**In the ADRs:**

7. **ADR-001 "Revisit when".** Use these triggers:
   - P0-1 or P0-3 fails with no fallback;
   - re-attach succeeds in fewer than 90% of 20 forced drops (P0-9);
   - more than 5% of 50 test calls fail the call path.
8. **ADR-003 Decision.** Say that "every setting in Block 2 §3.2" must be set explicitly, with `max_output_tokens` sent through `config.providerData`, and that `end_call` returns `backgroundResult(...)`.

**Then:**

9. Optionally, run one fresh-reader check on Block 2 v0.2 (1 agent; tell the owner the agent count first).

### 6.2 Decisions waiting for the owner

- Review Block 1 v0.2 and Block 2 v0.2. In particular, the defaults table in Block 1 §12.
- **Approve or reject keeping test audio.** This means synthetic clips and consented recordings of test speakers, in a separate test store, as an exception to "no audio stored" (Block 2 §10.4).
- **Send the 11 lawyer questions** (Block 1 §7.5). The answers decide the production hosting and the go-live date.
- **Send the 9 questions to OpenAI** (Block 2 §14).
- **Budget for people:** native Gulf Arabic speakers and raters for Phase 0 and Stage C.

### 6.3 Then: Block 3, domain model and multi-tenancy

It covers:

- entities: tenants, locations, doctors, services, schedules, appointments, holds, contacts, callbacks, sessions, usage, audit;
- an ERD;
- row-level security policies;
- IDs;
- encryption with searchable hashes (Block 1 N-18);
- the `voice_sessions` columns (Block 2 §2.3).

Use the doc-coauthoring workflow. Research inline or with a workflow, and tell the owner the agent count first.

## 7. Working rules for these sessions

- **Language:** chat in the owner's language, Levantine Arabic or English. Design docs are in English and written for the owner and for AI coding agents.
- **Tags:** [Decided] (owner), [Default] (recommendation; list it in the defaults table) and [Open] (needs a measurement or an answer).
- **Missing information:** give a recommended default; do not hold another question round.
- **Workflows:** at most **12 agents** each, and tell the owner the count before launching. Prefer verified sources, with adversarial fact-checking.
- **Keep projects separate.** Supporting_Center is not related to Rummaha_Dev.
- **Planning first.** No product code until the owner says so. Phase 0 is the first code.

## 8. Session history

| Date | Session summary |
|---|---|
| 2026-10-28 | Phase 0 skills installed. Research baseline (14 agents). Owner answered the 10 Block-1 questions. Block 1 drafted, with UAE health-data law checked against the primary sources. |
| 2026-10-28 → 29 | Owner chose Next.js, mini and no Kubernetes. Stack verified (8 agents). Block 1 v0.2, reviewed (3 agents), about 30 fixes. Block 2 researched (12 agents), drafted, reviewed (3 agents), and v0.2 written with all fixes. ADR-001 to ADR-003 drafted. This log created. |
