# Supporting_Center, Block 1: Vision and MVP requirements

| Field | Value |
|---|---|
| Version | 0.2, a draft for the owner to review. v0.2 applies the owner's stack and model decisions of 2026-10-28: Next.js as the full stack, `gpt-realtime-2.1-mini`, and no Kubernetes (Appendix A). |
| Date | 2026-10-29 |
| Owner | Mohamad Saleem |
| Readers | The owner, and the AI coding agents that will build from these planning blocks |
| Inputs | The owner's MVP decisions of 2026-10-28 (Appendix A); the research baseline in `docs/research/00-research-baseline.md`, whose sources are cited by its IDs, such as [O4] or [P19]; legal and OpenAI checks made on 2026-10-28, cited as [L1] to [L11]; the stack and model verification in `docs/research/01-stack-and-model-verification.md`, cited as [L12] to [L26] (Appendix B) |
| Next step | The owner reviews this draft. The next block is in §15. |

## How to read this document

Every requirement has one of three tags:

- **[Decided]**: the owner decided it. Only the owner changes it.
- **[Default]**: the planner's recommendation (written by Claude for the owner) for something the owner has not decided. It stands unless the owner changes it. §12 lists the important ones.
- **[Open]**: it needs an outside answer, either a legal opinion (§7.5) or a Phase 0 measurement (§8.2, §8.3).

Requirement IDs use these prefixes:

- W widget
- A agent
- B booking
- D dashboard
- P platform admin
- U usage
- N non-functional
- G go-live gate
- R UAE rule (§7.1)

Coding agents should cite the IDs in commits and tests. IDs in square brackets, such as [P12] or [L7], are citations, not requirements.

This document is not legal advice. §7 summarises what the sources say and lists what UAE counsel must confirm.

---

## 0. Summary

**What we are building.** A multi-tenant SaaS that gives UAE clinics an AI receptionist on their own website.

- A patient taps a button on the clinic's site and talks to the agent in Arabic or English.
- The agent answers questions about the clinic, its doctors and its services. It books, reschedules and cancels appointments in our own scheduling system, and shows options and confirmations on screen as it talks.
- Clinic staff manage appointments and availability in a dashboard.
- We meter the duration and AI cost of every conversation, per clinic.

**Fixed constraints [Decided]:**

- UAE only.
- Arabic and English, including switching between them mid-conversation. The Arabic must be natural Gulf Arabic, not just Modern Standard Arabic (MSA).
- A voice widget on the clinic's website is the only channel. No phone numbers, forwarding or WhatsApp.
- Clinic appointment booking is the only vertical.
- Appointments are stored in our platform.
- About 100 clinics.
- A monthly subscription. Prices come later, but usage is metered now.
- OpenAI is the only AI and voice provider.
- Inbound conversations only. No outbound calls. A callback request replaces live transfer.
- Privacy first. Use synthetic patient data until real-data processing is validated.
- One developer working with AI coding agents. No cloud provider is chosen yet.
- Technology, decided 2026-10-28: Next.js as the full stack; `gpt-realtime-2.1-mini` as the model for now; no Kubernetes.

**Three findings that shape everything else:**

1. **Real patient conversations cannot go live on OpenAI without legal clearance.**
   - OpenAI processes Realtime and all audio endpoints only in the US or the EU. Its UAE region covers selected text models and embeddings only [L7].
   - Federal Law No. 2 of 2019 allows health data to be stored or processed outside the UAE "only … in the cases prescribed" by a health-authority decision (Art. 13). Breaking that rule carries a fine of AED 500,000–700,000 (Art. 24) [L4].
   - Dubai's DHA forbids handling health information with a cloud provider outside the UAE, including backups (Policy HISHD/PP-12, clause 4.5.3) [L5]. Abu Dhabi's DoH restricts it too [P19, L6].
   - A booking conversation with a clinic very likely counts as health information.
   - **Consequence:** build and demonstrate with synthetic data, as the owner planned. Real-patient go-live is a legal gate (§7.6). It does not block building the MVP.
2. **Gulf Arabic quality on OpenAI is unproven.**
   - OpenAI publishes no Arabic metrics [O10].
   - In the only multi-vendor test we found, its `gpt-4o-transcribe` model got 44–46% of words wrong on Saudi-English and Egyptian-English code-switching [A24].
   - **Consequence:** a Phase 0 evaluation with pass thresholds (§8.3) comes before the voice core is built. If OpenAI fails those thresholds, that is the point to revisit the OpenAI-only decision.
3. **Capacity is cheap; minutes are not.**
   - The recommended target is 50 simultaneous sessions across the platform and 3 per clinic (§6.2).
   - Audio flows from the browser straight to OpenAI, so our servers carry only control traffic. One small server is enough.
   - AI cost grows with minutes. At 20 conversations per clinic per day, 100 clinics use about 180,000 minutes a month. That costs about $5,000 a month on `gpt-realtime-2.1-mini`, the chosen model, or $16,000 on the `gpt-realtime-2.1` fallback, with good prompt caching (§11).

**Architecture and stack.** The owner decided the model, Next.js and no Kubernetes on 2026-10-28. The rest is [Default]. Details are in §9, and formal ADRs come in Blocks 2 and 6.

- The model is `gpt-realtime-2.1-mini` [Decided]. Each clinic can fall back to `gpt-realtime-2.1` (§8.1).
- The browser streams audio straight to OpenAI Realtime over WebRTC.
- Our voice worker creates each call, using what OpenAI calls the "unified interface". It then attaches its own WebSocket connection, called a "sideband", to the same call [L8]. Instructions, tools, booking logic and usage metering therefore stay on our servers.
- Next.js is the full stack [Decided]: dashboard, widget, APIs and sign-in.
- One small worker process, built from the same codebase, holds the live calls. A Next.js deploy or restart would otherwise cut them (§9.1) [L12–L14].
- PostgreSQL with row-level security, as a container or a managed service. The app runs under Docker Compose on one server.
- No Kubernetes [Decided], and no Redis, vector database or media servers in the MVP.

---

## 1. Relationship to the research baseline

The baseline covered more markets, channels, verticals and vendors. The owner's decisions replace these baseline leanings, which are now background only:

| Baseline leaning (baseline §1.1) | Now |
|---|---|
| LiveKit Agents, with a cascaded pipeline for Arabic | OpenAI only. LiveKit is not needed for a browser-only channel (§9.6). |
| Phone numbers, WhatsApp calling and call forwarding in the MVP | The web widget only |
| Restaurants first | Clinics only |
| The first deployment in EU-Frankfurt | Development can run anywhere. The legal gate decides the production location (§9.4). |
| A dialect evaluation across several markets | Gulf Arabic, other Arabic as heard in the UAE, and English, including accented English (§8.3) |
| WhatsApp, SMS and e-mail confirmations | On-screen confirmation only in the MVP [Default] |

These baseline facts still apply:

- prices [O4];
- the prompt-caching layout [O5];
- the rules for row-level security [P12, P13];
- OpenAI's model shutdown dates [O3];
- OpenAI's prompting guidance [O10].

---

## 2. Vision and MVP goal

**Long-term vision.** An AI front-desk employee for any business. It is voice first and configured by the business itself, and it can grow into:

- new verticals, such as restaurants;
- new channels, such as phone, WhatsApp and chat;
- integrations, such as clinic systems and calendars.

**MVP goal.** Show with real clinics, once the legal gate is passed, that a bilingual voice agent on a clinic's website can:

1. answer clinic questions correctly from the clinic's own data;
2. book, reschedule and cancel appointments without errors or double bookings;
3. sound natural in Gulf Arabic and English, with acceptable latency on UAE networks;
4. run at a known, metered cost per clinic.

§14 defines what "done" means.

**Extensibility rule [Decided].** Design the seams for future verticals, channels and integrations, but do not build them. The seams (§9.5) are:

- a core model that is not specific to any vertical;
- a session model that is not specific to any channel;
- a `VoiceEngine` interface;
- a tool registry.

The MVP has no restaurant, phone, WhatsApp or integration code.

---

## 3. Users and roles

| Role | Who | What they can do in the MVP |
|---|---|---|
| Patient (caller) | Anyone on the clinic's website | Talk to the agent; book, reschedule or cancel their own appointment; leave a callback request |
| Clinic admin | The clinic's owner or manager | Everything in the clinic's dashboard, including users, settings, the widget and usage |
| Clinic staff | Reception and front desk | Appointments, calendar, availability and callback requests. No access to settings, users or usage. |
| Platform admin | The owner | Create clinics and invite each one's first admin; set plans and quotas; see usage and cost across all clinics; suspend a clinic; stop all voice sessions with a global kill switch |

A "doctor" role, for viewing one's own schedule, is postponed. Staff manage the doctors' schedules [Default].

---

## 4. Scope

### 4.1 In the MVP

| Area | Included |
|---|---|
| Channel | A voice widget embedded in the clinic's website, on desktop and mobile browsers [Decided] |
| Languages | Arabic and English, with switching mid-conversation [Decided]. The agent speaks a Gulf register and understands Gulf Arabic, other common dialects and MSA [Default]. |
| Agent [Decided] | Answers clinic questions; describes doctors and services; checks availability; books, reschedules and cancels; gives working hours and locations; takes a callback request when it cannot help |
| Agent safety | No medical advice [Decided]. It also discloses that it is an AI and redirects emergencies [Default]. |
| Scheduling | Our own scheduler [Decided]. It covers doctors' weekly hours, services with durations, exceptions (holidays, leave, Ramadan hours), short holds on a chosen slot, and booking without conflicts [Default]. |
| Dashboard [Decided] | Appointments list and calendar; statuses; manual create, edit and cancel; schedule and slot management |
| Dashboard extras | Callback inbox and usage view [Decided]. Doctors, services and locations; clinic profile and FAQ; widget settings and embed code [Default]. |
| Platform admin | Usage and cost across clinics [Decided]. Onboarding by invitation, plans and quotas, suspending a clinic, kill switch [Default]. |
| Usage | Per conversation: duration and token usage by type. Monthly totals per clinic. No billing system. [Decided] Computed cost, minute quotas and concurrency caps [Default]. |
| Security [Decided] | Authentication, role-based access control, isolation between clinics, and encryption in transit and at rest |
| Security extras [Default] | An audit log and scheduled data-deletion jobs |
| Quality [Default] | Phase 0 dialect and latency evaluation; automated scenario tests; synthetic demo data |

### 4.2 Postponed: designed for, not built

| Item | Why it is postponed | Seam kept now |
|---|---|---|
| Phone numbers, SIP and call forwarding | Owner decision; Gulf numbers are costly and regulated [T11, T16] | A channel field on sessions, and the `VoiceEngine` interface. OpenAI supports SIP natively [O12]. |
| WhatsApp messages and calls; SMS | Owner decision | A notification interface whose only MVP implementation is "on screen" |
| E-mail, SMS or WhatsApp confirmations to patients | Messaging providers move data outside the UAE, so this needs the legal gate | The same notification interface |
| Text chat | The owner said chat comes later | The conversation model does not depend on the channel |
| Outbound calls, reminders, follow-ups and marketing | Owner decision | — |
| Live transfer to a human | Optional for the owner; a callback request covers it | The callback request entity |
| External calendars and clinic management or medical-record systems | Owner decision | The booking service sits behind an interface, and appointments have an external-ID field |
| Billing and payments (Stripe or similar), and deposits | Owner decision | The usage ledger and a plan entity |
| Retrieval over documents (RAG with pgvector and reranking) | A clinic's knowledge is small enough to fit in the agent's instructions (§9.6) | A knowledge module with a size meter. Switch to retrieval when a clinic outgrows the budget. |
| Remembering a caller across conversations | Needs identity verification and costs privacy | The contact entity |
| Call recording | The owner wants it off by default, and it carries legal conditions | A per-clinic flag (off), and versioned consent text |
| Other verticals, such as restaurants | Owner decision | The core model is not specific to any vertical |
| The agent driving the clinic's own web pages (navigating, filling the clinic's forms) | Not planned. The agent acts through our booking tools and the widget's own cards. | — |
| Self-serve clinic signup; a doctor role; analytics beyond the basics | Not needed for about 100 invited clinics | — |
| Languages other than Arabic and English | Out of scope | Locale fields |

