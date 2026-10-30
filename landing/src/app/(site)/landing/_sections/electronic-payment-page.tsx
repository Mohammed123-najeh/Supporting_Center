// Standalone "electronic payment" detail page (/electronic-payment on the public
// host via the middleware rewrite; /landing/electronic-payment on the panel host).
// Own .rmn wrapper (SITE_CSS comes from the (site) layout). Hosts a looping
// preview of the landing's payment story (the Stripe Checkout card + the iPhone
// Duo, stepped by a timer) and the ways to pay — this is the page a customer
// opens from the payment section's "More details" button. Ends in a contact CTA.
"use client"
import { BrandMark } from "./brand-mark"
import Link from "next/link"
import type { SiteSettings, PaymentFeature } from "@/server/site/types"
import { useLang } from "../../../_ui/lang-context"
import { usePick } from "./site-lang"
import { mailtoHref, whatsappHref } from "./offer-links"
import { WhatsAppIcon } from "./whatsapp-icon"
import { PayDuoPreview, PaymentMethods } from "./pay-duo/pay-duo-section"
import { PaymentFeaturesThread } from "./payment-features-thread"
import "./electronic-payment-page.css"

type Contact = SiteSettings["contact"]

const T = {
  back: ["← العودة إلى الرئيسية", "← Back to home"],
  eyebrow: ["الدفع الإلكتروني", "Electronic payment"],
  title: ["مدفوعات آمنة، بتجربة تُشبه متجرك", "Secure payments, an experience that feels like your store"],
  lead: [
    "نبني تجربة دفع عربية أولًا عبر Stripe: البطاقات وApple Pay وGoogle Pay وLink، بالدرهم الإماراتي، بحماية 3-D Secure — بواجهة سريعة ومألوفة تُكمِل البيع بثقة.",
    "We build an Arabic-first payment experience on Stripe: cards, Apple Pay, Google Pay and Link, in UAE dirhams, protected by 3-D Secure — in a fast, familiar interface that closes the sale with confidence.",
  ],
  previewCap: ["معاينة حيّة لتجربة الدفع", "A live preview of the checkout experience"],
  cardsTitle: ["طرق الدفع", "Ways to pay"],
  cardsLead: ["البطاقات والمحافظ التي يستخدمها عملاؤك أصلًا — وتتم معالجتها عبر Stripe.", "The cards and wallets your customers already use — processed by Stripe."],
  methods: ["طرق الدفع المقبولة", "Accepted payment methods"],
  stripe: ["مدعوم من Stripe", "Powered by Stripe"],
  ctaTitle: ["مهتم بتفعيل الدفع الإلكتروني؟", "Interested in enabling electronic payment?"],
  ctaLead: ["راسلنا وسنعود إليك خلال يوم عمل واحد.", "Message us and we'll get back to you within one business day."],
  contact: ["راسلنا عن هذا", "Ask us about this"],
} as const

export function ElectronicPaymentPage({ contact, paymentFeatures }: { contact: Contact; paymentFeatures: PaymentFeature[] }) {
  const { dir } = useLang()
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const name = pick("الدفع الإلكتروني", "Electronic payment")
  const wa = whatsappHref(contact.whatsapp, name)

  return (
    <div className="rmn" dir={dir}>
      <div className="rmn-detail">
        <div className="container">
          <div className="rmn-detail-top">
            {/* next/link → prefetched client transition home; the intro loader is
                session-gated so it won't replay on return (no logo-flash reload). */}
            <Link href="/" className="brand">
              <BrandMark />
              <span className="brand-name">رمّانة</span>
            </Link>
            <Link href="/#electronic-payment" className="btn btn-ghost">{p(T.back)}</Link>
          </div>

          <span className="eyebrow">{p(T.eyebrow)}</span>
          <h1>{p(T.title)}</h1>
          <p className="rmn-detail-lead">{p(T.lead)}</p>

          {/* live preview — the landing's six scenes on a timer */}
          <div className="rmn-ep-preview">
            <PayDuoPreview />
            <div className="rmn-ep-preview-cap">{p(T.previewCap)}</div>
          </div>

          {/* ways to pay */}
          <div className="rmn-ep-cards">
            <div className="rmn-ep-cards-copy">
              <span className="rmn-pay-cards-lab">{p(T.cardsTitle)}</span>
              <p>{p(T.cardsLead)}</p>
            </div>
            <div className="rmn-ep-methods">
              <PaymentMethods label={p(T.methods)} stripeLabel={p(T.stripe)} />
            </div>
          </div>

          {/* CMS-driven payment-features timeline — the scroll-thread that used to
              sit on the main landing now lives here (its richer, editable form
              replaces the old hardcoded feature grid). Self-guards when empty. */}
          <PaymentFeaturesThread features={paymentFeatures} />

          <div className="rmn-detail-cta">
            <div>
              <h2>{p(T.ctaTitle)}</h2>
              <p style={{ color: "var(--olive-soft)", marginTop: ".3rem" }}>{p(T.ctaLead)}</p>
            </div>
            <div className="rmn-offer-ctas" style={{ marginTop: 0 }}>
              {wa ? (
                <a className="btn btn-primary btn-wa" href={wa} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> {p(T.contact)}
                </a>
              ) : (
                <a className="btn btn-primary" href={mailtoHref(contact.email || "hello@rummanah.dev", name)}>{p(T.contact)}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
