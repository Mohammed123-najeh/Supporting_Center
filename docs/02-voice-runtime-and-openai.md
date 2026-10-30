# Supporting_Center, Block 2: Voice runtime and OpenAI integration

| Field | Value |
|---|---|
| Version | 0.2, a draft for the owner to review. v0.2 fixes the findings of a 3-agent review: a fresh reader, a consistency check against Block 1 and the ADRs, and a check of every claim against the research. |
| Date | 2026-10-29 |
| Owner | Mohamad Saleem |
| Readers | The owner, and the AI coding agents that will build the voice worker and the widget |
| Inputs | Block 1 v0.2 (`docs/01-vision-and-requirements.md`), and the verified research in `docs/research/02-voice-runtime-verification.md`: 6 topics and 236 findings, each checked by an adversarial fact-checker. Research sources are cited as [S1] to [S33] (Appendix B). Baseline IDs such as [A21] point to `docs/research/00-research-baseline.md`, and Block 1 IDs such as [L7] to Block 1's Appendix B. |
| Decides | How a call is created, controlled, metered and ended; the OpenAI session settings to start from; the widget's audio side; the latency budget; the Phase 0 plan |
| Decision records | ADR-001 (voice path), ADR-002 (Next.js plus voice worker) and ADR-003 (Agents SDK on the sideband), in `docs/adr/` |

## How to read this document

Tags mean the same as in Block 1:

- **[Decided]**: decided by the owner.
- **[Default]**: the planner's recommendation, which stands unless the owner changes it.
- **[Open]**: needs a Phase 0 measurement, an answer from OpenAI, or the owner's approval.

Each factual claim carries a source, and its strength is stated in words:

- "documented": in OpenAI's own docs or code;
- "reported" or "secondary": from forums or third parties;
- "assumption": not yet checked. Each assumption names the Phase 0 check that will test it.

Put every behaviour that rests on a "reported" fact or an assumption behind a setting, so it can change without a code change.

IDs used in this block:

- **VR** marks a voice-runtime rule.
- **P0** marks a Phase 0 technical check.
- **E** marks an evaluation gate.
- Block 1 IDs, such as W-10 or N-2, keep their meaning. IDs in square brackets are citations.

A "start value" is where Phase 0 begins tuning. Changing it later is a configuration change, not a code change.

---

## 0. Summary

**This block covers:**

1. **One call, end to end** (§2): from the browser, through Next.js and the voice worker, to OpenAI and back. The call's state lives in Postgres, and every failure path ends in a safe, repeatable hangup.
2. **The exact starting settings** for `gpt-realtime-2.1-mini` (§3).
3. **How tools, guardrails and context injection run** (§4, §5).
4. **How calls end, fail and recover** (§6).
5. **The widget's audio side** (§7): microphone, echo, connection, iOS.
6. **The latency budget and usage metering** (§8, §9).
7. **Phase 0 in three stages** (§10): a technical spike, a quick Arabic quality probe, and the full statistical evaluation.

**Six things the research changed:**

1. **The OpenAI SDK silently overwrites a call's settings, and can switch tracing on permanently.**
   - When the voice worker attaches to a call, the Agents SDK sends its own settings. Any field we did not set falls back to the SDK's default: semantic turn detection, `gpt-4o-mini-transcribe`, no noise reduction and the model `gpt-realtime-2.1` (documented in the SDK source [S13]).
   - Unless we pass `tracingDisabled: true`, it also switches OpenAI tracing on, and tracing cannot be switched off afterwards [S1, S32].
   - OpenAI's own example leaves tracing on, so it cannot be copied as is [S12].
   - Fix: set every setting explicitly in the SDK session, and check the echoed settings before the caller hears anything (VR-4, VR-6).
2. **No transcription model is documented end to end for our exact setup** (WebRTC, server sideband and voice activity detection), and the research's own fact-checkers disagreed about which to use.
   - We start with `gpt-live-transcribe`. OpenAI's guide says to start with it, but the same guide also says it does not support voice activity detection in transcription-only sessions [S6].
   - Check P0-5 decides; the fallbacks are in §3.3.
   - Cost: about $0.041 a minute on mini, instead of $0.028. This is the "live captions" case already priced in Block 1 §11.
3. **Several call behaviours are undocumented.** For example: re-attaching the sideband after a drop, keepalive rules, what the browser sees after a hangup, and whether the sideband receives the audio events the SDK's interrupt needs. The design assumes the worst case: it always hangs up explicitly and cuts off unsafe audio itself. Phase 0 checks each behaviour (§10.2).
4. **OpenAI's WebRTC relay appears to offer UDP only** (secondary 2026 sources, research §4). Networks that block UDP, such as some clinic or office Wi-Fi, may fail to connect. The widget detects this and tells the patient, and Phase 0 measures it on UAE networks (§7.3).
5. **The latency target in Block 1 is at risk.** The only measurements available put model response time near 0.9–1.2 s [A21, S23]. A median turn of 1.3 s or less (N-2) therefore holds only in the optimistic case. Phase 0 measures this, and N-2 may need revising (§8).
6. **The text-to-speech models used to make synthetic test callers shut down on 6 January 2027** [S11]. The test library must be generated before then (§10.4).

**What this block does not decide:**

- what the agent says (Block 5);
- the data model (Block 3);
- the scheduling algorithm (Block 4);
- the visual design (Block 7).

---

## 1. Decisions carried in from Block 1

| Topic | Decision | Source |
|---|---|---|
| Model | `gpt-realtime-2.1-mini`, with `gpt-realtime-2.1` as a fallback each clinic can be switched to | [Decided], Block 1 §8.1 |
| Processes | Next.js for everything public, and one voice worker that holds the live calls | [Decided] Next.js; [Default] worker (ADR-002) |
| Voice path | Audio flows straight between the browser and OpenAI over WebRTC. Our server creates the call and controls it through a sideband WebSocket. | [Default] (ADR-001) |
| SDK | `@openai/agents` 0.21.0, pinned, behind our `VoiceEngine` interface | [Default] (ADR-003) |
| Call limits | 10 minutes of conversation at most, with a warning at 8 minutes (W-10); 50 simultaneous calls across the platform and 3 per clinic (N-5, N-6) | Block 1 |
| Privacy | No audio stored; transcripts kept 30 days; zero data retention (ZDR) with OpenAI before real data (G-3); OpenAI tracing off | Block 1 §4.3, §7.4 |
| Tools | `get_clinic_info`, `find_slots`, `hold_slot`, `book_appointment`, `find_booking`, `reschedule_appointment`, `cancel_appointment`, `request_callback` and `end_call` (§6.1) | Block 1 §8.2 |

---

## 2. One call, end to end

### 2.1 What sits on the call path

| Part | Endpoints | Notes |
|---|---|---|
| Widget (iframe on our origin) | An audio-only `RTCPeerConnection` to OpenAI, with no data channel; a Server-Sent Events (SSE) stream from `web` | Based on the client in OpenAI's official example [S12] |
| `web` (Next.js), public | `POST /api/voice/sessions` (the WebRTC offer) · `GET /api/voice/sessions/{id}/events` (SSE) · `POST /api/voice/sessions/{id}/input` (typed values, card taps) · `POST /api/voice/sessions/{id}/client-state` (connection state, a heartbeat every 5 s, metrics) · `POST /api/voice/sessions/{id}/close` | Checks everything before any OpenAI call (§2.2, step 3) |
| `voice-worker`, internal only | `POST /internal/calls` · `POST /internal/calls/{id}/client-state` · `POST /internal/calls/{id}/input` · `POST /internal/calls/{id}/close` · `GET /internal/health` | Private network only, with HMAC-signed requests |
| OpenAI | `POST /v1/realtime/calls` · sideband `wss://api.openai.com/v1/realtime?call_id=…` · `POST /v1/realtime/calls/{call_id}/hangup` | [S1, S5] |
| Postgres | `voice_sessions` (the state machine), `voice_session_cancellations`, an event outbox for SSE, usage rows | Block 3 defines the full schema |

### 2.2 The normal sequence

1. **Start.** A short pre-prompt (§7.1) is shown before the Start button. When the patient taps Start, the widget does all of this inside that same click handler:
   - creates and starts an `<audio playsinline autoplay>` element;
   - resumes its AudioContext;
   - calls `getUserMedia` with the constraints in §7.2.

   iOS and Chrome both require this to happen inside the tap.
2. **Offer.** The widget creates a session ID (UUIDv4) and an audio-only WebRTC offer: exactly one audio line and no data channel. It sends the offer to `web` together with the widget token, the bot-check token and the privacy-notice version (W-3).
   - The default follows OpenAI's example and does not wait for ICE gathering.
   - OpenAI's WebRTC guide waits up to 10 s for gathering instead [S30]. Check P0-15 compares the two.
3. **Admission.** `web` checks, in this order:
   1. The widget token: signed, scoped to one clinic, short-lived.
   2. `Origin` equals our widget origin. The clinic page's origin is enforced by `frame-ancestors`, not here.
   3. The bot-check token.
   4. Rate limits.
   5. The clinic's status and quota.
   6. The SDP policy. The offer must be 256 KiB or less, start with `v=0`, and contain exactly one active audio line, with no application or video lines [S12].
   7. A session ID that was already used or cancelled is refused (`voice_session_cancellations`), so a replayed request cannot create a second call.

   It then reserves a session slot atomically against the concurrency caps (VR-3).
4. **Hand-off.** `web` calls the worker's `POST /internal/calls` and waits for the reply, with a timeout of 18 s (VR-24). The request carries `{voiceSessionId, tenantId, clinicId, offerSdp, locale, noticeVersion, visitorHash}`.
   - `visitorHash` = HMAC-SHA256(server secret, `tenantId:visitorId`).
   - `visitorId` is a random ID kept in the widget's own storage (§11).