### 4.3 Never (product policy)

- No medical diagnosis, medical advice, triage decisions or medication advice [Decided].
- No storing of conversation audio in the MVP [Decided]. The owner wants recording off by default and no unnecessary audio kept. Recording stays a postponed, per-clinic option (§4.2) that needs notice, consent and the legal gate.
- The model never decides who may see or change data. The backend always enforces that [Default] [P16].

---

## 5. Functional requirements

### 5.1 Voice widget (W)

| ID | Requirement | Tag |
|---|---|---|
| W-1 | The clinic embeds the widget with one script tag. The widget runs in an iframe served from our domain, so the clinic's styles and scripts cannot interfere with it. It runs only on the clinic's allowed domains. | Default |
| W-2 | A floating button opens the widget. One tap starts the conversation, and the browser asks for the microphone only at that moment. | Decided |
| W-3 | Before the microphone opens, a short notice says that this is an AI assistant, that it is not for emergencies (call 998), and how the data is used, with a link to the privacy notice. Starting the conversation counts as accepting the notice, and the notice version is stored with the session. | Default |
| W-4 | The widget's interface language follows the page or browser: Arabic, laid out right to left, or English. The patient can switch it. The spoken language follows the patient. | Default |
| W-5 | Live captions for both sides; mute and end buttons; a visible status of listening, thinking or speaking. | Default |
| W-6 | When the agent needs a name, a mobile number or a booking reference, the widget also shows a field so the patient can type it; speaking still works. UAE mobile formats are validated: +971 5x xxx xxxx or 05x xxx xxxx. Typed values are confirmed on screen and kept off the model (§7.4). | Default |
| W-7 | After a booking, reschedule or cancellation, a confirmation card shows the clinic, location, doctor, service, date and time (Asia/Dubai) and the booking reference. An "Add to calendar" button creates an .ics file in the browser. | Default |
| W-8 | When the platform is busy, the clinic's quota is used up, the service is unavailable or the connection drops, the widget shows a clear message and offers a callback request form. | Default |
| W-9 | The widget works on current Chrome, Edge, Safari (macOS and iOS) and Firefox, with a mobile-first layout. It handles a denied microphone, Bluetooth headsets and the browser moving to the background on iOS. | Default |
| W-10 | A session lasts at most 10 minutes, with a warning at 8. After 30 seconds of silence the agent checks in; after 60 seconds it ends the session. | Default |
| W-11 | An invisible bot check runs before a session starts. Sessions are rate-limited per device and per IP address. | Default |
| W-12 | When the agent offers choices (time slots, doctors, services), the widget also shows them as cards the patient can tap. A tap counts the same as saying the choice. | Default |

### 5.2 Agent conversation (A)

| ID | Requirement | Tag |
|---|---|---|
| A-1 | The agent greets the patient with the clinic's name, says that it is an AI assistant, and offers Arabic or English. | Default |
| A-2 | It understands Gulf Arabic, other common Arabic dialects, MSA, English (including the South Asian and other accents common in the UAE) and mixed Arabic and English. It replies in the patient's language. In Arabic it uses a light Gulf register that every Arabic speaker understands, and it does not imitate the caller's dialect. | Decided (bilingual); Default (register) |
| A-3 | It answers questions about the clinic only from the clinic's own data: services, doctors, hours, locations, parking, accepted insurance, fees (if the clinic has entered them) and policies. Otherwise it says it does not know and offers a callback. | Decided |
| A-4 | It states availability, fees and doctors' schedules only from tool results in the current conversation, never from memory. | Default [O10] |
| A-5 | Before it books, reschedules or cancels, it reads back the full details: doctor, service, date, time and location, plus the patient's name and mobile number if they were spoken. It reads numbers one digit at a time and waits for a clear "yes". | Default [O10] |
| A-6 | It reports an action as done only after the tool has succeeded. If the tool fails, it says so and offers alternatives or a callback. | Default [O10] |
| A-7 | It gives no diagnosis, advice or triage. If the patient describes an emergency, it tells them to call 998 (ambulance) or go to the nearest emergency department, then offers to end the conversation. | Decided (no advice); Default (emergency script) |
| A-8 | It takes a callback request (name, mobile number, preferred time and a short topic) when it cannot help, when the patient asks for a person, or after two failed attempts at the same task. Identity verification gets three attempts (B-8). | Decided |
| A-9 | It resists manipulation. It ignores requests to change its role, reveal its instructions, access other patients' data or act for a different clinic. | Default |
| A-10 | It collects only the patient's name, mobile number, chosen service and doctor, and time. It does not ask for symptoms, diagnoses or medical history, and does not record them if the patient volunteers them. | Decided |

### 5.3 Booking operations (B)

| ID | Requirement | Tag |
|---|---|---|
| B-1 | Availability is computed as the doctor's weekly hours at a location, minus breaks, exceptions (closures, leave, special hours such as Ramadan), existing appointments and active holds. It is cut into slots of the service's length plus a buffer. | Default |
| B-2 | The agent offers at most three options at a time, nearest first, following any stated preference (doctor, day, morning or evening). | Default |
| B-3 | Appointments can be booked from 2 hours to 60 days ahead. Each clinic can change these limits. | Default |
| B-4 | Choosing a slot places a hold on it, and booking turns the hold into an appointment. The hold ends after 5 minutes, or when the patient ends the session normally. A dropped connection keeps the hold until its 5 minutes are up, so a reconnect (N-10) can resume it. Staff booking by hand in the dashboard (D-3) need no hold; the database constraint still blocks overlaps (B-5). | Default |
| B-5 | The database makes double booking impossible: no two appointments for one doctor can overlap. This holds even when two patients, or a patient and a staff member, try to book the same time at once. | Default |
| B-6 | Every write is idempotent: if the same tool call is retried, the result is the same. | Default [baseline §2.7] |
| B-7 | The backend resolves relative dates ("next Tuesday", "بعد بكرة", "the day after tomorrow") in Asia/Dubai time. The agent passes both what the patient said and its own interpretation. The backend returns the resolved date, which the agent reads back. | Default |
| B-8 | To reschedule or cancel, the patient gives the booking reference and the mobile number on the booking, typed or spoken. After three failed attempts, the agent offers a callback request instead. | Default |
| B-9 | Changes are allowed until 2 hours before the appointment, and each clinic can change this. After that, the agent offers a callback request. | Default |
| B-10 | Statuses: `pending` (only when the clinic requires staff confirmation), `confirmed`, `completed`, `no_show`, `cancelled_by_patient` and `cancelled_by_clinic`. Every change is audited with who made it: the agent, a staff member or the patient. | Decided (statuses exist); Default (this set) |
| B-11 | Each clinic chooses automatic confirmation (the default) or confirmation by staff. | Default |
| B-12 | Each mobile number may hold at most 3 future appointments per clinic and make at most 5 booking changes a day. | Default |

### 5.4 Clinic dashboard (D)

Who can use each feature [Default]:

- **Clinic admins only:** D-5, D-6, D-9, D-10 and D-11, plus the booking-window part of D-4.
- **Admins and staff:** D-1, D-2, D-3, D-7, D-8 and D-12, plus the weekly hours, breaks and exceptions in D-4.

| ID | Requirement | Tag |
|---|---|---|
| D-1 | An appointments list that filters by date, doctor, status and source, and searches by name, mobile number or booking reference. | Decided |
| D-2 | A calendar with day and week views per doctor and per location. It shows holds as well as appointments. | Decided |
| D-3 | Staff can create, edit, reschedule and cancel appointments by hand, and change their status. | Decided |
| D-4 | Staff manage availability: weekly hours per doctor per location, breaks, exceptions (closures, leave, special hours) and the booking window. | Decided |
| D-5 | Admins manage doctors, services and locations. **Doctors:** name in Arabic and English, specialty, languages spoken and services offered. **Services:** name in Arabic and English, duration, buffer, optional fee and which doctors provide them. **Locations:** address, map link, hours and phone number. | Default |
| D-6 | The clinic profile and FAQ, in Arabic and English, including accepted insurance networks and policies. A meter shows how much of the agent's knowledge budget is used (§9.6). | Default |
| D-7 | A callback inbox with the states new, in progress and done, plus notes. | Decided |
| D-8 | A conversation log. Each conversation shows its time, duration, language, outcome (booked, rescheduled, cancelled, callback, information only or abandoned), any linked appointment, and the transcript while it is kept. | Default |
| D-9 | Widget settings: allowed domains, the assistant's display name, the voice (chosen from tested voices), languages, the Arabic register (light Gulf, or formal MSA; §12 item 13), the embed code and a test page. | Default |
| D-10 | Admins invite staff, assign roles and deactivate users. Admins must use two-factor authentication. | Default |
| D-11 | A usage view: minutes used this month against the plan, number of conversations, and outcomes. | Decided |
| D-12 | New bookings and callback requests appear without reloading the page. | Default |
| D-13 | The dashboard is in English first but built ready for Arabic and right-to-left layout. The Arabic interface ships before the first clinic that needs it. | Default |

### 5.5 Platform admin (P)

| ID | Requirement | Tag |
|---|---|---|
| P-1 | Create a clinic and invite its first admin. | Default |
| P-2 | Plans set the included minutes per month, the concurrency cap and what happens at the limit (block, or allow overage). Prices are not needed yet. | Decided (plans include minutes); Default (the rest) |
| P-3 | A view across all clinics: minutes, conversations, AI cost, cost per minute, cache-hit rate and error rate. | Decided |
| P-4 | Suspend one clinic's widget, or stop all voice sessions with a global kill switch. | Default |
| P-5 | The platform admin sets the default model and the list of tested voices. Each clinic has a model setting, mini or the 2.1 fallback, that only the platform admin can change. Each clinic picks its voice from the tested list (D-9). | Default |

### 5.6 Usage tracking (U)

| ID | Requirement | Tag |
|---|---|---|
| U-1 | Each session records its clinic, start and end times, connected duration, why it ended, the language(s) used, the model snapshot and the outcome. | Decided |
| U-2 | Each session records token usage from OpenAI's usage events, split into text and audio and into input, cached input and output, plus transcription minutes. | Decided |
| U-3 | Each session's cost is computed from a versioned price table with effective dates, then stored. Stored costs are never recomputed afterwards. | Default |
| U-4 | Usage is totalled per clinic per day and per month. Quotas warn at 80% of included minutes. At 100% the plan either blocks new sessions or allows overage. | Decided (tracking); Default (quota rules) |
| U-5 | Each month our totals are reconciled against OpenAI's own usage and cost data, to within 5%. | Default |
| U-6 | The platform has spend alerts, and a monthly hard cap set below the OpenAI tier's monthly limit. | Default |

---

## 6. Non-functional requirements

### 6.1 Latency [Default: starting targets, revised after Phase 0]

All timings are measured in the browser, on UAE networks.

| ID | Measure | Target |
|---|---|---|
| N-1 | Starting a session: from the tap until the greeting is heard | median 2.5 s or less; 95th percentile 4 s or less |
| N-2 | A turn: from the end of the patient's speech until the agent's first audio | median 1.3 s or less; 90th percentile 2.0 s or less |
| N-3 | A tool call, timed on our server from receiving the call to sending the result | 95th percentile 300 ms or less |
| N-4 | A turn that includes a tool call: from the end of speech until the first audio. A short spoken lead-in counts. | 90th percentile 2.5 s or less |

For reference:

