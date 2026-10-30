// "Contact" landing section — a compact split: the message form on one side, the
// direct-channel cards (support@ / info@ / WhatsApp / address) on the other. The
// FULL experience (bigger form + FAQ) lives on the standalone /contact page; the nav
// "Contact" link navigates there. Anchor id="contact-section" (NOT #contact — the
// existing cta band owns that). Self-guards? No: contact is always shown (the form is
// the point), but the method cards hide any channel that's unset.
"use client"
import type { SiteSettings } from "@/server/site/types"
import { usePick } from "./site-lang"
import { whatsappHref, mailtoHref } from "./offer-links"
import { WhatsAppIcon } from "./whatsapp-icon"
import { ContactForm } from "./contact-form"
import "./contact-section.css"
import { StitchDivider } from "./stitch-divider"

type Contact = SiteSettings["contact"]

const T = {
  eyebrow: ["تواصل معنا", "Contact"],
  title: ["لنبدأ الحديث", "Let's start a conversation"],
  lead: [
    "سواء كان لديك مشروع في ذهنك أو سؤال بسيط — نحن هنا. اكتب لنا وسنعود إليك بسرعة.",
    "A project in mind or just a question — we're here. Send us a note and we'll get back to you quickly.",
  ],
  reach: ["قنوات مباشرة", "Direct channels"],
  support: ["الدعم الفني", "Support"],
  supportDesc: ["مشكلة تقنية أو حساب قائم", "A technical issue or an existing account"],
  info: ["الاستفسارات العامة", "General & sales"],
  infoDesc: ["مشروع جديد أو سؤال عام", "A new project or a general question"],
  whatsapp: ["واتساب", "WhatsApp"],
  whatsappDesc: ["الأسرع للردّ الفوري", "Fastest for an instant reply"],
  address: ["العنوان", "Location"],
  addressFallback: ["دبي، الإمارات العربية المتحدة", "Dubai, United Arab Emirates"],
  full: ["فتح صفحة التواصل الكاملة", "Open the full contact page"],
} as const

// The WhatsApp prompt sent with the wa.me deep-link.
const WA_TEXT = ["مرحبًا رمّانة 👋", "Hi Rummanah 👋"] as const

// The direct-channel cards (support@ / info@ / WhatsApp / address). Shared by the
// landing section AND the standalone /contact page. `showFullLink` adds the
// "open full contact page" link (section only). Each channel hides if unset.
export function ContactMethods({ contact, showFullLink = false, detailHref = "/contact" }: {
  contact: Contact; showFullLink?: boolean; detailHref?: string
}) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const support = contact.email_support || contact.email
  const info = contact.email_info || contact.email
  const wa = whatsappHref(contact.whatsapp, p(WA_TEXT))
  const address = pick(contact.address_ar, contact.address_en) || p(T.addressFallback)

  return (
    <>
      <span className="rmn-contact-methods-lab">{p(T.reach)}</span>

      {support ? (
        <a className="rmn-contact-card" href={mailtoHref(support, p(T.support))}>
          <span className="rmn-contact-card-ic" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7l8 6 8-6" /></svg>
          </span>
          <span className="rmn-contact-card-body">
            <b>{p(T.support)}</b>
            <span className="rmn-contact-card-val" dir="ltr">{support}</span>
            <span className="rmn-contact-card-desc">{p(T.supportDesc)}</span>
          </span>
        </a>
      ) : null}

      {info && info !== support ? (
        <a className="rmn-contact-card" href={mailtoHref(info, p(T.info))}>
          <span className="rmn-contact-card-ic" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
          </span>
          <span className="rmn-contact-card-body">
            <b>{p(T.info)}</b>
            <span className="rmn-contact-card-val" dir="ltr">{info}</span>
            <span className="rmn-contact-card-desc">{p(T.infoDesc)}</span>
          </span>
        </a>
      ) : null}

      {wa ? (
        <a className="rmn-contact-card rmn-contact-card-wa" href={wa} target="_blank" rel="noopener noreferrer">
          <span className="rmn-contact-card-ic" aria-hidden><WhatsAppIcon /></span>
          <span className="rmn-contact-card-body">
            <b>{p(T.whatsapp)}</b>
            <span className="rmn-contact-card-val" dir="ltr">{contact.whatsapp}</span>
            <span className="rmn-contact-card-desc">{p(T.whatsappDesc)}</span>
          </span>
        </a>
      ) : null}

      <div className="rmn-contact-card rmn-contact-card-static">
        <span className="rmn-contact-card-ic" aria-hidden>
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
        </span>
        <span className="rmn-contact-card-body">
          <b>{p(T.address)}</b>
          <span className="rmn-contact-card-val">{address}</span>
        </span>
      </div>

      {showFullLink ? (
        <a className="rmn-contact-full" href={detailHref}>
          {p(T.full)}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      ) : null}
    </>
  )
}

export function ContactSection({ contact, detailHref = "/contact" }: { contact: Contact; detailHref?: string }) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])

  return (
    <section className="rmn-contact" id="contact-section" aria-labelledby="rmn-contact-title">
      <div className="container">
        <div className="rmn-contact-head reveal">
          <StitchDivider crosses={5} />
          <span className="eyebrow">{p(T.eyebrow)}</span>
          <h2 id="rmn-contact-title" className="kufi">{p(T.title)}</h2>
          <p>{p(T.lead)}</p>
        </div>

        <div className="rmn-contact-grid">
          <div className="rmn-contact-form-wrap reveal">
            <ContactForm />
          </div>
          <aside className="rmn-contact-methods reveal" style={{ ["--d" as string]: ".12s" }}>
            <ContactMethods contact={contact} showFullLink detailHref={detailHref} />
          </aside>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
