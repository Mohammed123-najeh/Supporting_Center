# Supporting_Center: Research Baseline v0.1

**Date:** 2026-10-28 · **Status:** factual baseline for the design decisions that follow. This is not a design. · **Readers:** the owner, who makes the decisions, and the coding agent, which builds the system later.

**Inputs:** seven research reports. An adversarial verification of its decision-critical claims follows each report. The reports cover (1) the OpenAI voice stack, (2) alternative voice stacks and Arabic speech quality, (3) telephony, WhatsApp, SMS and e-mail, (4) competitors and the market, (5) knowledge, RAG, memory and caching, (6) platform architecture, reliability, security, compliance and observability, and (7) the restaurant and clinic verticals.

## How to read this

- **(verified):** the verification pass confirmed the claim. This includes figures it recomputed and facts it added from primary sources. **(corrected):** the verification pass changed the claim, and the corrected value is used. **(unverified):** not checked, either because the claim was not decision-critical or because the verifier could not confirm it. Treat these as indicative. A tag covers the figures and claims before it in the same sentence or table cell.
- **Derived figures** are computed in this document. They are tagged "(derived; verified inputs)" or "(derived; includes unverified inputs)". The §3 cost model reproduces the verifier's recomputation exactly: 66,800 input tokens, and $0.2531 and $0.0707 per call.
- **Sources:** bracketed IDs such as [O4] point to the URL, publisher and date in §8. Prices are USD list prices. Most vendor pages are undated; all were accessed 2026-10-28.
- **"Preliminary leaning"** means a starting hypothesis for the design phase, with its reason and what would change it. It is not a decision.
- **Gaps:** the shared web-search budget ran out in several research dimensions. These items were not researched or could not be retrieved: primary telecom-regulator texts for KSA, Egypt, Jordan and Palestine; MENA payment providers; official emergency numbers; Egypt's data-protection regulations; the BAA scope of Twilio and Telnyx; Ramadan and peak-hour call volumes; Careem's POS API; and whether the target markets require AI disclosure on calls. Dashboard UI/UX was outside this research round.

## Review notes

These notes were added in the main session after the synthesis.

- **How this was produced:**
  - Seven research agents, seven fact-checkers and one synthesis agent.
  - A separate review agent was stopped to save cost. These notes replace it.
  - The synthesis agent hit its output limit once and finished in a second message. The two parts were joined in §5.1, unchanged.
- **Verification totals:**
  - 101 decision-critical claims were checked: 83 confirmed, 15 corrected, 3 unverifiable.
  - The fact-checkers also flagged 77 facts the reports had missed. The synthesis used some of them, tagged (verified).
- **Arithmetic check:** these figures were recomputed and match to rounding:
  - §3.3: line items and totals for A1–A4.
  - §3.6: the all-in table, including the 77% and 88% telephony shares.
  - §3.8: the tenant economics.
- **Wording fix:** the first row of §1.2 gives the cost per minute (model only, no transcript), not per call. It is clarified in place.
- **Unverified items that decisions depend on.** Resolve each one before the related block is decided:
  1. Recording-consent penalties in the UAE, KSA, Egypt and Palestine (§2.7). Needs a legal review.
  2. Whether WhatsApp calls are blocked in the UAE (§2.2). This decides the UAE channel plan.
  3. Operator call-forwarding charges, and whether caller ID survives forwarding, in MENA (§2.2, §3.5). Forwarding is the proposed default channel.
  4. BAA coverage for OpenAI Realtime (§1.2). This decides whether US clinics can run on OpenAI speech-to-speech.
  5. Realtime concurrency on the lowest OpenAI usage tiers (§2.6). This decides launch capacity.
  6. Scribe v2 Realtime and Azure TTS prices (§3.2). The amounts are small, but they set the cascade's cost.
- **The leanings are hypotheses, not decisions.** Several depart from the owner's stated preferences:
  - LiveKit and a cascade for Arabic, instead of the OpenAI Agents SDK with Realtime only.
  - An EU-Frankfurt cell for MENA tenants.

  Each is decided in its own block (Requirements, Voice runtime, Infrastructure), with an ADR.

---

## 1. Executive summary

1. **Arabic dialect quality is the gating unknown, and the early evidence is unfavourable to OpenAI's audio models.**
   - No independent benchmark covers any speech-to-speech model on Arabic (verified) [A21]. OpenAI publishes no Arabic or dialect metric for its realtime or transcription models (verified) [O10].
   - Only one multi-vendor Arabic test was found. It was vendor-run and used Egyptian and Saudi Arabic mixed with English. Word error rates (WER) were 13.1% / 21.3% for ElevenLabs Scribe v2, 45.9% / 43.7% for OpenAI gpt-4o-transcribe, 54.6% / 50.6% for Azure and 59.7% / 62.4% for Google Chirp 3 (verified) [A24].
   - On conversational dialect speech that includes Jordanian and Palestinian Arabic, the best models still score about 44–50% WER (corrected) [M33, M34].
   - We should not lock in an engine before running our own dialect evaluation.
2. **OpenAI's voice line-up changes every few months.**
   - The current speech-to-speech models are `gpt-realtime-2.1` and `gpt-realtime-2.1-mini`, with 128k context, released 2026-07-06 (verified) [O1, O2].
   - Shutdown dates (verified) [O3]:
     - `gpt-realtime` and `gpt-realtime-mini`: 2027-01-20.
     - Standalone TTS models: 2027-01-06.
     - Legacy STT models: 2027-02-26.
   - In 2026 OpenAI shipped realtime 1.5 in February, 2 in May, 2.1 in July and GPT-Live in September (verified) [O1, O2, O7].
   - An engine abstraction layer is therefore required.
3. **Realtime cost for a 3-minute call is $0.253 on 2.1 and $0.071 on 2.1-mini with about 89% cache hits, and $0.801 and $0.212 with none** (verified recomputation) [O4, O5].
   - Agent audio output is about 45% of the 2.1 cost (verified).
   - Caching is best-effort. It is lost when instructions or tools change mid-call, or when truncation drops early context (verified) [O5].
   - With no cache hits, a 6-minute 2.1 call costs about $2.61 (derived; verified inputs).
   - Third parties price the same model at between $0.0676/min (LiveKit) and $0.38/min (Retell) (verified) [A1, M3].
4. **A cascaded pipeline is cheaper, and it is the only current route to named dialect voices.**
   - Speech plus LLM costs about $0.012–0.023 per minute for the cascade. Speech-to-speech costs about $0.028 per minute (mini) and $0.089 per minute (2.1), transcripts included (derived; includes unverified inputs).
   - Azure is the only major vendor with named Levantine, Gulf and Egyptian voices, such as `ar-JO`, `ar-LB`, `ar-SY`, `ar-SA`, `ar-AE` and `ar-EG` (verified) [A15].
   - A measured streaming cascade reached 755 ms time to first audio (corrected) [A22]. Speech-to-speech models measure 0.57–1.35 s on Artificial Analysis (verified) [A21].
5. **Gulf telephony is expensive and regulated, and on phone numbers it dominates the cost per minute.**
   - Plivo prices (verified) [T11]:
     - UAE local number: $150/month plus $0.10285/min.
     - UAE toll-free number: $20/month plus $0.38/min.
   - Twilio's public number price list has no rows for the UAE, KSA, Egypt, Jordan or Palestine (verified) [T10].
   - The UAE regulator (TDRA) treats VoIP offered to subscribers as a regulated activity. Third parties may provide it only together with a licensed operator or with TDRA approval (verified) [T16].
   - On a UAE local number, telephony is 77–88% of the all-in cost per minute (derived; verified inputs).
6. **Cheaper ways to receive calls exist in MENA, but each comes with conditions.**
   - Meta charges no fee for user-initiated WhatsApp calls (verified) [T25], and an agent can answer them over SIP or WebRTC (verified) [T24].
   - The number must be on Cloud API with a messaging limit of at least 2,000 unique recipients a day (verified) [T24].
   - Business-initiated WhatsApp calls are not available for Egyptian numbers (verified) [T24].
   - Consumer WhatsApp calls are reported to be blocked in the UAE (unverified) [M31]. The TDRA says that using unlicensed VoIP apps to make calls is illegal (verified) [T16], which may affect a web voice widget for UAE callers.
   - Tenant call-forwarding avoids holding regulated numbers. Operator forwarding charges, and whether the caller ID survives forwarding, are unknown (unverified).
7. **No speech-to-speech processing is available inside the Gulf today.**
   - OpenAI processes realtime and all audio endpoints only in the US or EU (verified) [O15]. Its UAE region processes only selected text models and `text-embedding-3-large`, and needs approval (verified) [O15].
   - Azure UAE North offers the realtime models only as Global deployments (verified) [P1].
   - LiveKit Cloud hosts agents only in Ashburn, Frankfurt and Mumbai, although media can be pinned to KSA and the UAE (verified) [A2].
   - Azure backbone round-trip time from UAE North is 100 ms to Frankfurt and 176–189 ms to US East (corrected) [A35].
   - The default real-time cell for MENA tenants should therefore be the EU (Frankfurt).
8. **Health data is the sharpest compliance constraint.**
   - Abu Dhabi's ADHICS 2.0 blocks cross-border flows of health data, including backups, unless a health regulator grants an exemption (verified; secondary US-government source) [P19].
   - Saudi transfers need standard contractual clauses, binding rules or a certificate, plus a risk assessment. A risk assessment is also required for continuous transfers of sensitive data (verified) [P22].
   - OpenAI's route for processing patient data (PHI) through Private Retention or Safety Retention is not available for `/v1/realtime`, and BAA coverage for realtime is unconfirmed (corrected) [O15, O16].
   - Clinics in Abu Dhabi and Saudi Arabia should not be in the MVP without legal counsel.
9. **Recording consent is a criminal-law issue in the region.**
   - Secondary sources report penalties for recording without consent (unverified; the UAE text could not be retrieved) [T35, T37, T38, T39]:
     - UAE: at least 6 months in prison and/or AED 150k–500k.
     - KSA: up to 1 year and/or SAR 500k.
     - Egypt: up to 1 year.
     - Palestine: at least 1 year and/or JD 1,000–3,000.
   - Jordan's PDPL requires written consent tied to a stated purpose (unverified) [T40].
   - Recording must be a per-jurisdiction policy with announced consent and stored evidence.
10. **Knowledge must be split: structured data behind typed tools, and documents behind hybrid RAG.**
    - OpenAI documented a limit of 16,384 tokens for instructions plus tools on the older `gpt-realtime`. One developer found that about 31.3k tokens failed with HTTP 504 on 2.x, while about 17.8k worked (verified as reported; unofficial) [O23, O35].
    - pgvector warns that a shared approximate index lets one tenant's data affect another tenant's search recall (verified) [K9].
    - OpenAI Vector Stores cost $2.50 per 1,000 `file_search` calls and are not eligible for zero data retention (ZDR) (verified) [O4, O15, O28].
    - Prices and availability must come only from tools.
11. **Prompt caching is the largest cost lever we control, and it dictates how prompts must be laid out.**
    - On `gpt-realtime-2.1`, cached input costs $0.40 per 1M tokens, against $4 (text) and $32 (audio) uncached (verified) [O4].
    - To get cache hits, each tenant needs a byte-stable prompt prefix (verified) [O5, O26]:
      - Add dynamic data as conversation items, not in the instructions.
      - Do not change instructions or tools mid-call.
      - Truncate with a retention ratio.
    - Semantic caching is unsafe for prices and availability; Redis states that false positives are inherent (verified) [K21].
12. **Market prices leave a margin only with the right mix of channel and engine.**
    - Market price points:
      - Wholesale all-in: about $0.05–0.15/min. Vapi is about $0.08–0.13 (verified) [M1]; Retell is $0.11 excluding telephony (corrected) [M3].
      - MENA enterprise list price: $0.25/min (ZIWO, verified) [M23].
      - UAE clinic packages: from AED 1,200/month (TalkRight, verified) [M30].
      - US restaurant flat plans: $85–350 per location per month (Maple, verified) [M16].
    - Our all-in cost (derived; includes unverified inputs):
      - $0.014–0.043/min for the cascade or mini on web, WhatsApp or US numbers.
      - $0.117–0.194/min on a UAE local number.
13. **The market gap is a product that is Arabic-dialect-first, self-serve, multi-vertical and locally integrated, with in-region hosting options.**
    - Retell offers Arabic only as `ar-SA`, with no dialect option (verified) [M4].
    - ElevenLabs data residency covers only the US, EU, India and Singapore, and only on Enterprise plans (verified) [M8].
    - MENA vendors are mostly sales-led enterprise products (ZIWO, Sarj, Maqsam, WideBot) or WhatsApp-text tools for small businesses (unverified) [M23–M29].
    - No voice offer focused on the Levant was found (unverified; search result).
14. **Restaurants can be integrated in MENA; clinics need our own scheduler.**
    - Restaurant integrations:
      - Foodics documents an order API with server-side totals, cash on delivery and status webhooks (verified) [V1, V2].
      - Deliverect's Channel API reaches many POS systems, but its 201 response does not mean the POS accepted the order (verified) [V7].
      - talabat only pushes its own orders into a POS (verified) [V9].
      - Toast order writes are limited to approved partners (verified) [V11].
      - Square shows only paid orders on its POS (verified) [V12].
    - Payments: of the MENA targets, Stripe lists only the UAE (verified) [V16].
    - Clinic scheduling:
      - No public booking API was found for MENA clinic platforms (unverified).
      - Cal.com's multi-tenant Platform takes no new signups (verified) [V30].
15. **Rules for AI voice are arriving.**
    - **EU:** the AI Act's transparency duty to tell people they are talking to an AI applies from August 2026. Emergency patient triage is high-risk, with obligations from 2 Dec 2027 (verified) [V39, V40].
    - **US:** AI voices count as "artificial" under the TCPA, so outbound AI calls need prior express consent (corrected) [V36].
    - **OWASP:** authorization must sit in downstream systems, not in the LLM (verified) [P16].

### 1.1 Preliminary direction (not a decision)

- **Phase 0, before building the voice core:**
  - A dialect evaluation harness covering Levantine, Gulf, Egyptian, MSA, English and code-switching, over phone, WhatsApp and web audio.
  - Latency measurements from Amman, Riyadh, Dubai and Cairo.
  - Legal reviews of recording, VoIP and health data.
- **Voice layer:** engine-agnostic, built on LiveKit Agents. Hypotheses to test:
  - The cascade is the default for Arabic.
  - `gpt-realtime-2.1-mini` serves English and MSA, and Arabic too if it reaches parity.
  - `gpt-realtime-2.1` handles complex flows.
  - GPT-Live serves English premium tenants once it matures.
- **MVP channels:** web widget, WhatsApp calling and tenant call-forwarding. Platform numbers only where they are self-serve and legal (US and EU, and possibly Jordan through Telnyx). No platform-held Gulf numbers until a licensed partner is signed.
- **Platform:**
  - Three planes: control, real-time and async.
  - The first cell in EU-Frankfurt.
  - Shared Postgres with row-level security.
  - Per-tenant quotas.
  - Sovereign in-country cells later.
- **Knowledge and memory:**
  - A Postgres catalog with pgvector and Arabic-normalized full-text search.
  - Typed tools.
  - A compact, cached tenant brief.
  - Our own layered memory.
- **Verticals:** restaurants first, through Foodics, Deliverect and a native order inbox. Clinic scheduling uses our own scheduler, in markets where counsel clears the data path.
- **Notifications:** WhatsApp utility templates under the Meta Tech Provider model first, then SMS as a fallback, then e-mail.
- **Economics:** target a cost of goods sold (COGS) of $0.05/min or less on web, WhatsApp and forwarded calls. Pass Gulf phone-number costs through to tenants or add a surcharge.

### 1.2 Where the reports conflict

| Topic | Value A | Value B | Better supported |
|---|---|---|---|
| `gpt-realtime-2.1` cost per minute | Derived per minute, model cost only (no transcript), for the 3-minute call profile: $0.084 cached to $0.267 uncached (verified recomputation) [O4, O5] | LiveKit list price $0.0676 (verified) [A1]; Retell $0.38 (verified) [M3] | A. It can be reproduced from verified token prices. LiveKit does not disclose its assumptions, and Retell's figure is a resale price that includes margin. |
| OpenAI SIP call length | "Max 2 h per call" (telephony report) | The 2-hour and 3-minute ring caps apply only to GPT-Live outbound SIP. A Realtime session lasts at most 60 min (corrected / verified) [O12, O6] | B. Plan for 60-minute sessions and reconnection. |
| "English is the default response language" | The quote exists in OpenAI's prompting guide (verified) [O10] | It appears in sample prompt text, not as documented model behaviour (corrected) [O10] | B. Either way, set the language and dialect in the instructions. |
| Best open Arabic ASR | Cohere Transcribe Arabic ranked first with 25.87 average WER (blog, 2026-07-07) [A30] | Leaderboard on 2026-10-20: Jais-ASR 22.82, Sygma 23.01, Audar 23.17, Cohere 24.19 (corrected) [M32] | B. It is newer and primary. |
| Casablanca test set | Described as "Maghrebi" (market report) | Eight dialects, including Jordanian, Palestinian, Emirati and Egyptian (corrected) [M34] | B |
| Foodics size | 30,000+ outlets in 35 countries (Forbes ME, 2024; unverified) [M36] | 40,000+ restaurants (Foodics homepage, 2026; verified as a self-reported claim) [V6] | B is newer. Both figures are self-reported. |
| Speechmatics real-time tiers | Enhanced $0.80/h, Standard $0.45/h (unverified) [A26] | Enhanced and Standard were retired on 2026-10-05, per the LiveKit docs (verified) [A5] | B. Get a new quote from Speechmatics. |
| LiveKit drain-timeout default | 1,800 s (blog, Feb 2026; unverified) [P4] | 1 hour (current docs; unverified) [P4] | B is newer. Design for a grace period of at least 60 minutes either way. |
| WhatsApp business-initiated call limits | The docs "conflict": 1 per day and 2 per week, against a raised limit | The 1-per-day and 2-per-week caps apply to permission requests. Calls are capped at 100 per user per day (corrected) [T24] | B |
| Retell example price | $0.11/min plus $0.015/min telephony | The example uses $0.00 telephony. With Retell's telephony it is about $0.125/min (corrected) [M3] | B |
| Retell LLM price range | $0.0016–0.16/min | Up to $0.32/min on the standard tier and $0.64/min on the fast tier (corrected) [M3] | B |
| Azure in-region models in UAE North | Only embeddings and Whisper | Text LLMs are also available through Regional Provisioned Managed (PTU) capacity. There are still no realtime or audio models (corrected) [P1] | B |
| Arabic RAG chunking | Sentence-aware chunking is best; semantic chunking is worst on every dataset | Not on every dataset. Most of the lead comes from one dataset; without it, the strategies are within 0.4 points of each other (corrected) [K2] | B. The choice of chunking matters little. |
| Cascade latency | 729–755 ms, hardware not stated | 755 ms was measured; 729 ms is an estimated best case; the LLM ran on an NVIDIA H200 (corrected) [A22] | B |
| Viva pricing | Not published | Published: credit plans at $349–1,199/month, or $350 plus $150 per provider (corrected) [M20] | B |
| OpenAI TTS end date | "The Speech API shuts down on 2027-01-06" | The three TTS models shut down on that date (corrected) [O3, O20] | B. The planning effect is the same. |
| BAA coverage for Realtime | `/v1/realtime` appears on the July 2026 HIPAA list, marked beta (unverified; the PDF says it is "no longer maintained") [O16] | The data-controls page lists no BAA endpoints, and the PHI retention route is unavailable for realtime (corrected) [O15] | Unresolved. Confirm with OpenAI. |
| Twilio numbers in the UAE | The Elastic SIP page says there are no voice-enabled UAE numbers (unverified) [T9] | The UAE terms describe toll-free and inbound-only numbers (verified) [T8]; the public price list has no UAE rows (verified) [T10] | There are no self-serve UAE numbers; they may be available through sales only. |
| LiveKit SIP regions | eu, india, sa, us, japan, aus, canada (verified) [A2] | The telephony pinning page lists aus, eu, india, japan, sa, uk, us (verified) [A3] | Neither page lists a UAE endpoint. Confirm UK and Canada with LiveKit. |
| FCC 24-17 date | Adopted 2024-02-08 | Adopted 2024-02-02, released 2024-02-08 (corrected) [V36] | B |
| Reranker latency (Agentset) | The page text says Voyage 2.5 and Cohere 3.5 take about 595–603 ms | The page table shows Cohere 3.5 at 392 ms (verified, table) [K18] | The page contradicts itself. Measure latency in-region. |