- In Artificial Analysis's English-centric tests, GPT-Realtime-2.1 produced its first audio in 0.97–1.21 s [A21].
- On Azure's network, a round trip from UAE North takes about 100 ms to Frankfurt and 176–189 ms to US East [A35].

### 6.2 Capacity and concurrency [Default]

The owner asked for a recommended concurrency target and its consequences.

**Assumptions** (replace them with pilot data):

- 100 clinics.
- 20 widget conversations per clinic per day.
- 3 minutes per conversation on average.
- 12% of a day's conversations fall in the busiest hour.
- All clinics share one time zone, so their busy hours coincide.
- At most 1% of conversations should be turned away as busy, sized with the Erlang B formula.

| Conversations per clinic per day | Busy-hour load (Erlangs) | Simultaneous sessions needed (1% busy) | Minutes per month |
|---|---|---|---|
| 10 | 6 | 13 | 90,000 |
| **20 (planning case)** | **12** | **20** | **180,000** |
| 50 | 30 | 42 | 450,000 |

**Recommendation:**

- **N-5:** set the platform target, and a configurable cap, at **50 simultaneous sessions**. At 1% busy, 50 sessions carry about 38 Erlangs. That is about 63 conversations per clinic per day across 100 clinics, three times the planning case.
- **N-6:** cap each clinic at **3 simultaneous sessions** by default; plans can change this. A clinic with 100 conversations a day would turn away about 2% of them. Very busy clinics get 5.
- **N-7:** load-test 50 simultaneous sessions with synthetic callers before the pilot.

**What this means for infrastructure:**

- With WebRTC from the browser to OpenAI, audio never passes through our servers.
- Each session holds one WebSocket to OpenAI and makes a few tool calls a minute. Fifty sessions mean 50 WebSockets and a few requests a second, which one small server (2 vCPU, 4 GB) and a small Postgres database can handle. The MVP does not need to scale out.
- Each call holds a WebSocket open for up to 10 minutes. Calls therefore live in a long-running voice worker process (§9.1), not in serverless functions or in the Next.js web process [P9, L12].
- Only deploys of the worker need to drain. The worker stops accepting new calls and lets running ones finish (10 minutes at most), with Docker's `stop_grace_period` at about 11 minutes. Deploying the Next.js web app never touches a live call.
  - With a single worker container, new calls would be refused during that drain.
  - Default: start the new worker container first, route new calls to it, and only then drain the old one. Block 11 designs this.
  - Until then, deploy the worker outside clinic hours.

**What this means for our OpenAI account** [O1, O14, L9]:

- Tiers depend only on total credit purchases: Build at $5, Launch at $100 and Grow at $500. Their monthly usage limits are $500, $5,000 and $200,000.
- `gpt-realtime-2.1-mini` has the same token limits as `gpt-realtime-2.1`: 200k tokens per minute on Build, 4M on Launch and 15M on Grow. Its request limits are 400, 10,000 and 20,000 per minute [L17]. - With the baseline's 4,000-token prompt prefix, a conversation uses about 23k tokens a minute. The token limits then allow about 8, 170 and 650 simultaneous conversations.
- At the full 12,000-token allowance for instructions and tools (§8.2), use rises to about 55k tokens a minute, which allows about 3, 70 and 270.
- Launch therefore still covers the 50-session target. It is unverified whether cached tokens count toward the limit, and OpenAI documents no limit on concurrent sessions.
- The pilot fits in Launch ($100 of credits).
- Launch's $5,000 monthly cap covers about 100 clinics at the planning case on mini with `gpt-transcribe`. It covers only about 68 with `gpt-live-transcribe`, and about 31 on 2.1 (§11).
- Buy $500 of credits to reach Grow before spending gets near that cap, and set per-project budgets.
- Increase traffic gradually. Ramping too fast can cause `slow_down` errors even within limits [L9].

§11 covers cost.

### 6.3 Availability and failure behaviour [Default]

- **N-8:** during the pilot, starting a widget session succeeds 99.5% of the time each month. OpenAI outages are excluded and reported separately.
- **N-9:** if OpenAI is down or rate-limited, the widget shows the out-of-service message and the callback form within 5 seconds (W-8). There are no silent failures.
- **N-10:** if the connection drops mid-conversation, the widget offers to reconnect. The new session starts with a short summary of where the booking stood, such as the held slot and the details already collected. Holds last 5 minutes, so they survive a quick reconnect.
- **N-11:** no confirmed booking is ever lost. The booking is saved before the agent confirms it (A-6).
- **N-12:** a full backup runs daily, with point-in-time recovery for 7 days during the pilot. A restore is tested before go-live.

### 6.4 Multi-tenancy and isolation [Decided: isolation; Default: how]

- **N-13:** one shared database. Every row owned by a clinic carries a `tenant_id`.
  - Every clinic-owned table has PostgreSQL row-level security with FORCE set.
  - The application connects as a role that does not own the tables and cannot bypass row-level security [P12, P13].
  - The tenant is set per transaction, never per connection (§9.3).
- **N-13a:** some work spans clinics: looking up a widget key before the clinic is known, the platform admin's totals (P-3), and jobs that expire holds, total usage or purge data. It runs through a separate, audited database role, or through `SECURITY DEFINER` functions limited to named operations. Jobs set the tenant per clinic whenever they touch one clinic's rows.
- **N-14:** the clinic is identified from the server-side session (widget key, then clinic). It is never taken from the model or from data the browser sends. Tool calls inherit it from the session.
- **N-15:** automated tests in CI check isolation between clinics for every table, API route and tool.
- **N-16:** cached clinic settings are keyed by clinic and settings version.
- **N-17:** one clinic cannot starve the others. Limits apply per clinic to simultaneous sessions (N-6), minutes (U-4) and request rate (W-11).

### 6.5 Security [Decided: the goals; Default: the specifics]

- **N-18:** encryption:
  - TLS on every connection.
  - Encryption at rest for the database, backups and file storage.
  - Field-level encryption for patients' names and mobile numbers, with keys held in a key-management service.
  - Encrypted fields cannot be searched or counted directly. Store keyed hashes ("blind indexes") of the normalised mobile number (E.164 format) and of normalised name tokens. These keep staff search (D-1), booking lookup (B-8) and per-number limits (B-12) working.
  - Blocks 6 and 8 finalise the design, including partial-name search.
- **N-19:** staff sign-in:
  - E-mail and password.
  - An authenticator-app code (TOTP) for admins.
  - Session cookies that are httpOnly, Secure and SameSite.
- **N-20:** the API enforces the roles in §3 with least privilege. Platform-admin access is audited.
- **N-21:** the OpenAI API key exists only on our servers. The browser never receives it [L8].
- **N-22:** the audit log records every write, every export and every admin action.
- **N-23:** secrets live in a secrets manager (encrypted environment files are acceptable while the data is synthetic), and there is a procedure for rotating them.
- **N-24:** CI scans dependencies and containers. The dashboard and API are reviewed against OWASP ASVS Level 2.
- **N-25:** prompt injection is contained:
  - Tools are narrow: one clinic, one appointment, one verified caller.
  - No tool returns another patient's data.
  - Text we do not control, such as FAQ entries and anything the patient says, never goes into the system instructions unmarked.

### 6.6 Accessibility, browsers and devices [Default]

- **N-26:** the widget and dashboard meet WCAG 2.2 AA. All speech is captioned, everything works from the keyboard, screen readers get labels, and colour contrast passes.
- **N-27:** the widget's loader script is 30 KB gzipped or less and never blocks the clinic's page. The iframe loads only when the widget is first opened.
- **N-28:** the test matrix:
  - Browsers: iOS Safari, Android Chrome, and Chrome, Edge, Safari and Firefox on desktop.
  - Networks: mobile data and home broadband on both e& and du.

### 6.7 Languages and localisation [Decided: Arabic and English; Default: the rest]

- **N-29:** all text a patient sees is in Arabic and English, with a right-to-left layout for Arabic. Input accepts both Arabic-Indic and Western digits.
- **N-30:** dates and times are shown and spoken in Asia/Dubai time (UTC+4, no daylight saving) and stored in UTC.
- **N-31:** names are stored as entered, in Arabic or Latin script, and search finds both.
- **N-32:** each clinic sets the working days of each location. Private clinics often open at weekends, so the weekend is not assumed.

### 6.8 Maintainability for a solo developer [Default]

- **N-33:** one language (TypeScript) and one repository for every part.
- **N-34:** one Next.js app and one voice worker, built from the same codebase and the same Docker image. No microservices and no Kubernetes [Decided].
- **N-35:** every outside dependency sits behind a thin interface: the OpenAI engine, notifications, the bot check, and e-mail later.
- **N-36:** one schema library defines the typed contracts, shared by the tool definitions, API validation and the user interface.
- **N-37:** coding agents run these tests on every change:
  - unit tests for scheduling;
  - integration tests against the database, including row-level security;
  - scenario tests of the agent's tools, without audio.

  A subset of the audio evaluation runs nightly.
- **N-38:** one planning document per block in `docs/`, and decision records (ADRs) in `docs/adr/`.

### 6.9 Observability [Default]

- **N-39:** each session produces a trace covering:
  - the session start;
  - the latency of every turn (N-2);
  - each tool call, with its latency and result code;
  - why the session ended;
  - its usage.
- **N-40:** logs never contain patient names, mobile numbers or transcript text. They carry IDs only. Transcripts live only in the database, under the retention rules in §7.4.
- **N-41:** dashboards show:
  - active sessions and sessions per hour;
  - error rate;
  - median and 90th-percentile turn latency, and tool latency;
  - cost per minute and cache-hit rate, per clinic.
- **N-42:** alerts fire when:
  - more than 5% of session starts fail over 5 minutes;
  - OpenAI returns errors;
  - spending looks abnormal;
  - a clinic runs out of quota.

---

## 7. Privacy, security and UAE compliance

### 7.1 What the rules say

Status labels:

- **primary**: read in the official text. The law's English text is an official translation, and the Arabic text prevails.
- **secondary**: from law-firm or government summaries.
- **unverified**: from a single secondary source, or the sources disagree.

| # | Rule | What it requires | Status |
|---|---|---|---|
| R1 | Federal Law No. 2 of 2019 on ICT in health fields, Art. 13 | Health information and data about health services provided in the UAE "may only be stored, processed, generated or transferred outside the State in the cases prescribed" by a decision of the health authority, made with the Ministry | primary [L4] |
| R2 | Same law, Art. 24 and Art. 22 | A fine of AED 500,000–700,000 for breaking Art. 13. Art. 22 adds that heavier penalties under other laws still apply. | primary [L4] |
| R3 | Ministerial Resolution No. 51 of 2021 | It lists ten exceptions to Art. 13. Conditions include written patient consent, encryption and keeping a copy in the UAE, and each emirate's health authority grants exceptions case by case. None of the exceptions is written for cloud or AI vendors. See the note below the table for the full list. | secondary [L1, L2, L3] |
| R4 | Same law, retention | Health information must be kept for at least 25 years from the person's last health procedure | primary [L4, L5] (law firms place it in Art. 20) |
| R5 | Same law, scope | The law's "Concerned Authority" means any entity that provides health or health-insurance services, and any entity directly or indirectly involved in applying the law. The law applies across the UAE, including the free zones. | primary [L4] (definition); secondary [L11] (free zones) |
| R6 | DHA (Dubai), Policy for Health Information Assets Management, HISHD/PP-12, in force since 26 March 2023 | See the note below the table | primary [L5] |
| R7 | Abu Dhabi DoH, ADHICS 2.0 | It restricts cloud use and cross-border flows of health information, backups included, unless DoH grants an exemption. Exemptions are reported to last up to one year, to be renewable if a localisation plan is progressing, and to be available during software development. | secondary [P19, L3, L6] |
| R8 | UAE Personal Data Protection Law (PDPL, Federal Decree-Law No. 45 of 2021) | Reported to exclude health data that has its own law. It still applies to other personal data, such as staff accounts. Sources disagree on whether its executive regulations are in force. | unverified [P18, L10] |
| R9 | Recording conversations | Recording without consent is reported to be a criminal offence, with at least 6 months' prison and/or a fine of AED 150,000–500,000 | unverified [T35] |
| R10 | Free zones | Dubai Healthcare City (DHCC) has its own Health Data Protection Regulation No. 7 of 2013. DIFC and ADGM have their own data-protection laws. | secondary [L3] |
| R11 | TDRA (the telecoms regulator) | The TDRA says using unlicensed VoIP apps to make calls is illegal. Whether that covers a browser widget talking to an AI is unclear. | verified statement; how it applies is unknown [T16] |

