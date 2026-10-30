// Standalone "Contact" page (/contact on the public host via the middleware
// rewrite; /landing/contact on the panel host). Own .rmn wrapper (SITE_CSS comes
// from the (site) layout). The full contact
// experience the nav "Contact" link navigates to: hero + split (form + direct
// channels) + a short FAQ. Reuses ContactForm + ContactMethods.
"use client"
import { BrandMark } from "./brand-mark"
import Link from "next/link"
import type { SiteSettings } from "@/server/site/types"
import { useLang } from "../../../_ui/lang-context"
import { usePick } from "./site-lang"
import { ContactForm } from "./contact-form"
import { ContactMethods } from "./contact-section"
import { CONTACT_FAQ } from "./site-copy"
import "./contact-section.css"
import "./contact-page.css"

type Contact = SiteSettings["contact"]

const T = {
  back: ["← العودة إلى الرئيسية", "← Back to home"],
  eyebrow: ["تواصل معنا", "Contact"],
  title: ["نحن هنا لمساعدتك", "We're here to help"],
  lead: [
    "اختر الطريقة الأنسب لك: املأ النموذج، أو راسلنا مباشرةً عبر البريد أو واتساب. نقرأ كل رسالة ونردّ خلال يوم عمل واحد.",
    "Pick whatever suits you: fill in the form, or reach us directly by email or WhatsApp. We read every message and reply within one business day.",
  ],
  formTitle: ["أرسل لنا رسالة", "Send us a message"],
  faqTitle: ["أسئلة سريعة", "Quick answers"],
  faq: CONTACT_FAQ,
} as const

export function ContactPage({ contact }: { contact: Contact }) {
  const { dir } = useLang()
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])

  return (
    <div className="rmn" dir={dir}>
      <div className="rmn-detail rmn-contact-page">
        <div className="container">
          <div className="rmn-detail-top">
            <Link href="/" className="brand">
              <BrandMark />
              <span className="brand-name">رمّانة</span>
            </Link>
            <Link href="/" className="btn btn-ghost">{p(T.back)}</Link>
          </div>

          <span className="eyebrow">{p(T.eyebrow)}</span>
          <h1>{p(T.title)}</h1>
          <p className="rmn-detail-lead">{p(T.lead)}</p>

          <div className="rmn-contact-grid rmn-contact-page-grid">
            <div className="rmn-contact-form-wrap">
              <h2 className="rmn-contact-page-formtitle">{p(T.formTitle)}</h2>
              <ContactForm />
            </div>
            <aside className="rmn-contact-methods">
              <ContactMethods contact={contact} />
            </aside>
          </div>

          {/* FAQ — a couple of quick answers, best-practice for a contact page. */}
          <div className="rmn-contact-faq" id="faq">
            <h2 className="kufi">{p(T.faqTitle)}</h2>
            <div className="rmn-contact-faq-grid">
              {T.faq.map((row, i) => (
                <div className="rmn-contact-faq-item" key={i}>
                  <h3>{pick(row[0], row[1])}</h3>
                  <p>{pick(row[2], row[3])}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