---

## 2. Decision areas

### 2.1 Voice runtime

**Key facts**
- **Session limits:** a Realtime session lasts at most 60 minutes (verified) [O6]. Gemini Live audio sessions last at most 15 minutes without session management (verified) [A11].
- **Time to first audio:** these figures are from Artificial Analysis, whose tests are English-centric (verified) [A21]. A streaming cascade measured 755 ms (corrected) [A22].

  | Model | Time to first audio |
  |---|---|
  | Eleven Realtime v1 Max | 0.57 s |
  | Grok Voice 3.0 | 0.81 s |
  | GPT-Realtime-2.1 | 0.97 s (minimal effort) / 1.21 s (high) |
  | Nova 2.0 Sonic | 1.14 s |
  | Gemini 3.8 Live | 1.18 s |
- **Turn-taking:** LiveKit's audio turn detector lists Arabic among its 14 languages (verified) [A4]. Gemini's default end-of-speech silence is about 800 ms (verified) [A11]. According to the TypeScript SDK docs, the VAD threshold, padding and silence settings cannot be set when accepting OpenAI SIP calls (unverified) [O17].
- **Tools:** version 2.x speaks short preambles by default, supports parallel tool calls, and offers reasoning effort from minimal to xhigh. OpenAI advises starting at low (verified) [O10]. Developers report that 2.1 and 2.1-mini sometimes answer instead of calling the tool (unverified) [O34].
- **Prompting guidance from OpenAI** (verified) [O10]:
  - Put authoritative sources in labelled sections.
  - Confirm before purchases or cancellations.
  - Report an action as done only after the tool succeeds.
  - Read numbers back digit by digit.
- **Safety:** the Moderation API does not classify audio. Guardrails act on transcripts, after the caller may already have heard the audio (unverified) [O22, O17].

**Engines**

| Option | What it is | Pros | Cons | Cost (3-min call; per min) | Arabic notes |
|---|---|---|---|---|---|
| **R1 OpenAI Realtime `gpt-realtime-2.1`** | One speech-to-speech reasoning session per call, over WebRTC, WebSocket or SIP. Tools run on our server through a sideband connection. | Fewest network hops. The server truncates audio on barge-in over WebRTC and SIP (verified) [O6]. Effort control, preambles and parallel tools (verified) [O10]. Native inbound SIP with REFER transfer and no stated SIP fee (verified) [O12]. Eligible for ZDR (verified) [O15]. | Highest audio prices (verified) [O4]. Costs about 3x more without cache hits (verified) [O5]. SIP is inbound only; outbound goes through GPT-Live (verified) [O12]. Processing in the US or EU only (verified) [O15]. No published concurrency limit (verified) [O1]. | $0.253 cached, $0.801 uncached (verified) [O4, O5]. $0.084–0.267/min (derived; verified inputs). | No Arabic or dialect metric (verified) [O10]. Voices are "optimized for English" (verified) [O20]. The language and dialect must be set in the instructions (corrected) [O10]. |
| **R2 `gpt-realtime-2.1-mini`** | A distilled version of R1 | About 3.6x cheaper than R1 for the same call profile (derived; verified inputs) | OpenAI warns it is weaker at following instructions and calling functions (verified) [O5]. Users report skipped tool calls (unverified) [O34]. | $0.071 cached, $0.212 uncached (verified). $0.024–0.071/min. | Same as R1 |
| **R3 GPT-Live `gpt-live-1`** | A full-duplex voice front end. Reasoning and tools are handed to an OpenAI Responses model or to our own backend. | Flat $0.05/min, billed per second (verified) [O7]. Published concurrency caps of 50, 300 and 500 sessions by tier (verified) [O7]. Outbound SIP (verified) [O12]. | None of its 21 voices is Arabic (verified) [O8]. It bills silence and time spent waiting for the backend (verified) [O5]. Not in the Agents SDK (verified) [O17]. Interrupting the agent does not cancel backend work (verified) [O39]. | $0.15 plus backend (verified) [O7]. About $0.051/min with a small backend LLM (derived; includes unverified inputs). | Not viable for Arabic today. Custom voices for `gpt-live-1` support English accents only (verified) [O9]. GPT-Live 1.1 is "coming soon to the API" and does not name Arabic (verified; forum source) [O38]. |
| **R4 Gemini 3.8 Live** | Google's stable speech-to-speech model | Audio costs $3 in and $12 out per 1M tokens (verified) [A10]. Time to first audio 1.18 s, index score 74.5 (verified) [A21]. Function calling is async by default (verified) [A11]. | Audio sessions are capped at 15 minutes without session management (verified) [A11]. Not the owner's preferred vendor. Vertex endpoints do not guarantee in-region processing (unverified) [A12]. | $0.047–0.068 per call including transcript (derived; whether context is re-billed each turn was not established). LiveKit list price $0.0182/min (verified) [A1]. | `ar` is listed, with no dialect detail (verified) [A11]. Google's Chirp 3 STT had 59.7% / 62.4% WER on Egyptian-English and Saudi-English (verified) [A24]. |
| **R5 Cascade** | Streaming Arabic STT, then an OpenAI text LLM with tools and RAG, then dialect TTS, with an Arabic-capable turn detector | Prices, orders and guardrails operate on text. Each tenant can choose an STT locale and a TTS voice. Each component can fail over separately. Lowest cost. Measured time to first audio 755 ms (corrected) [A22]. | More latency engineering and more vendors. Barge-in is handled by LiveKit or Pipecat, or by us. Prosody does not carry through. OpenAI's own TTS retires on 2027-01-06 (verified) [O3]. | $0.036 (value) to $0.068 (quality) per call; $0.012–0.023/min (derived; includes unverified inputs) | Scribe v2 has the best measured STT on code-switching (verified) [A24]. Azure has named Levantine, Gulf and Egyptian voices (verified) [A15]. |
| **R6 Managed platforms** (Vapi, Retell, ElevenLabs Agents, Telnyx AI Agent, Ultravox) | A hosted voice-agent runtime underneath our product | Fastest path to an MVP. Telephony, testing and knowledge bases are built in. | A platform fee on top of model costs (Vapi $0.05/min, verified) [M1]. Concurrency caps (Retell defaults to 20 calls; unverified) [P7]. No Middle East data residency (ElevenLabs verified [M8]; Retell and Vapi unverified [M5, M2]). Weak control over memory and tenancy. | Vapi about $0.08–0.13/min (verified) [M1]. Retell $0.11/min excluding telephony (corrected) [M3]. Telnyx about $0.06/min (unverified) [T3]. | Retell offers Arabic only as `ar-SA`, with no dialect option (verified) [M4]. |
| **R7 Azure Voice Live** | Managed STT, LLM and TTS behind a Realtime-compatible API | Over 600 voices, including Arabic locales. Enterprise compliance (unverified) [A16]. | No speech-to-speech models in UAE North, and LLM processing there is "Global" (verified) [A13]. SIP is not supported; telephony runs through Azure Communication Services (verified) [A16]. Azure STT had 54.6% / 50.6% WER on code-switching (verified) [A24]. | Pro tier: audio $32 / $64 per 1M tokens plus speech tokens (unverified) [A14] | Widest catalogue of dialect TTS voices (verified) [A15] |

**Frameworks**

| Option | What it is | Pros | Cons | Cost | Arabic notes |
|---|---|---|---|---|---|
| **F1 OpenAI Agents SDK, TypeScript** (0.21.0, released 2026-10-20) | `RealtimeAgent` and `RealtimeSession`, with WebRTC, WebSocket, SIP, Twilio and Cloudflare transports (verified) [O17] | The most complete OpenAI realtime support: handoffs, output guardrails, tool approval, hosted MCP and tracing (verified) [O17] | OpenAI engines only. No cascaded pipeline and no GPT-Live support (verified) [O17]. Pre-1.0. | Open source | Nothing Arabic-specific |
| **F2 OpenAI Agents SDK, Python** (0.24.0) | Realtime over WebSocket and SIP, plus the `VoicePipeline` cascade (unverified) [O18] | The Python ecosystem; a cascaded option | No browser WebRTC. `VoicePipeline` has no built-in barge-in (unverified) [O18]. Pre-1.0. | Open source | `VoicePipeline` documents only OpenAI STT and TTS (unverified) [O18] |
| **F3 LiveKit Agents** (Apache-2.0) | A media server and agent framework. Python core plus Node.js. Supports SIP, WebRTC and MCP, and runs speech-to-speech or a cascade (unverified) [A6]. | Engine-agnostic. Arabic turn detector (verified) [A4]. Fallback adapters for STT, LLM and TTS (unverified) [P10]. Per-turn OpenTelemetry spans (unverified) [P24]. Can be self-hosted. | One more system to run. LiveKit Cloud hosts agents only in us-east, eu-central and ap-south (verified) [A2]. No fallback adapter for speech-to-speech models (unverified) [P10]. | Self-hosted: compute only. Cloud: $0.01 per agent-minute; plans at $0, $50 and $500 per month (verified) [A1]. | LiveKit Inference lists Arabic-capable STT and TTS models (verified) [A5] |
| **F4 Pipecat** (BSD-2) | A Python pipeline framework from Daily | The widest list of speech-to-speech integrations. Its Smart Turn v3.2 detector lists Arabic. Pipecat Flows supports structured dialogs. (all unverified) [A7, A9] | Needs a separate transport. Pipecat Cloud runs only in the US, EU and India (unverified) [A8]. | Pipecat Cloud $0.01 per active minute (unverified) [A8] | Smart Turn publishes no per-language accuracy (unverified) [A9] |
| **F5 No framework** | OpenAI native SIP, a sideband WebSocket and the unified WebRTC interface (verified) [O12, O13] | Fewest moving parts. Tenant config is injected when the call is accepted (verified) [O13]. | OpenAI only. No control over the media path for consent prompts, fixed audio or recording. | None | Nothing Arabic-specific |

**Preliminary leaning (not a decision):** use F3, LiveKit Agents in Python, as the real-time framework, behind an engine-agnostic `VoiceSession` interface that carries transcripts, tool calls, interruptions and usage.
- The Phase-0 evaluation chooses the engine per tenant and language. The current hypothesis is R5 for Arabic, R2 for English and MSA, and R1 for complex flows.
- Tools and business logic live in a separate typed service that any engine can call.
- *Why:*
  - Arabic quality on OpenAI speech-to-speech is unknown (finding 1).
  - One media layer can serve phone, WhatsApp and web.
  - Consent prompts and fixed audio need control of the media path.
  - Models change frequently (finding 2).
- *Would change if:* Phase 0 shows `gpt-realtime-2.1` or its mini version at parity on the target dialects, with acceptable latency from MENA. In that case F1 or F5 (OpenAI-native) is simpler for the MVP.

### 2.2 Telephony and channels

**By market**

| Market | Platform-held numbers | Cost evidence | Regulatory notes | Practical way in |
|---|---|---|---|---|
| US | Self-serve from Twilio, Telnyx, Plivo and LiveKit | Twilio local inbound $0.0085/min, number $1.15/month, Media Streams $0.0044/min (verified) [T1]. LiveKit US inbound $0.01/min (verified) [A1]. Telnyx about $0.0052/min (unverified) [T2]. | Federal law requires one-party consent for recording (unverified) [T33]; state laws were not checked. Outbound AI-voice calls need TCPA consent (corrected) [V36]. | Platform numbers, or OpenAI native SIP |
| UK / EU | UK local numbers need a UK address; mobile and toll-free numbers accept a worldwide address (unverified) [T15] | Not captured | The UK requires businesses to make reasonable efforts to inform callers before recording (unverified) [T34]. EU member-state rules were not researched. | Platform numbers; `sip-eu` for EU residency (verified) [O12] |
| UAE | Twilio's public list has no UAE numbers (verified) [T10]. Its UAE terms say geographic numbers are inbound-only, toll-free numbers may not be made available to third parties, and calls must terminate in the UAE (verified) [T8]. | Plivo local $150/month plus $0.10285/min; toll-free $20/month plus $0.38/min (verified) [T11]. Twilio outbound $0.3635/min to landlines and $0.2995/min to mobiles (verified) [T10]. | TDRA requires a licensed operator or its approval for VoIP, and says using unlicensed VoIP apps to make calls is illegal (verified) [T16]. WhatsApp calls are reported to be blocked (unverified) [M31]. Recording reportedly needs all-party consent (unverified) [T35]. | Forwarding; WhatsApp, subject to the legal check; numbers from licensed partners (e&, du); Telnyx Dubai SIP anchoring (verified) [T6]; LiveKit `me` media region (verified) [A2] |
| KSA | Not on Twilio's public list (verified) [T10]. Plivo offers toll-free only (unverified) [T12]. | Plivo toll-free $115/month plus $0.747/min (unverified) [T12]. Twilio outbound $0.1738/min to landlines and $0.3122/min to mobiles (verified) [T10]. | Regulator texts were not retrieved. Under the Anti-Cyber Crime Law, interception carries up to 1 year and/or SAR 500k (unverified) [T37]. | LiveKit `sa` SIP endpoint (verified) [A2]; forwarding; WhatsApp; a licensed partner |
| Jordan | Telnyx local numbers from $65/month (unverified) [T14]. Needs an ID or company documents and an address anywhere in the world (verified) [T13]. | Twilio outbound $0.2677/min to landlines and $0.3448/min to mobiles (verified) [T10] | The PDPL requires written consent for a stated purpose, and offers no standard-contractual-clause route for transfers abroad (unverified) [T40] | Telnyx number as a pilot candidate; forwarding; WhatsApp |
| Egypt | Telnyx local numbers need an Egyptian company registration and a local address (verified) [T13] | Twilio outbound $0.2056/min to landlines and $0.2090/min to mobiles (verified) [T10] | Recording without consent carries up to 1 year (unverified) [T38]. Business-initiated WhatsApp calls are unavailable for +20 numbers (verified) [T24]. | Numbers owned by the tenant; user-initiated WhatsApp calls; forwarding |
| Palestine | No number source found | Not captured | Illegal recording carries at least 1 year and/or JD 1,000–3,000 (unverified) [T39]. Whether WhatsApp calling works on +970 numbers is unconfirmed. | WhatsApp, web widget, forwarding |

**Options**

| Option | What it is | Pros | Cons | Cost | Arabic / MENA notes |
|---|---|---|---|---|---|
| **T1 Tenant call-forwarding** | The tenant forwards its existing number to a platform number or SIP endpoint: always, when busy, on no answer or after hours | No number porting. We avoid holding regulated MENA numbers. Staff can answer first, with the AI taking overflow. | Operator charges and caller-ID preservation are unknown (unverified). Two call legs add latency. | Receiving leg, for example $0.0085/min on a US Twilio number (verified) [T1], plus the operator's charge (unknown) | Likely the default for UAE, KSA, Egypt and Palestine. e& sells a paid add-on to forward UAE mobiles abroad (unverified) [T17]. |
| **T2 WhatsApp Business Calling** | The customer taps "call" in the business's WhatsApp, and Meta delivers the call over SIP/TLS (WebRTC or SDES-SRTP media, Opus or G.711) or over WebRTC (verified) [T24] | No Meta fee for user-initiated calls (verified) [T25]. The caller is identified by their WhatsApp number. The call opens the 24-hour service window (verified) [T18]. | Needs a Cloud API number at 2,000 or more unique recipients a day (verified) [T24], and allows one SIP server per number (unverified) [T24]. Business-initiated calls need user permission and are unavailable for Egyptian, US and Canadian numbers (verified) [T24]. | Infrastructure $0.003–0.005/min (unverified) [T4, T23] | UAE blocking is reported (unverified) [M31]. Support for +970 numbers is unconfirmed. |
| **T3 Web voice widget (WebRTC)** | Voice in the browser or app through LiveKit or OpenAI WebRTC, with short-lived client secrets (default 600 s) (unverified) [O24] | No carrier cost. Wideband audio. | Callers find it only through the tenant's site or app. The UAE VoIP-app rule may apply (the rule is verified; whether it applies here is unclear) [T16]. | $0 carrier | Wideband audio may improve STT accuracy over 8 kHz phone audio (assumption) |
| **T4 LiveKit as the single media layer** | PSTN over SIP, the widget over WebRTC and WhatsApp through Connectors all join LiveKit rooms | One abstraction for all channels. A Saudi SIP endpoint `sa` and a KSA-plus-UAE media group `me` (verified) [A2]. WhatsApp media stays WebRTC/Opus with no transcoding (unverified) [T4]. | No UAE SIP endpoint (verified) [A2]. Region pinning needs the Scale plan (verified) [A3] and turns off automatic failover (unverified) [A3]. Connectors lack warm transfer and recording (unverified) [T4]. | Agent session $0.01/min; SIP $0.003–0.004/min (verified) [A1] | Media can stay in KSA and the UAE, but the model hop still goes to the US or EU |
| **T5 OpenAI native SIP** | A carrier trunk connects directly to `sip.api.openai.com`, or `sip-eu` in the EU (verified) [O12] | Fewest network hops. No SIP fee stated (verified) [O12]. | Inbound only for Realtime (verified). No Middle East endpoint (verified) [O12]. No media control. | Carrier origination only, for example about $0.0034/min for Twilio Elastic SIP (unverified; URL not captured) | Best suited to US and EU tenants who speak English |
| **T6 Twilio Programmable Voice** | Numbers plus the Media Streams WebSocket or ConversationRelay | Mature, with US and UK coverage. One vendor for voice, SMS, WhatsApp and e-mail. | No MENA numbers in the public list (verified) [T10]. No Middle East edge location (unverified) [T5]. | US inbound $0.0085/min plus Streams $0.0044/min. ConversationRelay $0.07/min. REFER transfer $0.10 per transfer. (verified) [T1] | Not a source of Gulf numbers |
| **T7 Telnyx** | A carrier network with numbers, SIP, a Voice API and a hosted AI agent | A Dubai SIP anchorsite since 2026-05-15 (verified) [T6]. Jordan numbers (unverified) [T14]. A UAE storage region (unverified) [T7]. | Egyptian local numbers need a local company (verified) [T13]. MENA rates appear only in the price sheet. | US inbound about $0.0052/min (unverified) [T2] | Best placed among CPaaS providers for Gulf media anchoring and a Jordan pilot |
| **T8 Plivo** | A CPaaS provider | Low US list prices (unverified) | Gulf numbers are expensive: see the market table above (verified / unverified) [T11, T12] | As listed above | Not viable for Gulf numbers at scale |
| **T9 Numbers from licensed local partners** | Numbers or SIP trunks from e&, du, STC, Mobily, Zain, Orange, Umniah, Paltel/Jawwal or Telecom Egypt | The legal route for platform-held local numbers; TDRA requires a licensed partner (verified) [T16] | Contracts, licences and prices were not researched | Unknown | Required for any platform-held Gulf numbers |

