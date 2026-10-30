# ADR-003: Use the OpenAI Agents SDK on the sideband, pinned and wrapped

| Field | Value |
|---|---|
| Status | Proposed (2026-10-29). Accepted when the owner approves Block 2. |
| Deciders | Mohamad Saleem (owner) |
| Related | Block 2 §2.2, §3, §4, §5; ADR-001; `docs/research/02-voice-runtime-verification.md` §5 |

## Context

- The voice worker must run each call's sideband: instructions, tools, guardrails, context and usage.
- OpenAI's Agents SDK for TypeScript (`@openai/agents`, 0.21.0) documents a "browser audio with server-side controls" pattern, and ships the reference example `realtime-server-controlled`.
- The SDK is pre-1.0, and minor versions may break it.
- The research found four behaviours we must handle ourselves:
  - **Settings:** on connect, the SDK overwrites call settings with its own defaults for any field we did not set.
  - **Model:** it sends `gpt-realtime-2.1` unless the model is set explicitly.
  - **Tracing:** it switches OpenAI tracing on, permanently, unless `tracingDisabled: true` is set.
  - **Interrupts:** its websocket `interrupt()` probably does nothing on a WebRTC sideband.

## Decision

Use `RealtimeSession` with `transport: "websocket"` and `connect({ apiKey, callId })`, with these settings:

- the model set explicitly, per clinic;
- `tracingDisabled: true`;
- `historyStoreAudio: false`;
- every audio and turn-detection setting set explicitly (Block 2 §3.2);
- trusted context passed only through `runContext.context`.

How we use it:

- **Version:** pin the exact SDK version.
- **Wrapping:** keep the SDK behind our `VoiceEngine` interface.
- **Readiness gate:** check the echoed settings before the caller hears anything.
- **Guardrail cut-offs:** send `response.cancel` and `output_audio_buffer.clear` ourselves, or use the `OpenAIRealtimeSIP` transport if Phase 0 shows it works on WebRTC calls.
- **Usage:** store raw usage per `response.done`, plus the transcription usage events.
- **Upgrades:** only deliberately, after the evaluation set passes.

The fallback, if the SDK gets in the way, is raw Realtime events over the `ws` library. The core protocol is small: about 200–400 lines.

## Consequences

- **Good:**
  - A first-party, maintained pattern.
  - Tool execution, response sequencing, guardrails and history come built in.
  - Raw events stay reachable through `transport_event` and `sendEvent`.
- **Bad:**
  - Churn before version 1.0.
  - Defaults that must be overridden.
  - Edge cases that are less tested on the sideband than on the browser path.

## Alternatives considered

| Option | Why not (for now) |
|---|---|
| Raw Realtime events over `ws` | Full control, but we would rebuild schema validation, tool sequencing and guardrails ourselves. It stays as the fallback. |
| The Python Agents SDK | One more language. The TypeScript SDK has the fuller Realtime support. |

## Revisit when

- The SDK causes P0-3, P0-4 or P0-6 to fail.
- An upgrade breaks the evaluation set.
- OpenAI publishes an official server-side pattern for `/v1/realtime/calls` that does not use the SDK.