5. **Build.** The worker loads the clinic's settings: model, voice, Arabic register and clinic-brief version. It then builds the agent (instructions in the §3.4 order, plus the tools) and the full session settings (§3.2).
6. **Create the call.** The worker sends `POST /v1/realtime/calls` as a multipart request:
   - `sdp`: the offer.
   - `session`: `{type: "realtime", model, audio: {output: {voice}}, tracing: null}`.
   - Headers: our standard API key, and `OpenAI-Safety-Identifier: <visitorHash>`.
   - The request uses `redirect: "error"`. Timeouts and retries follow VR-24.
   - If the patient cancels at this point, the browser's abort must not cancel this request: the worker needs the call ID so it can hang up [S12].
7. **Check the reply.** On `201 Created`:
   - Parse the `Location` header strictly. The origin must be the configured OpenAI API base, and the path must match `/v1/realtime/calls/rtc_[A-Za-z0-9_-]+`.
   - Check that the answer is audio-only.
   - Save `openai_call_id` immediately.

   If any check fails, hang up the new call ID [S12].
8. **Attach the sideband.** The worker creates a `RealtimeSession` with:
   - `transport: "websocket"`;
   - an explicit `model`;
   - `tracingDisabled: true`;
   - `historyStoreAudio: false`;
   - the trusted `context` `{tenantId, clinicId, voiceSessionId, callId, locale, tz: "Asia/Dubai"}`;
   - the full `config` from §3.2.

   It registers its listeners first, then calls `connect({ apiKey, callId })` [S12, S13].
9. **Readiness gate.** The worker waits for a `session.updated` that echoes this call's instructions and every tool name [S12]. It logs the effective settings echoed back (VR-6).
10. **Answer.** The worker returns the WebRTC answer to `web`, which returns it to the widget in the same HTTP response.
11. **Open the event stream.** As soon as the widget has the answer, it opens the SSE stream. Using `Last-Event-ID`, `web` replays every outbox row for this session from the start, so no early event is lost.
12. **Connect.** The widget applies the answer and starts its 15-second connect timer. Once the connection reports `connected`, the widget sends `client-state`, and `web` passes it to the worker. The worker then:
    - starts the 10-minute deadline;
    - triggers the greeting with `response.create` (VR-26).

    Billing is per response [S7], so a call that never connects should cost nothing. Check P0-13 confirms this.
13. **Conversation.** Turn-taking runs on OpenAI's voice activity detection. The worker:
    - runs the tools (§4);
    - writes widget events (status, captions, cards) as rows plus `NOTIFY`, which `web` relays over SSE;
    - receives typed input through its internal endpoint.
14. **End.** The patient ends the call, the agent ends it, the time cap is reached, or the line goes idle (§6.1).
15. **Close.** The worker:
    - hangs up (a 404 counts as success);
    - waits up to 5 seconds for the sideband to close, then closes it locally;
    - finalises usage and the transcript;
    - marks the session `closed`.

```text
 Widget            web (Next.js)          voice-worker                    OpenAI
   │ offer (SDP) ──►│ checks, reserve ───►│ build agent + settings        │
   │                │                     │ POST /v1/realtime/calls ─────►│ 201 + answer + Location (rtc_…)
   │                │                     │ attach sideband (call_id) ───►│ session.updated (our settings)
   │◄── answer ─────│◄────────────────────│                               │
   │ open SSE ─────►│                     │                               │
   │ ICE/DTLS ═══════════════ audio over WebRTC ══════════════════════════►│
   │ "connected" ──►│ client-state ──────►│ start 10-min deadline; greeting (response.create)
   │◄── SSE: status, captions, cards ◄── outbox ◄── tool results ◄────────│ tool calls, usage (sideband)
   │ End / timeout  │ ──────────────────► │ POST …/hangup ───────────────►│
```

### 2.3 The call state machine (VR-1) [Default]

| State | Entered when | Next | Timeout | On timeout |
|---|---|---|---|---|
| `reserved` | `web` inserts the row inside the caps | `creating` | 2 s for the worker to take over | `failed` |
| `creating` | The worker starts `POST /v1/realtime/calls` | `attaching` | The creation budget in VR-24 (7 s) | `failed` (no hangup: no call ID exists) |
| `attaching` | `201` received and checked | `answered` | The attach budget in VR-24 (10 s) | Hang up, then `failed` |
| `answered` | The answer has been returned to the widget | `active` | 15 s for the widget to report `connected` | Hang up, then `failed` with reason `media_timeout` |
| `active` | The widget reports `connected` | `wrapping_up`, `reattaching` | Wrap-up starts at 9:30 (§6.1) | Wrap up |
| `reattaching` | The sideband dropped, and no hangup has been sent | `active` or `hanging_up` | 3 s | Hang up |
| `wrapping_up` | The time cap, a silent line or the agent's goodbye | `hanging_up` | The hard deadline: `connected_at` + 10:00 | Hang up |
| `hanging_up` | Hangup sent | `closed` | 15 s: the 10 s hangup request plus a 5 s wait for the sideband to close | Close locally; if the hangup failed, leave it to the sweeper |
| `closed` / `failed` | End state | — | — | — |

- **VR-2 (durability):**
  - The worker writes `openai_call_id` before attaching the sideband.
  - On start-up, the worker hangs up every call it owns that has no `hangup_confirmed_at`. OpenAI's example cannot do this, because its state lives only in memory [S12].
  - A sweeper runs every 30 seconds. It hangs up calls past their deadline plus 60 seconds and calls stuck in a setup state for more than 60 seconds, and it retries failed hangups with backoff.
  - A close request that arrives before setup finishes is recorded in `voice_session_cancellations`. Setup checks this table at each step and hangs up if the session was cancelled.
- **VR-3 (caps):**
  - The caps are enforced atomically at reservation (Block 1 N-5, N-6).
  - The worker also keeps its own limit of live calls (60 per worker), so a bug in `web` cannot overload OpenAI.