**Preliminary leaning (not a decision):**
- Treat telephony as per-country configuration behind one ingress layer (T4).
- MVP channels: the web widget (T3), WhatsApp calling (T2), tenant call-forwarding (T1), and platform numbers only where they are self-serve and legal. That means the US and EU through Twilio or Telnyx, and Jordan through Telnyx if a Levant pilot comes first.
- Use OpenAI native SIP (T5) only as an optimisation for US and EU tenants.
- Hand calls to a human with SIP REFER or a LiveKit transfer.
- *Why:*
  - Gulf numbers cost $0.10–0.75/min.
  - Carrier terms forbid passing numbers to third parties.
  - The TDRA requires a licensed partner.
- *Would change if:* a licensed partner offers numbers or SIP in the Gulf at acceptable rates, or counsel rules out WhatsApp or the widget for UAE callers.

### 2.3 Speech quality for Arabic dialects

**STT evidence**

| Evidence | Scope | Key results | Status | Caveats |
|---|---|---|---|---|
| Perle code-switching benchmark [A24] | Egyptian-English and Saudi-English, 300 utterances per pair, run by a vendor | WER Egyptian / Saudi: Scribe v2 13.1 / 21.3; gpt-4o-transcribe 45.9 / 43.7; Azure 54.6 / 50.6; Chirp 3 59.7 / 62.4 | verified | No Levantine pair. Batch or streaming not stated. WER exaggerates the gaps compared with BERTScore. The dataset is public on Hugging Face. |
| Open Universal Arabic ASR leaderboard, 2026-10-20 [M32] | Six test sets, including dialects; open models only | Average WER: Jais-ASR 22.82; Sygma 23.01; Audar 23.17; Cohere Transcribe Arabic 24.19; OmniASR 7B 28.32; Whisper Large V3 36.86 | corrected | No commercial APIs ranked |
| IFM measurement [M33] | The same six sets | Speechmatics Melia 1 23.51; Scribe v2 24.54 average. On Casablanca: 46.41 and 50.20. | verified (as published) | Measured by the maker of Jais-ASR |
| Casablanca [M34] | Conversational speech in eight dialects, including Jordanian, Palestinian, Emirati and Egyptian | The best models score about 44–50% WER | corrected | This is the main accuracy risk for Levant calls |
| Arabic Arena [A31] | 24 test sets plus simulated 8 kHz telephony | Best open model: telephony 14.64, Levantine (Shams) 32.03, Saudi (SADA) 29.51, Egyptian (MGB-3) 12.92 | unverified | Batch only |
| Vendor claims | Speechmatics 4.5% WER on an unnamed dataset [A26]; Deepgram "lowest WER" [A25]; Munsit 18% average [A38]; Maqsam 99.1% [A39] | — | unverified | Self-reported |
| Locale coverage | Deepgram Nova-3 lists `ar-AE`, `ar-SA`, `ar-JO`, `ar-PS`, `ar-EG` and more [A5]. Azure STT has 18 Arabic locales, including `ar-PS` and `ar-JO`; only `ar-SA` supports phrase lists [A15]. Speechmatics Linden-1 has a bilingual `ar_en` mode [A5]. | — | verified | Locale codes say nothing about accuracy |

**TTS evidence**

| Vendor / model | Arabic coverage | Latency | Price | Status |
|---|---|---|---|---|
| Azure Neural TTS | 16 locales with 2 voices each. Levantine: `ar-JO`, `ar-LB`, `ar-SY`. Gulf: `ar-SA`, `ar-AE`, `ar-KW`, `ar-QA`, `ar-BH`, `ar-OM`. Egyptian: `ar-EG`. No `ar-PS`. HD voices only through limited-access custom voice. | — | $15 per 1M characters (unverified) [A14] | locales verified [A15] |
| ElevenLabs Flash v2.5 / v4 Turbo | Generic Arabic | About 75 ms / 100 ms model latency | Flash $0.04 per 1,000 characters | unverified [A20] |
| Cartesia Sonic 3.x | `ar`, with no dialect locales | Under 90 ms (vendor claim) | $0.030/min through LiveKit (verified) [A1] | Arabic support verified [A5]; the rest unverified [A32] |
| Gemini 3.8 Flash TTS | MSA and Egyptian only | — | $0.0144/min through LiveKit (verified) [A1]; the price doubles on 2027-01-01 (unverified) [A33] | coverage unverified [A33] |
| xAI TTS | `ar-EG`, `ar-SA`, `ar-AE` | — | $15 per 1M characters (unverified) [A19] | coverage verified [A5] |
| SILMA TTS v2 | Saudi Najdi | 280 ms to first token (vendor test) | $0.025/min | unverified [A34] |
| OpenAI realtime voices | Not tied to a language; "optimized for English" | — | Realtime audio output price | verified [O20] |
| Deepgram Aura-2 | No Arabic | — | — | verified [A5] |

**Options**

| Option | What it is | Pros | Cons | Cost | Arabic notes |
|---|---|---|---|---|---|
| **S1 OpenAI audio only** | Realtime voices for output, and gpt-live-transcribe or gpt-transcribe for transcripts | One vendor; the owner's preference | No published Arabic metric (verified) [O10]. gpt-4o-transcribe had 45.9% / 43.7% WER on code-switching (verified) [A24]. | STT $0.0045–0.017/min (verified) [O4] | GPT-Live has no Arabic voice (verified) [O8] |
| **S2 Specialist STT with named-dialect TTS** | Scribe v2, Deepgram `ar-*` or Speechmatics for STT; Azure `ar-*`, ElevenLabs or Cartesia for TTS | The best measured code-switching STT (verified) [A24]. Dialect locales and voices (verified) [A5, A15]. | More vendors and data-processing agreements. Accuracy claims are mostly self-reported (unverified). | STT $0.003–0.0075/min; TTS $0.012–0.04 per minute of speech (mixed status; see §3) | Levantine is the least measured dialect |
| **S3 Azure for both STT and TTS** | Azure STT (18 locales) and Azure TTS (16 locales) | One vendor with named dialect voices. Microsoft notes that standalone Azure Speech normally processes in-region, with Voice Live as the exception (verified) [A13]. | Weak on code-switching at 54.6% / 50.6% WER (verified) [A24]. Only `ar-SA` supports phrase lists (verified) [A15]. | STT $1.00 per audio hour; TTS $15 per 1M characters (unverified) [A14] | A candidate for in-region UAE processing; to be confirmed |
| **S4 MENA specialists** | CNTXT Munsit, SILMA, Hamsa | Focus on dialects. Sovereign and on-premises options. Munsit has plugins for LiveKit and Pipecat. (unverified) [A38, M27] | All claims are self-reported. Small vendors carry continuity risk. | Munsit $8–80/month; SILMA $0.025/min (unverified) [A38, A34] | Most likely to sound natural in Gulf dialects; prove it side by side |
| **S5 Self-hosted open models** | Jais-ASR and Cohere Transcribe Arabic (both Apache-2.0) | Best open-model WER (corrected) [M32]. Can be hosted in-country. Jais-ASR runs on vLLM behind an OpenAI-compatible endpoint (verified) [M33]. | Evidence is from batch tests only; streaming latency is unproven. Requires running GPUs. | Compute only | A candidate for the sovereign tier |
| **S6 Other speech-to-speech** | Gemini 3.8 Live, Eleven Realtime, Ultravox | Arabic is listed (verified for Gemini [A11]; unverified for the others [A20, A18]) | No dialect data | See §3 | Only if the owner accepts non-OpenAI speech-to-speech |

**Phase-0 evaluation design (proposal)**

- **Data:**
  - Per dialect (Levantine from Jordan and Palestine, Gulf from Saudi Arabia and the UAE, Egyptian, MSA, English, and Arabic-English code-switching), scripted restaurant orders and clinic bookings performed by native speakers.
  - Each recorded with consent over 8 kHz phone lines, WhatsApp (Opus) and WebRTC, in quiet and noisy conditions.
  - Reuse the Perle code-switching set [A24] and Casablanca [M34].
- **Metrics:**
  - Normalized WER and CER.
  - Entity accuracy on phone numbers, prices, quantities, names, dialect dates and times, menu items and doctor names.
  - End-of-turn latency and the rate of false end-of-turn detections.
  - Time to first audio, measured from Amman, Riyadh, Dubai and Cairo.
  - How well the agent recovers from barge-in.
  - Correctness of tool calls and task success.
  - TTS naturalness and dialect authenticity, rated by native listeners.
- **Output:**
  - An engine recommendation per dialect, measured against thresholds the owner sets.
  - A frozen regression set, rerun in CI on every change to a model or prompt.

**Preliminary leaning (not a decision):**
- Plan for S2 or S3 as a cascade, and run S1 and S6 against it in Phase 0.
- The baselines to beat are Azure `ar-*` voices for TTS and Scribe v2 Realtime for STT.
- Keep S5 for a sovereign tier.
- *Why:* only S2 and S3 have measured dialect coverage today.
- *Would change if:* OpenAI speech-to-speech meets the owner's thresholds in Phase 0.

### 2.4 Knowledge layer

**Key facts**
- **Retrieval improvements:** Anthropic measured the top-20 retrieval failure rate falling from 5.7% to 2.9% with contextual embeddings plus contextual BM25, and to 1.9% with reranking. It advises skipping RAG for knowledge bases under about 200k tokens when using text LLMs (verified) [K16]. Realtime prompts are far smaller than that (finding 10).
- **Arabic (MSA) retrieval:**
  - MIRACL Arabic nDCG@10: BM25 39.5; mE5-large 76.0; bge-m3 dense 78.4, all modes 80.2.
  - MIRACL average: `text-embedding-3-large` 54.9 against bge-m3 dense 69.2 (verified) [K1].
  - An Arabic RAG study measured bge-m3 at 70.99 and mE5-large at 70.31. A reranker raised the average from 70.99 to 74.15 (corrected) [K2].
  - No retrieval benchmark exists for dialects.
- **pgvector:**
  - Without iterative scan, a filtered HNSW query returns too few rows: about 4 rows for a filter matching 10% of rows at the default `ef_search` of 40.
  - HNSW is limited to 2,000 dimensions for `vector` and 4,000 for `halfvec` (verified) [K9].
  - `text-embedding-3-large` returns 3,072 dimensions by default, so use `halfvec` or the `dimensions` parameter (verified) [O27, K9].
- **Rerankers:** managed rerank APIs take about 392–616 ms; Zerank 2 takes 265 ms; Qwen3-Reranker-8B takes about 4.7 s (verified, third-party) [K18].
- **OpenAI Vector Stores** (verified) [O4, O28]:
  - $2.50 per 1,000 `file_search` calls, through the Responses API only.
  - Storage costs $0.10 per GB per day after the first free GB.
  - Default chunks are 800 tokens with 400 tokens of overlap.
  - Deletions are eventually consistent.
- **Realtime tool types:** Realtime sessions accept only `function` and `mcp` tools (verified) [O21]. The Assistants API shut down on 2026-08-26 (verified) [O3].
- **Call setup:** the SIP webhook delivers the From and To headers before the call is accepted, and the accept request carries the full session configuration (verified) [O12, O13]. So the tenant and caller can be resolved before the first word.

**Options**

| Option | What it is | Pros | Cons | Cost | Arabic notes |
|---|---|---|---|---|---|
| **K1 Structured catalog and typed tools (Postgres)** | Tenant-scoped tables for items, variants, modifiers, prices, hours, services, slots, orders and bookings. Tools such as `search_items`, `quote_order`, `find_slots` and `create_booking`, with totals computed on the server. | Prices are exact and current. Lookups take milliseconds in-region. The same tools serve voice, chat and the dashboard. | Needs a schema per vertical plus custom attributes as an escape hatch. Spoken item names need fuzzy matching. | Negligible | Store Arabic, English and dialect aliases for each item. Normalize alef/hamza, taa marbuta, alef maqsura and diacritics. Postgres ships an `arabic_stem` dictionary (unverified) [K10]. |
| **K2 Compact tenant brief in the instructions, cached** | Identity, hours, policy summary, top FAQs and escalation rules. Built at publish time and byte-identical across calls. | No retrieval delay for common questions. Cheap once cached. | Small token budget. The first response of each call is uncached. Long price lists invite the model to misquote. | An 8k-token prefix adds about $0.034 per 3-min call on 2.1 compared with a 4k prefix (derived; verified inputs) | Write it in the tenant's language and state the dialect policy |
| **K3 Hybrid RAG in Postgres** | A `chunks` table with tenant ID, version, `halfvec` embedding and tsvector. Exact search for small tenants; HNSW with iterative scan, or partitions, for large ones. Results merged with Reciprocal Rank Fusion (RRF). | One database for catalog, documents and memory. Row-level security for isolation. No per-query fees. | The shared-index recall pitfalls above (verified) [K9]. Core full-text ranking is not BM25, and ParadeDB's BM25 extension is AGPL (unverified) [K10]. | About 15–18 GB for 10k tenants at 300 chunks each (unverified estimate) | `arabic_stem` handles dialect forms poorly; add normalization and synonym lists |
| **K4 Managed vector store, one namespace per tenant** (turbopuffer, Pinecone) | Vectors stored per tenant namespace, with the catalog staying in Postgres | Physical isolation per tenant and instant tenant deletion (unverified) [K13, K14] | Another vendor, and another residency question. turbopuffer's own benchmark shows a full-text p50 of 874 ms. (unverified) [K14] | Pinecone has a $50/month minimum; turbopuffer starts at $16/month (unverified) [K13, K14] | Check each engine's Arabic tokenizer |
| **K5 OpenAI Vector Stores** | Managed hybrid search, reached through our own function tool | No infrastructure to run | Adds a network hop. Deletions are eventually consistent, so old prices may appear. Not ZDR-eligible. (verified) [O28, O15] | About $2,500 per 1M lookups (derived; verified inputs) | Arabic tokenization cannot be tuned |
| **K6 OpenAI `text-embedding-3-large` at 1024 dimensions** | The owner's preferred vendor | $0.13 per 1M tokens, or $0.02 for `-small` (verified) [O4]. Vectors can be shortened natively (verified) [O27]. | A 2024-generation model with weaker published multilingual retrieval (verified) [K1] | About $195 to embed 1.5B tokens (derived; verified inputs) | No Arabic split published |
| **K7 Other embedding APIs** (Gemini Embedding 2, Voyage 4, Cohere Embed 5) | Newer multilingual embedders | Cohere's own table scores Arabic at 87 for Gemini, 86 for Voyage 4 Large and 83 for Embed 5 Pro (unverified, vendor-reported) [K3] | Another vendor. Gemini silently truncates input over 8,192 tokens (unverified) [K4]. | $0.02–0.20 per 1M tokens (unverified) [K3, K4, K5] | Dialect performance untested |
| **K8 Self-hosted embeddings** (bge-m3, mE5-large, Qwen3-Embedding) | Open models run in-region | The best-documented Arabic (MSA) retrieval (verified) [K1, K2]. MIT or Apache licences (unverified) [K7, K8]. | Requires running GPUs. mE5 truncates input at 512 tokens (unverified) [K8]. | Compute only | Benchmarks are MSA, not dialect |
| **K9 Selective reranking** | Rerank the top 20–50 results only for tenants with many documents, or for ambiguous queries | Improves retrieval, as shown in the studies above (verified / corrected) [K2, K16] | Adds 0.3–0.6 s per call for managed APIs (verified) [K18]. Jina v3.5 is licensed CC BY-NC (unverified) [K6]. | Voyage rerank-2.5 costs $0.05 per 1M tokens (unverified) [K5] | `bge-reranker-v2-m3` showed Arabic gains (corrected) [K2] |

**Ingestion (proposal):**
1. The tenant uploads a PDF, image, XLSX or CSV, or gives a website.
2. The content is extracted into the catalog schema. OpenAI file inputs parse only the first 1,000 rows of each spreadsheet sheet (unverified) [O30].
3. The tenant reviews the differences on an approval screen.
4. A versioned publish follows.
5. The brief, embeddings, caches, tool definitions and fixed audio are rebuilt.
6. The token budget is checked at publish time.

**Preliminary leaning (not a decision):**
- Use K1, K2 and K3 together.
- Choose embeddings by evaluation, with K6 at 1024 dimensions as the default candidate and K8's bge-m3 as the challenger.
- Use K9 only where it measurably helps.
- Do not use K5 as the multi-tenant backbone.
- *Why:* exact prices, one transactional store, isolation through row-level security, and cost.
- *Would change if:* tenant knowledge bases turn out much larger than expected, or a sovereign tier needs a separate vector store.

### 2.5 Memory and caching