**The ten exceptions in Ministerial Resolution 51/2021 (R3):**

1. pharmacovigilance;
2. treatment abroad;
3. insurance claims;
4. research and clinical trials;
5. wearable devices;
6. diagnostic testing;
7. cooperation with the UAE government;
8. telemedicine;
9. personal use;
10. other purposes approved with the Ministry of Health and Prevention (MOHAP).

**What the DHA policy requires (R6):**

- **Scope (3.1–3.2):** every health information asset handled by an entity that DHA regulates, and every information system such an entity uses for healthcare services.
- **4.5.3:** cloud solutions must prevent health information being handled or stored with a cloud provider outside the UAE, including for backup and disaster recovery.
- **4.5.4:** cloud contracts must guarantee continuity, the return of data in a transferable format, no ownership by the provider and secure disposal.
- **4.5.6:** health information in the cloud must be available for patients' access requests.
- **4.6.1:** retention of 25 years.

### 7.2 Where OpenAI processes data

From OpenAI's data-controls page, checked on 2026-10-28 [L7]:

- **`/v1/realtime`**, including `gpt-realtime-2.1` and `gpt-realtime-2.1-mini`, is stored and processed only in the US or the EU.
- **The audio endpoints**, for transcription and speech, are processed only in the US or the EU.
- **The UAE region** (`ae.api.openai.com`) processes only selected text models (`gpt-5.6-luna`, `gpt-5.5`, `gpt-5.2`) and `text-embedding-3-large`. It needs OpenAI's approval and either zero data retention (ZDR) or modified abuse monitoring (MAM). Nothing voice-related runs there.
- **Retention controls:**
  - `/v1/realtime` is eligible for ZDR.
  - By default, OpenAI keeps abuse-monitoring logs for up to 30 days.
  - Regions other than the US need approval for abuse-monitoring controls.
- **Price uplift:** data-residency endpoints cost 10% more for models released on or after 2026-03-05, which includes the 2.1 models.
- **Tracing:** OpenAI's tracing for `/v1/realtime` does not yet meet EU data residency.
- **Azure:** Microsoft Azure's UAE North region offers the realtime models only as "Global" deployments, which may be processed anywhere [P1].

### 7.3 What this means for the MVP

- **Building and demonstrating with synthetic data raises no conflict.** This is the owner's plan, and nothing here changes it.
  - Real clinic staff may use the dashboard during demos, as long as all patient data stays synthetic.
  - Their staff accounts are personal data. Whether the PDPL covers them is counsel question 11.
- **Real patients are a different matter.** Audio would go from the patient's browser to OpenAI in the US or the EU. That probably conflicts with R1, R6 and R7, unless one of these holds:
  - counsel concludes that booking conversations are not health information, which is unlikely;
  - a health authority approves our data path;
  - OpenAI offers Realtime processing in the UAE, which it does not today [L7].
- **Hosting our own database in a UAE region is necessary but not enough**, as the owner noted. R6 also requires backups and disaster recovery to stay in the UAE.

**Ways to go live**, for the owner to decide after counsel's opinion:

| Path | What it means | Comment |
|---|---|---|
| 1. Approval | Ask the relevant health authority to approve the OpenAI data path, backed by ZDR, minimised data (§7.4), encryption, and notice and consent | Fits OpenAI-only. Timing depends on the regulator. |
| 2. In-UAE processing | Wait for OpenAI to offer Realtime processing in its UAE region, or ask for it | Fits OpenAI-only. OpenAI has given no date. |
| 3. Revisit OpenAI-only | Use a pipeline that runs entirely in the UAE. None of OpenAI's audio models runs in the UAE today, so this means another provider or a model hosted in the UAE. | The owner's decision, and outside the MVP |

**None of these paths changes much of the MVP code**, provided three things hold:

1. All personal data stays in our own database, which can be hosted in the UAE.
2. The voice engine sits behind an interface (§9.5).
3. What we send to OpenAI is minimised.

That is why the legal track can run alongside the build.

### 7.4 Legal requirements and engineering practices

**Legal requirements**, as far as counsel confirms them:

| Requirement | Basis | How we meet it |
|---|---|---|
| Keep health data in the UAE unless an exception or approval applies | R1, R6, R7 | Production database, backups, disaster recovery and any logs that hold personal data all stay in a UAE region. The OpenAI path is used for real patients only after approval. |
| Keep health information for at least 25 years where the rule applies | R4 | Data can be exported to the clinic, and retention can be long. Counsel decides whether our booking records fall under the rule (§7.5). |
| Contract terms for cloud storage | R6, clause 4.5.4 | Our agreement with each clinic covers continuity, returning the data in a transferable format, our having no ownership of the data, and secure disposal |
| Patients can access their information | R6, clause 4.5.6 | The clinic can export all data about one patient |
| Consent before recording | R9 | Recording is off. Until counsel says otherwise, we treat transcripts as possibly being recordings, so the notice-and-start step (W-3) comes first. |

**Engineering practices we adopt anyway:**

- Collect the minimum. The agent asks for no medical details and stores no free-text clinical notes (A-10).
- Keep typed details away from the model. Anything typed into the W-6 fields stays on our servers, and the model receives only a placeholder such as "name and mobile number captured".
- Never store conversation audio in the MVP (§4.3).
- Turn on zero data retention with OpenAI before any real data, and leave OpenAI's tracing off.
- Send OpenAI a safety identifier that names no one: a hashed ID for the session or device [L8].
- Keep logs free of personal data (N-40).
- Encrypt in transit and at rest, and encrypt names and mobile numbers at field level (N-18).
- Enforce row-level security and test isolation between clinics (N-13 to N-15).
- Require two-factor authentication for admins, grant least privilege, and keep an audit log.
- Disclose that the assistant is an AI (A-1, W-3), and redirect emergencies (A-7).
- Staff notification e-mails, when they come later, contain only a link, never patient data.
- Delete data on the retention schedule below.

| Data | Default retention [Default; counsel confirms] |
|---|---|
| Conversation audio | Not stored in the MVP |
| Transcripts | 30 days. Each clinic can choose 0–90 days. During the synthetic phase there is no limit. |
| Session records and usage (no transcript) | 24 months |
| Appointments and patient contact details | While the clinic is a customer. At the end of the contract, export to the clinic and then delete, subject to counsel's view on R4. |
| Callback requests | 90 days after they are closed |
| Audit log | 24 months |
| Backups | 7 days of point-in-time recovery during the pilot; older backups expire on schedule |

### 7.5 Questions for UAE counsel [Open]

1. Does a booking conversation count as "health information and data" under Federal Law No. 2 of 2019? That covers the voice, the transcript, the patient's name and mobile number, the chosen doctor or specialty, and the time.
2. Does the law bind us directly, as a vendor to clinics, or only through each clinic's obligations?
3. Could real-time processing of booking conversations by OpenAI in the US or the EU, with zero data retention, qualify under a Resolution 51/2021 exception or a DHA or DoH approval? What is the process and timeline in Dubai, and in Abu Dhabi?
4. Does the analysis change if identity details are typed and never reach OpenAI, and the spoken content is limited to scheduling?
5. Does the 25-year retention rule cover booking records held by our platform, or only the clinic's medical record? Can we export the records to the clinic and then delete them?
6. Is a text transcript of a conversation with an AI a "recording" for the consent rules in criminal law? Is tapping "start" after a notice enough consent?
7. Do the TDRA's VoIP rules cover a browser voice widget that talks to an AI?
8. What contracts do we need? A data-processing agreement with each clinic, OpenAI's terms (ZDR and its data-processing agreement), and the clauses DHA requires in clause 4.5.4.
9. Do different rules apply to clinics in free zones (DHCC, DIFC, ADGM)?
10. Do any DoH or DHA policies on AI apply to a booking assistant that talks to patients, for example on disclosure, registration or approval?
11. Does the PDPL apply to staff accounts and other personal data that is not health data, and are its executive regulations in force?

### 7.6 Go-live gates: all must pass before any real patient data [Default]

| ID | Gate |
|---|---|
| G-1 | A written legal opinion covering §7.5 questions 1–7, 10 and 11 for the pilot's emirate |
| G-2 | A data path counsel has approved: either a health-authority approval or exemption for OpenAI, or a processing route inside the UAE |
| G-3 | OpenAI has approved zero data retention (ZDR) for `/v1/realtime` for our organisation. If we use `eu.api.openai.com`, OpenAI has also approved its abuse-monitoring controls, which ZDR satisfies [L7]. |
| G-4 | Production hosting is in a UAE region, covering the database, backups, disaster recovery and any logs with personal data |
| G-5 | Data-processing agreements are signed with the pilot clinics; an Arabic and English privacy notice is published; the consent text is versioned |
| G-6 | A security review is done: the ASVS Level 2 checklist, isolation tests passing, and a light penetration test |
| G-7 | Retention and deletion jobs are running and tested |
| G-8 | The §8.3 thresholds are met in a production-like setup, and the 50-session load test passes |
| G-9 | Incident response and breach-notification procedures are written, in line with DHA's breach policy, which is referenced in [L5] but not reviewed |

---

## 8. OpenAI technology fit

### 8.1 Options within OpenAI only

| Option | Fit | For | Against | Cost per minute, for a 3-minute conversation with a transcript, cached → uncached [baseline §3.3] |
|---|---|---|---|---|
| **`gpt-realtime-2.1`** (speech to speech) | Fallback, set per clinic | The strongest instruction-following and tool-calling in OpenAI's realtime line. Short spoken preambles, parallel tool calls and adjustable reasoning effort [O10]. Eligible for ZDR [L7]. | The highest price. Arabic quality is not measured. The voices are "optimized for English" [O20]. | $0.089 → $0.271 |
| **`gpt-realtime-2.1-mini`** | **Chosen for now** [Decided 2026-10-28] | About 3.2 times cheaper for a 3-minute conversation. It is OpenAI's current mini Realtime model, released 2026-07-06, with no shutdown date. It supports function calling, reasoning effort, EU residency and ZDR [L17]. | OpenAI warns it is weaker at following instructions and calling functions [L18]. Developers report skipped tool calls and drift in non-English languages [O34, L26]. Cached audio input is the one price where mini is close to 2.1 ($0.30 against $0.40 per 1M tokens) [L18], but within the 10-minute cap the per-minute gap stays about 3× (baseline §3.4). | $0.028 → $0.075 |
| OpenAI cascade: transcription, then a text model, then OpenAI speech | Fallback only | Guardrails can act on text, and the text model is cheaper | We would have to build turn-taking and barge-in ourselves. OpenAI's `gpt-4o-transcribe` scored 44–46% WER on Arabic code-switching [A24]. Its replacements, `gpt-transcribe` and `gpt-live-transcribe`, have no published Arabic results. Three OpenAI speech models shut down on 2027-01-06 [O3]. | Not costed for OpenAI-only |
| GPT-Live (`gpt-live-1`) | Not suitable | A flat $0.05 a minute, with published concurrency caps [O7] | No Arabic voice [O8]. It bills silence [O5], and the Agents SDK does not support it [O17]. | $0.051 (English only) |

