# ADR-001: Voice path — browser WebRTC to OpenAI, with control from our server

| Field | Value |
|---|---|
| Status | Proposed (2026-10-29). Accepted when the owner approves Block 2. Phase 0 checks P0-1 to P0-9 can reopen it. |
| Deciders | Mohamad Saleem (owner) |
| Related | Block 1 §8.2, §9; Block 2 §2, §6; ADR-002; ADR-003 |

## Context

- Patients talk to the agent from a widget on a clinic's website. The owner decided on OpenAI only, the `gpt-realtime-2.1-mini` model, and no phone channel in the MVP.
- Tools, booking rules, instructions and usage metering must stay on our servers:
  - The browser runs on third-party clinic pages.
  - Usage drives billing, so the browser cannot be trusted to report it.
- Latency matters for a natural voice conversation.

## Decision

The browser sends and receives audio **directly with OpenAI Realtime over WebRTC**. Our voice worker:

1. Receives the browser's audio-only WebRTC offer, through Next.js, after the SDP policy and admission checks.
2. Creates the call with `POST /v1/realtime/calls`, the "unified interface", using our standard API key. Browser ephemeral keys are never used.
3. Attaches a server-side **sideband** WebSocket to the call (`wss://api.openai.com/v1/realtime?call_id=…`). Over it, the worker sets the instructions and tools, runs the tools, injects context, meters usage and ends the call.
4. Returns the answer to the browser only after OpenAI confirms our settings.

The browser opens no data channel. It receives only allowlisted app events from our server, over SSE.

## Consequences

- **Good:**
  - The audio path has no hop through our servers, so there is no media infrastructure to run.
  - Instructions, tools, the `call_id` and usage never reach the browser.
  - Metering comes from OpenAI's own events.
  - OpenAI documents this pattern and publishes a reference implementation (`examples/realtime-server-controlled`).
- **Bad:**
  - We depend on undocumented behaviour: whether the sideband can re-attach, keepalive rules, which events arrive. The design assumes the worst case and Phase 0 checks each one.
  - We cannot control the media path: no recording hooks and no custom audio processing. That is acceptable, because the MVP records nothing.
  - OpenAI's relay may offer UDP only, so some networks will fail to connect.
  - Data is processed only in the US or the EU, which is the legal gate in Block 1 §7.

## Alternatives considered

| Option | Why not |
|---|---|
| The browser uses the SDK with an ephemeral key and runs the tools itself | Instructions and tools would be visible and changeable in the browser, usage could not be trusted, and calls created with ephemeral keys had sideband 404 errors in September 2026 |
| Our server relays the audio over WebSocket | An extra audio hop, more latency, and media handling we would have to build and run |
| LiveKit or another media server | Needed only for several providers, phone calls or recording, none of which is in the MVP. It is one more system to run. |
| GPT-Live (`gpt-live-1`) | No Arabic voice; a separate API |

## Revisit when

- Phase 0 shows the sideband path is unreliable (P0-3, P0-8, P0-9).
- The phone channel, recording or a second provider enters scope.
- OpenAI deprecates `/v1/realtime/calls`.