- **Live states**, which count toward the caps and the one-live-call-per-visitor rule: `reserved`, `creating`, `attaching`, `answered`, `active`, `reattaching` and `wrapping_up`. `hanging_up` does not count.
- **Session columns** (Block 3 finalises the schema):
  - Identity and ownership: `id` (the browser's session ID), `tenant_id`, `clinic_id`, `visitor_hash`, `channel` (`web_widget`), `notice_version`, `openai_call_id` (unique), `model`, `voice`, `worker_id`, `previous_session_id`.
  - State and outcome: `state`, `languages`, `outcome`, `close_reason`, `last_error_code`.
  - Times: `created_at`, `connected_at`, `deadline_at`, `closed_at`, `hangup_confirmed_at`.
  - A partial unique index on `visitor_hash` over the live states enforces one live call per visitor.

**VR-24, setup time budget** [Default]:

| Step | Budget |
|---|---|
| Admission in `web` (checks and reservation) | 1 s |
| Call creation | First attempt: 6 s timeout. One retry only after a fast `429 slow_down`, `503 server_is_overloaded` or a network error before any response, only if `Retry-After` is 1 s or less, and only if at least 3 s of the 7 s creation budget remain. |
| Attach plus readiness | 10 s in total. One retry with a new `RealtimeSession`, if at least 4 s remain. A `404 call_id_not_found` has been reported about 5.5 s after the handshake began (research §2). |
| `web` → worker request | Timeout 18 s |
| Widget request | Timeout 20 s, showing "Connecting…" meanwhile |
| Normal case | 1.5 s or less at the 95th percentile (P0-14) |

**When the patient is told about a failure:**

- When OpenAI **answers with an error**, the widget shows the busy or out-of-service message and the callback form at once, within 5 s of the tap.
- When OpenAI **does not answer at all**, it shows them when the budget runs out, at most 20 s after the tap.

Block 1 N-9 is updated to match.

---

## 3. OpenAI session settings

### 3.1 Where each setting goes (VR-4) [Default]

- **Call creation body:** keep it minimal, as in OpenAI's example: `{type, model, audio.output.voice, tracing: null}` [S1, S12].
  - The research disagrees on whether the calls reference documents a full schema for this body (research §2 and §5).
  - Check P0-2 settles it. If the full settings are accepted, send them here too, so the very first audio already uses our settings. The readiness gate then becomes a safety check.
- **Sideband:** on connect, the SDK sends a full `session.update` built from the `RealtimeSession` config. Any field we did not set gets the SDK's default [S13]. So **every setting in §3.2 is set in the `RealtimeSession` config**, and never only in the creation body.
- **Settings outside the SDK's config type:** the 0.21.0 config type has no field for `max_output_tokens` or `truncation`. The SDK sends them only when they are placed in `config.providerData`, which is merged into the raw session payload (research §5).
- **During the call:** no `session.update` of instructions or tools. Updating them would break prompt caching (§3.4) and makes the SDK resend everything.
  - The one exception is a re-attach after a drop (§6.2): it resends identical settings, and the cache cost is accepted.
  - Changing turn detection mid-call, for example a longer silence window while a patient reads out a number, is left out of the MVP [Default].
- **A warning sign for the turn-detection fields.** The SDK's SIP helper says OpenAI's Calls API rejects `threshold`, `prefix_padding_ms` and `silence_duration_ms` for SIP calls (research §5). Checks P0-2 and P0-4 test whether WebRTC calls accept them.
  - If they are rejected, fall back to `server_vad` with OpenAI's defaults. That keeps the idle timeout but loses tuning.
- **VR-6 (check what OpenAI applied):** log the settings that `session.updated` echoes back for every call. Compare them with §3.2, including `max_output_tokens`, and alert on any difference.
  - The documentation and its own example disagree on some defaults: `silence_duration_ms` is 500 ms in the reference but 200 ms in the example [S1].
  - Until P0-4 shows what the tracing echo looks like, an unexpected tracing value raises an alert rather than failing the call.

### 3.2 Start values (VR-5) [Default]

| Setting | Start value | Why | Phase 0 |
|---|---|---|---|
| `model` | Per clinic: `gpt-realtime-2.1-mini`, or `gpt-realtime-2.1` as the fallback. Set it in the creation body and in the `RealtimeSession` `model` option. | Otherwise the SDK sends `gpt-realtime-2.1` [S13]. The model has a 128k-token context [S28]. | — |
| `output_modalities` | `["audio"]` | Audio plus its transcript [S1] | — |
| `audio.output.voice` | Per clinic, from a tested list. Start with `marin`, `cedar` and two or three others. | OpenAI's general quality picks. There is no Arabic guidance [S8]. The voice is locked after the first audio [S2]. | Native raters compare 4–5 voices |
| `audio.output.speed` | 1.0 | Speed is only a playback setting [S1] | — |
| `audio.input.turn_detection` | `server_vad`: `threshold` 0.5, `prefix_padding_ms` 300, `silence_duration_ms` 600, `idle_timeout_ms` 30000, `create_response` true, `interrupt_response` true | The idle timeout behind W-10 (the agent checks in after 30 s) exists only for `server_vad` [S1, S4]. 600 ms lets a patient pause while reading out a number. | Compare with `semantic_vad` (eagerness auto, low); silence 500 / 600 / 700 ms; threshold 0.5 / 0.6. Field acceptance: P0-2, P0-4. |
| `audio.input.noise_reduction` | `far_field` for every call | Assumption: patients hold the phone in front of them to see cards and typed fields. The research also suggested `near_field` for phones. MVP has no per-call switching. | P0-20 picks far, near or off |
| `audio.input.transcription` | `gpt-live-transcribe`, `languages: ["ar", "en"]`, keywords = clinic and doctor names (sanitised), prompt = context only | §3.3 | The P0-5 matrix |
| `reasoning.effort` | `low`, set explicitly | OpenAI recommends `low` for support and lookup agents. The default is undocumented [S8]. Keep it the same for the whole call (§3.4). | Compare `minimal` (P0-17) |
| `tool_choice` | `auto` | — | — |
| `parallel_tool_calls` | `false` | Holds and bookings must happen in order | — |
| `max_output_tokens` | 1500, sent through `config.providerData` | A guard against runaway answers. Agent audio uses 20 tokens per second, so this is about a minute of speech. | Watch for `incomplete` responses. Whether reasoning tokens count is unknown (P0-19). |
| `truncation` | Not sent. The SDK does not send it, and the API default is `auto`. | A 10-minute call is far below the 128k-token context. Microsoft's Azure docs say 2.x models ignore truncation; OpenAI has not documented this (research §1). | — |
| `tracing` | `null` in the creation body, and `tracingDisabled: true` in the SDK | Tracing cannot be changed once enabled [S1]. It does not meet EU data-residency rules [S10]. | Check the echo (P0-4) |
| `historyStoreAudio` (SDK) | `false`, the default | No audio is stored | — |
| Audio formats | Leave as the SDK sends them (PCM 24 kHz) | WebRTC negotiates Opus on its own | P0-4 checks that the SDK's format fields cause no error |

### 3.3 Caller transcription (VR-7) [Default]

**Why it is needed.** Live captions (W-5) and the conversation log (D-8) both need a transcript of what the patient said.

**Its limits.**

- OpenAI says the input transcript only approximates what the model heard and may differ from it [S1]. Booking data therefore comes **only from tool arguments**, checked on the server and read back digit by digit (A-5). It never comes from the transcript.
- OpenAI staff also say the agent's own output transcript is not guaranteed to match its audio exactly (research §3). This limits the guardrail in §5.1.

**Model ladder.** The research disagrees here:

- one fact-checker preferred `gpt-transcribe`;
- another said to drop it;
- a third suggested the older `gpt-4o-*-transcribe` models.

P0-5 decides. The ladder, from first choice to last resort:

| Rank | Model | Price per minute | Status for our setup |
|---|---|---|---|
| 1 | `gpt-live-transcribe` | $0.017 | OpenAI's guide says "start with gpt-live-transcribe", but that same guide says it does not support voice activity detection in transcription-only sessions [S6]. OpenAI's SDK docs configure it in a RealtimeSession on `gpt-realtime-2.1` with semantic VAD, not over a WebRTC sideband [S14]. Unverified for our setup. |
| 2 | `gpt-transcribe` | $0.0045 | OpenAI's cost guide recommends it for committed turns in Realtime sessions [S7]. The transcription guide says that workflow "requires a WebSocket connection" [S6]. Our audio is WebRTC, so this is unverified. |
| 3 | `gpt-4o-transcribe`, or `gpt-4o-mini-transcribe` (the SDK default) | $0.006 / $0.003 | Known to work with voice activity detection. Both shut down on 26 February 2027 [S11], so this is a temporary fallback only. |
| 4 | An out-of-band transcript from the model itself | Recalculate at 2.1-mini rates | A text-only `response.create` with `conversation: "none"` after each committed turn (research §3) |
| 5 | None | — | Store only the agent's transcript and the tool calls. Captions then show only the agent's side. |

**Language codes.**

- Test `["ar", "en"]` (the start value), `["afb", "en"]` (Gulf Arabic is `afb` in ISO 639-3 [S25]), `["ara", "en"]`, a single code, and no code at all.
- Never send `language` and `languages` together [S6].

**Prompt and keywords.**

- The prompt gives context only, for example: "Calls to a clinic in the UAE about appointments. Callers speak Gulf Arabic, English, or both." OpenAI's transcription guide advises against restating the transcription task [S29].
- Keywords are built per clinic, and stripped of `<`, `>` and line breaks. One bad keyword makes OpenAI reject the whole settings update.

**Bad transcripts and failures.**

- One secondary report links invented text to very short audio and to text made only of keyword words. Flag such transcripts.
- Alert on `conversation.item.input_audio_transcription.failed`.

**Cost.** `gpt-live-transcribe` adds about $0.013 a minute compared with `gpt-transcribe`. The planning figure for mini becomes about $0.041 a minute (Block 1 §11). Check P0-24 measures what is actually billed.

### 3.4 Prompt layout and caching (VR-8) [Default]

**Order of the prompt:**

1. **Platform policy:** the same bytes for every clinic. It covers the agent's role, the language policy, the booking rules and safety.
2. **Clinic block:** versioned, and changes only when the clinic edits its data. At most 6,000 tokens (Block 1 D-6).
3. **Tools:** in a fixed order, serialised the same way every time.
4. **Everything that changes during a call:** added as `system` conversation items with `conversation.item.create`, which does not trigger a reply. Examples are today's date and time in Asia/Dubai, and the placeholders for typed details.

**Known facts:**

- Realtime has no `prompt_cache_key`. Caching is automatic, based on the prompt's prefix, and best effort.
- Changing the instructions or the tools mid-call breaks the cache [S7].
- That changing the reasoning effort also breaks it is inferred from OpenAI's general prompt-caching guide, which does not cover Realtime.
- Whether the cache carries over between separate calls is undocumented. Check P0-18 measures it from `cached_tokens` on each call's first response.

**Size limit:** instructions plus tools stay at about 12,000 tokens or less (Block 1 §8.2).

### 3.5 Language behaviour (Block 5 writes the actual prompt)

OpenAI's multilingual guidance [S8] gives these rules:

- Greet in the clinic's default language.
- Switch language only when the patient says something substantive in the other language, or asks to switch. Never switch because of a name, an accent or an English medical term inside an Arabic sentence.
- Keep lead-in phrases and confirmations in the current language.
- If unsure, ask once, in both languages.

Our additions:

- Write the Arabic instructions and examples in Gulf spelling.
- Convert numbers to Western digits in tool arguments.
- Read identifiers back digit by digit.

**Known risks** (all secondary):

- On `gpt-realtime`, a name such as "Amir" made the model switch language, even when the prompt forbade it [S27].
- On `gpt-realtime-2`, instructions about accent were reportedly ignored (research §3).
- One early user of 2.1-mini reported that it stopped calling tools in a SIP flow, while also noting that it followed prompt rules more consistently [S26].

Phase 0 measures all three (P0-23, Stage B).

---

## 4. Tools at runtime

### 4.1 How a tool call runs (VR-9) [Default]

- **The SDK runs completed calls.**
  - It runs a tool when `response.output_item.done` carries a function call with status `completed`.
  - It then sends the result and `response.create` through its own sequencer, which allows only one response at a time [S13, S32].
  - We do not rebuild this flow.
- **Tool definition.** Each tool is a `tool()` with [S31]:
  - Zod parameters, strict by default, with `.nullable()` instead of `.optional()`;
  - a `timeoutMs` of 4,000 for reads and 8,000 for writes;
  - `timeoutBehavior: "error_as_result"`;
  - a `timeoutErrorFunction` and an `errorFunction`, both returning `{ok: false, code, say}` and never internal details. Without `timeoutErrorFunction`, the model would see a generic "timed out" message.
- **Trusted context.** The tenant, clinic and session come **only** from `runContext.context`, never from tool arguments (Block 1 N-14).
- **Opaque references.** The hold and booking references that a tool returns are bound to the clinic and the session on the server. A reference that is forged, stale or from another session is rejected.
- **Idempotency.**
  - Every write is keyed by `(voice_session_id, tool call ID)` in Postgres, so a retried call returns the same result (Block 1 B-6).
  - Business rules add a second guard: a hold can be used only once, and only one booking can exist per hold.
  - A write that times out might still commit. So the timeout message tells the model to check the current state, through `find_booking` or the hold's status, before trying again.
- **No `needsApproval`.** There is no human on the server to approve anything. Confirmation happens in the conversation (A-5), and server state enforces it:
  - `book_appointment` needs a valid hold for this session;
  - `reschedule_appointment` and `cancel_appointment` need a booking that was verified in this session (B-8).
- **Speed.** Every tool, read or write, completes within 300 ms at the 95th percentile (Block 1 N-3). The timeouts above are only hard limits. The agent says one short lead-in sentence before `find_slots` and `book_appointment` (Block 5).
- **The patient speaks while a tool runs.**
  - Voice activity detection may start a new response, which can leave an unfinished function call.
  - The SDK runs only completed calls. So the worker scans each `response.done` for function calls that did not complete, and sends each one an output such as `{status: "superseded"}` through `transport.sendEvent`, without a new `response.create`.
  - This is our design, not documented OpenAI behaviour. P0-23 tests it.
  - A write that had already committed stays committed, and the agent mentions it on the next turn.
- **Typed details** (W-6):
  - Typed values are saved in the session's context in Postgres.
  - The model sees only a placeholder item, such as "[name and mobile captured on screen]".
  - `book_appointment` reads the real values from the context.

### 4.2 Tool results and on-screen cards

- **Two outputs per tool.** A tool returns compact JSON to the model. It can also write a widget event, such as slot cards (W-12) or the confirmation card (W-7), through the outbox to SSE.
- **What tool output never contains:** other patients' data, or internal IDs. Only the opaque references above are allowed.

---

## 5. Guardrails and context injection

### 5.1 Output guardrails (VR-10) [Default]

- **The check.** It runs on the agent's transcript, through the SDK's `outputGuardrails` with `debounceTextLength` about 100. It is made of lists, with no AI model involved:
  - phrase and pattern lists per language for diagnosis and medical advice, such as dosages, "you should take" or "it sounds like";
  - the names of other clinics, taken from our database;
  - patterns for personal data, such as phone numbers and Emirates IDs.

  Block 5 owns these lists.
- **Its limits.**
  - The patient may already have heard part of a sentence before the transcript arrives.
  - The transcript may not match the audio exactly (§3.3).

  The prompt (Block 5) is the first defence; this check is the backstop.
- **On a trip, cut the audio ourselves.**
  - The worker sends `response.cancel`, then `output_audio_buffer.clear`.
  - The SDK's own `interrupt()` on the websocket transport probably does nothing on a WebRTC sideband, because it waits for audio events the sideband may never receive (documented in the SDK source [S13]; the outcome is unverified).
  - P0-6 tests this. An alternative is the SDK's `OpenAIRealtimeSIP` transport, whose interrupt already sends both events [S15].
- **The SDK's feedback message.** After a trip, the SDK tells the model what was blocked, and that message includes the guardrail's output as JSON [S32].
  - Keep that output free of personal data and internal details.
  - Tag the message so it never appears in the patient's transcript.

### 5.2 Adding context during a call (VR-11) [Default]

- **Silent context:** a `system`-role `conversation.item.create`, sent with `transport.sendEvent`. It triggers no reply. Uses include the time warning and a refreshed slot list.
- **Spoken prompts:** `response.create` with instructions for that one response. Uses include the greeting and the goodbye.
- **Never** `session.update` the instructions mid-call (§3.1).

**VR-26, responses started by the worker** [Default]:

- Only one response can be active at a time.
- A response can be active while no audio is playing, for example while the model is thinking or a tool is running.
- A second request fails with `conversation_already_has_active_response`. The error code is sometimes empty, so match the message as well (research §1).
- The SDK's sequencer only orders the SDK's own requests.

So the worker tracks `response.created` and `response.done` itself. It sends its own `response.create` (greeting, goodbye) only when no response is active, and otherwise queues it until the next `response.done`. If the "already active" error still occurs, it retries after the next `response.done`.

---

## 6. Ending, failures and recovery

### 6.1 Normal endings (VR-12) [Default]

**The 10-minute timeline (W-10).** Times count from `connected_at`.

| Time | What happens |
|---|---|
| 8:00 | The widget gets `app.call.time_warning`, and a `system` item tells the agent there are about two minutes left and it should steer towards a close |
| 9:30 | State `wrapping_up`: the worker asks for a short goodbye as soon as no response is active (VR-26) |
| Goodbye finished, or 10:00 | Hang up, whichever comes first. A goodbye still playing at 10:00 is cut off. |
| 10:00 + 60 s | The sweeper hangs up anything still open |

Conversation therefore never runs past 10:00.

**The worst case for a draining worker:**

| Phase | Time |
|---|---|
| Setup | 20 s |
| Conversation | 10:00 |
| Hangup | 15 s |
| **Total** | **about 10:35** |

That fits within the `stop_grace_period` of about 11 minutes.

**Other endings:**

| Trigger | What happens |
|---|---|
| The patient taps End | The widget calls close, and `web` passes it to the worker. The worker hangs up at once, with no goodbye. |
| The agent ends the call | The agent says goodbye, then calls `end_call`. This tool returns its result with the SDK's `backgroundResult(...)`, so no follow-up `response.create` is sent [S32]. The worker hangs up once the goodbye has finished playing. P0-23 checks that no extra speech follows. |
| A silent line | **30 s:** `idle_timeout_ms` fires `input_audio_buffer.timeout_triggered`, and OpenAI generates a check-in. The worker then adds a `system` item: "if the patient stays silent at the next timeout, say a short goodbye and call `end_call`". **Next timeout:** that goodbye. If `end_call` does not follow within 10 s, the worker hangs up itself. |
| Repeated failures | After 3 failed or incomplete responses in a row, the agent apologises, the widget shows the callback card, and the call ends |

**About the silent-line timing.** The idle timer restarts only after the check-in has finished playing [S1]. A silent line therefore ends after roughly 60–70 s, not exactly 60 s.

**How the goodbye's end is detected:**

- by `output_audio_buffer.stopped`, if the sideband receives it (P0-3);
- otherwise, when the transcript is done plus an estimate of the remaining playback, based on the number of audio tokens at 20 per second.

**How every hangup runs:**

1. Tell the widget first, with `app.call.ended` and the reason. What the browser sees after a server hangup is undocumented.
2. Send `POST …/hangup`, with the SDK's own retries off and a 10-second timeout. A 404 counts as success.
3. Wait up to 5 seconds for the sideband to close, then close it locally.
4. Finalise usage and the transcript.

### 6.2 Failures (VR-13) [Default]

| Failure | How it is detected | What happens |
|---|---|---|
| Call creation returns 429 `slow_down` or 503 `server_is_overloaded`, or a network error happens before any response | HTTP status, or the request error | One more attempt under VR-24. If that also fails, the widget shows the busy message and the callback form (W-8, N-9). |
| Call creation returns 400, 401, 403 or 404, or a quota or billing 429 | HTTP status | No retry. Alert the platform admin. The widget shows the out-of-service message **and** the callback form. |
| Call creation times out after the request was sent | Timeout | No retry. Without an idempotency key, a retry could leave an orphan call we cannot identify. Mark the session `failed`, show the busy message and the form, and alert if this keeps happening. |
| The `Location` header or the answer fails validation | Checks in §2.2, step 7 | Hang up the new call ID; `failed` |
| Attaching the sideband fails (`404 call_id_not_found`, or a socket error) | Connect error | One retry with a **new** `RealtimeSession`, within VR-24. `connect()` throws unless the transport is disconnected [S13]. If that fails, hang up and show the busy message. |
| Readiness is not confirmed within the attach budget | Timer | Hang up; `failed` |
| The widget never reports `connected` (15 s) | Timer | Hang up. The widget shows a connection error with a retry button. Log the ICE details. |
| The sideband drops during a call | The transport reports `disconnected`. Reported for SIP calls: OpenAI sends no close frame, so a deliberate end and a drop look the same (secondary [S16]). | Only from `active` or `wrapping_up`, and only if no hangup has been sent: enter `reattaching`. Attach a new `RealtimeSession` with identical settings, which must pass the readiness echo check, within 3 s. The conversation continues on OpenAI's side, our own state comes from Postgres, and any unfinished function calls get outputs (§4.1). This is undocumented; P0-9 tests it. If it fails: hang up, send `app.call.ended` with reason `error`, and offer a callback. |
| The browser connection is lost | VR-25 (§7.3) | Hang up. The sideband may never learn that the browser left (SDK issue #684, closed without a fix). |
| The worker is told to stop (a deploy) | SIGTERM | Stop accepting calls: readiness goes false, and `web` shows the busy message. Calls still being set up are cancelled and hung up. Live calls run to their end (§6.1). **Until Block 11 designs a blue/green swap, deploy the worker outside clinic hours** (Block 1 §6.2). |
| The worker crashes | Process exit | Docker restarts it. Start-up recovery hangs up every call this worker owned (VR-2). Widgets see the disconnect and show an ended message. |
| OpenAI sends an `error` event mid-call | `error` event | Log it with our event ID; most are recoverable. After 3 failed responses in a row, end gracefully (§6.1). |
| Rate limits are close | `rate_limits.updated` | Alert when less than 20% remains. Admission lowers its caps. |

**Keepalive.** The SDK sends no pings. In a December 2025 forum thread, an OpenAI engineer said nothing on the server side enforces a timeout (secondary, research §2). Do not add an aggressive client-side ping timeout. P0-11 tests a 5-minute silent call.

### 6.3 Reconnecting after a dropped browser connection (Block 1 N-10)

- **The patient starts it.** The widget offers **Reconnect**, and the patient taps it. iOS needs a tap to reopen the microphone, so reconnects are never automatic.
- **The new session.** It is reserved with `previous_session_id`. In the same transaction, admission closes the previous session if it is still live, hanging up its call if needed, so the one-live-call rule never blocks the reconnect.
- **Seeding.** The worker starts the new call with a `system` item that summarises where things stood: the held slot (which survives its 5 minutes, B-4), the details already captured (as placeholders) and the patient's intent.
- **Time.** The reconnected call keeps the original call's remaining time, with at least 3 minutes.
- **Limit.** At most 2 reconnects per original call.

---

## 7. The widget's audio side

### 7.1 Embedding and microphone permission (VR-14) [Default]

- **The iframe.** It uses `allow="microphone; autoplay"`, with no origin list and no `*`. A wildcard would give the microphone to any origin loaded in the frame. Current WebKit parses both forms [S20]. The clinic pastes a small loader script that creates the iframe, so the attribute is always right.
  - Add `screen-wake-lock` only if Phase 0 decides the screen should stay on during a call [Open].
- **The clinic's own headers.** Onboarding fetches the clinic's page and checks two headers:
  - **`Permissions-Policy`:** it can block the microphone in Chromium-based browsers only. Firefox and Safari ignore that header [S19], so the error message names the browsers affected.
  - **`Content-Security-Policy` `frame-src`:** it must allow our widget origin.
- **Which site the browser asks for.**
  - Chrome asks for, and remembers, the permission per clinic site.
  - If the patient picks "Allow this time", Chrome asks again on the next visit.
  - What Safari and Firefox show is unverified. P0-21 takes screenshots.
- **Popup fallback.** If the iframe cannot get the microphone, offer "Open in a new window" on our own origin. There, the permission belongs to our domain and is shared across all clinics.
- **Permission flow.**
  - A short pre-prompt, shown before the Start button, explains what the browser is about to ask.
  - `getUserMedia` is called only inside the Start tap.
  - Each error gets a clear message: `NotAllowedError` (blocked: show how to unblock, and the popup), `NotFoundError` (no microphone), `NotReadableError` (microphone busy), and anything else (retry).
- **Widget page headers.**
  - `Content-Security-Policy: frame-ancestors` lists that clinic's allowed origins.
  - `Permissions-Policy: microphone=(self)` is set.
  - No `X-Frame-Options`.

### 7.2 Capturing and playing audio (VR-15) [Default]

- **Capture.** Use `getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: { ideal: 1 } } })`. Use plain booleans or `ideal` only, never `exact`.
- **Playback.** Agent audio plays **only** through an `HTMLAudioElement` (`srcObject`, `autoplay`, `playsinline`), so Chrome's echo canceller can use it as its reference. Any analysis taps the stream through an `AnalyserNode` that is not connected to the speakers.
- **Speakerphone echo.** Echo can make the agent think the patient interrupted. Mitigations:
  - the noise-reduction setting chosen in P0-20;
  - tuning the detection threshold;
  - a "headphones work best" hint;
  - a mute button.

  OpenAI also documents a no-op `wait_for_user` tool that helps the model ignore background audio (research §1). Block 5 decides whether to add it, after P0-20.
- **Measuring false interruptions.** P0-20 counts speech detected within 500 ms of the agent starting to speak that produces no meaningful transcript.

### 7.3 Connection handling (VR-16, VR-25) [Default]

- **Audio-only offer, no data channel.** This is the pattern in OpenAI's example [S12]. The server's SDP policy, not browser code, is the security boundary.
- **ICE and UDP.**
  - OpenAI's relay terminates the media, so we configure no STUN or TURN servers.
  - Secondary 2026 sources say the relay answers with UDP only, so networks that block UDP will fail to connect.
  - Log the candidate types and the selected pair for every call.
  - After the connect timeout, show "This network is blocking voice calls; try mobile data."
  - Running our own TURN server over port 443 is a later option. It adds cost and a relay hop, and raises TDRA questions.
- **Firefox.** Calls were reported to drop on the patient's second turn. Mozilla closed the bug as "works for me" on Firefox 151.0.3 after it stopped reproducing, and OpenAI has not confirmed a fix (secondary [S18]). Show "For best results use Chrome, Edge or Safari" until P0-21 clears it.
- **Widget connection states.**
  - The states are `idle`, `requesting_mic`, `connecting`, `connected`, `reconnecting` and `ended`.
  - There is no ICE restart; it is undocumented for an existing call. Instead, end the call and offer Reconnect (§6.3).

**VR-25, liveness signals:**

| Signal | Threshold | Who detects it | Action |
|---|---|---|---|
| `connectionState` is `disconnected` | 10 s | Widget | Show "Reconnecting…". After 10 s, treat it as `failed`. |
| `connectionState` is `failed` | Immediate | Widget | End the call locally, report `failed` through `client-state`, offer Reconnect |
| No incoming audio packets | 3 s, used only if P0-7 shows the relay keeps sending packets while the agent is silent | Widget | Same as `disconnected` |
| Client heartbeat (`client-state` every 5 s) | Missing for 15 s | `web` | Tell the worker the browser is lost, and the worker hangs up |
| SSE keep-alive (a comment from `web` every 10 s) | Missing for 20 s | Widget | Reopen SSE with `Last-Event-ID` |
| Sideband `disconnected` | Immediate | Worker | `reattaching` (§6.2) |

### 7.4 iOS Safari (VR-17) [Default]

- **Start.** A tap is required.
- **Audio session.** Feature-detect `navigator.audioSession`. Use this sequence, from the WebKit bug 282939 workaround:
  1. `auto` before `getUserMedia`;
  2. `play-and-record` after it;
  3. at the end, `playback`;
  4. then `auto`.

  Whether this works inside a cross-origin iframe is unverified (P0-21).
- **Recovery.** Watch the track's `mute` and `ended` events, audio-session interruptions such as a phone call, and `visibilitychange`. To recover, call `getUserMedia` again and swap the track in with `RTCRtpSender.replaceTrack`, without ending the call.
- **Known iOS 26 bug.** After an iOS audio-daemon reset, `getUserMedia` fails, and reloading the page often does not help: most affected users recovered only by fully closing and reopening Safari. A fix is committed, but the iOS release that ships it is unknown [S21]. The widget tells the patient to close and reopen Safari.
- **No promises yet.** Do not promise that a call survives screen lock or switching apps until the device tests in P0-21 pass.

---

## 8. Latency budget (VR-18) [Default]

The targets come from Block 1:

| ID | Measure | Target |
|---|---|---|
| N-1 | From the tap to the greeting | median 2.5 s; 95th percentile 4 s |
| N-2 | A turn, from the end of the patient's speech to the agent's first audio | median 1.3 s; 90th percentile 2.0 s |
| N-3 | A tool call | 95th percentile 300 ms |
| N-4 | A turn that includes a tool call | 90th percentile 2.5 s |

The table splits the median for a turn without a tool call. These are **planning allocations, not measurements**: Phase 0 replaces each line with measured medians and 90th percentiles (P0-17).

| Stage | Optimistic | Conservative | Basis |
|---|---|---|---|
| Detecting that the patient finished (`silence_duration_ms`) | 600 ms | 600 ms | Our setting, and the biggest stage we can tune |
| Audio from the browser to OpenAI | 50 ms | 90 ms | One-way, about half of Azure's round-trip times from the UAE: Frankfurt about 100 ms, US East 176–189 ms [A35] |
| Model, from end of turn to first audio | 450 ms | 900 ms | No figure exists for mini. gpt-realtime-2.1 measured 0.97–1.21 s [A21], and gpt-realtime-1.5 about 0.9 s in τ-Voice [S23]. It is unclear whether those include end-of-turn detection. |
| Audio back, plus the jitter buffer and playout | 150 ms | 200 ms | `getStats` |
| **Total** | **1,250 ms** | **1,790 ms** | |

**N-2 is at risk.** It holds only in the optimistic case. The levers are:

- a shorter silence window (500 ms);
- `reasoning.effort: minimal`;
- the EU endpoint (§12).

If P0-17 shows the conservative case, N-2 in Block 1 needs revising before Stage C.

**A turn with a tool call** adds four stages:

1. The function call travels to the worker.
2. The tool runs (300 ms or less at the 95th percentile, N-3).
3. The result travels back.
4. The model starts its second response.

The agent's spoken lead-in covers this wait, so the lead-in counts as the first audio (N-4).

**How latency is measured:**

- **In the browser:**
  - a light voice detector on the microphone (end of the patient's speech) and an onset detector on the agent's audio. Their gap is the perceived turn latency.
  - `getStats`:
    - `remote-inbound-rtp` `roundTripTime`. Current Safari lacks `candidate-pair` `currentRoundTripTime` [S19].
    - `jitterBufferDelay` divided by `jitterBufferEmittedCount`.
    - packets lost.
    - concealed samples.
  - Totals are sent per call, through `client-state` and a beacon when the page closes. No audio leaves the device.
- **On the server**, timestamps from the sideband:
  - `input_audio_buffer.speech_stopped`. With `server_vad`, its `audio_end_ms` includes the silence window [S3].
  - `response.created`.
  - The first transcript delta.
  - `output_audio_buffer.started`, if the sideband receives it.
  - The start and end of each tool call.
  - `response.done`.
- **Reporting:** joined by session ID, and reported as median, 90th and 95th percentiles per language, browser, operating system, network type (UDP or TCP) and model.

---

## 9. Usage metering (VR-19) [Default]

- **Each `response.done`:** insert one row with `voice_session_id`, `tenant_id`, `response_id`, `status`, `model` and the raw `usage` JSON. This keeps the split between cached, audio and text tokens. The SDK's own totals lose the link to each response (research §5).
- **Transcription:** record the usage that `conversation.item.input_audio_transcription.completed` reports, in tokens or seconds. The SDK's usage total leaves it out (research §5).
- **Cross-check:** at close, store the SDK's `session.usage` totals as a check.
- **Cost:** computed from the versioned price table (U-3). The cache-hit rate is cached input tokens ÷ input tokens, per call.
- **Capacity:** keep `rate_limits.updated` snapshots for capacity alarms (§6.2).
- **The browser never receives usage.**
- **How OpenAI bills:**
  - Realtime bills per response, with no charge for connections or bandwidth [S7].
  - Empty audio filtered out by voice activity detection does not count as model input tokens [S7].
  - Transcription is billed separately, and whether it bills all audio or only detected speech is not documented. P0-24 compares billed transcription with call length.

---

## 10. Phase 0 plan

### 10.1 Three stages [Default]

| Stage | Goal | Size | Outcome |
|---|---|---|---|
| **A. Technical spike** | Prove the call path and answer the P0 checks | One synthetic clinic, with the 3 tools from Block 1 §8.3: `get_clinic_info`, `find_slots` and a simplified `book_appointment` | **Done** when every P0 check has an answer and this document is updated. **Stop and escalate** (reopen ADR-001) if P0-1 or P0-3 fails with no fallback, or if fewer than 95% of 50 test calls complete the call path. |
| **B. Arabic quality probe** | A provisional go or no-go for OpenAI on Gulf Arabic, before the platform is built | Gulf Arabic and English. Per language: 20 live calls by native speakers, plus about 40 harness calls replaying recorded human caller turns. Scored with the §10.3 grading. The same calls are also run on `gpt-realtime-2.1`. At least 15 Gulf raters, as an indication. | **Stop and escalate to the owner** if Gulf Arabic task success is below 70%, or average naturalness is below 3.0. **Continue with the risk flagged** between 70% and 84%. **Continue** at 85% or more. |
| **C. Full evaluation** | The statistical gate for Block 1 §8.3, §14 and G-8 | §10.5 | Every E gate passes |

**Which decision each stage makes.** Stages A and B make up Phase 0. Phase 0 makes the Block 1 §8.3 decision **provisionally**, on the Stage B result. Stage C confirms it on the real platform before the pilot, in Phase 3.

### 10.2 Stage A: technical checks [Open]

| ID | Check | If the answer is bad |
|---|---|---|
| P0-1 | An audio-only offer is accepted, the answer is audio-only, and the call works with control from the sideband only | Allow a receive-only data channel, and treat everything on it as visible to the browser |
| P0-2 | `POST /v1/realtime/calls` accepts the full settings, including the `server_vad` tuning fields | Keep the minimal creation body. If the tuning fields are rejected, use OpenAI's `server_vad` defaults (§3.1). |
| P0-3 | Which events the sideband receives: `session.created`; `response.done` with usage; function-call events; transcription events; `output_audio_buffer.*`; `response.output_audio.delta` | Move latency measurement and goodbye detection to browser-side signals (§6.1, §8) |
| P0-4 | The settings echoed after the SDK connects match §3.2, including `max_output_tokens` sent through `providerData` and the turn-detection fields. The SDK's audio-format fields cause no error. What the tracing echo looks like. | Fix the session config, and set the VR-6 alert accordingly |
| P0-5 | Transcription matrix: {`gpt-live-transcribe`, `gpt-transcribe`, `gpt-4o-transcribe`} × {`server_vad`, `semantic_vad`} × {`["ar","en"]`, `["afb","en"]`, `["ara","en"]`, a single code, none}. Test clips: 20 Gulf Arabic, 20 English and 20 mixed, each clean and noisy. Pass for captions: events arrive for every turn, Arabic character error rate is 30% or less, and English word error rate is 15% or less. | Move down the ladder in §3.3 |
| P0-6 | Does `response.cancel` plus `output_audio_buffer.clear` stop the agent mid-sentence, and how fast? Does the SDK's `interrupt()` do anything on our transport? Is an extra `clear` harmless? | Switch to the `OpenAIRealtimeSIP` transport, or send the events ourselves (§5.1) |
| P0-7 | Hangup: what the browser sees (`connectionState` sequence, track `ended`) and how long teardown takes; a 404 after the call has ended; whether the relay keeps sending audio packets while the agent is silent | Adjust the widget's end handling and VR-25 |
| P0-8 | Closing only the sideband: does the call keep running? Reports from SIP calls say it does (secondary [S17]). | An explicit hangup is required everywhere (the design already assumes this) |
| P0-9 | Re-attaching after a sideband drop: over 20 forced drops while the call is live, does it work, and does the conversation carry on? | Below 90% success, remove re-attach: a drop then means hang up and offer a callback (ADR-001) |
| P0-10 | Two sidebands on one call (for observability) | Optional |
| P0-11 | A call left silent for 5 minutes, with the idle timeout off: does the sideband survive? | Add a tolerant keepalive |
| P0-12 | `idle_timeout_ms` 30000 fires `timeout_triggered`; the second timeout produces the goodbye and `end_call` (§6.1) | Use an application-level silence timer instead |
| P0-13 | A call that is created but never connected: is it charged, and is it cleaned up? | Tighten the 15-second media timeout |
| P0-14 | Setup time: call creation, sideband attach and `session.updated` together take 1.5 s or less at the 95th percentile | Revisit the readiness gate and the creation body |
| P0-15 | Connecting with and without waiting for ICE gathering [S30]: success rate and time, and candidate types (UDP or TCP) on e& and du, mobile and home, and office Wi-Fi | Change the offer timing; consider our own TURN server |
| P0-16 | The EU endpoint, with the four overrides in §12: call creation, the sideband and hangup on `eu.api.openai.com`, plus latency compared with the default endpoint | Stay on the default endpoint; get written confirmation from OpenAI |
| P0-17 | The latency stages in §8, measured from UAE networks; effort `low` against `minimal`; `server_vad` at 500, 600 and 700 ms against `semantic_vad` | Retune §3.2, and revise N-2 if needed |
| P0-18 | `cached_tokens` on the first response of a new call (caching across calls) and across turns | Update the cost model in Block 1 §11 |
| P0-19 | `max_output_tokens` 1500: any `incomplete` responses? How are reasoning tokens counted? | Raise the limit or remove it |
| P0-20 | Echo and false interruptions on speakerphone (iPhone, Android, laptop) for `far_field`, `near_field` and off, with and without a `wait_for_user` tool | Choose the noise-reduction value in §3.2 |
| P0-21 | Browsers: Chrome, Edge, Safari on macOS and iOS, and Firefox (the second-turn drop issue). Screenshots of the permission prompt (which site it names). iOS screen lock, backgrounding, interruptions, and `audioSession` inside the iframe. | Update the browser notices and the iOS promises |
| P0-22 | Concurrency ramp to 10, 25, then 50 simultaneous synthetic calls on the Launch tier: errors, 429s, `rate_limits.updated` | Lower the caps (N-5) until OpenAI confirms |
| P0-23 | Behaviour on mini: language switching after names, Modern Standard Arabic instead of Gulf, mixed-language turns, tool-calling discipline, the patient speaking during a tool call (superseded outputs), and no speech after `end_call` | Feed the findings into Block 5 and Stage B |
| P0-24 | Billed transcription seconds or tokens compared with call length, for each candidate model | Update §3.3 and Block 1 §11 |

### 10.3 Test harness (VR-20) [Default]

**Runner.**

- TypeScript with Playwright Test, driving real Chromium (the new headless mode).
- It loads the real widget iframe, against `web` and the worker in a test tenant.
- The host test page copies a clinic's embed code, including the `allow` attributes, and launches Chromium with `--autoplay-policy=no-user-gesture-required`.
- Run it on OpenAI's Launch tier: the Build tier's 400 requests and 200k tokens per minute are too low for about 10 browsers plus simulated callers.

**Caller audio.**

- `addInitScript` replaces `getUserMedia` with a stream from a `MediaStreamAudioDestinationNode`, in an AudioContext owned by the page at 48 kHz.
- The runner pushes each caller turn's audio with `frame.evaluate` and schedules it with `AudioBufferSourceNode.start(when)`.
- Caveat: this skips the browser's echo cancellation, noise suppression and gain control.

**Smoke test of the real microphone path.** A few calls use Chrome's fake-device flags with a WAV file (`%noloop`, 16-bit mono, 48 kHz). These calls are not used for quality or latency numbers: Chromium warns that a file input played through audio processing comes out distorted.

**Capturing the agent's audio.**

- The remote track goes to a muted, playing `<audio>` element.
- In parallel, a `MediaStreamAudioSourceNode` feeds an AudioWorklet that measures loudness frame by frame, on the same clock as the injected caller audio.
- A stereo test recording keeps the caller on the left and the agent on the right.

**Turn latency in the harness** runs from the scheduled end of the caller's speech to the first agent frame above −45 dBFS that lasts at least 60 ms. Its resolution is about one frame, 10–20 ms.

**Two caller modes.**

- **Scripted:** recorded human turns, or for smoke runs only, synthetic turns, play in a fixed order.
  - The next turn starts 400–800 ms after the agent stops.
  - The agent's turn end is detected from audio energy until P0-3 confirms the sideband receives `output_audio_buffer.stopped`.
  - If the agent asks something the script cannot answer, the call is labelled as a divergence, not a failure.
- **Agent against agent:** a second `gpt-realtime-2.1` session over WebSocket plays the caller, with a persona. Its results are treated as optimistic.
- **Gated runs:** pin turn detection to `server_vad`. The `semantic_vad` "low" setting can wait 8 s, longer than the 5 s answer deadline.

**Test hook in the worker** (test tenant only). It logs every tool call and its arguments, the sideband event timestamps, and the final database state of each call.

**Grading.** A call passes when all of these hold:

- the final database state matches the expected state;
- the required tool calls were made with the right arguments;
- no unauthorised writes happened;
- an OpenAI judge model confirms the read-back and finds no invented policy.

The judge is calibrated against 60 calls labelled by people, half of them in Arabic, and must reach a Cohen's kappa of at least 0.7.

**Where the grading comes from.**

- Grading runs locally, because OpenAI's `/v1/evals` and `/v1/files` endpoints are not eligible for zero data retention [S10].
- The metric definitions follow OpenAI's voice-agent evaluation cookbook [S22]. Its code targets GPT-Live, so only the definitions carry over. The Realtime reference harness is [S33].
- The τ-Voice results [S23] serve only as a rough expectation: they are English-only and from gpt-realtime-1.5.

### 10.4 Test audio (VR-21) [Default]

- **Generate the synthetic caller library before 6 January 2027**, when OpenAI's text-to-speech models shut down [S11].
  - Write the Arabic text in Gulf spelling, and use every voice for variety.
  - A native Emirati reviewer accepts or rejects each Arabic clip.
  - Add acoustic variants: clean, café noise at 15 dB, a laptop-microphone filter and 2% packet loss.
  - Synthetic clips are for regression and smoke tests only. Block 1 §8.3 says they are not a quality measure.
- **Human recordings, the source of scored calls:**
  - 10 Gulf Arabic speakers, at least 6 of them Emirati, mixed in gender and age.
  - 6 English speakers who live in the UAE, with mixed accents.
  - 8 speakers of other Arabic dialects.
  - Each records single requests and full scripted calls on their own phone or laptop.
  - Written consent; no patient data.
- **Keeping test audio** [Open: needs the owner's approval]. Block 1 §4.3 says "no storing of conversation audio in the MVP" [Decided]. Stage C needs to keep two kinds of test audio, in a separate test store:
  - synthetic clips;
  - consented recordings of test speakers.

  Neither is a patient conversation. Only the owner can approve this exception.

### 10.5 Stage C: gates [Default]

**How a gate works.**

- A gate passes when the lower bound of the measured rate's **Wilson score interval (two-sided 95%, z = 1.96)** is at least the Block 1 pass mark minus a margin.
- The sample sizes are chosen so that a system truly at the mark usually passes.
- Block 1 §8.3 and §14 are updated to say that pass marks are judged this way.
- Scored calls for E-1 to E-3 use **human caller audio only**: live calls by native speakers, or recorded human turns replayed through the harness.

| Gate | Unit and size | Pass mark (Block 1) | Margin | Needed to pass | Chance of passing if truly at the mark | Chance of passing if truly at the floor |
|---|---|---|---|---|---|---|
| E-1 Gulf Arabic task success | 160 calls | 85% | 10 points | at least 131 | 89% | 2.5% |
| E-2 English task success | 120 calls | 90% | 10 points | at least 105 | 86% | 2.2% |
| E-3 Other Arabic dialects and mixed language | 80 calls | 80% | 15 points (a varied group) | at least 61 | 84% | 2.1% |
| E-5a Critical fields (doctor, date, time on each completed booking or reschedule) | At least 400 fields | 98% | 5 points | at least 383 of 400 | about 100% | 1.5% |
| E-5b Tool discipline (each agent turn that states availability, fees or schedules) | At least 300 turns | 98% | 5 points | at least 288 of 300 | 99% | 2.1% |
| E-5c Gulf Arabic understanding (each Gulf caller turn) | At least 1,000 turns | 90% | 5 points | at least 873 of 1,000 | about 100% | 2.1% |

**Other gates:**

- **Clustering in E-5.** The units in E-5 are grouped within calls, so also report a bootstrap by call, and gate on whichever lower bound is lower.
- **E-4, critical errors: zero across the 360 scored calls per model configuration.** That bounds the true rate below 0.83% (exact one-sided 95%). Critical errors are:
  - a wrong slot, date or patient committed;
  - a booking without confirmation;
  - cancelling the wrong booking;
  - medical advice.
- **E-6, latency:**
  - N-1, N-2 and N-4, over at least 1,000 turns per language;
  - N-3, from the worker's logs;
  - at least 98% of turns answered within 5 s;
  - the agent stops within 2 s in at least 90% of interruptions;
  - the agent cuts the patient off in 10% of turns or fewer.
- **E-7, human ratings:**
  - The scales are listening quality (ITU-T P.800 ACR, 1 to 5), listening effort, and a custom 1-to-5 "sounds Gulf" scale.
  - **Stage C:** more than 30 listeners per language, 40 clips per condition, plus anchor clips and attention traps. Agreement among raters must reach Krippendorff's alpha (ordinal) of at least 0.667.
  - **Pass:** Arabic naturalness averages at least 4.0, with a confidence-interval lower bound of at least 3.7, and the "sounds Gulf" scale averages at least 3.5.
- **E-8, safety red-team:** at least 60 emergency prompts and 60 medical-advice prompts per language, with zero failures. Zero failures in 60 bounds the miss rate below 4.9%; larger sets tighten that.
- **E-9, cost per minute:** the measured average stays within the planning range for mini: $0.028 to $0.088, from fully cached to uncached, with `gpt-live-transcribe`. If it falls outside, update Block 1 §11 before the pilot.

**Scenario mix:**

- booking 35%, reschedule 15%, cancel 15%, find a booking 10%, clinic questions 10%, callback 5%, out of scope 10%;
- overlays: interruptions 15%, background noise 20%, an unavailable slot or an expired hold at least 10%.

**Comparing mini with 2.1** uses a paired McNemar test on the same scenarios. It can only detect differences of about 15 points or more, so a "no difference" result does not prove they are equivalent.

### 10.6 What Phase 0 delivers

- **The provisional decision**, using Block 1 §8.3's rule: keep mini; move clinics to 2.1; launch English first; or revisit OpenAI-only.
- **Documents:**
  - `docs/research/03-phase0-results.md`;
  - an updated §3.2 and §8 in this document;
  - updated ADRs.
- **Assets:** the test-caller library and the test harness.
- **Cost** (an unverified estimate):
  - Calls cost about $0.12–0.26 each on mini and $0.30–0.85 on 2.1, from cached to uncached. Agent-against-agent runs add a second 2.1 session.
  - Phase 0 is likely to cost low hundreds of dollars in OpenAI usage, and Stage C a few hundred more.
  - The real cost is people: native speakers and raters. This is a budget item for the owner.

---

## 11. Security of the voice path (VR-22) [Default]

- **Keys.** The standard OpenAI API key stays on the worker. No ephemeral keys reach the browser, which also avoids the reported sideband 404 errors (Block 1 [L22]).
- **Offer and answer.** The SDP policy is enforced on both. The `call_id` never reaches the browser.
- **What the browser receives** is an allowlist only:
  - the speaking status;
  - captions;
  - cards;
  - time warnings;
  - the reason a call ended;
  - `VOICE_*` error codes.

  Never tool arguments or outputs, usage or raw errors.
- **Internal API.** It runs on a private network only, with HMAC-signed requests.
- **Requests from the widget.**
  - `Origin` must be the widget origin.
  - The widget token is scoped to one clinic and is short-lived.
  - A bot check runs before each session, and rate limits apply per device and per IP address.
- **Safety identifier.** OpenAI recommends sending a stable identifier that protects privacy [S30]. We send `visitorHash` (§2.2, step 4), which is never a phone number or a name.
  - Assumption: the widget's storage is kept separate for each clinic site and may be cleared by the browser, so the identifier is stable only on a best-effort basis.
  - The privacy design (Block 1 §7.4, Block 8) confirms this approach.
- **Tracing** is off (§3.2).
- **Logs** contain no transcript text and no personal data (Block 1 N-40).
- **Tools** take their trusted context only from `runContext`, validate every input, and write idempotently (§4.1).

---

## 12. Data residency and endpoints (VR-23) [Default]

- **Phase 0:** `api.openai.com`.
- **The EU endpoint**, if chosen, needs four overrides:
  1. the call-creation URL;
  2. the sideband URL in `connect({ url })`, because the SDK hard-codes `api.openai.com` when given a `callId`;
  3. the base URL used for hangup;
  4. the `Location` origin check in §2.2, step 7.
- **What the EU endpoint also needs:**
  - OpenAI's approval of abuse-monitoring controls, plus a Modified Retention amendment;
  - for the EU specifically, ZDR, MAM, PSP or Safety Retention; zero data retention covers this part (research §2, [S10]);
  - a 10% price uplift (Block 1 [L7]);
  - **written confirmation from OpenAI** that call creation, the sideband and the WebRTC media are all processed in the EU. The docs do not say this.
- **UAE:** OpenAI's UAE region does not offer Realtime today [S10]. See Block 1 §7.

---

## 13. Risks specific to this block

| # | Risk | Response |
|---|---|---|
| 1 | The SDK overwrites our settings with its defaults | Set every field in the SDK config, check the echo (VR-6), and keep a regression test |
| 2 | Tracing gets switched on and cannot be switched off | `tracing: null` and `tracingDisabled: true`, an echo check, and a CI test that fails if either is missing |
| 3 | No documented transcription model, and the 26 Feb 2027 shutdown | The ladder in §3.3; P0-5; question 4 for OpenAI (§14) |
| 4 | Undocumented sideband behaviour: re-attach, keepalive, which events arrive | Design for the worst case (explicit hangup, our own audio cut-off), P0-3 and P0-6 to P0-11, and questions for OpenAI |
| 5 | The UDP-only relay fails on networks that block UDP | Detect it and tell the patient; measure in P0-15; our own TURN server later |
| 6 | iOS Safari loses the microphone, or Firefox drops calls | Recovery logic (§7.4), browser notices, P0-21 |
| 7 | OpenAI's direction: its voice docs now lead with GPT-Live, a separate API [S24] with no Arabic voice ([O8]) | `/v1/realtime/calls` is not on the deprecation list [S11]. Keep the `VoiceEngine` interface; ask for the roadmap (§14). |
| 8 | No documented limit on concurrent Realtime sessions | Ramp gradually (P0-22), confirm with OpenAI, keep the worker's own limit (VR-3) |
| 9 | Test-caller audio cannot be generated after 6 Jan 2027 | Generate the library during Phase 0 (§10.4) |
| 10 | The latency target N-2 is missed | The levers in §8; P0-17; revise N-2 before Stage C if needed |

---

## 14. Questions for OpenAI (support or sales) [Open]

1. **Concurrency.** What is the limit on concurrent Realtime sessions on the Launch and Grow tiers? We plan for 50.
2. **EU processing.** Under `eu.api.openai.com`, are `/v1/realtime/calls`, the sideband, hangup and the WebRTC media all processed in the EU?
3. **UAE.** Is there a timeline for Realtime in the UAE region?
4. **Transcription.** Which caller-transcription models are supported in a WebRTC conversation with a sideband and voice activity detection, both now and after 26 February 2027?
5. **The sideband.** Can it re-attach after a drop? Can several sidebands attach to one call? What keepalive does it expect? Is there a "call ended" signal or a call-status endpoint?
6. **Caching.** Does prompt caching work across separate Realtime calls, and does zero data retention change caching?
7. **Reasoning.** What is the default reasoning effort for `gpt-realtime-2.1-mini`, and do reasoning tokens count toward `max_output_tokens`?
8. **Roadmap.** What is the plan for `/v1/realtime/calls` compared with GPT-Live? Is GPT-Live getting Arabic voices?
9. **Safety identifier.** Should `OpenAI-Safety-Identifier` also be sent on the sideband handshake, or is it bound to the call when it is created?

---

## Appendix A: Traceability to Block 1

| Block 1 item | Covered in |
|---|---|
| W-2, W-3 (one-tap start, notice before the microphone) | §2.2 steps 1–2; §7.1 |
| W-5 (captions) | §3.3; §11 (allowlisted events) |
| W-6, W-7, W-12 (typed fields, confirmation card, slot cards) | §4.1; §4.2 |
| W-8 (busy and failure states) | §6.2; VR-24 |
| W-9 (browsers and mobile) | §7; P0-21 |
| W-10 (10-minute cap, warning at 8; silence check-in and end) | §3.2 (`idle_timeout_ms`); §6.1 |
| W-11 (bot check, rate limits) | §2.2 step 3; §11 |
| A-5, A-6 (read-back; success only after the tool) | §3.3; §4.1 |
| A-7, A-10 (no medical advice; minimal data) | §5.1; §4.1; E-8 |
| B-4, B-6, B-8 (holds, idempotency, verification) | §4.1; §6.3 |
| N-1 to N-4 (latency) | §8; P0-14; P0-17; E-6 |
| N-5, N-6, N-7 (concurrency, load test) | VR-3; P0-22 |
| N-9, N-10 (failure messages, reconnect) | VR-24; §6.2; §6.3 |
| U-1 to U-3 (usage) | §9; §2.3 (session columns) |
| G-3 (ZDR) | §1; §12 |
| G-8 (Phase 0 thresholds) | §10.5 |

## Appendix B: Sources

The full findings and fact-checks are in `docs/research/02-voice-runtime-verification.md`. All pages were read on 2026-10-28 or 2026-10-29.

| ID | Source | Used for |
|---|---|---|
| S1 | https://developers.openai.com/api/reference/resources/realtime/subresources/calls.md | Creating calls; session fields and their defaults; tracing cannot change once enabled; the input transcript is approximate |
| S2 | https://developers.openai.com/api/reference/resources/realtime/client-events | `session.update` rules: model and voice are locked |
| S3 | https://developers.openai.com/api/reference/resources/realtime/server-events.md | Event fields; `audio_end_ms` includes the silence window |
| S4 | https://developers.openai.com/api/docs/guides/realtime-vad.md | Turn-detection types; eagerness; idle timeout only for `server_vad` |
| S5 | https://developers.openai.com/api/docs/guides/voice-server-controls | The sideband by `call_id`; the `Location` header; one owner per action |
| S6 | https://developers.openai.com/api/docs/guides/realtime-transcription.md | Transcription models; `languages`; VAD limits in transcription sessions; "requires a WebSocket connection" |
| S7 | https://developers.openai.com/api/docs/guides/voice-latency-cost | Billing per response; `gpt-transcribe` for Realtime sessions; token rates; what breaks the cache |
| S8 | https://developers.openai.com/api/docs/guides/voice-prompting.md | Language policy; reasoning effort; reading numbers back |
| S9 | https://developers.openai.com/api/docs/guides/realtime-conversations.md | The 60-minute session limit |
| S10 | https://developers.openai.com/api/docs/guides/your-data | Residency regions and their prerequisites; ZDR eligibility; tracing and EU residency |
| S11 | https://developers.openai.com/api/docs/deprecations | Shutdown of the TTS models (2027-01-06), older realtime models (2027-01-20) and older transcription models (2027-02-26) |
| S12 | https://github.com/openai/openai-agents-js/tree/main/examples/realtime-server-controlled | The reference implementation: SDP policy, call creation, readiness gate, cleanup, audio-only client |
| S13 | https://github.com/openai/openai-agents-js/blob/v0.21.0/packages/agents-realtime/src/openaiRealtimeBase.ts and `openaiRealtimeWebsocket.ts` | SDK defaults and how they overwrite our settings; `connect()` rules; interrupt behaviour |
| S14 | https://raw.githubusercontent.com/openai/openai-agents-js/v0.21.0/examples/docs/voice-agents/configureSession.ts | `gpt-live-transcribe` used in a RealtimeSession (docs example) |
| S15 | https://github.com/openai/openai-agents-js/blob/v0.21.0/packages/agents-realtime/src/openaiRealtimeSip.ts | The `OpenAIRealtimeSIP` transport's interrupt (cancel plus clear) |
| S16 | https://community.openai.com/t/lack-of-realtime-websocket-close-frame/1369160 | No close frame on SIP sidebands (secondary) |
| S17 | https://community.openai.com/t/how-can-i-programatically-end-a-gpt-realtime-sip-call/1355362 | Closing the WebSocket does not end a SIP call (secondary) |
| S18 | https://community.openai.com/t/firefox-realtime-api-webrtc-voice-sessions-drop-deterministically-on-the-users-second-speech-turn/1380257 | The Firefox second-turn drop (secondary) |
| S19 | https://github.com/mdn/browser-compat-data (`http/headers/Permissions-Policy.json`, `api/RTCStatsReport.json`) | The Permissions-Policy header is Chromium-only; gaps in Safari's statistics |
| S20 | https://github.com/WebKit/WebKit/blob/main/Source/WebCore/html/PermissionsPolicy.cpp | How WebKit parses the iframe `allow` attribute |
| S21 | https://bugs.webkit.org/show_bug.cgi?id=319706 | The iOS 26 audio-daemon `getUserMedia` bug |
| S22 | https://raw.githubusercontent.com/openai/openai-cookbook/main/examples/audio/duplex_voice_agent_evaluation/README.md | Definitions of voice-agent evaluation metrics |
| S23 | https://arxiv.org/html/2603.13686v1 | τ-Voice benchmark (English only, gpt-realtime-1.5) |
| S24 | https://developers.openai.com/api/docs/models/gpt-live-1.md | GPT-Live as a separate API |
| S25 | https://iso639-3.sil.org/code/afb | The Gulf Arabic language code |
| S26 | https://community.openai.com/t/new-realtime-models-on-the-api-gpt-realtime-2-1-and-gpt-realtime-2-1-mini/1385896 | Early reports on 2.1-mini (secondary) |
| S27 | https://community.openai.com/t/realtime-api-language-switching/1366289 | Language switching triggered by names (secondary) |
| S28 | https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini | Model facts, rate limits and prices |
| S29 | https://developers.openai.com/api/docs/guides/transcription | Prompting advice: don't restate the transcription task |
| S30 | https://developers.openai.com/api/docs/guides/voice-webrtc | Safety identifier recommendation; waiting for ICE gathering |
| S31 | https://github.com/openai/openai-agents-js/blob/v0.21.0/packages/agents-core/src/tool.ts | Tool timeouts, `timeoutErrorFunction`, `errorFunction` |
| S32 | https://github.com/openai/openai-agents-js/blob/v0.21.0/packages/agents-realtime/src/realtimeSession.ts | Tool flow and `backgroundResult`; tracing on `session.created`; guardrail feedback |
| S33 | https://github.com/openai/openai-cookbook/tree/main/examples/evals/realtime_evals | OpenAI's Realtime evaluation reference harness |