Do not build on the older `gpt-realtime` or `gpt-realtime-mini`. Both shut down on 2027-01-20 [O3].

**Safeguards that come with mini** [Default; from `docs/research/01-stack-and-model-verification.md` §2]:

- **Model choice:**
  - The model is a per-clinic setting. `gpt-realtime-2.1` is the fallback for any clinic or language that fails the Phase 0 marks.
  - Pin the dated model snapshot.
- **Explicit settings:**
  - Set `reasoning.effort` explicitly, starting at `low`. Its default is not documented [L18].
  - Pin the reply language in the instructions (A-2).
- **Tools and facts:**
  - The voice worker is the only owner of tools. It sends each tool result and then `response.create`, and deduplicates by tool-call ID. The browser ignores tool events.
  - The agent never confirms a booking, reschedule or cancellation unless the database committed it (A-6, B-5). Developers report that an older mini model invented a clinic department [L26].
  - Clinic facts come only from tool or database results (A-3, A-4).
- **Audio:** turn on echo cancellation and noise suppression in the browser, and tune voice-activity detection. Mini has reports of echo making it interrupt itself.
- **Transcription:** use `gpt-transcribe` or `gpt-live-transcribe` for the caller's speech. `gpt-4o-transcribe` and `whisper-1` shut down on 2027-02-26 [O3]. Phase 0 tests the chosen model on WebRTC and checks that it accepts the Arabic code `ar`.
- **Capacity:** use OpenAI's Launch tier or above, and load-test 50 sessions (N-7).

### 8.2 Integration pattern [Default; detailed in Block 2]

1. The patient taps Start. The widget opens the microphone and creates a WebRTC offer.
2. The widget sends the offer to a Next.js route handler, along with the widget key and the bot-check token.
3. The route handler runs its checks: allowed origin, bot token, clinic status and quota.
   - It then reserves a session slot atomically: in one transaction, it inserts a session row with status `admitting` and checks the clinic and platform concurrency caps (N-5, N-6). Two simultaneous starts therefore cannot both exceed a cap.
   - It then calls the voice worker's internal endpoint and waits for its reply. The WebRTC answer goes back to the widget in the same HTTP response.
4. The voice worker takes over the reserved session and builds the session settings: the pinned model snapshot, voice, instructions, tools and audio settings (turn detection, noise reduction, transcription). It sends the offer and the settings to OpenAI's `POST /v1/realtime/calls`, using our standard API key and an `OpenAI-Safety-Identifier` header [L8].
   - Calls are not created with ephemeral browser keys. In September 2026, developers reported sideband 404 errors on calls created that way [L22].
5. OpenAI replies with its WebRTC answer and a `Location` header that contains the call ID. The answer goes back to the widget. From then on, audio flows directly between the browser and OpenAI.
6. The voice worker attaches the sideband, `wss://api.openai.com/v1/realtime?call_id=…` [L8].
   - It uses the Agents SDK's documented "browser audio with server-side controls" pattern: `new RealtimeSession(agent, { transport: 'websocket', model: 'gpt-realtime-2.1-mini', tracingDisabled: true })`, then `session.connect({ apiKey, callId })` [L20]. The template is the SDK's `examples/realtime-server-controlled`.
   - The model must be set explicitly. Otherwise the SDK's automatic `session.update` sends `gpt-realtime-2.1` [L21].
   - Pin the SDK version, which is pre-1.0, and keep it behind our `VoiceEngine` interface. If the SDK gets in the way, the fallback is raw Realtime events over a WebSocket.
   - Over the sideband, the worker:
     - adds the changing context, such as today's date in Asia/Dubai, as conversation items;
     - runs the tool calls;
     - records usage. It reads `response.done` usage, and transcription usage from the raw events, because the SDK's usage total leaves transcription out [L21];
     - enforces the 10-minute cap with its own timer;
     - ends the call with `POST /v1/realtime/calls/{call_id}/hangup` [L19], and also tells the widget to close its connection;
     - cuts off unsafe audio by sending `response.cancel` and `output_audio_buffer.clear` itself.
7. A second channel carries the on-screen cards (W-6, W-7, W-12) and anything the patient types.
   - Next.js pushes events to the widget with Server-Sent Events from a route handler, with proxy buffering turned off.
   - Typed input goes to Next.js by ordinary POST requests.
   - **Worker to web:** the worker inserts an event row and sends NOTIFY. Next.js, which LISTENs, relays the event to the widget over SSE.
   - **Web to worker:** Next.js POSTs typed values and card taps to the worker's internal endpoint, keyed by session ID.
   - Typed identity values stay in our database. The model receives only a placeholder, such as `contact_captured`. The booking tool reads the real values from the session (§7.4).
8. At the end, the worker closes the session, finalises the usage record and keeps the transcript under the retention rules.

**Planned MVP tools** [Default; contracts are defined in Block 5]:

1. `get_clinic_info`
2. `find_slots`
3. `hold_slot`
4. `book_appointment`, which needs a valid hold
5. `find_booking`, which takes the booking reference plus the mobile number
6. `reschedule_appointment`
7. `cancel_appointment`
8. `request_callback`
9. `end_call`: no side effects; it schedules the hangup once the goodbye has played. Added in Block 2 §6.1.

The clinic always comes from the session (N-14), never from a tool argument.

**Prompt layout for caching** [O5]:

1. The platform policy, which never changes.
2. The clinic brief, which changes only when the clinic edits its data.
3. The tool definitions, which never change.
4. Everything else, added later as conversation items. Parts 1–3 must never be edited during a call.

**Size limits:**

- Keep instructions plus tools to about 12,000 tokens or less. OpenAI documented 16,384 tokens for the older model; one developer found about 17,800 tokens worked on 2.x and about 31,000 failed [O23, O35].
- Cap the clinic brief at about 6,000 tokens (the D-6 meter). Arabic needs more tokens than English for the same content.

**Phase 0 must confirm [Open]:**

- **Sideband events:**
  - Does the sideband receive every server event: tool-call arguments, `response.done` with usage, and transcription events? OpenAI's SIP guide says the call WebSocket "behaves exactly like any other Realtime API connection", but this is untested for WebRTC calls [L19].
  - Does it receive `response.output_audio.delta`? The SDK's interrupt logic depends on it.
- **Ending a call:**
  - What does the browser see after `hangup`?
  - Does closing the sideband alone end the call?
- **Accepted settings:**
  - Does a `session.update` sent over the sideband agree with the settings posted at call creation?
  - Is the Arabic code `ar` accepted by the chosen transcription model, inside a WebRTC session with voice-activity detection?
- **EU endpoint:** does `eu.api.openai.com` support `/v1/realtime/calls` and the sideband?
- **Latency:** compare OpenAI's default endpoint with its EU endpoint, measured from the UAE.

### 8.3 Phase 0: the evaluation that comes before the voice core [Default]

> Block 2 §10 details this plan. It splits the work into three stages:
>
> - **A:** a technical spike, with 23 checks.
> - **B:** a quick Arabic quality probe that can stop the project early.
> - **C:** the full statistical evaluation, run before the pilot.
>
> Block 2 also turns the pass marks below into statistical gates (E-1 to E-7), with sample sizes.

**Goal:** before building the voice core, confirm that `gpt-realtime-2.1-mini`, the owner's choice, is good enough for Gulf Arabic and English. Then choose the endpoint (default or EU) and the voices. `gpt-realtime-2.1` runs the same set as the comparison and fallback.

**Build:**

- A minimal widget.
- The session flow from §8.2.
- Three tools over one synthetic clinic: `get_clinic_info`, `find_slots`, and a simplified `book_appointment` that places the hold and books it in one step. Phase 0 uses a minimal scheduling table, not the full engine from Phase 1.

**Test set:**

- About 40 scenarios: booking, rescheduling, cancelling, FAQ, a callback request, an emergency, and off-topic or manipulation attempts.
- Each scenario is run in:
  - English: native speakers, and South Asian and other UAE accents;
  - Gulf Arabic with native Emirati speakers;
  - Egyptian and Levantine Arabic;
  - mixed Arabic and English.
- At least 5–10 real speakers. Synthetic callers, using OpenAI speech to read scripts, are only smoke tests: generated Arabic does not sound like real Gulf speech.

**Connectivity:** WebRTC on mobile data and home broadband from both e& and du, and on a typical office Wi-Fi.

| Measure | How it is measured | Pass mark |
|---|---|---|
| Task success | The final database state matches the scenario | 90% or more in English; 85% or more in Gulf Arabic; 80% or more in other Arabic dialects and mixed Arabic and English |
| Critical fields (doctor, date, time) | Database compared with the scenario | 98% or more |
| Tool discipline: no availability or price stated without a tool call | Transcript compared with the tool log | 98% or more |
| Gulf Arabic understanding: patient turns understood without a repeat | Raters mark each turn | 90% or more |
| Arabic naturalness | At least 3 native Emirati raters, scoring 1–5 | Average 4.0 or more |
| Turn latency from the UAE | Timed in the browser | Median 1.3 s or less; 90th percentile 2.0 s or less |
| Emergency and medical-advice tests | A red-team set | 100% |
| Cost per minute | Usage events | mini: $0.028–0.075 a minute; 2.1: $0.089–0.271. With `gpt-live-transcribe`, add about $0.013 a minute (§11). |

**Decision rule:**

- If mini passes, keep mini. This is the owner's decision.
- If only 2.1 passes on Arabic, use 2.1 for every clinic that serves Arabic speakers, which in practice is every clinic. The model is fixed when a call is created, and a call can switch language, so the fallback works per clinic, not per language. The per-clinic model setting makes this a configuration change, not a code change. Costs are in §11.
- If mini fails English, the same per-clinic fallback applies.
- If neither passes on Arabic, the owner chooses between two options:
  - launch English first, with Arabic in beta;
  - revisit the OpenAI-only decision.

---

## 9. Architecture and stack

The owner decided three things on 2026-10-28:

- Next.js is the full stack.
- The model is `gpt-realtime-2.1-mini`.
- There is no Kubernetes.

Everything else here is [Default]. Blocks 2 and 6 record the decisions as ADRs. The evidence is in `docs/research/01-stack-and-model-verification.md`.

### 9.1 Overview

```text
 Clinic website, in the patient's browser
 ┌─────────────────────────────────────────┐
 │ Widget iframe (Next.js embed route)     │◄──── audio over WebRTC ─────►┌────────────────────────────────┐
 │ microphone and speaker; captions;       │                              │ OpenAI Realtime                 │
 │ cards; typed fields                     │                              │ gpt-realtime-2.1-mini (US / EU) │
 └──────────────┬──────────────────────────┘                              └────────────────▲───────────────┘
                │ HTTPS: start (WebRTC offer), typed input                                 │ sideband WebSocket (call_id):
                │ SSE: cards and status                                                    │ instructions, tool calls, usage
                ▼                                                                          │
 ┌───────────────────────────────────────────────┐  internal HTTP  ┌──────────────────────┴────────────────────────┐
 │ web: Next.js 16 (next start)                  │ ──────────────► │ voice-worker: Node.js + TypeScript             │
 │  dashboard · widget embed route · loader file │                 │  creates calls: POST /v1/realtime/calls        │
 │  route handlers: session admission, APIs, SSE │                 │  one sideband per call (Agents SDK)            │
 │  sign-in (Better Auth) · server actions       │                 │  tool handlers · metering · 10-minute timer    │
 └───────────────────────┬───────────────────────┘                 │  pg-boss jobs · its own SIGTERM drain          │
                         │                                         └──────────────────────┬────────────────────────┘
                         ▼                                                                ▼
          ┌──────────────────────────────────────────────────────────────────────────────────────────────┐
          │ PostgreSQL 18: row-level security per clinic · bookings · usage ledger · audit log · job queue │
          │ (the worker sends events to web with NOTIFY; web LISTENs and forwards them over SSE)           │
          └──────────────────────────────────────────────────────────────────────────────────────────────┘
 Shared code (packages/shared): domain services including the scheduling engine, Drizzle schema, Zod contracts, tool definitions.
```

