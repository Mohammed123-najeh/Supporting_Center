// "Electronic payment" (الدفع الإلكتروني) — the old six-scene checkout story on
// the iPhone Duo, paid through Stripe. Desktop: a Stripe Checkout card fills
// itself in, then the Duo rises folded, unfolds (≈1.35 s), takes the payment with
// Touch ID and folds shut as the card turns into a receipt. Phones: the Duo
// alone, folded → unfolding in place.
//
// How it moves: the band is a tall scroll track with a sticky 100svh stage and
// one invisible zone per scene (five on phones). Scrolling only TRIGGERS a scene
// (use-scene-stepper sets data-scene); each scene's CSS rule then plays it at its
// own fixed pace, forward and back (pay-duo.css). No scroll handler, no rAF, and
// the server renders the exact DOM the client keeps (data-scene="1").
//
// Static (no motion, short section): the CMS preview (PayDuoStatic), reduced
// motion, no JS, and very short landscape screens — the card filled in and the
// Duo open on the Apple Pay sheet.
"use client"
import { useRef } from "react"
import type { CheckoutStage, SiteSettings } from "@/server/site/types"
import { usePick } from "../site-lang"
import { mailtoHref, whatsappHref } from "../offer-links"
import { WhatsAppIcon } from "../whatsapp-icon"
import { DuoDevice } from "./duo-device"
import { StripeCard } from "./stripe-card"
import { AppleGlyph, LockGlyph, MastercardMark } from "./glyphs"
import { useSceneStepper } from "./use-scene-stepper"
import { useSceneAutoplay } from "./use-scene-autoplay"
import "./pay-duo.css"
import { StitchDivider } from "../stitch-divider"

type Contact = SiteSettings["contact"]

const T = {
  eyebrow: ["الدفع الإلكتروني", "Electronic payment"],
  title: ["تجربة دفع آمنة", "A secure checkout"],
  lead: [
    "من السلّة إلى الإيصال — شاهد كيف يتدفّق الدفع في متجرك، خطوةً بخطوة.",
    "From cart to receipt — watch how payment flows in your store, step by step.",
  ],
  details: ["التفاصيل الكاملة", "More details"],
  contact: ["راسلنا", "Contact us"],
  scroll: ["مرّر لتشغيل التدفّق", "Scroll to run the flow"],
  methods: ["طرق الدفع المقبولة", "Accepted payment methods"],
  secured: ["مؤمَّن بواسطة رمّانة — دفع مشفّر", "Secured by Rummanah — encrypted payment"],
  stripe: ["مدعوم من Stripe", "Powered by Stripe"],
} as const

// Desktop position (--z) and phone position (--zm) of each scene's zone, in zone
// heights. On phones scene 2 (the summary stepping aside) has nothing to show,
// so its zone collapses to zero height and the later zones move up by one.
const ZONES = [0, 1, 2, 3, 4, 5].map((z) => ({ z, zm: Math.max(0, z - 1) }))

const two = (n: number) => (n < 10 ? `0${n}` : `${n}`)

