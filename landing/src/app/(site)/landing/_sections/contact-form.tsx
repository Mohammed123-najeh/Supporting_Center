// The public contact form — shared by the on-landing Contact SECTION and the
// standalone /contact PAGE. First real client→API call from the landing: it POSTs
// to /api/public/contact (same-origin, so it passes the middleware host-split + the
// isSameOrigin CSRF check). Minimal fields (name, email, topic, message) per
// conversion best-practice; inline validation; a clear success state; a honeypot +
// a captured render-timestamp for spam. Bilingual via usePick; RTL-correct.
"use client"
import { useRef, useState, type FormEvent } from "react"
import { usePick } from "./site-lang"

const T = {
  name: ["الاسم", "Name"],
  namePh: ["اسمك الكامل", "Your full name"],
  email: ["البريد الإلكتروني", "Email"],
  emailPh: ["you@example.com", "you@example.com"],
  topic: ["الموضوع", "Topic"],
  topicSupport: ["الدعم الفني", "Support"],
  topicSales: ["مبيعات / مشروع جديد", "Sales / new project"],
  topicGeneral: ["استفسار عام", "General enquiry"],
  message: ["رسالتك", "Message"],
  messagePh: ["كيف يمكننا مساعدتك؟", "How can we help you?"],
  send: ["إرسال الرسالة", "Send message"],
  sending: ["جارٍ الإرسال…", "Sending…"],
  promise: ["نردّ عادةً خلال يوم عمل واحد.", "We usually reply within one business day."],
  okTitle: ["تم استلام رسالتك", "Message received"],
  okBody: ["شكرًا لتواصلك — سيصلك ردّنا قريبًا على بريدك.", "Thanks for reaching out — we'll get back to you by email soon."],
  okAgain: ["إرسال رسالة أخرى", "Send another message"],
  errName: ["يرجى إدخال اسمك.", "Please enter your name."],
  errEmail: ["يرجى إدخال بريد إلكتروني صحيح.", "Please enter a valid email."],
  errMessage: ["يرجى كتابة رسالتك.", "Please write your message."],
  errSend: ["تعذّر إرسال الرسالة. حاول مرة أخرى أو راسلنا مباشرةً.", "Couldn't send the message. Please try again or email us directly."],
  errRate: ["محاولات كثيرة. يرجى المحاولة بعد قليل.", "Too many attempts. Please try again shortly."],
} as const

type Topic = "support" | "sales" | "general"
type Status = "idle" | "sending" | "sent" | "error"

// Basic client-side email shape check (server re-validates with zod). Kept lenient;
// the server is the real boundary.
const looksEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export function ContactForm({ defaultTopic = "general" }: { defaultTopic?: Topic }) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [topic, setTopic] = useState<Topic>(defaultTopic)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [errorKey, setErrorKey] = useState<keyof typeof T | null>(null)
  // Field-level errors surface only after a first submit attempt (don't nag while typing).
  const [touched, setTouched] = useState(false)
  // Honeypot: a hidden field bots fill and humans don't.
  const honeypot = useRef("")
  // Captured once on mount — the min-time-to-submit anchor.
  const renderedAt = useRef(Date.now())

  const nameErr = touched && !name.trim() ? p(T.errName) : ""
  const emailErr = touched && !looksEmail(email) ? p(T.errEmail) : ""
  const messageErr = touched && !message.trim() ? p(T.errMessage) : ""

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!name.trim() || !looksEmail(email) || !message.trim()) return
    setStatus("sending")
    setErrorKey(null)
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          topic,
          message: message.trim(),
          website: honeypot.current, // honeypot (empty for humans)
          ts: renderedAt.current,
        }),
      })
      if (res.ok) {
        setStatus("sent")
        return
      }
      setErrorKey(res.status === 429 ? "errRate" : "errSend")
      setStatus("error")
    } catch {
      setErrorKey("errSend")
      setStatus("error")
    }
  }

  function reset() {
    setName(""); setEmail(""); setTopic(defaultTopic); setMessage("")
    setStatus("idle"); setErrorKey(null); setTouched(false)
    renderedAt.current = Date.now()
  }

  if (status === "sent") {
    return (
      <div className="rmn-cf rmn-cf-done" role="status" aria-live="polite">
        <span className="rmn-cf-check" aria-hidden>
          <svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" /><path d="M16 27l7 7 14-15" /></svg>
        </span>
        <h3>{p(T.okTitle)}</h3>
        <p>{p(T.okBody)}</p>
        <button type="button" className="btn btn-ghost" onClick={reset}>{p(T.okAgain)}</button>
      </div>
    )
  }

  const sending = status === "sending"
  return (
    <form className="rmn-cf" onSubmit={onSubmit} noValidate>
      <div className="rmn-cf-row">
        <label className="rmn-cf-field">
          <span className="rmn-cf-label">{p(T.name)}</span>
          <input
            type="text" className="rmn-cf-input" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={p(T.namePh)} autoComplete="name" enterKeyHint="next" aria-invalid={!!nameErr}
            aria-describedby={nameErr ? "cf-name-err" : undefined} maxLength={120}
          />
          {nameErr ? <span id="cf-name-err" className="rmn-cf-err">{nameErr}</span> : null}
        </label>
        <label className="rmn-cf-field">
          <span className="rmn-cf-label">{p(T.email)}</span>
          <input
            type="email" dir="ltr" className="rmn-cf-input" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={p(T.emailPh)} autoComplete="email" inputMode="email" enterKeyHint="next" aria-invalid={!!emailErr}
            aria-describedby={emailErr ? "cf-email-err" : undefined} maxLength={320}
          />
          {emailErr ? <span id="cf-email-err" className="rmn-cf-err">{emailErr}</span> : null}
        </label>
      </div>

      <label className="rmn-cf-field">
        <span className="rmn-cf-label">{p(T.topic)}</span>
        <div className="rmn-cf-select">
          <select value={topic} onChange={(e) => setTopic(e.target.value as Topic)}>
            <option value="support">{p(T.topicSupport)}</option>
            <option value="sales">{p(T.topicSales)}</option>
            <option value="general">{p(T.topicGeneral)}</option>
          </select>
          <span className="rmn-cf-chev" aria-hidden />
        </div>
      </label>

      <label className="rmn-cf-field">
        <span className="rmn-cf-label">{p(T.message)}</span>
        <textarea
          className="rmn-cf-input rmn-cf-textarea" value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder={p(T.messagePh)} rows={5} enterKeyHint="send" aria-invalid={!!messageErr}
          aria-describedby={messageErr ? "cf-message-err" : undefined} maxLength={4000}
        />
        {messageErr ? <span id="cf-message-err" className="rmn-cf-err">{messageErr}</span> : null}
      </label>

      {/* Honeypot — visually hidden + off the a11y tree; a filled value flags a bot. */}
      <div className="rmn-cf-hp" aria-hidden>
        <label>Website<input type="text" tabIndex={-1} autoComplete="off"
          onChange={(e) => { honeypot.current = e.target.value }} /></label>
      </div>

      {/* Response-time promise at the hesitation moment (just above submit). */}
      <p className="rmn-cf-promise">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        {p(T.promise)}
      </p>

      {status === "error" && errorKey ? (
        <p className="rmn-cf-error" role="alert">{p(T[errorKey] as readonly [string, string])}</p>
      ) : null}

      <button type="submit" className="btn btn-primary rmn-cf-submit" disabled={sending}>
        {sending ? p(T.sending) : p(T.send)}
      </button>
    </form>
  )
}

export default ContactForm