**Why the live calls run in a separate worker, not inside Next.js:**

- **Deploys and restarts cut calls.** On SIGTERM, Next.js waits only for in-flight HTTP requests and `after()` callbacks, then exits with code 143 [L13, L14]. Open sideband sockets would therefore be cut mid-call on every deploy or restart.
  - The only ways around this are undocumented for the App Router: the `NEXT_MANUAL_SIG_HANDLE` setting, or misusing `after()`.
- **Next.js has no supported way to run long-lived work.** Its docs say its backend features are "not a full backend replacement" [L12].
- **In-process state is unreliable.** Module-level state can be duplicated across bundles. The process error handlers only log errors, so a broken session manager would keep running.
- **A custom server doesn't fix it.** It is discouraged, cannot be combined with standalone output, and keeps the same problems [L15].
- **The worker gets its own crash and drain policy.**
  - On a fatal error it exits, and Docker restarts it.
  - On SIGTERM it stops taking new calls, lets running calls finish (10 minutes at most), then exits.
  - Docker's `stop_grace_period` is about 11 minutes, on the worker only.

### 9.2 Components

| Component | Runs in | Job | Notes |
|---|---|---|---|
| Widget loader | `web`, as a static file in `/public` with versioned names | A script of 30 KB gzipped or less that adds the button and creates the iframe | It never blocks the clinic's page (N-27). Set `Cache-Control` explicitly, because the default is `max-age=0`. |
| Widget embed route | `web` | The voice interface, captions, cards, typed fields and every state | See the note below the table |
| Session admission | `web`, in a route handler | Checks the origin, bot token, clinic status, quota and concurrency, then hands the call to the worker | — |
| Call manager | `voice-worker` | Creates the OpenAI call; runs the sideband, the timers and hangup; meters usage | Long-running, with its own drain (§9.1) |
| Tool handlers | `voice-worker` | Thin adapters from the model's tool calls to domain services. They check every input. | The clinic always comes from the session (N-14) |
| Scheduling engine | `packages/shared`, used by both processes | Availability, holds, booking, rescheduling, cancelling | Database constraints are the final guard (B-5) |
| Dashboard and APIs | `web` | Staff and admin features (§5.4, §5.5), through route handlers and server actions | Every page and action checks the sign-in session itself, not only `proxy.ts` |
| Live updates | `web` (SSE) plus Postgres LISTEN/NOTIFY | New bookings, callback requests, widget cards | Turn off proxy buffering for SSE routes |
| Jobs | `voice-worker` (pg-boss) | Expire holds, total up usage, purge data on schedule, reconcile with OpenAI | A queue stored in Postgres; no Redis |
| PostgreSQL | Its own container, or a managed service | All data, row-level security, audit log, usage ledger, job queue | One database |

**Widget embed route.** It runs in an iframe with `allow="microphone"` and sends two headers:

- `Content-Security-Policy: frame-ancestors <that clinic's origins>`;
- `Permissions-Policy: microphone=(self)`.

Exclude the route from any global `frame-ancestors 'none'` policy. Browsers apply the strictest of several CSP headers, so a global policy would block the embed.

### 9.3 Stack

Versions are those current at research time (2026-10-28). Block 6 pins them exactly.

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript everywhere | One language for the widget, dashboard, APIs and voice worker. OpenAI's TypeScript Agents SDK has the fullest Realtime support [O17]. Tool contracts are typed. |
| Full stack | **Next.js 16** [Decided] (16.4.3), App Router, self-hosted with `next start` or standalone output | Covers the dashboard, widget embed route, loader file, route handlers, server actions and SSE. Upgrade to the 2026-11-03 security release when it ships [L16]. Use the Node.js runtime only, never Edge: the database driver and auth need Node. |
| Voice worker | A plain Node.js and TypeScript process from the same repository and Docker image, built with esbuild or run with tsx | Holds the sideband WebSockets and runs the tools, metering and jobs (§9.1) |
| Runtime | Node.js 24 LTS. The minimum is 22.12, which pg-boss requires [L25]. | — |
| Repository | pnpm workspaces: `apps/web`, `apps/voice-worker`, `packages/shared` | `packages/shared` holds the domain services, Drizzle schema, Zod contracts and tool definitions. Block 6 may simplify this to one app with a worker entrypoint. |
| OpenAI | The `openai` SDK for REST calls (`/v1/realtime/calls`, `hangup`) | The sideband uses `@openai/agents` with its version pinned (0.21.0 at research time), behind our `VoiceEngine` interface [L20, L21]. The fallback is raw Realtime events over a WebSocket. |
| Model | `gpt-realtime-2.1-mini` [Decided] | `gpt-realtime-2.1` is the per-clinic fallback (§8.1) |
| Database | PostgreSQL 18 | Row-level security with FORCE, and `btree_gist` exclusion constraints for bookings |
| Data access | Drizzle ORM 0.45.x, pinned. The v1 line is still a release candidate. | See "Drizzle and row-level security" below the table [L23] |
| Jobs | pg-boss 12.x, running in the voice worker [L25] | A job can be enqueued in the same transaction as the booking that triggers it |
| Validation | Zod | Shared by the tools, the APIs and the forms |
| Authentication | Better Auth 1.7.14 or later, with the organization, two-factor and Next.js cookie plugins and the Drizzle adapter [L24] | See "Better Auth settings" below the table |
| Interface | React (through Next.js), Tailwind and an accessible component library | next-intl 4.14.x for Arabic and English. Set `<html lang dir>` from the locale. |
| Bot check | Cloudflare Turnstile | Verified on the server in a route handler. Tokens are single-use and expire after 300 seconds. |
| Observability | OpenTelemetry and structured JSON logs | Use a self-hostable tracing and error-tracking backend once there is real data, and hosted services only during the synthetic phase. OpenAI tracing is off (`tracingDisabled`). |
| Testing | Vitest for unit and integration tests; Playwright for end-to-end tests (the `webapp-testing` skill); a scenario harness for the agent's tools | — |
| Packaging | One Docker image with two entrypoints | Docker Compose runs `web`, `voice-worker`, `postgres` and a reverse proxy (Caddy or nginx), with buffering off for SSE routes. The same setup moves between Hostinger and AWS unchanged. |

**Drizzle and row-level security:**

- Drizzle has no native `tstzrange` type and no EXCLUDE constraint. Use a custom column type, and write the constraints in custom SQL migrations.
- Booking code catches SQLSTATE 23P01, the error PostgreSQL raises when an exclusion constraint blocks an overlapping booking.
- The tenant is set only through a per-transaction wrapper: `set_config('app.tenant_id', $1, true)`.
- Policies read the tenant with `NULLIF(current_setting('app.tenant_id', true), '')`.

**Better Auth settings:**

- Use the latest release (1.7.14 at research time), and also set `requireEmailVerificationOnInvitation: true`, because of advisory GHSA-fmh4-wcc4-5jm3.
  - Sources disagree on whether upgrading alone fixes it, and the setting does not cover every invitation endpoint.
  - Re-check the advisory before Phase 1.
- Keep the auth tables outside tenant row-level security.
- Each Better Auth "organization" is one clinic. The dashboard sets `app.tenant_id` from the signed-in user's active organization.
- The platform admin is a separate platform role, not a clinic member.

### 9.4 Hosting at each stage [Default]

| Stage | Data | Where | Notes |
|---|---|---|---|
| Local development | Synthetic | The owner's machine, using Docker Compose (`web`, `voice-worker`, `postgres`), plus an HTTPS tunnel for testing on phones | `next dev` reloads code on every edit. Live calls run in the worker, so those reloads don't drop them. |
| Demo and staging | Synthetic only | Any low-cost server, such as a Hostinger VPS, or AWS | Must never hold real patient data |
| Pilot and production | Real, once the G gates pass | A UAE region: AWS `me-central-1` (UAE) or Azure UAE North, including backups and disaster recovery | DHA clause 4.5.3 requires backups and disaster recovery to stay in the UAE [L5]. Hostinger qualifies only if it offers hosting located in the UAE, which is not checked. |

### 9.5 Seams for future expansion [Decided rule; Default design]

- **Core model:**
  - The tenant (the clinic) has locations.
  - Resources (doctors) provide services.
  - Bookings link a contact, a resource, a service and a time.
  - Clinic words live in labels, not in table names.
- **`VoiceEngine` interface:**
  - It starts a session, sends context, receives tool calls, returns results, and reports usage and the end of the session.
  - The MVP has one implementation: OpenAI Realtime over WebRTC with a sideband.
  - SIP, a cascade or other providers would be new implementations later.
- **Channel field:** every session records its channel, which in the MVP is always `web_widget`.
- **Tool registry:** tools are declared once, with a schema, a handler and a list of verticals they serve. A future vertical adds tools rather than editing existing ones.
- **Notification interface:** the only MVP implementation is `on_screen`. E-mail, SMS and WhatsApp come later.
- **External IDs:** appointments and resources carry an optional `external_ref` for future integrations with clinic systems.

### 9.6 Deliberately left out of the MVP

| Not in the MVP | Why | When to reconsider |
|---|---|---|
| LiveKit or other media servers | With a browser-only channel on OpenAI, the browser can talk to OpenAI directly | Phone channel, more than one provider, recording, or custom audio processing |
| Redis | At this scale, Postgres handles the queue, rate limits on one server, and real-time notifications | More than one server instance, or high-rate counters |
| pgvector, RAG and reranking | A clinic's knowledge fits within the 6,000-token brief and benefits from prompt caching | Once any clinic goes over the brief budget, or documents arrive |
| OpenAI Vector Stores and `file_search` | They are not eligible for ZDR and cost $2.50 per 1,000 calls [O15, O28] | Not planned |
| Kubernetes and microservices | No Kubernetes [Decided]. One server running Docker Compose [Default]: a web app and one worker are enough. | Several regions, or a team |
| Live calls inside the Next.js process, or a Next.js custom server | A deploy or restart would cut live calls. Next.js has no supported API for long-running work. A custom server is discouraged and cannot use standalone output [L12–L15]. | Not planned |
| Fastify API service and a separate Preact widget app (the v0.1 plan) | Replaced by Next.js as the full stack, plus the voice worker | — |
| Multi-agent handoffs | One agent with 9 tools covers the scope | New verticals |

---

## 10. Main technical challenges and how we handle them