**Key facts**
- **Managed memory accuracy is disputed.**
  - An independent re-run of the LoCoMo benchmark (verified; a single-author preprint that promotes a competing system) [K23]:
    - Full context: 79.8% accuracy, p95 latency 5.51 s.
    - Mem0: 29.3% accuracy, p95 latency 5.59 s.
  - Mem0's own paper claims a 26% improvement over OpenAI's memory (verified as the paper's claim) [K23].
- **Zep backups:** Zep keeps backups for up to 365 days and cannot purge a single customer from them (unverified) [K25].
- **OpenAI's memory pattern:**
  - It consists of a structured profile plus global notes plus session notes, merged after the session.
  - OpenAI warns that injecting memory "is not a security boundary" (unverified) [O29].
- **Fixed audio and the media path:** pre-recorded fixed audio only works if we control the media path (unverified) [K19, K20].
- **Fixed-phrase generation after TTS shutdown:** `gpt-audio-1.5` remains available for generating fixed phrases after the TTS shutdown. Audio costs $32 in and $64 out per 1M tokens (verified) [O32].
- **Cache monitoring:** usage, including cached tokens, is reported in `response.done` (verified) [O5]. This lets us monitor the cache-hit rate of every call.

**Options**

| Option | What it is | Pros | Cons | Cost | Arabic notes |
|---|---|---|---|---|---|
| **M1 Our own layered memory** | L0: call state in Redis, keyed by call ID. L1: caller profile per tenant and hashed E.164 number. L2: 5–10 advisory notes, merged after hang-up by a small model. L3: tenant knowledge. | No latency during the call. Full control of retention, deletion and residency. Never shared across tenants. | We build extraction, de-duplication, conflict rules and evaluations. Notes can carry prompt injection. | One small LLM call per call, which is negligible | Store the caller's language, dialect and name spelling in both Arabic and Latin script |
| **M2 Managed memory** (Zep/Graphiti, Mem0, Letta) | Extraction and retrieval as a service | Ready-made pipelines | Accuracy disputed (verified) [K23]. Backup retention (unverified) [K25]. Another processor of personal data. | Zep Flex $125/month for 50k credits (unverified) [K25] | Byte-metered ingestion costs about twice as much per Arabic character, since UTF-8 uses 2 bytes for Arabic |
| **M3 Exact-key caches, prompt caching and pre-recorded fixed audio** | Redis keys include the tenant ID and knowledge version. A stable prompt prefix. Pre-recorded greetings, AI disclosure and hold lines. | Always correct. Cleared by bumping the version. Clips start instantly at no cost. | Fixed audio needs control of the media path and a voice that matches the live one | Redis memory only | Record clips per dialect |
| **M4 Semantic response caching** | Returns a stored answer for a similar question | Fewer LLM calls for reworded FAQs in text chat | False positives are inherent (verified) [K21]. Unsafe for transactional data. | An embedding and a lookup per request | Needs tight thresholds per language |

Prompt layout for cache hits (proposal, based on [O5, O26]):

```
[1] Platform policy                  static for all tenants
[2] Tenant brief vN                  static per tenant; rebuilt only on publish
[3] Tool definitions                 same order and schemas for every call of the tenant
---- session starts: never edit [1]-[3] mid-call (edits bust the cache, verified [O5]) ----
[4] Conversation items: caller profile and memory, date and time, retrieved snippets, then turns
Truncation: retention_ratio about 0.8 (OpenAI's example), plus a token_limits.post_instructions cap (verified) [O5]
```

**Preliminary leaning (not a decision):**
- Use M1 and M3 together.
- Use M4 only for text-chat FAQs later, never for prices, availability or bookings.
- Do not adopt M2 now.
- *Why:* latency, correctness, and deletion and residency control.
- *Would change if:* M1's evaluations show poor recall on returning callers.

### 2.6 Platform architecture, tenancy, scaling, region placement

**Where each component can run**

| Component | Options | Evidence |
|---|---|---|
| Speech-to-speech processing | OpenAI: US or EU only. Azure UAE North: Global deployments only. Gemini: listed for Vertex Middle East endpoints, without a residency guarantee. | verified [O15, P1]; unverified [A12] |
| Text LLM in the UAE | OpenAI UAE region: `gpt-5.6-luna`, `gpt-5.5`, `gpt-5.2`, with approval and a 10% surcharge. Azure UAE North PTU: `gpt-4.1`, `gpt-5.1`, `gpt-6-sol` and others. OCI Riyadh and Dubai: Cohere Command A. Telnyx Dubai: Kimi K2.6. | verified [O15]; corrected [P1]; unverified [P3, T7] |
| Embeddings in the UAE | OpenAI UAE region `text-embedding-3-large`; Azure UAE North `text-embedding-3-*` | verified [O15, P1] |
| STT in the UAE | Azure UAE North Whisper (regional); self-hosted models | verified [P1] |
| Media and SIP ingress | LiveKit media group `me` (KSA and UAE) and SIP endpoint `sa`; Telnyx Dubai anchorsite. Twilio's nearest edge is Frankfurt or Dublin. | verified [A2, T6]; unverified [T5] |
| Agent workers | LiveKit Cloud: us-east, eu-central or ap-south, and fixed once created. Self-hosted: anywhere. | verified [A2, A3] |
| Observability data | LiveKit Cloud stores it in the US or EU (Frankfurt) only. A self-hosted Langfuse can run anywhere. | verified [P29]; unverified [P25] |
| Round-trip time from UAE North | UAE Central 6 ms, Qatar 15 ms, Pune 32 ms, Frankfurt 100 ms, US East 176–189 ms | corrected [A35] |

**Options**

| Option | What it is | Pros | Cons | Cost | Arabic notes |
|---|---|---|---|---|---|
| **P-a Three planes, self-hosted LiveKit on Kubernetes, in regional cells** | Control plane: dashboard, configuration, billing, ingestion. Real-time plane: agent workers and media. Async plane: a transactional outbox feeding queues and idempotent workers. | Control over region, scaling signal and connection draining. No per-minute fee. The same code can be deployed as a sovereign cell. | We are on call for media and SIP, and need warm spare capacity per region | Small: 10–25 calls per 4 vCPU / 8 GB server (verified) [P5] | Pass each tenant's dialect configuration into every session |
| **P-b LiveKit Cloud managed agents** | LiveKit hosts the media, SIP and agents | Rolling deploys that wait for calls to finish. Autoscaling. Built-in traces. | Old instances are stopped after a 1-hour rollout window (unverified) [P4]. Observability data stays in the US or EU only (verified) [P29]. A BAA is only available on the Scale, Enterprise and Startup plans, and only for LiveKit Cloud (verified) [P30]. | $0.01 per agent-minute (verified) [A1] | Media can stay in KSA and the UAE |
| **P-c A managed voice platform as the real-time plane** | Vapi or Retell runs the calls; we run the control plane and tools | Fastest MVP. Vapi publishes its reliability engineering: 5% canary releases with rollback in under 60 s (verified, self-reported) [P6]. | Platform fees and concurrency caps. Little control over region, tracing and retention. | Vapi fee $0.05/min (verified) [M1] | Dialect support is limited to what the platform exposes |
| **P-d Sovereign in-country cell** | A cell in the UAE or KSA with STT, LLM, TTS and storage all in-country | Can meet rules that forbid cross-border transfer | No speech-to-speech available in-country. In-country TTS is unverified. | The infrastructure floor is repeated for every cell | The Arabic quality of in-country LLMs is unverified |
| **P-e Tenancy: pool, then bridge, then silo** | A tenant ID and row-level security on every tenant table, with `app.current_tenant` set per transaction. Large or regulated tenants move to their own schema, database or region. | AWS recommends this for pooled isolation (verified) [P12]. Cheapest. | Noisy neighbours. Superusers, roles with BYPASSRLS, and table owners bypass row-level security unless FORCE is set (verified) [P13]. | The pool is cheapest; silo is priced into enterprise tiers | — |
| **P-f Serverless functions for calls** | Lambda or Cloud Run | No servers to run | Lambda allows at most 15 minutes (verified) [P9]. Cloud Run WebSockets last at most 60 minutes (unverified) [P8]. | — | — |

**Scaling facts**
- **OpenAI limits are shared by every tenant on our account** (verified) [O14, O1]:
  - Tokens per minute for 2.1: 200k (Build), 4M (Launch), 15M (Grow).
  - Monthly spend caps: $500, $5,000 and $200,000.
  - No Realtime concurrency limit is published.
- **Concurrency at the lowest tier:** at about 23k tokens per call-minute, the Build tier allows only about 8 concurrent 2.1 calls (unverified; this assumes cached tokens count toward the limit) [O1].
- **Ramping traffic:** ramping too fast can trigger HTTP 429 `slow_down` (unverified) [O14].
- **Autoscaling and draining:** scale out at about 0.5 load when the admission threshold is 0.7. Allow a grace period of 10 minutes or more for voice calls (verified) [P5]. Set the drain period to at least the maximum call length.

**Preliminary leaning (not a decision):**
- Use P-a with P-e.
- Put the first cell in EU-Frankfurt.
- P-b is acceptable for the first pilot if operations capacity is short.
- Build P-d only for a signed regulated customer.
- Enforce per-tenant caps on concurrent calls, monthly spend and calls per caller.
- *Why:*
  - Data residency and control over where observability data lives.
  - Cost at volume.
  - The same code can be deployed as a sovereign cell later.

### 2.7 Reliability, security, compliance, observability and evals

**Reliability and security controls**
- **Degrade ladder.** When a vendor fails, step down in this order:
  1. Switch provider inside the pipeline.
  2. Fall back from speech-to-speech to the cascade.
  3. Take a message.
  4. Forward the call to the tenant's human staff.
  5. Play a static apology.

  LiveKit's fallback adapters cover STT, LLM and TTS, but not speech-to-speech models (unverified) [P10].
- **Releases.** Use canary releases starting at 5% of traffic, with automatic rollback (verified, Vapi's self-reported practice) [P6]. Keep protocol changes backward-compatible. Drain for 60 minutes or more.
- **Idempotency:**
  - Every write tool carries an idempotency key such as (call_id, tool_call_id).
  - Use a transactional outbox with consumers that tolerate at-least-once delivery (unverified pattern) [P11].
  - OpenAI does not deduplicate outbound SIP calls, so never retry automatically after an ambiguous timeout (verified) [O12].
- **Authorization lives in the backend** (verified) [P16]:
  - The runtime injects the tenant and the verified caller.
  - High-impact actions need confirmation.
  - Untrusted text goes only into user messages (unverified) [O31].
  - SIP headers are treated as untrusted (verified) [O12].
- **Tenant isolation:**
  - Use FORCE ROW LEVEL SECURITY with an application role that does not own the tables, and run cross-tenant tests in CI (verified basis) [P12, P13].
  - Filter or partition vector search per tenant (verified) [K9].
  - Put the tenant and knowledge version in every cache key.
- **Secrets:** use KMS envelope encryption with an encryption context of {tenant_id, integration} (unverified) [P14].
- **Toll fraud:**
  - Allow calls only to low-risk destinations, and use one telephony sub-account per tenant (verified) [P17].
  - Set usage triggers. Twilio says toll-fraud charges can exceed $100,000 (verified) [P17].
  - Enforce spend caps, a maximum call length and silence timeouts.

**Compliance by jurisdiction**

| Jurisdiction | Call recording | Data transfer and residency | Health data | AI disclosure and outbound calls |
|---|---|---|---|---|
| US | One-party consent at federal level (unverified) [T33]; states not checked | — | A BAA chain is needed. Realtime BAA coverage is unconfirmed (corrected) [O15, O16]. LiveKit offers a BAA only on its Scale, Enterprise and Startup plans (verified) [P30]. Callers must be verified before details are disclosed (unverified) [V35]. | AI-voice outbound calls need prior express consent (corrected) [V36]. The healthcare exemption is limited to 1 call per day and 3 per week (unverified) [V37]. California AB 3030 covers clinical information but not scheduling (unverified) [V38]. |
| EU | Not researched | GDPR Art. 28: sub-processors need authorization (unverified) [P23]. OpenAI's EU endpoint requires ZDR or modified abuse monitoring (MAM) (verified) [O15]. | — | Art. 50 disclosure applies from August 2026. Triage is high-risk from 2 Dec 2027. The Art. 6(3) derogation must be documented. (verified) [V39, V40] |
| UK | Reasonable efforts to inform callers (unverified) [T34] | — | — | — |
| UAE | All-party consent; at least 6 months and/or AED 150k–500k (unverified) [T35] | The PDPL excludes health data that falls under the health-data law (unverified) [P18] | ADHICS 2.0 blocks cross-border flows (verified) [P19]. Dubai's DHA policies allow them (unverified) [P20]. | Marketing SMS only between 7 AM and 9 PM, with explicit consent that can be stored (verified) [T16] |
| KSA | Interception carries up to 1 year and/or SAR 500k (unverified) [T37] | Transfers need SCCs, BCRs or a certificate plus a risk assessment, and continuous sensitive-data transfers also need one (verified) [P22]. Breaches must be notified within 72 hours (unverified) [P21]. | Ministry of Health controls apply (unverified) [P21] | — |
| Jordan | Written consent for a stated purpose (unverified) [T40] | No SCC route; transfers rely on an adequacy list (unverified) [T40] | Health data is sensitive and needs prior consent (unverified) [T40] | Breach notice within 72 hours to the regulator and within 24 hours to data subjects for serious harm (unverified) [T40] |
| Egypt | Up to 1 year in prison (unverified) [T38] | PDPL status not researched | — | — |
| Palestine | At least 1 year and/or JD 1,000–3,000 (unverified) [T39] | Not researched | — | — |

**Options**

| Option | What it is | Pros | Cons | Cost | Arabic notes |
|---|---|---|---|---|---|
| **Q1 OpenAI-hosted tracing** | The Agents SDK's default exporter | No setup | Unavailable under ZDR. Records raw audio and sensitive data by default. (verified / corrected) [O19] | Included | — |
| **Q2 OpenTelemetry into a self-hosted Langfuse** | Per-turn spans tagged with tenant ID, call ID and agent version, stored in the same region as the data, with redaction | Works under ZDR. Keeps data in-region. Gives the latency split per turn. | Needs Postgres, ClickHouse, Redis and S3. Some features need an enterprise licence. (unverified) [P25] | Self-hosted infrastructure | — |
| **Q3 LiveKit Cloud observability** | Managed traces, logs and recordings | No setup | Data stays in the US or EU only (verified) [P29] | LiveKit plan | — |
| **Q4 Simulated-caller vendors** | Hamming, Cekura, Coval | Red-team suites, scheduled production checks, integration with CI | Another sub-processor. Only Hamming lists Arabic. (unverified) [P28, P27, P26] | Cekura $0.25 per test minute; Coval $0.25–0.40 per simulated minute (unverified) | Dialect personas would need to be built |
| **Q5 Our own evaluation harness** | The Phase-0 set becomes the CI regression suite, with scripted callers per dialect | Dialect-specific. We own the data. | We build and maintain it | Engineering time | Core to the product's Arabic quality |
| **Q6 Recording off by default; opt-in per tenant and jurisdiction** | Keep transcripts and summaries; record only with an announced consent step and stored evidence | Limits criminal exposure (finding 9) | Less audio available for QA | — | Consent prompts per dialect |

**Preliminary leaning (not a decision):**
- Use Q2, Q5 and Q6, with the degrade ladder and the controls above.
- Disclose that the caller is talking to an AI at the start of every call.
- Evaluate Q4 after Phase 0.
- *Would change if:* counsel confirms that announced recording is safe in each launch market.

### 2.8 Notifications: WhatsApp, SMS, e-mail

| Item | Value | Status | Source |
|---|---|---|---|
| WhatsApp pricing model | Charged per delivered message, by category and recipient market. A user message or a user call opens a 24-hour service window. | verified | [T18] |
| Changes on 2026-10-01 | Each business number gets 1,000 free service messages a month, then they are charged. Utility templates sent inside an open window are now charged. | verified | [T18] |
| Utility, authentication and service rates | KSA $0.0107; UAE $0.0157; Egypt $0.0036; Jordan $0.0091; Palestine ("Other") $0.0077 | verified | [T19] |
| Marketing rates | KSA $0.0576; UAE $0.0576; Egypt $0.0644; Jordan $0.0392; Palestine $0.0604 | verified | [T19] |
| International authentication rates | KSA $0.0598; UAE $0.051; Egypt $0.065 | verified | [T19] |
| Rate changes | Only on the first day of a quarter, with at least 1 month's notice | verified | [T18] |
| Template review | Up to 24 hours | unverified | [T21] |
| SMS per segment (Twilio) | UAE $0.1176; KSA $0.1949; Egypt $0.3959; Jordan $0.4429; Palestine $0.4101 | unverified | [T26] |
| SMS rules | UAE: registered sender IDs (about 2 weeks); no URLs, chat links or phone numbers in the body unless allowlisted. KSA: a registered alphanumeric sender is mandatory and URLs must be allowlisted. Egypt: domestic registration takes about 3 weeks. Jordan: about 12 days. None of the five markets supports two-way SMS. | verified | [T27] |
| Arabic SMS encoding | UCS-2: 70 characters in a single segment, 67 per part when concatenated | unverified (general rule, not from the research) | — |
| E-mail | Amazon SES à la carte costs $0.10 per 1,000. New accounts default to the Essentials plan at $0.16 per 1,000 since 2026-07-21. | verified | [T28] |
| Gmail bulk-sender rules | Senders of more than 5,000 a day need SPF, DKIM, DMARC and domain alignment, plus one-click unsubscribe for marketing. Spam rate must stay below 0.30%. | verified | [T32] |

**Options**

| Option | What it is | Pros | Cons | Cost | Arabic notes |
|---|---|---|---|---|---|
| **N1 WhatsApp through the Meta Tech Provider model with Embedded Signup** | Tenants connect their own WhatsApp Business Account in our dashboard, and Meta bills them directly (unverified) [T22] | No markup. The tenant owns its number. Self-serve. | Needs Meta App Review. We build template management and webhooks. | Meta fees only (verified) [T19] | Every template in both Arabic and English |
| **N2 WhatsApp through a BSP** (Twilio, 360dialog) | The provider hosts the WhatsApp connection | Credit lines. Same API as voice. | Twilio's markup is larger than Egypt's utility fee | Twilio adds $0.005 per message (unverified) [T23]. 360dialog charges €49–99 per number per month (unverified; URL not captured). | — |
| **N3 SMS with per-tenant sender IDs** | Through Twilio; local aggregators were not researched | Works without WhatsApp | 7–110 times the WhatsApp utility price (derived; includes unverified inputs). Registration lead times. URL bans. | See the table above | UCS-2 segments make Arabic messages longer |
| **N4 E-mail through SES** | A platform sender using each tenant's verified domain | Cheapest | We handle bounces ourselves. Avoid the Essentials default. | $0.10 per 1,000 (verified) [T28] | Right-to-left templates |
| **N5 Managed e-mail** (Postmark, Resend, SendGrid) | Higher-level e-mail APIs | Templates, analytics, and per-tenant streams or sub-users | About 5–18 times the SES cost (unverified) [T29–T31] | Postmark $15–18 per 10k; Resend $20 per 50k (unverified) | — |

**Preliminary leaning (not a decision):**
- Use N1, with N3 as the fallback and N4 for e-mail, under a channel policy set per tenant.
- Confirm a booking made during a WhatsApp call in the same chat.
- After a normal phone call, a WhatsApp confirmation is a business-initiated template message, because only a WhatsApp message or call opens the free window (verified) [T18].
- *Would change if:* tenants refuse to connect their own WhatsApp accounts. Then use N2.

---

## 3. Unit economics

### 3.1 Call profile

| Parameter | Value | Status |
|---|---|---|
| Call length | 180 s: the caller talks 72 s, the agent talks 90 s, and 18 s is silence | assumption |
| Silence | Filtered out by VAD and not billed on Realtime | verified [O5] |
| Turns | 10 caller turns, 10 spoken responses and 2 tool-call responses, so 12 responses | assumption |
| Static prefix | 4,000 text tokens: persona, policies and tool schemas | assumption |
| Per turn | 30 transcript tokens, 40 reasoning tokens (low effort); each tool result 200 tokens; each function-call item 30 tokens | assumption |
| Audio tokens | Caller 600 per minute; agent 1,200 per minute | verified [O5] |
| Context | The full history is re-sent with every response | verified [O5] |
| Cache | Best case: every previously sent token is a cache hit, which gives 89.4% of 66,800 input tokens | verified recomputation [O4, O5] |
| Cascade LLM | Caller 30 and agent 40 tokens per turn; 12 LLM calls; 55,060 input tokens, of which 49,940 are cached; 460 output tokens | assumption / derived |
| TTS volume | About 800 characters per minute of speech, so about 1,200 characters per call | unverified |
| STT billing basis | The full 3 minutes is streamed and billed | assumption |

### 3.2 Price inputs

| Input | Value | Status | Source |
|---|---|---|---|
| `gpt-realtime-2.1` | Audio $32 in, $0.40 cached, $64 out. Text $4 in, $0.40 cached, $24 out. All per 1M tokens. | verified | [O4] |
| `gpt-realtime-2.1-mini` | Audio $10 in, $0.30 cached, $20 out. Text $0.60 in, $0.06 cached, $2.40 out. All per 1M tokens. | verified | [O4] |
| Post-call transcript for speech-to-speech | `gpt-transcribe` at $0.0045/min on 3 minutes = $0.0135 | price verified [O4]; billing basis assumed | [O4] |
| In-session transcription (alternative) | `gpt-live-transcribe` at $0.017/min | price verified; billing basis inside speech-to-speech sessions unverified | [O4] |
| Cascade LLM (`gpt-5.6-luna`) | Input $0.20, cached $0.02 and 30-minute cache write $0.25, all per 1M tokens. The output price was not captured; assumed $2 per 1M. | inputs verified; output unverified assumption | [O25, O4] |
| STT, Deepgram Nova-3 through LiveKit | $0.0048/min | verified | [A1] |
| STT, ElevenLabs Scribe v2 Realtime | $0.39/h, which is $0.0065/min | unverified | [A27] |
| TTS, Azure neural `ar-*` | $15 per 1M characters, which is $0.012 per minute of speech | unverified | [A14] |
| TTS, Cartesia Sonic 3 through LiveKit | $0.030 per minute of speech | verified | [A1] |
| Gemini 3.8 Live | Audio $3 in and $12 out per 1M tokens, about $0.005 and $0.018 per minute; $0.0182/min through LiveKit | verified | [A10, A1] |
| GPT-Live | $0.05/min, billed per second including silence | verified | [O7, O5] |
| Orchestration | LiveKit Cloud $0.01/min (verified) [A1]. Self-hosted about $0.002/min (unverified estimate, not from the research). | mixed | — |

### 3.3 Model and speech cost for a 3-minute call

| Architecture | Line items | Per call | Per min | Status |
|---|---|---|---|---|
| **A1 Realtime 2.1, best-case cache** | Uncached text in $0.0189; uncached audio in $0.0749; cached in $0.0239; text out $0.0202; audio out $0.1152; transcript $0.0135 | **$0.267** | $0.089 | Model cost $0.2531 is a verified recomputation; the transcript line is derived |
| A1 with no cache hits | Model $0.8007 plus transcript | $0.814 | $0.271 | derived; verified inputs |
| **A2 Realtime 2.1-mini, best-case cache** | $0.0028 + $0.0234 + $0.0065 + $0.0020 + $0.0360, plus transcript | **$0.084** | $0.028 | Model cost $0.0707 is a verified recomputation |
| A2 with no cache hits | Model $0.2118 plus transcript | $0.225 | $0.075 | derived; verified inputs |
| **A3 Cascade, value** | Deepgram $0.0144; LLM about $0.0032; Azure TTS $0.0180 | **$0.036** | $0.012 | derived; includes unverified inputs |
| **A4 Cascade, quality** | Scribe v2 $0.0195; LLM $0.0032; Cartesia $0.0450 | **$0.068** | $0.023 | derived; includes unverified inputs |
| A5 Gemini 3.8 Live | $0.033–0.055 plus transcript; per-turn context re-billing not established | $0.047–0.068 | $0.016–0.023 | derived; a lower bound |
| A6 GPT-Live (English only) | $0.15 plus a backend LLM of about $0.003 | $0.153 | $0.051 | derived; includes unverified inputs |

### 3.4 Sensitivity of Realtime cost (derived; verified price inputs)

| Scenario | 2.1 per call | Mini per call |
|---|---|---|
| Best-case cache, 89.4% | $0.253 | $0.071 |
| 50% of cacheable tokens hit | $0.527 | $0.141 |
| No cache hits | $0.801 | $0.212 |
| Tenant prefix also cached across calls (unconfirmed for Realtime) | $0.239 | $0.069 |
| 8k-token static prefix | $0.287 | $0.076 |
| Agent talks 60 s instead of 90 s | $0.196 | $0.053 |
| 6-min call, cached | $0.513 ($0.086/min) | $0.151 ($0.025/min) |
| 6-min call, no cache hits | $2.606 ($0.434/min) | $0.731 ($0.122/min) |
| 10-min call, cached | $0.883 ($0.088/min) | $0.271 ($0.027/min) |

With caching, the cost per minute is roughly flat as calls get longer. Without caching, the cost per call grows roughly with the square of call length. The cache-hit rate should therefore be tracked per call from `response.done`.

### 3.5 Telephony per channel

| Channel / country | Per minute | Fixed | Per 3-min call | Status |
|---|---|---|---|---|
| Web widget (WebRTC) | $0 carrier | — | $0 | — |
| WhatsApp call, user-initiated | Meta $0, plus infrastructure $0.003–0.005 | — | $0.009–0.015 | Meta fee verified [T25]; infrastructure unverified [T4, T23] |
| US number, Twilio plus Media Streams | $0.0129 | $1.15/month | $0.039 | verified [T1] |
| US number, LiveKit | $0.01 | about $1/month | $0.030 | per-minute rate verified [A1]; monthly fee unverified |
| UAE local number (Plivo) | $0.10285 | $150/month | $0.309 | verified [T11] |
| UAE toll-free (Plivo) | $0.38 | $20/month | $1.14 | verified [T11] |
| KSA toll-free (Plivo) | $0.747 | $115/month | $2.24 | unverified [T12] |
| Jordan local (Telnyx) | not captured | $65/month | — | unverified [T14] |
| Forwarded from a MENA operator | Operator charge (unknown), plus the receiving leg, for example $0.0085 on a US number | — | — | unverified / unknown |
| Handoff to a human by SIP REFER (Twilio) | $0.10 per transfer | — | — | verified [T1] |
| Outbound to the UAE, KSA, Egypt and Jordan (Twilio) | $0.2995–0.3635; $0.1738–0.3122; $0.2056–0.2090; $0.2677–0.3448 | — | — | verified [T10] |

### 3.6 All-in cost per minute (derived; includes unverified inputs)

These figures include self-hosted orchestration, estimated at $0.002/min. With LiveKit Cloud, add $0.008/min to every cell. Monthly number rental and notifications are excluded.

| Architecture | Web | WhatsApp | US number | UAE local number | UAE toll-free | KSA toll-free (unverified) |
|---|---|---|---|---|---|---|
| A1 2.1, cached | 0.091 | 0.095 | 0.104 | 0.194 | 0.471 | 0.838 |
| A1 2.1, no cache | 0.273 | 0.277 | 0.286 | 0.376 | 0.653 | 1.020 |
| A2 mini, cached | 0.030 | 0.034 | 0.043 | 0.133 | 0.410 | 0.777 |
| A2 mini, no cache | 0.077 | 0.081 | 0.090 | 0.180 | 0.457 | 0.824 |
| A3 cascade, value | 0.014 | 0.018 | 0.027 | 0.117 | 0.394 | 0.761 |
| A4 cascade, quality | 0.025 | 0.029 | 0.038 | 0.127 | 0.405 | 0.772 |
| A5 Gemini 3.8 Live | 0.018–0.025 | 0.022–0.029 | 0.030–0.038 | 0.120–0.128 | 0.398–0.405 | 0.765–0.772 |
| A6 GPT-Live (English) | 0.053 | 0.057 | 0.066 | 0.156 | 0.433 | 0.800 |

- On a UAE local number, telephony is 77% of the cost per minute for A2 and 88% for A3.
- Number rental adds more on top. For example, a UAE local number at $150 a month adds $0.15 per call at 1,000 calls a month.

### 3.7 Notifications per completed order or booking (derived)

| Market | WhatsApp utility (verified) [T19] | SMS, 1 segment (unverified) [T26] | SMS as a multiple of WhatsApp |
|---|---|---|---|
| KSA | $0.0107 | $0.1949 | 18x |
| UAE | $0.0157 | $0.1176 | 7.5x |
| Egypt | $0.0036 | $0.3959 | 110x |
| Jordan | $0.0091 | $0.4429 | 49x |
| Palestine | $0.0077 | $0.4101 | 53x |

E-mail through SES costs $0.0001 per message (verified) [T28].

### 3.8 Example tenant economics (derived; includes unverified inputs; excludes support, infrastructure overhead, payment fees and notifications)

| Case | Revenue | Configuration | Cost / month | Margin |
|---|---|---|---|---|
| UAE clinic paying AED 1,500/month (about $408, unverified exchange rate), 1,000 calls × 3 min | $0.136/min | A2 on a UAE local number | $549 | −$141 |
| Same clinic | — | A3 on a UAE local number | $501 | −$93 |
| Same clinic | — | A2 over WhatsApp | $102 | +$306 (75%) |
| Same clinic | — | A3 over the web or WhatsApp | $42–54 | +$354–366 |
| US restaurant at $150/month flat, 500 calls | $0.10/min | A2 on a US number | $66 | +$84 (56%) |
| Same restaurant, 1,500 calls | $0.033/min | A2 on a US number / A3 on a US number | $195 / $122 | −$45 / +$28 |

### 3.9 Third-party per-minute prices compared with our model

| Source | Price | Status | Note |
|---|---|---|---|
| LiveKit Inference, GPT Realtime 2.1 / 2.1-mini | $0.0676 / $0.0216 per min | verified [A1] | Usage assumptions not disclosed |
| Retell, GPT Realtime 2.1 / 2.1-mini | $0.38 / $0.07 per min | verified [M3] | Resale price |
| Artificial Analysis cost per hour of input audio | GPT-Realtime-2.1 High $10.75; Gemini 3.8 Live $0.84 (12.8 times cheaper) | verified [A21] | A benchmark metric that ignores cache discounts |
| Our model, 2.1 | $0.084–0.267/min | derived; verified inputs | The best-supported figure for our own costing |

**Takeaways:**
- On the web widget and WhatsApp, AI cost dominates.
- On Gulf phone numbers, telephony dominates, and toll-free numbers are prohibitively expensive.
- Cache discipline and short agent turns are the main levers we control. Agent audio output is 45% of the 2.1 cost (verified).
- Flat "unlimited" plans only work with low-cost engines and low call volumes per location. Volumes per location are unknown (§7).

---

## 4. Market

### 4.1 Competitors

| Who | Target customer | Channels | Notable features | Pricing |
|---|---|---|---|---|
| Vapi | Developers, agencies, enterprise | Voice: PSTN, SIP, WebRTC | Customers bring their own providers; evals and simulations; EU region on Premier (unverified) [M2] | $0.05/min platform fee plus providers. 1,000 minutes cost about $82–129. HIPAA add-on $2,000/month. Pro has a $999/month minimum. (verified) [M1] |
| Retell AI | SMB and mid-market builders, agencies | Voice, chat | Knowledge base, warm transfer, post-call analysis, simulation testing; processing in the US only (unverified) [M5] | $0.07–0.31/min. Its example is $0.11 excluding telephony (corrected). AI QA $0.10/min. 20 concurrent calls free. (verified) [M3] |
| Bland | Enterprise-leaning | Voice; SMS and chat on Enterprise | Pathways orchestration; on-premises or VPC deployment | $0.12–0.14/min plus telephony (unverified) [M6] |
| ElevenLabs Agents | Developers to enterprise | Voice, with customers bringing their own telephony | Voice library; burst capacity up to 3x concurrency | $0.08/min plus LLM; burst $0.16/min (unverified) [M7]. Residency in the US, EU, India and Singapore on Enterprise only (verified) [M8]. |
| Synthflow | Enterprise only | Voice | No-code builder | From $30,000 a year (verified) [M9] |
| Telnyx Voice AI | Developers | Voice | Telephony from the carrier's own network | $0.05/min, about $0.06 all-in (unverified) [T3] |
| PolyAI | Enterprise | Voice, SMS, WhatsApp, chat, e-mail | Its own voice model; claims 99.994% uptime | Quote only. Model API $0.02/min plus tokens. (unverified) [M11] |
| Sierra | Large consumer brands | Chat, voice | Outcome-based pricing; claims 55+ languages | Not published (unverified) [M12] |
| Intercom Fin | Helpdesk users | Chat and e-mail; voice for select customers | Priced per outcome | $0.99 per outcome; plus $19 per seat on Intercom's own helpdesk (verified) [M13] |
| Parloa, Voiceflow | EU enterprise; agencies | Voice, chat | Compliance badges; white-labelling | Not published (unverified; URL not captured) |
| Slang AI | Restaurants (US) | Phone | OpenTable, Resy and SevenRooms bookings; VIP routing | $399–599 per location; billing period not stated (unverified) [M14] |
| Loman, Kea, ConverseNow | Restaurants and chains | Phone | Orders written into the POS; card payments by phone; claimed order accuracy of 99.3–99.6% | On request (unverified) [M15, M17, V21] |
| Maple | Restaurants | Phone | POS ordering; OpenTable; upselling | $85–150/month (Voice) or $220–350/month (Pro); no per-minute fees (verified) [M16] |
| Assort Health, Hello Patient, Arini | Medical and dental practices | Phone | EHR and practice-management booking, intake, outbound outreach | Quote only (unverified) [M19, V23, M18] |
| Viva | Dental | Phone | Credit plans | Plans at $349, $899 and $1,199 a month, at 10 credits per AI minute; or $350 plus $150 per provider (corrected) [M20] |
| Rosie, Smith.ai, Goodcall | Local SMBs | Phone | Self-serve; Smith.ai offers human backup | Rosie $49–299/month (about $0.15–0.20/min). Smith.ai $1.67–3.00 per call. Goodcall $79–299/month. (unverified) [M21, M22] |
| ZIWO | MENA contact centers | Voice | Saudi and UAE dialects; data hosted in-country | $0.25/min, excluding setup, platform and channel fees (verified) [M23] |
| Maqsam, Sarj, WideBot, Hamsa with OmniOps | MENA enterprise and regulated sectors | Phone; WhatsApp voice (WideBot) | Dialect focus; hosting in KSA or the UAE | Not published (unverified) [M24–M27] |
| CNTXT Munsit | Speech APIs | STT, TTS | Claims 25+ dialects; LiveKit and Pipecat plugins; raised a $60M Series A | $8–80/month plans (unverified) [A38, M28] |
| Rafeeq | Gulf SMBs | WhatsApp text only | Ramadan opening hours; Arabic that adapts to the customer's gender | AED 1,500–2,500/month plus AED 2,500 setup (unverified) [M29] |
| TalkRight | UAE clinics | Phone, WhatsApp, e-mail | EMR integration scoped per customer | From AED 1,200/month; AED 2,000/month with telephony (verified) [M30] |

### 4.2 Table stakes for enterprise buyers

These are synthesized across Vapi, Retell, Bland, PolyAI, Sierra and ElevenLabs (unverified as a set):
- **Conversation:** natural turn-taking with barge-in.
- **Knowledge:** a knowledge base built from a website or documents.
- **Actions:** tool calls into calendars, CRMs and POS systems.
- **Handoff and messaging:** warm transfer to a human with context, and confirmations by SMS or WhatsApp.
- **Post-call:** recordings, transcripts, summaries, and success and sentiment scores.
- **Quality:** simulation testing and QA (Retell charges $0.10/min for AI QA, verified [M3]), plus PII redaction and guardrails.
- **Security and compliance:**
  - Retention controls and ZDR.
  - Data residency.
  - SOC 2 Type II, ISO 27001, a HIPAA BAA and a GDPR DPA.
  - SSO, RBAC and audit logs.
- **Operations:**
  - A 99.9% SLA on the top tier (Vapi Premier, verified) [M1].
  - Customers can bring their own SIP and LLM.
  - Guaranteed concurrency with burst capacity.
- **Billing:** transparent billing with spend caps. Complaints about billing and support are common (unverified) [M10].

### 4.3 Typical price per minute

| Segment | Typical price | Evidence |
|---|---|---|
| Developer platforms, all-in | About $0.05–0.15/min | Vapi (verified), Retell (corrected), Telnyx, ElevenLabs, Bland (unverified) |
| Speech-to-speech resale | $0.07–0.38/min | Retell (verified) [M3] |
| US SMB packaged | About $0.15–0.20/min; $1.67–3.00 per call; flat $85–599 per location per month | Maple (verified); Rosie, Smith.ai, Slang (unverified) |
| Dental AI | $200–500 per location per month | Article benchmark (verified) [M20] |
| MENA enterprise | $0.25/min plus fees | ZIWO (verified) [M23] |
| GCC SMB | AED 1,200–2,500/month, about $330–680 | TalkRight (verified); Rafeeq (unverified) |
| Ceiling: human alternatives | Answering services $0.75–1.50/min; an in-house receptionist $3,646–6,187/month | (verified) [M20] |

### 4.4 Gaps and opportunities

1. **Dialect quality and selection.** Retell lists only `ar-SA` (verified) [M4]. A feature request for Lebanese and Levantine Arabic was still unanswered as of 2026-05-05 (verified) [M4].
2. **Middle East data residency.** The global platforms we checked do not offer it (ElevenLabs verified [M8]; Vapi and Retell unverified [M2, M5]).
3. **Local integrations.** Foodics (verified) [V1], free user-initiated WhatsApp calls (verified) [T25], and local payment links (not researched).
4. **The Levant.** No offer focused on Jordan or Palestine was found (unverified).
5. **Self-serve.** Self-serve onboarding with one clear bill, spend caps and fast support.
6. **Bundled QA.** QA with Arabic dialect caller personas, included in the price.
7. **Channel economics.** WhatsApp and the web widget cost 5–30 times less per minute than Gulf phone numbers (derived), which can be passed on as a price advantage.

Threats to these gaps:
- Global platforms could close the dialect gap.
- Well-funded regional vendors could move into the SMB market.
- Meta now prices its own AI agent inside WhatsApp at $2.00 per 1M tokens (verified) [T18].

---

## 5. Verticals

### 5.1 Restaurant ordering

**Flow (proposal), with tools:**
1. Pre-recorded greeting and AI disclosure in the tenant's dialect.
2. `lookup_customer(phone)` loads returning-caller memory, such as the last order and address. Foodics supports looking up customers by phone (unverified) [V5].
3. Identify the intent: order, reservation, status, hours or FAQ, complaint, or a request for a human.
4. Fulfilment and branch: delivery or pickup, and the branch. Check the branch's `receives_online_orders` flag and opening hours, the delivery zone and the minimum order. Scheduled orders send `due_at` in UTC (verified) [V2].
5. `search_menu` and `get_item`, using per-branch price and stock, where a null stock value means unknown, not zero (verified) [V2]. Handle modifiers, half-and-half and combos (unverified schema) [V3]. Keep the cart in L0 memory.
6. `quote_order` uses the POS calculator, such as Foodics `/orders_calculator` (verified) [V1]. Foodics recalculates all totals and taxes on its side (verified) [V1]. Read back the items, modifiers, total, fulfilment and time.
7. Payment: cash on delivery (in Foodics, omit `payments`; in Deliverect, use `type 1` with `orderIsAlreadyPaid=false`, verified [V2, V7]) or a payment link. Never take card numbers by voice.
8. After an explicit "yes", call `submit_order` with a UUIDv4 idempotency key. Foodics returns 422 for a duplicate ID (verified) [V1].
9. On the call, say "order received" and that confirmation will follow. Acceptance and the ETA come later, through the `application.order.updated` webhook or Deliverect statuses 20–95 (verified) [V2, V7]. If the venue does not acknowledge in time, escalate.

**Edge cases**

| Case | Required behaviour |
|---|---|
| Item unavailable, or stock unknown (null) | Offer alternatives; treat null as unknown, not zero (verified) [V2] |
| Branch closed, or `receives_online_orders=false` | Do not take the order; offer another branch or a scheduled order (verified) [V2] |
| Address outside the zone, or below the minimum | Explain and offer pickup |
| Price changes during the call | Re-quote before submitting; prices come only from tools |
| Change after submitting | Foodics allows declining only while the order is pending (verified) [V1]; otherwise hand off to staff |
| POS fails silently after a 201 (Deliverect) | Webhook timeout, then escalate (verified) [V7] |
| Allergy question | Repeat only stored allergen data and never promise "allergen-free". Offer a handoff and put the allergy note on the ticket. The UK FSA requires allergen information before purchase and again at delivery (unverified) [V18]. |
| Blacklisted caller, prank caller or hidden caller ID | Handle the tenant's blacklist; Foodics test cases include blacklisted customers (unverified) [V5]. Ask the caller for their number. Apply cash-on-delivery limits. |
| Caller asks about an aggregator order (talabat, Jahez) | Redirect the caller to the aggregator. talabat accepts no orders from outside channels (verified) [V9]. |
| Payment link not paid | Time out and cancel automatically. Square sends an order to the POS only once it is paid (verified) [V12]. Its workaround, recording an EXTERNAL payment, incurs a Square transaction fee (verified) [V15]. |
| Caller starts reading out a card number | Stop the caller and do not store it; redact it from transcripts. Card data in audio or logs brings them into PCI scope (unverified) [V17]. |
| Dish names in dialect, or code-switching | Keep an alias lexicon per item in Arabic, English and dialect forms. |
| Currencies with three decimal places (JOD, KWD, BHD, OMR) | Use integer minor units plus a decimal-digits field, as Deliverect does (verified) [V7]. |
| Toast orders | The Toast API does not check service hours, and auto-fired KDS orders skip approval (unverified) [V10]. Our tool layer must enforce opening hours. |
| Peak bursts (dinner, Ramadan iftar; no volume data) | Per-tenant concurrency caps. Kitchen pacing (maximum orders per 15 minutes) is an open question. |

**Integrations**

| System | Markets | Can a voice channel create orders? | Notes | Status |
|---|---|---|---|---|
| Foodics | KSA, UAE, Egypt, Kuwait, Jordan, Oman, Qatar [V6] | Yes: POST `/orders` and `/orders_calculator` with OAuth. Creating needs scopes `orders.limited.create` and `orders.id.write`; paying needs `orders.limited.pay`; declining needs `orders.limited.decline`. [V1] | Cash on delivery is supported natively. The `application.order.updated` webhook reports status. Delivery orders need customer and address; reuse `customer_address_id` to avoid duplicate addresses. Partner terms, fees and rate limits are unknown. | verified |
| Deliverect | Global, including the Gulf | Yes, through the Channel API [V7] | The restaurant needs its own Deliverect subscription. A 201 does not mean the POS accepted the order. Cancel by sending status 100; it is complete only when status 110 comes back. Set ASAP when pickup is within 30 minutes. | verified |
| talabat | Gulf, Egypt | No. Orders flow only from talabat into the POS. [V9] | Redirect callers | verified |
| Jahez | KSA | No; its orders reach the POS through Deliverect [V8] | — | unverified |
| Careem | Gulf | Unknown | Not researched | — |
| Toast | US | Only for partner and custom integrations [V11] | `/prices` is the only supported way to get totals [V10] | access verified; behaviour unverified |
| Square | US, UK, France, Ireland, Spain, Japan, Australia, Canada [V14] | Yes, but orders with fulfilment appear on the POS only once paid [V12] | Payment links are single-use (unverified) [V13] | verified (countries unverified) |
| Our own order inbox | Any | Yes; we own it | Accept or reject with an ETA from a dashboard or tablet; WhatsApp, SMS or printer alerts; escalation if no one responds | proposal |
| Stripe | Of the MENA targets, only the UAE [V16] | Payment links | — | verified |
| Regional payment providers (Tap, Moyasar, HyperPay, Paymob) | MENA | — | Not researched | — |

**KPIs**
- **Answer rate.**
- **Order capture rate:** orders divided by calls with ordering intent.
- **Order accuracy:** corrections or refunds per 100 orders. McDonald's aimed for at least 95% before a wider rollout, while voice-ordering accuracy was reported in the low 80s (verified; trade press) [V19]. The SEC settled with Presto after most of its drive-thru orders turned out to need human intervention (unverified) [V20].
- **Average order value** and upsell attach rate.
- **Average handle time.**
- **Handoff rate.**
- **Venue acceptance:** how long the venue takes to accept, and how often it times out.
- **Missed-call recovery.**
- **Cost per order.**
- **Early hang-ups:** the rate of callers hanging up in the first 15 seconds.
- **Caller satisfaction (CSAT).**

### 5.2 Clinic booking

**Flow (proposal), with tools:**
1. Greeting, with AI disclosure at the start.
2. **Emergency screen.** Detect emergency keywords for each locale and tell the caller to call the local emergency number; transfer if the tenant has configured it. The agent never triages.
   - Official emergency numbers were not researched.
   - The EU AI Act classes emergency patient triage as high-risk (verified) [V39], with obligations from 2 Dec 2027 (verified) [V40].
   - A system that only does narrow procedural tasks can claim the Art. 6(3) exemption, but the provider must document that assessment and register it (verified) [V39].
3. **Intent:**
   - New booking.
   - Reschedule.
   - Cancel.
   - Information: hours, services, accepted insurers.
   - Clinical questions (medication, results, symptoms): handed to staff.
4. **New booking:**
   1. Service type.
   2. Provider preference.
   3. `find_slots(service, provider?, window)`.
   4. `hold_slot`.
   5. Collect the fields the tenant requires, such as name, phone, date of birth, national ID or e-mail.
   6. Read the date and time back in words.
   7. `book`.
   8. Send a confirmation on the tenant's channel, with links to reschedule or cancel.
5. **Reschedule, cancel or disclose details.**
   - Verify the caller first, by an OTP sent to the phone on file or by phone number plus date of birth.
   - Never act on a fuzzy match or on several possible patients.
   - Offer to reschedule before cancelling, and apply the cancellation window.
   - HIPAA requires verifying identity and authority before disclosing information (unverified) [V35].
6. **Waitlist:** use the FHIR `waitlist` status with a `requestedPeriod` (verified) [V24].
7. **Reminders:** send them by SMS or WhatsApp.
   - SMS reminders improve attendance compared with no reminder (RR 1.14), and work about as well as phone calls (RR 0.99) at lower cost (unverified) [V42].
   - The average outpatient no-show rate is about 23% (unverified) [V41].
   - In the US, AI-voice reminder calls need consent or must stay within the healthcare exemption: at most 1 a day and 3 a week, each 1 minute or less (unverified) [V37].

**Edge cases**

| Case | Required behaviour |
|---|---|
| Booking for a dependant | Create a separate patient record linked to the caller, and confirm the caller's authority |
| Several family members share one phone number | Match on phone, name and date of birth; never a fuzzy match |
| Name spelled in Arabic and in Latin script | Store both and confirm the spelling |
| Relative dates and times in dialect ("بعد بكرة", "بعد المغرب") | Parse them in the tenant's time zone, accounting for prayer times, and read back the absolute date and time |
| Ramadan hours; weekends that differ by country | Per-tenant calendars |
| The slot is taken during the call | Hold the slot and re-check it when booking. An available slot does not guarantee the booking will succeed (verified) [V24]. |
| Calendar sync conflicts | Use push notifications rather than polling. Google allows 10,000 requests a minute per project and 600 per user (unverified) [V32]. |
| Insurance questions | Answer only from the tenant's list of accepted insurers, without guaranteeing coverage |
| Medication, results or symptoms | Give no advice; transfer the call or leave a message for staff |
| Caller distress | Follow the emergency script and transfer |

**Integrations**

| System | Booking support | Notes | Status |
|---|---|---|---|
| Our own scheduler, modelled on FHIR | Ours | Schedule → Slot → Appointment, with 10 statuses including `noshow` and `waitlist` [V24] | model verified |
| Google Calendar | freeBusy and events | Charges are planned for usage above 1M requests a day per project [V32] | unverified |
| Microsoft 365 | Graph `getSchedule` for free/busy | Personal Microsoft accounts are not supported [V33] | unverified |
| Microsoft Bookings | Graph Bookings API | Requires Microsoft 365 Business Premium [V34] | unverified |
| Cal.com | API v2 | 120 requests a minute per key; the multi-tenant Platform has taken no new signups since 2025-12-15 [V30] | verified |
| Calendly | Scheduling API | Needs a paid plan per tenant; availability queries cover at most 31 days [V31] | unverified |
| Epic | STU3 `$find` and `$book`, with setup per health system [V25]. The public R4 sandbox has no Slot or Schedule resources [V28]. | Enterprise only | mixed |
| Oracle Health | R4 Slot search and Appointment creation. `If-Match` is required, with 409 or 412 on conflict. A booked appointment needs exactly one Slot and one accepted patient. [V26] | — | verified |
| athenahealth | FHIR R4 Appointment is read and search only, with no Slot or Schedule [V27]. Open slots come from proprietary endpoints [V25]. | — | FHIR part verified; proprietary part unverified |
| MENA platforms (Vezeeta, Okadoc, Altibbi) | No public API found. Hospital integrations are bespoke, for example Okadoc with InterSystems TrakCare [V29]. | — | unverified |

**KPIs**
- **Booking conversion.**
- **Containment:** calls resolved without staff.
- **Abandonment and hold time.**
- **No-show rate.**
- **Saves:** reschedules that would otherwise have been cancellations.
- **After-hours bookings.**
- **Verification failures:** the rate at which identity verification fails.
- **Emergency escalations.**
- **Handoff rate.**
- **Cost per booking.**

Clinic vendors market hold time, abandonment, unanswered calls and appointment volume (unverified) [V22, V23].

**Preliminary leaning (not a decision):** pilot clinic scheduling only where counsel confirms that US or EU processing is acceptable, and keep the data minimal, with no clinical content. Abu Dhabi and KSA clinics wait for a sovereign cell (§2.6, P-d).

### 5.3 A generic vertical template (proposal)

The core primitives are shared by every vertical. A vertical is then a versioned configuration pack, with no code per tenant.

| Primitive | Contents |
|---|---|
| Tenant and location | Hours, holidays, Ramadan schedule, time zone, currency with minor units, languages and dialects, enabled channels |
| Catalog | Items, variants, modifier groups (min, max, free, default, excluded), combos, half-and-half. Price, availability and stock per location, where stock is available, unavailable or unknown. Localized names plus spoken aliases. Allergens, nutrition, preparation time. |
| Resources and schedules | Providers, rooms, tables; services with durations and buffers; slots; holds |
| Transaction | Order and Booking state machines, with idempotency keys and an audit trail |
| Customer identity | Hashed E.164 number per tenant. Verification levels: L0 none, L1 caller ID, L2 OTP, L3 OTP plus date of birth or national ID. |
| Notification | Channel order per tenant, templates per language, fallbacks |
| Policy pack | Disclosure text, recording and consent rules per jurisdiction, safety rules, escalation, forbidden topics |
| Connector | One interface: `sync_catalog`, `availability`, `quote`, `submit`, `status_webhook`, `cancel` |
| KPI and evaluation pack | Metric definitions, plus scripted test calls with caller personas for each dialect |

Each pack contains schema extensions, tools with typed JSON schemas, a flow graph (states and the information each state needs), prompts per dialect, lexicons, policies, notification templates, KPIs, an evaluation suite and connectors. Packs are versioned, and tenants are migrated between versions.

```yaml
template: restaurant-ordering          # extends core@1
entities:
  catalog: {variants: true, modifier_groups: true, combos: true, half_and_half: true, allergens: true}
transactions:
  order:
    states: [draft, quoted, caller_confirmed, submitted, accepted, declined, timed_out, cancelled, fulfilled]
    submit_requires: [quote_id, caller_confirmed, payment_method, idempotency_key]
    acceptance_timeout_s: 300          # tenant setting
tools: [lookup_customer, search_menu, get_item, quote_order, submit_order, order_status, send_payment_link, transfer_to_human]
policies: {ai_disclosure: at_start, prices: tool_only, allergens: stored_only_no_guarantee, card_numbers: never_by_voice}
notifications: {order_accepted: [whatsapp_utility, sms, email]}
connectors: [native_inbox, foodics, deliverect]
kpis: [answer_rate, order_capture_rate, order_accuracy, avg_order_value, handoff_rate, acceptance_latency]
evals: [happy_path_levantine, happy_path_gulf, happy_path_egyptian, modifiers, closed_branch, allergy, prank_caller]
---
template: clinic-booking               # extends core@1
transactions:
  booking:
    states: [proposed, held, booked, arrived, fulfilled, noshow, cancelled, waitlist]   # FHIR R4 subset
    hold_ttl_s: 120
identity: {new_booking: L1, change_or_disclose: L2}
safety: {triage: forbidden, emergency_keywords: per_locale, clinical_questions: route_to_staff}
tools: [find_slots, hold_slot, book, reschedule, cancel, verify_otp, add_to_waitlist, transfer_to_human]
connectors: [native_scheduler, google_calendar, microsoft_365]
kpis: [booking_conversion, containment, abandonment, noshow_rate, reschedule_saves, after_hours_bookings]
```

---

## 6. Risks and unknowns, ranked by impact

| # | Risk | Impact | Evidence | Mitigation / next step |
|---|---|---|---|---|
| 1 | Arabic dialect quality falls short on the chosen engine | The core MENA value proposition fails | Code-switching WER of 43–62% for OpenAI, Azure and Google (verified) [A24]; Casablanca about 44–50% (corrected) [M33, M34]; a Saudi accent by default on Retell (verified) [M4] | Phase-0 evaluation; keep a cascade path; dialect profiles per tenant |
| 2 | Telecom licensing and number availability in MENA | No local numbers; risk of blocking or penalties | TDRA rules (verified) [T16]; no MENA numbers at Twilio (verified) [T10]; Egyptian numbers need local company documents (verified) [T13]; regulator texts for KSA, Egypt, Jordan and Palestine not retrieved | Forwarding, WhatsApp and the widget first; licensed partners; legal counsel |
| 3 | Health-data residency against US- or EU-only realtime processing | The clinic vertical is blocked in Abu Dhabi and KSA | [P19, P22] (verified); [O15] (verified) | Restaurants first; clinic data limited to scheduling; sovereign cell later |
| 4 | Recording calls without valid consent | Criminal exposure | [T35, T37, T38, T39] (unverified) | Recording off by default; consent capture; counsel |
| 5 | Wrong prices, orders or bookings | Refunds, churn, liability | [V19] (verified); [V20, O34] (unverified) | Prices only from tools; server-side confirmation checks; read-back; evaluations on every model release |
| 6 | Cost of Gulf telephony | Negative margins (§3.8) | [T11] (verified); [T12] (unverified) | Channel mix; pass costs through in pricing |
| 7 | Latency from MENA, with no processing in the region | Turn-taking feels unnatural; callers hang up | Round-trip 100–189 ms (corrected) [A35]; time to first audio 0.97–1.21 s (verified) [A21] | EU cell; measure from 4 cities; spoken preambles |
| 8 | Model churn and immature SDKs | Forced migrations and regressions | Deprecations (verified) [O3]; SDKs are pre-1.0 (verified) [O17] | `VoiceSession` abstraction; pinned versions; regression suite |
| 9 | Realtime costs blow up | 2–5 times the expected cost (§3.4) | Derived; verified inputs | Stable prompt prefix; maximum call length; monitor cached tokens |
| 10 | Shared rate limits and capacity | Throttling at launch | Tier limits (verified) [O14]; about 8 concurrent calls on Build (unverified) | Reach the Grow tier early; per-tenant caps; ramp gradually |
| 11 | Data leaking between tenants | Severe loss of trust and legal exposure | [K9, P13] (verified) | FORCE ROW LEVEL SECURITY; an app role that does not own tables; cross-tenant tests in CI; tenant-scoped cache keys |
| 12 | Toll fraud and abuse | Runaway spend, possibly over $100k | [P17] (verified) | Geographic permissions; one sub-account per tenant; spend caps |
| 13 | Dependence on WhatsApp | Prices change quarterly; calling in the UAE is uncertain | [T18] (verified); [M31] (unverified) | Versioned price tables; fallback channels |
| 14 | Integrations are gated or form a long tail | Vertical depth arrives slowly | Toast (verified) [V11]; Epic (mixed) [V25, V28]; Foodics partner terms unknown | Our own order inbox and scheduler as fallbacks; Foodics and Deliverect first |
| 15 | Competitive squeeze | Margins and differentiation erode | Meta's own business AI agent priced at $2 per 1M tokens (verified) [T18]; well-funded regional vendors (unverified) [M28] | Build the moat from integrations, compliance and vertical workflows |
| 16 | Callers reject AI | Lower containment | 31% say they would hang up on an AI (unverified; vendor-sponsored survey) [M35] | An instant path to a human; callbacks; disclosure; track early hang-ups |
| 17 | Gaps in this research | Decisions made on incomplete data | Search budget exhausted (see "How to read this") | Targeted follow-up research before each related build step |

---

## 7. Questions the owner must answer

| # | Question | Why it matters | Default if unanswered |
|---|---|---|---|
| 1 | Which country and dialect launch first: Jordan or Palestine (Levantine), KSA or the UAE (Gulf), or Egypt? | Sets the STT and TTS shortlist, numbers, residency, payments and legal reviews | Phase 0 covers all three; the launch decision waits for the results |
| 2 | Restaurants or clinics first? | Clinics add constraints on health data, caller identity and safety | Restaurants first, then a clinic-scheduling pilot after counsel |
| 3 | Which channels matter most to the first customers: a number, forwarding, WhatsApp or the web widget? | Cost per minute differs by 5 to 30 times, and so does regulatory exposure | Widget, WhatsApp and forwarding |
| 4 | Is OpenAI a hard requirement or a preference? May non-OpenAI speech vendors, or Gemini, be used if they win the Arabic evaluation? | Decides whether R4 and R5 are allowed | Preference: OpenAI for the LLM, and the evaluation winner for speech |
| 5 | What quality bar must Arabic meet for each dialect: WER, entity accuracy, latency, naturalness? | Sets the pass or fail criteria for Phase 0 | The owner sets it after seeing baseline results |
| 6 | What budget and consent approach for collecting dialect test calls? | Recording laws, and the quality of the dataset | Actors with written consent |
| 7 | Will we serve tenants that need in-country processing in the first year? | Puts a sovereign cell on the roadmap | No |
| 8 | Record calls by default, or keep transcripts only? | Criminal exposure against QA value | Transcripts only; recording as an opt-in per jurisdiction |
| 9 | Which pricing model and COGS target: flat per location, per minute or per outcome? | Decides the engine and channel mix | Per-location plans with included minutes; COGS of $0.05/min or less |
| 10 | Self-serve or sales-assisted onboarding for the MVP? | The scope of the onboarding UI and the support load | Self-serve, with an assisted option |
| 11 | Do tenants have staff to take live transfers, or are callbacks and messages the norm? | Affects telephony, call flows and KPIs | Both, set per tenant |
| 12 | Is prepaid ordering by payment link in scope, or only cash on delivery? | Payment-provider work and PCI scope | Cash on delivery first; payment links later |
| 13 | Which integration first: Foodics, Deliverect or our own order inbox? | The engineering plan | Our own order inbox plus Foodics |
| 14 | Which cloud and first region, and LiveKit Cloud or self-hosted? | Operations burden, cost and residency | EU-Frankfurt, self-hosted LiveKit |
| 15 | Python or TypeScript for the agent workers? | The SDK path: LiveKit's Python core or OpenAI's TypeScript SDK | Python for the workers, TypeScript for the dashboard |
| 16 | When do SOC 2 and ISO 27001 happen, and are US clinics (HIPAA) in scope? | Enterprise sales and the BAA chain | Not in the MVP |
| 17 | Are outbound calls (reminders, callbacks) in the MVP? | TCPA consent; OpenAI supports outbound only through GPT-Live or bridges; WhatsApp permission limits | No; send reminders as messages |
| 18 | WhatsApp model: Tech Provider, with tenants paying Meta, or a BSP reseller with markup? | Margin and onboarding friction | Tech Provider |
| 19 | AI disclosure wording, and a voice persona per tenant (custom voices)? | Legal (EU Art. 50) and brand experience | Standard disclosure wording; stock voices |
| 20 | Is an agency or white-label channel planned? | The tenant hierarchy in the data model | Keep an organization level above tenants |
| 21 | What team size and target date for the first pilot? | Scope, and whether to buy a managed platform (P-c) | — |

---

## 8. Sources

Date is the publication or update date where known. "n.d." means undated. All pages were accessed on 2026-10-28.

| ID | URL | Publisher | Date | Used for |
|---|---|---|---|---|
| O1 | https://developers.openai.com/api/docs/models/gpt-realtime-2.1 | OpenAI | n.d. | gpt-realtime-2.1 specs, limits, prices |
| O2 | https://developers.openai.com/api/docs/changelog | OpenAI | entries 2026-01-13 to 2026-10-20 | Release dates |
| O3 | https://developers.openai.com/api/docs/deprecations | OpenAI | entries 2026-07-20, 2026-08-26, 2026-10-01 | Shutdown dates |
| O4 | https://developers.openai.com/api/docs/pricing | OpenAI | n.d. | All OpenAI prices |
| O5 | https://developers.openai.com/api/docs/guides/voice-latency-cost?api=realtime (also ?api=live) | OpenAI | n.d. | Audio tokens, caching, truncation; GPT-Live billing |
| O6 | https://developers.openai.com/api/docs/guides/realtime-conversations | OpenAI | n.d. | 60-minute sessions; barge-in |
| O7 | https://developers.openai.com/api/docs/models/gpt-live-1 | OpenAI | n.d. (GA 2026-09-10) | GPT-Live price and concurrency |
| O8 | https://developers.openai.com/api/docs/guides/live-conversations.md ; https://developers.openai.com/api/docs/guides/live-delegation.md | OpenAI | n.d. | GPT-Live voices, delegation |
| O9 | https://developers.openai.com/api/docs/guides/custom-voices | OpenAI | n.d. | Custom voices |
| O10 | https://developers.openai.com/api/docs/guides/voice-prompting | OpenAI | n.d. | Language policy, preambles, effort, read-back |
| O12 | https://developers.openai.com/api/docs/guides/voice-sip | OpenAI | n.d. | Native SIP; outbound rules |
| O13 | https://developers.openai.com/api/reference/resources/realtime/subresources/calls/methods/accept | OpenAI | n.d. | Call-accept configuration |
| O14 | https://developers.openai.com/api/docs/guides/rate-limits | OpenAI | n.d. (tiers changed 2026-10-06) | Tiers, limits, slow_down |
| O15 | https://developers.openai.com/api/docs/guides/your-data | OpenAI | n.d. | Residency, retention, ZDR |
| O16 | https://cdn.openai.com/osa/hipaa-endpoints.pdf | OpenAI | 2026-07-09 | HIPAA endpoint list |
| O17 | https://openai.github.io/openai-agents-js/guides/voice-agents/transport/ ; https://openai.github.io/openai-agents-js/guides/voice-agents/build/ ; https://registry.npmjs.org/@openai/agents | OpenAI | v0.21.0, 2026-10-20 | TypeScript Agents SDK |
| O18 | https://openai.github.io/openai-agents-python/realtime/guide/ ; https://openai.github.io/openai-agents-python/voice/pipeline/ | OpenAI | v0.24.0, 2026-10-15 | Python Agents SDK |
| O19 | https://openai.github.io/openai-agents-python/tracing/ | OpenAI | n.d. | Tracing under ZDR |
| O20 | https://developers.openai.com/api/docs/guides/text-to-speech | OpenAI | n.d. | TTS deprecation, voices |
| O21 | https://developers.openai.com/api/docs/guides/realtime-mcp | OpenAI | n.d. | Realtime tool types, MCP |
| O22 | https://developers.openai.com/api/docs/guides/moderation | OpenAI | n.d. | No audio moderation |
| O23 | https://developers.openai.com/blog/realtime-api | OpenAI | n.d. | 16,384-token instructions-plus-tools limit |
| O24 | https://developers.openai.com/api/docs/guides/voice-webrtc | OpenAI | n.d. | WebRTC, client secrets, safety identifier |
| O25 | https://developers.openai.com/api/docs/guides/prompt-caching | OpenAI | n.d. | Text-model caching; gpt-5.6-luna cache prices |
| O26 | https://developers.openai.com/cookbook/examples/prompt_caching_201 | OpenAI | n.d. (archived) | Realtime caching behaviour |
| O27 | https://developers.openai.com/api/docs/guides/embeddings | OpenAI | n.d. | Embedding dimensions |
| O28 | https://developers.openai.com/api/docs/guides/retrieval | OpenAI | n.d. | Vector Stores, file_search |
| O29 | https://developers.openai.com/cookbook/examples/agents_sdk/context_personalization | OpenAI | n.d. | Long-term memory pattern |
| O30 | https://developers.openai.com/api/docs/guides/pdf-files | OpenAI | n.d. | File inputs |
| O31 | https://developers.openai.com/api/docs/guides/agent-builder-safety | OpenAI | n.d. | Prompt-injection mitigations |
| O32 | https://developers.openai.com/api/docs/models/gpt-audio-1.5 | OpenAI | n.d. | Non-realtime speech output |
| O34 | https://community.openai.com/t/new-realtime-models-on-the-api-gpt-realtime-2-1-and-gpt-realtime-2-1-mini/1385896 | OpenAI forum | 2026-07-06 | 2.1 launch; tool-skipping reports |
| O35 | https://community.openai.com/t/realtime-api-instruction-limit-16-384-tokens-is-too-low-for-production-voice-agents-with-tool-calling/1378932/5 | OpenAI forum | 2026-05-11 | Instructions-size test |
| O38 | https://community.openai.com/t/gpt-live-1-1-is-rolling-out-with-new-voices-and-better-accents/1406704 | OpenAI forum | 2026-10-15 | GPT-Live 1.1 |
| O39 | https://community.openai.com/t/introducing-gpt-live-1-in-the-api/1396471 | OpenAI forum | 2026 | GPT-Live interruption behaviour |
| A1 | https://livekit.com/pricing | LiveKit | n.d. | Plans; Inference prices; telephony |
| A2 | https://docs.livekit.io/deploy/admin/regions/endpoints | LiveKit | regions 2026-10-22; SIP 2026-03-13 | Regions, SIP endpoints |
| A3 | https://docs.livekit.io/deploy/admin/regions/agent-deployment.md ; https://docs.livekit.io/deploy/admin/regions/region-pinning ; https://docs.livekit.io/deploy/admin/regions/data-residency.md | LiveKit | n.d. | Agent region rules, pinning |
| A4 | https://docs.livekit.io/agents/build/turns/turn-detector/ | LiveKit | n.d. | Arabic turn detection |
| A5 | https://docs.livekit.io/agents/models/stt/ ; https://docs.livekit.io/agents/models/tts/ | LiveKit | n.d. | Arabic-capable STT and TTS; Speechmatics retirement |
| A6 | https://github.com/livekit/agents | LiveKit | n.d. | Framework features |
| A7 | https://github.com/pipecat-ai/pipecat | Daily | n.d. | Pipecat |
| A8 | https://www.daily.co/pricing/pipecat-cloud ; https://docs.pipecat.ai/pipecat-cloud/introduction | Daily | n.d. | Pipecat Cloud |
| A9 | https://github.com/pipecat-ai/smart-turn | Daily | n.d. | Smart Turn v3.2 |
| A10 | https://ai.google.dev/gemini-api/docs/pricing | Google | 2026-10-27 | Gemini prices |
| A11 | https://ai.google.dev/gemini-api/docs/live-guide | Google | 2026-09-18 | Gemini Live behaviour |
| A12 | https://docs.cloud.google.com/vertex-ai/generative-ai/docs/learn/locations | Google | 2026-10-28 | Vertex Middle East endpoints |
| A13 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions?tabs=voice-live | Microsoft | 2026-10-26 | Voice Live regions |
| A14 | https://prices.azure.com/api/retail/prices?$filter=productName eq 'Azure Speech' and armRegionName eq 'uaenorth' | Microsoft | meters 2024-02-01 to 2026-10-01 | Azure Speech prices |
| A15 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts | Microsoft | 2026-10-22 | Arabic locales and voices |
| A16 | https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live ; https://learn.microsoft.com/en-us/azure/ai-services/speech-service/voice-live-faq | Microsoft | 2026-10-26; FAQ 2026-06-05 | Voice Live; no SIP |
| A18 | https://www.ultravox.ai/pricing | Ultravox | 2026-10-09 | Ultravox |
| A19 | https://docs.x.ai/docs/pricing | xAI | n.d. | xAI prices |
| A20 | https://elevenlabs.io/docs/overview/models | ElevenLabs | n.d. | ElevenLabs models |
| A21 | https://artificialanalysis.ai/speech-to-speech | Artificial Analysis | n.d. (cites July 2026) | Speech-to-speech latency, index, cost |
| A22 | https://arxiv.org/html/2603.05413v2 | Qiu et al. | 2026-03-17 | Cascade latency |
| A24 | https://www.perle.ai/benchmark/asr/ ; https://arxiv.org/abs/2605.19069 | Perle AI | 2026-05-22 | Code-switching WER |
| A25 | https://deepgram.com/pricing | Deepgram | n.d. (Arabic launch 2026-01-28) | Deepgram Arabic claims |
| A26 | https://www.speechmatics.com/speech-to-text/arabic | Speechmatics | n.d. | Speechmatics Arabic claims |
| A27 | https://elevenlabs.io/docs/capabilities/speech-to-text | ElevenLabs | n.d. | Scribe v2 |
| A30 | https://cohere.com/blog/transcribe-arabic | Cohere | 2026-07-07 | Cohere Transcribe Arabic |
| A31 | https://github.com/kadirnar/arabic-arena | Arabic Arena | 2026-10-19/20 | Open-model telephony WER |
| A32 | https://docs.cartesia.ai/build-with-cartesia/tts-models/latest | Cartesia | 2026-08-27 | Sonic 3.6 |
| A33 | https://ai.google.dev/gemini-api/docs/speech-generation | Google | 2026-10-12 | Gemini TTS |
| A34 | https://silma.ai/blog/best-low-latency-arabic-text-to-speech-apis-for-developers-2026-benchmark | SILMA | 2026-07-29 | Arabic TTS latency and prices |
| A35 | https://learn.microsoft.com/en-us/azure/networking/azure-network-latency | Microsoft | dataset to 2026-07-30 | Round-trip times from UAE North |
| A38 | https://munsit.com/ | CNTXT | n.d. | Munsit |
| A39 | https://maqsam.com/ | Maqsam | n.d. | Maqsam claims |
| T1 | https://www.twilio.com/en-us/voice/pricing/us | Twilio | Aug 2026 | US voice prices; REFER |
| T2 | https://telnyx.com/pricing/call-control | Telnyx | 2026-09-01 | Telnyx US prices |
| T3 | https://telnyx.com/pricing/conversational-ai ; https://telnyx.com/pricing/voice-ai-agents | Telnyx | n.d. | Telnyx AI agent |
| T4 | https://livekit.com/blog/introducing-livekit-connectors | LiveKit | 2026-09-01 | WhatsApp connector |
| T5 | https://www.twilio.com/docs/global-infrastructure/edge-locations | Twilio | 2026-06-12 | Edge locations |
| T6 | https://telnyx.com/release-notes/dubai-uae-anchorsite-sip-connections | Telnyx | 2026-05-15 | Dubai anchorsite |
| T7 | https://telnyx.com/release-notes/uae-data-locality | Telnyx | 2026-07-08 | UAE storage; Dubai inference |
| T8 | https://www.twilio.com/en-us/legal/service-country-specific-terms/uae-phone-numbers | Twilio | 2021-01-01 | UAE number terms |
| T9 | https://www.twilio.com/en-us/sip-trunking/pricing/ae | Twilio | Aug 2026 | UAE SIP trunking |
| T10 | https://assets.cdn.prod.twilio.com/pricing-csv/SiteNumbersPricing.csv ; https://www.twilio.com/en-us/voice/pricing/ae (also /sa, /eg, /jo) | Twilio | accessed 2026-10-28 | Number availability; outbound rates |
| T11 | https://www.plivo.com/voice/pricing/ae/ | Plivo | n.d. | UAE numbers |
| T12 | https://www.plivo.com/voice/pricing/sa/ | Plivo | n.d. | KSA toll-free |
| T13 | https://support.telnyx.com/en/articles/5469551-international-numbers-required-documents | Telnyx | n.d. | Documents required for numbers |
| T14 | https://telnyx.com/phone-numbers/jordan | Telnyx | n.d. | Jordan numbers |
| T15 | https://www.twilio.com/en-us/guidelines/gb/regulatory | Twilio | n.d. | UK number rules |
| T16 | https://tdra.gov.ae/en/FAQs | TDRA (UAE) | n.d. (site updated 2026-10-28) | VoIP and SMS rules |
| T17 | https://www.eand.ae/en/c/mobile/add-ons/etisalat-bridge.html | e& | n.d. | UAE forwarding add-on |
| T18 | https://developers.facebook.com/docs/whatsapp/pricing | Meta | reflects 2026-10-01 | WhatsApp pricing rules |
| T19 | https://whatsappbusiness.com/products/platform-pricing/ | Meta | queried 2026-10-28 | WhatsApp rates by market |
| T21 | https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-review/ | Meta | n.d. | Template review |
| T22 | https://developers.facebook.com/docs/whatsapp/solution-providers | Meta | n.d. | Tech Provider model |
| T23 | https://www.twilio.com/en-us/whatsapp/pricing | Twilio | Sep 2026 | BSP fees |
| T24 | https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/ | Meta | latest changelog 2026-03-23 | WhatsApp Calling API |
| T25 | https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/pricing/ | Meta | n.d. | WhatsApp calling prices |
| T26 | https://www.twilio.com/en-us/sms/pricing/eg (and the other per-country SMS pricing pages) | Twilio | Oct 2026 | SMS prices |
| T27 | https://www.twilio.com/en-us/guidelines/ae/sms ; https://www.twilio.com/en-us/guidelines/sa/sms ; https://www.twilio.com/en-us/guidelines/eg/sms ; https://www.twilio.com/en-us/guidelines/jo/sms ; https://www.twilio.com/en-us/guidelines/ps/sms | Twilio | n.d. | SMS rules |
| T28 | https://aws.amazon.com/ses/pricing/ | AWS | n.d. | SES prices |
| T29 | https://postmarkapp.com/pricing | Postmark | n.d. | Postmark prices |
| T30 | https://resend.com/pricing | Resend | n.d. | Resend prices |
| T31 | https://www.twilio.com/en-us/products/email-api/pricing | Twilio SendGrid | n.d. | SendGrid prices |
| T32 | https://support.google.com/a/answer/81126 | Google | n.d. | Gmail sender rules |
| T33 | https://www.law.cornell.edu/uscode/text/18/2511 | Cornell LII | current | US recording law |
| T34 | https://www.legislation.gov.uk/uksi/2018/356/regulation/4/made | UK Government | 2018 | UK business recording |
| T35 | https://www.recordinglaw.com/world-laws/world-recording-laws/uae-recording-laws/ | RecordingLaw | 2026-03-21 | UAE recording penalties |
| T37 | https://gulfnews.com/world/gulf/saudi/in-saudi-arabia-its-now-illegal-to-snoop-on-spouse-1.2199597 | Gulf News | 2018-11-05 | KSA interception penalty |
| T38 | https://eg.andersen.com/recording-in-person-or-phone-conversations/ | Andersen Egypt | 2023-03-02 | Egypt recording law |
| T39 | https://security-legislation.ps/?p=12552 | DCAF | n.d. | Palestine cybercrime law |
| T40 | https://www.clydeco.com/en/insights/2023/10/jordan-issues-first-personal-data-protection-law | Clyde & Co | 2023-10-17 | Jordan PDPL |
| M1 | https://vapi.ai/pricing | Vapi | n.d. | Vapi prices |
| M2 | https://docs.vapi.ai/security-and-privacy/eu-region | Vapi | n.d. | Vapi regions |
| M3 | https://www.retellai.com/pricing | Retell AI | n.d. | Retell prices |
| M4 | https://community.retellai.com/t/egyptian-dialect-support/2240 ; https://docs.retellai.com/build/language-support | Retell AI | 2026-03 to 2026-05 | Arabic dialect gap |
| M5 | https://community.retellai.com/t/retell-nis2-is-full-eu-data-residency-actually-possible/2541 | Retell AI | 2026-05-01 | US-only processing |
| M6 | https://www.bland.ai/pricing | Bland | n.d. | Bland prices |
| M7 | https://elevenlabs.io/pricing/agents | ElevenLabs | n.d. | ElevenLabs Agents prices |
| M8 | https://elevenlabs.io/docs/overview/administration/data-residency | ElevenLabs | n.d. | ElevenLabs residency |
| M9 | https://synthflow.ai/pricing | Synthflow | n.d. | Synthflow prices |
| M10 | https://www.trustpilot.com/review/synthflow.ai | Trustpilot | 2025-03 to 2026-05 | Customer complaints |
| M11 | https://poly.ai/ ; https://poly.ai/pricing | PolyAI | n.d. | PolyAI |
| M12 | https://sierra.ai/product/voice ; https://sierra.ai/blog/outcome-based-pricing-for-ai-agents | Sierra | blog 2024-12-10 | Sierra |
| M13 | https://fin.ai/pricing | Intercom | n.d. | Fin pricing |
| M14 | https://www.slang.ai/pricing | Slang AI | n.d. | Slang |
| M15 | https://loman.ai/pricing | Loman | n.d. | Loman |
| M16 | https://maple.inc/pricing | Maple | n.d. | Maple prices |
| M17 | https://restauranttechnologynews.com/2025/08/via-313-pizzeria-taps-keas-voice-ai-to-handle-phone-orders-across-23-restaurant-locations/ | Restaurant Technology News | 2025-08-27 | Kea |
| M18 | https://www.arini.ai/ | Arini | n.d. | Arini |
| M19 | https://www.healthcareittoday.com/2026/07/06/assort-health-raises-120-million-series-c-telepatia-raises-33-million-series-a/ | Healthcare IT Today | 2026-07-06 | Assort Health |
| M20 | https://www.getviva.ai/dental-answering-service-cost/ ; https://www.getviva.ai/#pricing | Viva | 2026-05-18 | Benchmarks; Viva prices |
| M21 | https://heyrosie.com/pricing | Rosie | 2026-09-21 | Rosie |
| M22 | https://smith.ai/pricing/ai-receptionist | Smith.ai | n.d. | Smith.ai |
| M23 | https://www.ziwo.io/sa/product/ai-voice-agent/ ; https://www.ziwo.io/pricing/ | ZIWO | n.d. | ZIWO |
| M24 | https://www.arabnews.com/node/2589697/saudi-arabia | Arab News | 2025-02-10 | Maqsam |
| M25 | https://sarj.ai | Sarj | n.d. | Sarj |
| M26 | https://en.sharikatmubasher.com/media-hub/news/21511395/widebot-ai-unveils-groundbreaking-arabic-voice-ai-for-whatsapp-business | Mubasher | 2025-10-14 | WideBot |
| M27 | https://www.unite.ai/omniops-and-hamsa-partner-to-bring-sovereign-arabic-voice-ai-to-saudi-arabia/ | Unite.AI | 2026-07-15 | Hamsa and OmniOps |
| M28 | https://mena.entrepreneur.com/business-news/mohammad-abu-sheikhs-cntxt-ai-reaches-us300-million-in-committed-revenue-expands-to-us | Entrepreneur Middle East | 2026-10-20 | CNTXT funding |
| M29 | https://rafeeq.cloud/ | Rafeeq | n.d. | Rafeeq |
| M30 | https://talkright.net/pricing | TalkRight | n.d. | TalkRight |
| M31 | https://simology.io/blog/uae-voip-app-calling-what-works-what-doesnt-2026-traveller-guide | Simology | 2026-07-18 | WhatsApp calls in the UAE |
| M32 | https://huggingface.co/spaces/elmresearchcenter/open_universal_arabic_asr_leaderboard | Elm Research Center | 2026-10-20 | Arabic ASR leaderboard |
| M33 | https://huggingface.co/IFM/Jais-ASR | IFM | 2026-10 | Jais-ASR; commercial STT comparison |
| M34 | https://huggingface.co/datasets/UBC-NLP/Casablanca | UBC NLP | n.d. | Casablanca dialects |
| M35 | https://digital-release.kxan.com/business/press-releases/cision/20260513SF56145/ai-backlash-grows-across-us-uk-and-canada-more-customers-reject-bots-for-human-support-in-2026 | AnswerConnect (press release) | 2026-05-13 | Caller attitudes |
| M36 | https://www.forbesmiddleeast.com/lists/the-middle-easts-fintech-50/foodics/ | Forbes Middle East | 2024-04-05 | Foodics size |
| K1 | https://arxiv.org/html/2402.03216v4 | BAAI | 2024 | MIRACL results |
| K2 | https://arxiv.org/html/2506.06339v1 | Arabic RAG study | 2025-06-01 | Arabic embedders, reranking, chunking |
| K3 | https://cohere.com/blog/embed-5 | Cohere | 2026-09-30 | Embed 5; vendor Arabic table |
| K4 | https://ai.google.dev/gemini-api/docs/embeddings | Google | 2026-10-26 | Gemini Embedding 2 |
| K5 | https://docs.voyageai.com/docs/pricing | Voyage AI | 2026-09-29 | Voyage prices |
| K6 | https://huggingface.co/jinaai/jina-reranker-v3.5 | Jina AI | 2026 | Reranker licence |
| K7 | https://huggingface.co/Qwen/Qwen3-Embedding-0.6B | Qwen | n.d. | Qwen3-Embedding |
| K8 | https://huggingface.co/BAAI/bge-m3 | BAAI | n.d. | bge-m3 |
| K9 | https://github.com/pgvector/pgvector | pgvector | n.d. | Filtered HNSW, limits, multitenancy |
| K10 | https://www.postgresql.org/docs/current/textsearch-psql.html | PostgreSQL | 18.6 docs | arabic_stem |
| K13 | https://www.pinecone.io/pricing/ | Pinecone | n.d. | Pinecone prices |
| K14 | https://turbopuffer.com/pricing | turbopuffer | n.d. | turbopuffer prices and latency |
| K16 | https://www.anthropic.com/news/contextual-retrieval | Anthropic | 2024-09-19 | Retrieval failure rates |
| K18 | https://agentset.ai/rerankers | Agentset | 2026-02-15 | Reranker latency |
| K19 | https://docs.livekit.io/agents/multimodality/audio/customization/ | LiveKit | n.d. | Pre-recorded audio |
| K20 | https://docs.cartesia.ai/build-with-cartesia/capability-guides/tts-caching | Cartesia | n.d. | TTS caching |
| K21 | https://redis.io/docs/latest/develop/ai/context-engine/langcache/concepts/ | Redis | n.d. | Semantic cache limits |
| K23 | https://arxiv.org/html/2606.16707v1 ; https://arxiv.org/abs/2504.19413 | B. Li; Mem0 | 2026-06-15; 2025-04-28 | Memory benchmarks |
| K25 | https://www.getzep.com/pricing ; https://help.getzep.com/context-retention | Zep | n.d. | Zep pricing and retention |
| P1 | https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability | Microsoft | 2026-10-19 | Azure models in UAE North |
| P3 | https://docs.oracle.com/en-us/iaas/Content/generative-ai/model-endpoint-regions.htm | Oracle | n.d. | OCI Riyadh and Dubai models |
| P4 | https://livekit.com/blog/deployment-reliability-cloud | LiveKit | 2026-02-25 | Deploy draining |
| P5 | https://docs.livekit.io/deploy/custom/deployments/ | LiveKit | n.d. | Sizing, autoscaling, grace period |
| P6 | https://vapi.ai/blog/how-we-achieved-99-99-reliability-at-vapi | Vapi | 2025-08-12 | Reliability patterns |
| P7 | https://docs.retellai.com/deploy/concurrency.md | Retell AI | n.d. | Concurrency |
| P8 | https://docs.cloud.google.com/run/docs/triggering/websockets | Google | 2026-10-26 | Cloud Run WebSockets |
| P9 | https://docs.aws.amazon.com/lambda/latest/dg/configuration-timeout.html | AWS | n.d. | Lambda timeout |
| P10 | https://docs.livekit.io/agents/logic/fallback-strategies.md | LiveKit | n.d. | Fallback adapters |
| P11 | https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html | AWS | n.d. | Transactional outbox |
| P12 | https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-managed-postgresql/rls.html | AWS | n.d. | RLS guidance |
| P13 | https://www.postgresql.org/docs/current/ddl-rowsecurity.html | PostgreSQL | current | RLS bypass rules |
| P14 | https://docs.aws.amazon.com/kms/latest/developerguide/encrypt_context.html | AWS | n.d. | KMS encryption context |
| P16 | https://genai.owasp.org/llmrisk/llm062025-excessive-agency/ | OWASP | 2025 | Excessive agency |
| P17 | https://www.twilio.com/docs/voice/tutorials/voice-dialing-geographic-permissions | Twilio | 2026-07-21 | Toll fraud |
| P18 | https://www.clydeco.com/fr/insights/2021/11/uae-issues-landmark-personal-data-protection-law | Clyde & Co | 2021-11-30 | UAE PDPL |
| P19 | https://www.trade.gov/country-commercial-guides/united-arab-emirates-digital-economy | US Department of Commerce | 2024-09-20 | ADHICS 2.0 |
| P20 | https://www.trade.gov/market-intelligence/united-arab-emirates-regulations-limit-cross-border-health-data-flows | US Department of Commerce | 2024-01-22 | UAE health-data transfers |
| P21 | https://www.clydeco.com/en/insights/2023/09/saudi-arabia-issues-implementing-regulations | Clyde & Co | 2023-09-08 | Saudi PDPL |
| P22 | https://www.mayerbrown.com/en/insights/publications/2024/10/updates-to-saudi-arabias-personal-data-protection-regulations-sccs-guidelines-and-more | Mayer Brown | 2024-10-09 | Saudi transfers |
| P23 | https://gdpr-info.eu/art-28-gdpr/ | GDPR text | n.d. | Sub-processors |
| P24 | https://docs.livekit.io/reference/agents/session-traces/ | LiveKit | n.d. | OpenTelemetry spans |
| P25 | https://langfuse.com/self-hosting | Langfuse | n.d. | Self-hosting |
| P26 | https://www.coval.ai/pricing | Coval | n.d. | Coval |
| P27 | https://www.cekura.ai/pricing | Cekura | n.d. | Cekura |
| P28 | https://hamming.ai/ | Hamming | n.d. | Hamming |
| P29 | https://docs.livekit.io/testing/observability/data-residency.md | LiveKit | n.d. | Observability data residency |
| P30 | https://docs.livekit.io/deploy/admin/hipaa.md | LiveKit | n.d. | LiveKit BAA |
| V1 | https://developers.foodics.com/guides/making-orders | Foodics | n.d. | Order API |
| V2 | https://developers.foodics.com/guides/online_ordering_integrations | Foodics | n.d. | Cash on delivery, statuses, webhooks |
| V3 | https://developers.foodics.com/guides/menu-structuring | Foodics | n.d. | Menu model |
| V5 | https://developers.foodics.com/guides/call_center_integration | Foodics | n.d. | Caller lookup |
| V6 | https://www.foodics.com/ | Foodics | n.d. | Footprint |
| V7 | https://developers.deliverect.com/v3.0-ordering-experience/reference/create-channel-order.md | Deliverect | 2026-10-23 | Channel API |
| V8 | https://www.deliverect.com/integrations/jahez | Deliverect | n.d. | Jahez |
| V9 | https://integration.talabat.com/en/how-it-works/ | talabat | n.d. | Aggregator order flow |
| V10 | https://doc.toasttab.com/doc/devguide/apiCreatingOrders.html | Toast | n.d. | Order creation |
| V11 | https://doc.toasttab.com/doc/devguide/apiOverview.html | Toast | n.d. | API access tiers |
| V12 | https://developer.squareup.com/docs/orders-api/what-it-does ; https://developer.squareup.com/forums/t/28210 | Square | n.d.; forum Oct 2026 | Paid-only POS orders |
| V13 | https://developer.squareup.com/docs/checkout-api/quick-pay-checkout | Square | n.d. | Payment links |
| V14 | https://developer.squareup.com/docs/international-development | Square | n.d. | Square countries |
| V15 | https://developer.squareup.com/docs/payments-api/take-payments/external-payments | Square | n.d. | External-payment fee |
| V16 | https://stripe.com/global | Stripe | n.d. | Stripe countries |
| V17 | https://blog.pcisecuritystandards.org/industry-guidance-on-accepting-telephone-payments-securely | PCI SSC | 2018-11-27 | Phone payments |
| V18 | https://www.gov.uk/government/publications/allergen-guidance-for-food-businesses/allergen-guidance-for-food-businesses | UK FSA | 2026-07-17 | Allergen rules |
| V19 | https://www.nrn.com/quick-service/mcdonald-s-is-ending-its-ai-drive-thru-test-with-ibm | Nation's Restaurant News | 2024-06-17 | Order accuracy |
| V20 | https://www.sec.gov/enforcement-litigation/administrative-proceedings/33-11352-s | SEC | 2025-01-14 | Presto settlement |
| V21 | https://conversenow.ai/ | ConverseNow | n.d. | ConverseNow |
| V22 | https://www.assorthealth.com/ | Assort Health | n.d. | Clinic KPIs |
| V23 | https://www.hellopatient.com/ | Hello Patient | n.d. | Clinic KPIs |
| V24 | https://hl7.org/fhir/R4/appointment.html | HL7 | R4 v4.0.1 | Appointment model |
| V25 | https://nirmitee.io/blog/fhir-scheduling-api-appointment-slot-epic-oracle-athenahealth/ | Nirmitee | 2026-09-06 (updated 2026-10-19) | EHR scheduling |
| V26 | https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/op-appointment-post.html ; https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/op-appointment-id-patch.html ; https://docs.oracle.com/en/industries/health/millennium-platform-apis/mfrap/op-slot-get.html | Oracle | n.d. | Oracle Health booking |
| V27 | https://api.platform.athenahealth.com/fhir/r4/metadata | athenahealth | 2022-06-06 | FHIR capabilities |
| V28 | https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4/metadata | Epic | Aug 2026 release | FHIR capabilities |
| V29 | https://gulfbusiness.com/en/2020/tech/emirates-hospitals-group-selects-okadoc-to-digitise-call-centre-roll-out-telehealth-platform/ | Gulf Business | 2020-07-29 | Okadoc and TrakCare |
| V30 | https://cal.com/docs/api-reference/v2/introduction | Cal.com | n.d. | Cal.com API |
| V31 | https://developer.calendly.com/schedule-events-with-ai-agents | Calendly | 2025-10-16 | Calendly API |
| V32 | https://developers.google.com/workspace/calendar/api/guides/quota | Google | 2026-09-11 | Calendar quotas |
| V33 | https://learn.microsoft.com/en-us/graph/api/calendar-getschedule | Microsoft | 2026-05-19 | getSchedule |
| V34 | https://learn.microsoft.com/en-us/graph/api/resources/booking-api-overview | Microsoft | 2024-11-21 | Bookings API |
| V35 | https://www.law.cornell.edu/cfr/text/45/164.514 | Cornell LII | amended 2013 | HIPAA verification |
| V36 | https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf ; https://www.mayerbrown.com/en/insights/publications/2024/02/fcc-declares-authority-and-intent-to-regulate-ai-generated-calls-under-the-tcpa | FCC; Mayer Brown | 2024-02-08; 2024-02-27 | AI voices under the TCPA |
| V37 | https://www.law.cornell.edu/cfr/text/47/64.1200 | Cornell LII | amended 2025-08-29 | Healthcare exemption |
| V38 | https://agora.eto.tech/instrument/1552 | ETO AGORA | enacted 2024-09-28 | California AB 3030 |
| V39 | https://ai-act-service-desk.ec.europa.eu/en/ai-act/annex-3 ; https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-50 ; https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-6 ; https://artificialintelligenceact.eu/annex/3/ | European Commission; FLI | consolidated text as at 2026-07-27 | EU AI Act |
| V40 | https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai | European Commission | accessed 2026-10-28 | AI Act timeline (AI Omnibus) |
| V41 | https://www.ebi.ac.uk/europepmc/webservices/rest/article/MED/29482948?resultType=core&format=json | Dantas et al., Health Policy | 2018 | No-show rate |
| V42 | https://www.ebi.ac.uk/europepmc/webservices/rest/article/MED/24310741?resultType=core&format=json | Gurol-Urganci et al., Cochrane | 2013 | SMS reminders |