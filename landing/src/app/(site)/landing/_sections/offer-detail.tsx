// Full detail page for one offer (/offers/[slug] on the public host). Own
// .rmn wrapper (SITE_CSS comes from the (site) layout). Primary
// media renders LARGE — video gets normal controls (no autoplay here, this is
// a reading page); remaining media becomes a gallery. Body is plain text with
// blank-line paragraphs. Ends in a contact CTA (mailto subject prefilled +
// WhatsApp when configured).
"use client"
import { BrandMark } from "./brand-mark"
import type { SiteOffer, SiteSettings } from "@/server/site/types"
import { useLang } from "../../../_ui/lang-context"
import { usePick } from "./site-lang"
import { mailtoHref, whatsappHref, bodyParagraphs } from "./offer-links"
import { WhatsAppIcon } from "./whatsapp-icon"

type Contact = SiteSettings["contact"]

const T = {
  back: ["← العودة إلى الرئيسية", "← Back to home"],
  ctaTitle: ["مهتم بهذه الخدمة؟", "Interested in this service?"],
  ctaLead: ["راسلنا وسنعود إليك خلال يوم عمل واحد.", "Message us and we'll get back to you within one business day."],
  contact: ["راسلنا عن هذا", "Ask us about this"],
} as const

function media(rel: string | null | undefined): string | null {
  return rel ? `/media/${rel}` : null
}

// `hero` = the primary media, the page's largest paint: fetched first, never lazy.
function MediaBlock({ path, kind, poster, alt, hero = false }: {
  path: string; kind: "image" | "video"; poster?: string | null; alt: string; hero?: boolean
}) {
  if (kind === "video") {
    return (
      <video src={media(path)!} poster={media(poster) ?? undefined}
        controls playsInline preload="metadata" />
    )
  }
  return hero
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={media(path)!} alt={alt} loading="eager" fetchPriority="high" />
    // eslint-disable-next-line @next/next/no-img-element
    : <img src={media(path)!} alt={alt} loading="lazy" />
}

export function OfferDetail({ offer, contact }: { offer: SiteOffer; contact: Contact }) {
  const { dir } = useLang()
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const name = pick(offer.name_ar, offer.name_en)
  const summary = pick(offer.summary_ar, offer.summary_en)
  const body = pick(offer.body_ar, offer.body_en)
  const [primary, ...gallery] = offer.media
  const wa = whatsappHref(contact.whatsapp, name)

  return (
    <div className="rmn" dir={dir}>
      <div className="rmn-detail">
        <div className="container">
          <div className="rmn-detail-top">
            <a href="/" className="brand">
              <BrandMark />
              <span className="brand-name">رمّانة</span>
            </a>
            <a href="/#features" className="btn btn-ghost">{p(T.back)}</a>
          </div>

          <span className="eyebrow">{offer.icon || "✕"}</span>
          <h1>{name}</h1>
          {summary && <p className="rmn-detail-lead">{summary}</p>}

          {primary && (
            <div className="rmn-detail-hero">
              <MediaBlock path={primary.path} kind={primary.kind} poster={primary.poster} alt={name} hero />
            </div>
          )}

          {body && (
            <div className="rmn-detail-body">
              {bodyParagraphs(body).map((para, i) => <p key={i}>{para}</p>)}
            </div>
          )}

          {gallery.length > 0 && (
            <div className="rmn-detail-gallery">
              {gallery.map((m, i) => (
                <MediaBlock key={m.path} path={m.path} kind={m.kind} poster={m.poster}
                  alt={`${name} — ${i + 2}`} />
              ))}
            </div>
          )}

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