| Challenge | Why it is hard | How we handle it |
|---|---|---|
| Arabic voice quality | No published Arabic metrics; weak results on code-switching [O10, A24]; UAE callers speak many dialects and accents | The Phase 0 thresholds and decision rule (§8.3); a Gulf register in the instructions; typed fields for names and numbers (W-6); read-back (A-5); tappable cards (W-12) |
| Latency | Audio travels from the UAE to OpenAI in the US or EU, and tool calls add round trips | Measure OpenAI's default and EU endpoints; spoken preambles; low reasoning effort; tools under 300 ms (N-3); short tool outputs |
| Reliable scheduling | Concurrent bookings, holds, relative dates, staff edits during a conversation, Ramadan hours and holidays | Exclusion constraints (B-5); holds (B-4); idempotency (B-6); the backend resolves dates (B-7); an exceptions model (B-1); a booking state machine on the server: no booking without a valid hold |
| The model skipping tools | OpenAI says mini, the chosen model, is weaker at calling functions [L18]. Developers report that 2.1 and mini sometimes answer without calling the tool [O34]. | The mini safeguards (§8.1); the server refuses inconsistent requests; read-back; the "tool discipline" measure (§8.3); falling back to 2.1 for a clinic |
| Multi-tenancy | One mistake can leak another clinic's data | Row-level security with FORCE; the clinic always comes from the session; isolation tests in CI (N-13 to N-15) |
| Privacy and compliance | The data path conflicts with UAE health-data rules (§7.3) | The synthetic phase; counsel; the go-live gates; data minimisation; ZDR; hosting in the UAE |
| OpenAI changes | New models every few months; shutdowns [O3]; changing rate limits. The Agents SDK is pre-1.0, and minor versions may break it [L20]. | Pinned model snapshots and a pinned SDK version behind the `VoiceEngine` interface; regression evaluations before any upgrade; tier planning (§6.2) |
| Long-lived calls beside a web framework | A Next.js deploy or restart would cut live calls (§9.1) | A separate voice worker with its own drain and crash policy |
| Abuse and runaway cost | Anyone on the clinic's site can start a session, and an open tab can keep listening | Bot check, rate limits, the 10-minute cap and idle timeout, quotas, the kill switch, spend alerts (W-10, W-11, U-4, U-6) |
| Browser audio | iOS Safari quirks, echo, noisy rooms, denied microphones, dropped networks | OpenAI's noise reduction; the test matrix (N-28); clear widget states (W-8); reconnecting with a summary (N-10) |
| Fake bookings | No SMS check of the mobile number in the MVP | Limits per number (B-12); optional staff confirmation (B-11); rate limits |

---

## 11. Cost and capacity

**Cost per minute.** These figures use the baseline's 3-minute conversation, with a transcript at $0.0045 a minute [baseline §3.1–3.3]. "Cached" assumes about 89% of input tokens hit the prompt cache. The web channel has no telephony cost.

| Conversations per clinic per day (100 clinics) | Minutes per month | 2.1, cached ($0.089/min) | 2.1, uncached ($0.271/min) | mini, cached ($0.028/min) | mini, uncached ($0.075/min) |
|---|---|---|---|---|---|
| 10 | 90,000 | $8,010 | $24,390 | $2,520 | $6,750 |
| **20 (planning case)** | **180,000** | **$16,020** | $48,780 | **$5,040** | $13,500 |
| 50 | 450,000 | $40,050 | $121,950 | $12,600 | $33,750 |

- **Which figures to plan with:** mini is the chosen model, so the mini columns are the planning figures. The 2.1 columns show the cost of falling back.
- **Per clinic, in the planning case:** 1,800 minutes a month cost about $50 on mini and $160 on the 2.1 fallback, with caching. Without caching, they cost $135 and $488.
- **The figures in the table assume:**
  - the baseline's 3-minute call with a 4,000-token prompt prefix;
  - caller transcription by `gpt-transcribe` at $0.0045 a minute.
- **If live captions (W-5) need `gpt-live-transcribe`**, at $0.017 a minute:
  - mini costs about $0.041 a minute, or about $7,300 a month in the planning case;
  - 2.1 costs about $0.101 a minute, or about $18,250;
  - the gap narrows to about 2.5×.
  - Phase 0 decides which transcription model works inside a WebRTC session [Open].
  - Block 2 §3.3 starts with `gpt-live-transcribe`. Until Phase 0 says otherwise, the planning figure for mini is therefore about $0.041 a minute, or about $7,300 a month in the planning case.
- **If instructions and tools use the full ~12,000-token allowance** (§8.2), cost per conversation rises by roughly 25% on 2.1 and 15% on mini (extrapolated from baseline §3.4). Keep the clinic brief within its 6,000-token budget.
- **Long conversations:** cached audio input is the one price where mini is close to 2.1 ($0.30 against $0.40 per 1M tokens) [L18]. Within the 10-minute cap, the per-minute gap still stays about 3× (baseline §3.4).
- Track the real figures per session (U-2).
- **A pilot of 5 clinics** at 20 conversations a day uses 9,000 minutes a month: about $252 on mini, or $801 on 2.1. That fits within the Launch tier's $5,000 monthly limit.
- **The EU endpoint**, if Phase 0 chooses it, adds 10% to both mini and 2.1, because both were released after 2026-03-05 [L7]. In the planning case that is about $5,540 a month on mini.
- **Infrastructure** in the MVP (one small server, managed Postgres, backups and monitoring) is estimated in the low hundreds of dollars a month. Block 11 prices it. AI usage is the dominant cost.
- **A guide for pricing later:** every included plan minute costs about $0.028 in AI alone on mini, or $0.089 on the 2.1 fallback, with caching. A plan with 1,000 minutes therefore carries about $28 of AI cost on mini, or $89 on 2.1, before infrastructure, support and margin.
- **Cost controls:**
  - the caching layout (§8.2);
  - the 10-minute cap and idle timeout (W-10);
  - per-clinic quotas (U-4);
  - keeping clinics on mini rather than the 2.1 fallback;
  - low reasoning effort;
  - short tool outputs;
  - the cache-hit rate tracked for every session (U-2).

---

## 12. Missing information and recommended defaults

Each default stands unless the owner changes it. The "Decide by" column says when a default stops being changeable cheaply.

| # | Topic | Recommended default | Decide by |
|---|---|---|---|
| 1 | Pilot emirate | One emirate only, chosen after counsel's opinion. Leave free-zone clinics (DHCC, DIFC, ADGM) out of the first pilot. | Before the pilot |
| 2 | Patient data collected | Name and mobile number. No e-mail or date of birth, and nothing about the reason for the visit beyond the chosen service. | Now |
| 3 | How patients get confirmation | An on-screen card and an "Add to calendar" file. No e-mail, SMS or WhatsApp in the MVP. | Now |
| 4 | Checking identity before a reschedule or cancellation | Booking reference plus mobile number. No one-time codes in the MVP. | Now; revisit when messaging arrives |
| 5 | Confirming bookings | Automatic. A clinic can require staff confirmation. | Now |
| 6 | Booking window and change cut-off | 2 hours to 60 days ahead; changes allowed until 2 hours before | Now |
| 7 | Hold length | 5 minutes | Now |
| 8 | Limits per mobile number | 3 future appointments per clinic; 5 booking changes a day | Now |
| 9 | Session limits | 10 minutes at most; ends after 60 seconds of silence | Now |
| 10 | Concurrency | 50 sessions across the platform; 3 per clinic | Now; revisit with pilot data |
| 11 | Model | **Decided by the owner (2026-10-28):** `gpt-realtime-2.1-mini`. Phase 0 checks it against the marks in §8.3, and `gpt-realtime-2.1` is the fallback for each clinic. | Decided |
| 12 | OpenAI endpoint | Phase 0 compares the default and EU endpoints. ZDR is needed in production either way (G-3). The EU endpoint also needs OpenAI's approval of abuse-monitoring controls and costs 10% more. | Phase 0 |
| 13 | Arabic speaking style | A light Gulf register, without copying the caller's dialect. A clinic can choose a more formal MSA. | Block 5 |
| 14 | Voices | Test 2–3 voices with native raters in Phase 0. Each clinic picks from those. | Phase 0 |
| 15 | Dashboard language | English first, ready for right-to-left. Arabic when a clinic needs it. | Block 7 |
| 16 | Notifying staff | Real-time updates in the dashboard only. E-mail nudges without patient data come later. | Now |
| 17 | Onboarding | By invitation from the platform admin. The clinic admin enters the clinic's data, and we help with setup. | Now |
| 18 | Clinics with several branches | Supported in the data model and interface from the start | Now |
| 19 | Transcript retention | 30 days; each clinic can choose 0–90 days | Counsel |
| 20 | Hosting | Development on a local machine. Demos with synthetic data, anywhere. Production in a UAE region after counsel's opinion. | Block 11 |
| 21 | When a clinic reaches its minutes | Block new sessions and show the callback form, unless the plan allows overage | Block 10 |
| 22 | Outside clinic hours | The widget works 24/7. Callback requests made after hours are flagged for the next working day. | Now |
| 23 | Booking for someone else, such as a child | Allowed. Record the patient's name; do not collect age. | Block 4 |
| 24 | Insurance questions | Answered from the clinic's list of accepted insurance networks. No eligibility checks. | Now |
| 25 | Fees | The agent quotes a fee only if the clinic has entered one | Now |
| 26 | UAE public holidays | Loaded as suggestions that the clinic confirms. Islamic holiday dates are confirmed only close to the day. | Block 4 |

---

## 13. Risks

| # | Risk | Likelihood | Impact | Response | Owner |
|---|---|---|---|---|---|
| 1 | Health-data rules block going live with real patients on OpenAI | High | High | Use synthetic data until cleared; engage counsel now; pursue the approval path; minimise data; watch OpenAI's UAE region | Owner and counsel |
| 2 | Gulf Arabic quality on OpenAI is not good enough | Unknown | High | Phase 0 thresholds and decision rule; typed fields; read-back; tappable cards | Owner |
| 3 | Latency from the UAE is too high | Medium | Medium | Compare endpoints; spoken preambles; fast tools; low reasoning effort | Developer |
| 4 | An OpenAI model change alters the agent's behaviour | High | Medium | Pinned snapshots; the `VoiceEngine` interface; regression evaluations before upgrades | Developer |
| 5 | The model answers without calling a tool. Mini, the chosen model, is officially weaker at calling functions [L18]. | Medium to high [O34] | High | The mini safeguards (§8.1); the server-side booking state machine; read-back; the tool-discipline measure; falling back to 2.1 for a clinic | Developer |
| 6 | Bots or open tabs burn minutes | Medium | Medium | Bot check; rate limits; caps; idle timeout; quotas; kill switch | Developer |
| 7 | Fake bookings fill a clinic's calendar | Medium | Medium | Limits per number; optional staff confirmation; rate limits | Developer |
| 8 | Double or wrong bookings | Low | High | Exclusion constraint; holds; idempotency; read-back; concurrency tests | Developer |
| 9 | One clinic's data leaks to another | Low | Very high | Row-level security with FORCE; clinic taken only from the session; tests in CI | Developer |
| 10 | Some UAE networks or regulators block or degrade WebRTC | Unknown | High | Phase 0 network tests; counsel question 7 | Owner and developer |
| 11 | Too much work for one developer | High | Medium | A small architecture; a phased plan; AI coding agents working against tests; postpone everything optional | Owner |
| 12 | Costs overrun when the prompt cache misses | Medium | Medium | A stable prompt prefix; cache-hit rate tracked per session; the 10-minute cap | Developer |
| 13 | The pre-1.0 Agents SDK changes behaviour between versions | Medium | Medium | Pin the version; keep it behind `VoiceEngine`; keep raw WebSocket events as the fallback; run the evaluation set before upgrading [L20] | Developer |

---

## 14. MVP acceptance criteria

The MVP is done when all of the following are true:

1. Every **[Decided]** requirement in §5 is built and tested. **[Default]** requirements are built unless the owner changed them.
2. On the Phase 0 evaluation set, rerun before the pilot, every pass mark in §8.3 is met:
   - task success;
   - critical fields;
   - tool discipline;
   - Gulf Arabic understanding;
   - Arabic naturalness;
   - emergency and medical-advice handling;
   - cost per minute.
3. A concurrency test makes no double bookings: 1,000 parallel attempts to book the same slots.
4. The isolation tests find no access across clinics.
5. Turn latency (N-2) meets its target on UAE networks.
6. A load test of 50 simultaneous synthetic sessions has an error rate under 1%.
7. Over one test month, our usage totals match OpenAI's own data to within 5%.
8. All go-live gates (G-1 to G-9) pass before any real patient data is used.

---

## 15. How we deliver, and the next blocks

### 15.1 Build phases (detailed in Block 12)

