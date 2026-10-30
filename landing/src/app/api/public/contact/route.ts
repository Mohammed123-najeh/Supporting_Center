// POST /api/public/contact — the landing contact form's endpoint (ContactForm in
// _sections/contact-form.tsx posts here). A STUB: it validates the submission like
// the source's route (same fields, limits and status codes) and returns 200, but it
// stores and sends nothing. Wire it to real storage / email (and add a rate limit,
// which answers 429 → the form's "too many attempts" message) before going live.
//
// Kept from the source: same-origin check (403), JSON body validation (400), and
// the silent spam drop — a filled honeypot or a submit faster than a human could
// type gets the normal success reply, so a bot can't tell it was caught.
import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TOPICS = ["support", "sales", "general"] as const
type Topic = (typeof TOPICS)[number]

// Minimum think-time (ms) between the form rendering and submit.
const MIN_SUBMIT_MS = 2500

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Submission = { name: string; email: string; topic: Topic; message: string; website: string; ts?: number }

// Same limits as the source's zod schema: name 1–120, email ≤320, topic enum,
// message 1–4000, honeypot `website` any string ≤2000, `ts` optional number.
function parse(body: unknown): Submission | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null
  const o = body as Record<string, unknown>
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : null)
  const name = str(o.name)
  const email = str(o.email)
  const message = str(o.message)
  const topic = o.topic
  const website = o.website === undefined ? "" : typeof o.website === "string" ? o.website : null
  const ts = o.ts === undefined ? undefined : typeof o.ts === "number" ? o.ts : null
  if (!name || name.length > 120) return null
  if (!email || email.length > 320 || !EMAIL_RE.test(email)) return null
  if (!message || message.length > 4000) return null
  if (typeof topic !== "string" || !(TOPICS as readonly string[]).includes(topic)) return null
  if (website === null || website.length > 2000) return null
  if (ts === null) return null
  return { name, email, topic: topic as Topic, message, website, ts }
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin")
  if (!origin) return true // same-origin fetches from older browsers may omit it
  try {
    return new URL(origin).host === req.headers.get("host")
  } catch {
    return false
  }
}

const ok = () => NextResponse.json({ ok: true, data: { received: true } })
const fail = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status })

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return fail("cross-origin request rejected", 403)

  let data: Submission | null
  try {
    data = parse(await req.json())
  } catch {
    data = null
  }
  if (!data) return fail("invalid submission", 400)

  const tooFast = typeof data.ts === "number" && Number.isFinite(data.ts) && Date.now() - data.ts < MIN_SUBMIT_MS
  if (data.website.length > 0 || tooFast) return ok()

  // Stub: no storage, no email. Log the topic only, never the visitor's details.
  console.info(`[contact] stub received a "${data.topic}" message (${data.message.length} chars)`)
  return ok()
}