// The official "Powered by Stripe" badge + the accepted-method marks. Shared by
// the landing rail and /electronic-payment.
export function PaymentMethods({ label, stripeLabel }: { label: string; stripeLabel: string }) {
  return (
    <>
      {/* The official "Powered by Stripe" badge (unmodified brand asset), linked
          to stripe.com as Stripe asks; blurple on light, white on dark. */}
      <a className="rmn-spay-stripe" href="https://stripe.com" target="_blank" rel="noopener noreferrer" aria-label={stripeLabel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="on-light" src="/powered-by-stripe-blurple.svg" alt="" width={150} height={34} loading="lazy" decoding="async" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="on-dark" src="/powered-by-stripe-white.svg" alt="" width={150} height={34} loading="lazy" decoding="async" />
      </a>
      {/* Each mark draws its logo and carries its name as visually-hidden text. */}
      <ul className="rmn-spay-marks" aria-label={label} dir="ltr">
        <li className="mk-visa"><span aria-hidden="true">VISA</span><span className="vh">Visa</span></li>
        <li className="mk-mc">{MastercardMark}<span className="vh">Mastercard</span></li>
        <li className="mk-amex"><span aria-hidden="true">AMEX</span><span className="vh">American Express</span></li>
        <li className="mk-apple">{AppleGlyph}<span aria-hidden="true">Pay</span><span className="vh">Apple Pay</span></li>
        <li className="mk-gpay"><b aria-hidden="true">G</b><span aria-hidden="true">Pay</span><span className="vh">Google Pay</span></li>
        <li className="mk-link"><span aria-hidden="true">link</span><span className="vh">Link</span></li>
      </ul>
    </>
  )
}

function Rail({ stages, contact, detailHref, live }: {
  stages: CheckoutStage[]; contact: Contact; detailHref: string; live: boolean
}) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const wa = whatsappHref(contact.whatsapp, p(T.eyebrow))
  return (
    <div className="rmn-spay-rail">
      {/* All six stages stay in the DOM (and in reading order for screen
          readers); the active one is shown — stacked in one grid cell, so a
          scene change never moves the layout. */}
      <ol className="rmn-spay-steps">
        {stages.map((s, i) => (
          <li key={i} className="rmn-spay-step" data-step={i + 1} aria-current={live && i === 0 ? "step" : undefined}>
            <span className="rmn-spay-count" dir="ltr">{two(i + 1)} / {two(stages.length)}</span>
            <h3 className="kufi">{pick(s.title_ar, s.title_en)}</h3>
            <p>{pick(s.desc_ar, s.desc_en)}</p>
          </li>
        ))}
      </ol>
      <div className="rmn-spay-prog" aria-hidden="true"><span /></div>
      <div className="rmn-spay-cta">
        <a className="btn btn-primary" href={detailHref}>{p(T.details)}</a>
        {wa ? (
          <a className="btn btn-ghost btn-wa" href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> {p(T.contact)}</a>
        ) : (
          <a className="btn btn-ghost" href={mailtoHref(contact.email || "hello@rummanah.dev", p(T.eyebrow))}>{p(T.contact)}</a>
        )}
      </div>
      <PaymentMethods label={p(T.methods)} stripeLabel={p(T.stripe)} />
      <p className="rmn-spay-trust">{LockGlyph}{p(T.secured)}</p>
      {live && <div className="rmn-spay-hint" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {p(T.scroll)}
      </div>}
    </div>
  )
}

// The stage's visual: always LTR, decorative (the rail carries the text).
function Visual() {
  return (
    <div className="rmn-spay-visual" dir="ltr" aria-hidden="true" inert>
      <StripeCard />
      <DuoDevice />
    </div>
  )
}

export function PayDuoSection({ stages, contact, detailHref = "/electronic-payment" }: {
  stages: CheckoutStage[]
  contact: Contact
  detailHref?: string
}) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const rootRef = useRef<HTMLElement>(null)
  useSceneStepper(rootRef)
  return (
    <section ref={rootRef} className="pay-section rmn-spay" id="electronic-payment">
      <div className="container">
        <div className="section-head reveal">
          <StitchDivider crosses={7} />
          <span className="eyebrow">{p(T.eyebrow)}</span>
          <h2>{p(T.title)}</h2>
          <p>{p(T.lead)}</p>
        </div>
      </div>
      <div className="rmn-spay-band">
        {ZONES.map(({ z, zm }) => (
          <span key={z} className="rmn-spay-zone" data-zone={z} aria-hidden="true" style={{ "--z": z, "--zm": zm } as React.CSSProperties} />
        ))}
        <div className="rmn-spay-stage" data-scene="1">
          <div className="rmn-spay-inner">
            <Rail stages={stages} contact={contact} detailHref={detailHref} live />
            <Visual />
          </div>
        </div>
      </div>
    </section>
  )
}

// CMS live preview: the same rail + visual, static (no band, no stepper).
export function PayDuoStatic({ stages, contact }: { stages: CheckoutStage[]; contact: Contact }) {
  return (
    <div className="rmn-spay rmn-spay--static">
      <div className="rmn-spay-stage" data-scene="5">
        <div className="rmn-spay-inner">
          <Rail stages={stages} contact={contact} detailHref="#" live={false} />
          <Visual />
        </div>
      </div>
    </div>
  )
}

// /electronic-payment: the visual alone, its scenes stepped by a timer.
export function PayDuoPreview() {
  const rootRef = useRef<HTMLDivElement>(null)
  useSceneAutoplay(rootRef)
  return (
    <div ref={rootRef} className="rmn-spay rmn-spay--autoplay">
      <div className="rmn-spay-stage" data-scene="1">
        <Visual />
      </div>
    </div>
  )
}