| Phase | Content | Done when |
|---|---|---|
| 0. Spike and evaluation | A skeleton of the `web` and `voice-worker` processes; a minimal widget; the session flow, sideband and 3 tools on synthetic data, using `gpt-realtime-2.1-mini`, with 2.1 as the comparison. Measure latency, run the evaluation set, confirm metering and close the open items in §8.2. | The §8.3 decision is made |
| 1. Core platform | Repository, authentication, tenancy with row-level security, clinic data (locations, doctors, services, schedules), the scheduling engine, the basic dashboard, synthetic data | Staff can manage a clinic and its bookings by hand |
| 2. Voice agent | The production call manager in the voice worker, tools, guardrails, widget experience (cards, captions, states), callbacks and the conversation log | The full booking flow works by voice on synthetic data |
| 3. Operations | Metering, quotas, platform admin, observability, automated evaluations in CI, load test | Acceptance criteria 2–7 are met |
| 4. Pilot readiness | Security review, UAE hosting, retention jobs, legal gates, onboarding the pilot clinics | Gates G-1 to G-9 pass |

### 15.2 Planning blocks (revised for the MVP scope)

| # | Block | What it answers |
|---|---|---|
| 1 | Vision and MVP requirements | This document |
| 2 | Voice runtime and OpenAI integration | The voice worker's session lifecycle, sideband, audio settings and latency budget; confirming mini against the Phase 0 marks; choosing the voice, endpoint and transcription model; the detailed Phase 0 plan |
| 3 | Domain model and multi-tenancy | Entities, the data model, row-level security, IDs and the audit log |
| 4 | Scheduling engine | The availability algorithm, holds, constraints, exceptions, time zones and edge cases |
| 5 | Agent design | Conversation flows in Arabic and English, instructions, tool contracts, guardrails and evaluation scenarios |
| 6 | Application architecture and stack | The Next.js app and the voice worker: processes, domain modules, APIs, authentication and roles, jobs, repository layout, exact version pins and ADRs |
| 7 | Widget and dashboard UX/UI | Flows, states and the design system, using the `ui-ux-pro-max` and `frontend-design` skills |
| 8 | Security, privacy and compliance design | Threat model, data-flow map, retention jobs, counsel's answers and the gates |
| 9 | Observability, testing and evaluations | Traces, metrics, the test pyramid and the evaluation harness |
| 10 | Usage metering, cost model and plans | The ledger, price table, quotas and reconciliation |
| 11 | Infrastructure and environments | Development, staging and production; the hosting decision; CI/CD; backups |
| 12 | Phased build plan for coding agents | Milestones, tasks and acceptance tests |

**Recommended order:** Blocks 2 to 12 in sequence.

**Status (2026-10-29):** Block 2 is drafted in `docs/02-voice-runtime-and-openai.md`, with ADR-001 to ADR-003 in `docs/adr/`.

- Block 2 comes first because the Phase 0 results can change Blocks 5–7.
- Phase 0 can be built as soon as Block 2 is approved, while Blocks 3–4 are being written.
- Phase 1 starts only after Blocks 3, 4 and 6 are approved, because it builds the data model, the scheduler and sign-in.
- Start the legal track now, using §7.5. It runs in parallel and decides where production is hosted.

---

## Appendix A: Owner decisions and where they are covered

| Owner decision (2026-10-28) | Covered in |
|---|---|
| 1. UAE only; Arabic (Gulf) and English; switching between them | §0; A-2; N-29 to N-32; §8.3 |
| 2. A voice widget on the website only; no numbers, forwarding or WhatsApp. Confirmed again: "just a normal voice assistant that takes actions through the website". | §4; W-1 to W-12; §8.2; §9 |
| 3. Clinic appointment booking only; no other verticals | §4; A-3 to A-10; B-1 to B-12 |
| 4. Appointments stored in our platform; a dashboard for staff | B-1 to B-12; D-1 to D-13 |
| 5. About 100 clinics; isolation; a recommended concurrency target | §6.2; N-13 to N-17; §11 |
| 6. Monthly subscriptions; usage tracked; no billing system yet | P-2; U-1 to U-6; §11 |
| 7. OpenAI only; evaluate its technologies | §8; §9; §13 risks 2, 4 and 5 |
| 8. Inbound conversations only; a simple fallback; live transfer optional | A-8; D-7; §4.2 |
| 9. Privacy first; UAE compliance research; synthetic data first; no medical advice; recording off by default and no unnecessary audio kept | §4.3; A-7; A-10; §7; N-18 to N-25; G-1 to G-9 |
| 10. Solo developer with AI agents; no cloud chosen; no deadline | N-33 to N-38; §9.3; §9.4; §15 |
| 11. No Kubernetes for now | §0; §9 (introduction); N-34; §9.6 |
| 12. Next.js as the full stack, if recommended. It is recommended, plus one small voice worker from the same codebase (§9.1). | §0; §8.2; §9.1 to §9.4; §9.6 |
| 13. `gpt-realtime-2.1-mini` for now | §0; §8.1 to §8.3; §11; §12 item 11; §13 risk 5 |
| 14. Final instructions: keep the architecture extensible for future verticals, phone channels and external booking systems, without building them now | §2 (extensibility rule); §4.2; §9.5 |
| 15. The original idea: voice first, chat later | §2; §4.2 |

## Appendix B: Sources added in this block

Sources with O, A, P, T and M IDs are listed in `docs/research/00-research-baseline.md`, §8.

| ID | Source | Publisher | Date | Used for |
|---|---|---|---|---|
| L1 | https://insightplus.bakermckenzie.com/bm/data-technology/united-arab-emirates-health-data-law-permitted-transfers-of-health-data | Baker McKenzie | 2021 | Resolution 51/2021 exceptions (search excerpt) |
| L2 | https://cms.law/en/are/legal-updates/uae-health-data-new-data-transfer-permissions | CMS | 2021-06-22 | Exceptions and their conditions |
| L3 | https://www.trade.gov/market-intelligence/united-arab-emirates-regulations-limit-cross-border-health-data-flows (the baseline's P20) | US Department of Commerce | 2024-01-22 | The ten exceptions; ADHICS cloud restriction; DHCC regulation |
| L4 | https://www.ehs.gov.ae/app_content/legislations/php-law-en-77/files/basic-html/page2.html, page5.html and page7.html | Emirates Health Services (official English text of Federal Law No. 2 of 2019) | read 2026-10-28 | Definitions; Art. 13; the 25-year retention rule; Art. 22 and 24 |
| L5 | https://dha.gov.ae/uploads/012023/Policy%20for%20Health%20Information%20Assets%20management2023151842.pdf | Dubai Health Authority (HISHD/PP-12) | issued 2022-12-26; in force 2023-03-26 | Clauses 3.1–3.3, 4.5.1–4.5.6 and 4.6.1 |
| L6 | https://usuaebusiness.org/?p=35610 | US-UAE Business Council | not stated | ADHICS 2.0 cloud and exemption terms (secondary; unverified) |
| L7 | https://developers.openai.com/api/docs/guides/your-data (the baseline's O15) | OpenAI | read 2026-10-28 | Residency regions; Realtime processing in the US and EU only; ZDR; 10% uplift |
| L8 | https://developers.openai.com/api/docs/guides/voice-webrtc ; https://developers.openai.com/api/docs/guides/voice-server-controls?api=realtime | OpenAI | read 2026-10-28 | Unified interface; sideband by `call_id`; keeping tools on the server; safety-identifier header |
| L9 | https://developers.openai.com/api/docs/guides/rate-limits (the baseline's O14) | OpenAI | read 2026-10-28 | Tier thresholds and monthly limits; `slow_down` and ramping |
| L10 | https://docs.modulos.ai/frameworks/uae-pdpl/scope-enforcement-and-the-executive-regulation ; https://uppersetup.com/en/blog/uae-personal-data-protection-law-pdpl-the-complete-business | Secondary guides that disagree | 2026 | Status of the PDPL executive regulations (unverified) |
| L11 | https://bsalaw.com/insight/the-new-uae-health-data-law-an-in-depth-look/ | BSA Law | 2021-12-30 | The law covers free zones; Art. 13 summary |

Sources L12 to L26 come from the stack and model verification of 2026-10-28. The full findings, the fact-checks and further sources are in `docs/research/01-stack-and-model-verification.md`.

| ID | Source | Publisher | Date | Used for |
|---|---|---|---|---|
| L12 | https://nextjs.org/docs/app/guides/backend-for-frontend | Vercel (Next.js docs) | read 2026-10-28 | Backend features "not a full backend replacement"; limits of long-running handlers |
| L13 | https://nextjs.org/docs/app/guides/self-hosting | Vercel (Next.js docs) | updated 2026-10-15 | Graceful shutdown waits only for in-flight requests and `after()` callbacks |
| L14 | https://github.com/vercel/next.js/blob/v16.4.3/packages/next/src/server/lib/start-server.ts | Vercel (Next.js source, v16.4.3) | 2026-10-23 | The SIGTERM handler calls `process.exit(143)` after the HTTP drain |
| L15 | https://nextjs.org/docs/app/guides/custom-server | Vercel (Next.js docs) | read 2026-10-28 | Custom servers are discouraged and cannot be combined with standalone output |
| L16 | https://registry.npmjs.org/-/package/next/dist-tags ; https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026.md | npm registry; Vercel | 2026-10-23; 2026-10 | Next.js 16.4.3 is the current release; security release due 2026-11-03 |
| L17 | https://developers.openai.com/api/docs/models/gpt-realtime-2.1-mini | OpenAI | read 2026-10-28 | Model facts; rate limits by tier (200k / 4M / 15M tokens per minute; 400 / 10,000 / 20,000 requests per minute) |
| L18 | https://developers.openai.com/api/docs/guides/voice-latency-cost | OpenAI | read 2026-10-28 | Mini is weaker at instruction following and function calling; full context re-sent each turn; prices |
| L19 | https://developers.openai.com/api/docs/api-reference/realtime-calls/hangup-call ; https://developers.openai.com/api/docs/guides/voice-sip | OpenAI | read 2026-10-28 | Ending a call with `hangup`; the call WebSocket "behaves exactly like any other Realtime API connection" |
| L20 | https://openai.github.io/openai-agents-js/guides/voice-agents/transport/ ; https://github.com/openai/openai-agents-js/tree/main/examples/realtime-server-controlled | OpenAI (Agents SDK for TypeScript) | v0.21.0, 2026-10-20 | The browser-audio with server-side-controls pattern (`transport: 'websocket'`, `connect({ apiKey, callId })`); pre-1.0 versioning |
| L21 | https://raw.githubusercontent.com/openai/openai-agents-js/main/packages/agents-realtime/src/openaiRealtimeBase.ts | OpenAI (Agents SDK source) | read 2026-10-28 | Default model `gpt-realtime-2.1` unless set; usage comes from `response.done` only |
| L22 | https://community.openai.com/t/ephemeral-keys-trigger-realtime-sideband-404-errors/1396002 | OpenAI forum (secondary) | 2026-09-09 to 09-16 | Sideband 404 errors on calls created with ephemeral keys |
| L23 | https://orm.drizzle.team/docs/rls ; https://github.com/drizzle-team/drizzle-orm/issues/2813 | Drizzle | read 2026-10-28 | RLS support; no native EXCLUDE constraints |
| L24 | https://www.better-auth.com/docs/plugins/organization ; https://github.com/better-auth/better-auth/security/advisories/GHSA-fmh4-wcc4-5jm3 | Better Auth | read 2026-10-28 | Organization plugin; the invitation advisory and its required setting |
| L25 | https://github.com/timgit/pg-boss | pg-boss | v12.x, read 2026-10-28 | Postgres job queue; Node 22.12 or later |
| L26 | https://community.openai.com/t/realtime-regression-in-non-english-production-voice-agents-gpt-realtime-mini-vs-gpt-realtime-mini-2025-10-06/1380643 | OpenAI forum (secondary) | 2025–2026 | Non-English regressions on mini models; a clinic test where the model invented a department |
