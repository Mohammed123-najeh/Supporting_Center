// "What we offer" — an embroidery-skinned bento grid of offers. Each cell shows
// the offer's media (image, or the poster for a video — never a live <video> in
// the grid; real playback lives on the /offers/[slug] detail page) or an
// embroidered-hoop fallback, plus title, summary, and CTAs (detail page +
// WhatsApp/mailto). On desktop the grid gains premium cursor effects (spotlight,
// border-glow, particles, tilt, magnetism, ripple) via MagicBento; on mobile and
// inside the CMS preview it's a plain, cheap grid. Keeps id="features" so nav
// anchors still work. `OffersShowcase` is exported and rendered directly by the
// CMS live-preview, so it stays the shared reusable unit.
"use client"
import dynamic from "next/dynamic"
import type { SiteOffer, SiteSettings } from "@/server/site/types"
import { usePick } from "./site-lang"
import { mailtoHref, whatsappHref } from "./offer-links"
import { WhatsAppIcon } from "./whatsapp-icon"
import { BentoGrid, BentoCell } from "./magic-bento"
import { useIsDesktop, usePrefersReducedMotion, useInPreview } from "./use-media"
import { StitchDivider } from "./stitch-divider"

// Desktop scrollytelling variant (the refreshed "services showcase" design) —
// dynamically imported (ssr:false) so its JS + CSS + mockups form a separate async
// chunk that only downloads on a qualifying desktop mount, never in the
// mobile/tablet landing chunk or the CMS dashboard bundle (which imports
// OffersShowcase from this file). It is CMS-DRIVEN (reads the same SiteOffer[] as
// the bento), so edits stay in sync across both. Until it loads, the space it
// will take is already held by .rmn-svc-hold (see OffersShowcase).
const ServicesShowcase = dynamic(() => import("./services/services-showcase"), {
  ssr: false,
  loading: () => <div className="rmn-svc-hold" aria-hidden="true" />,
})

// The scrollytelling variant is used on desktop, motion allowed, ≥2 offers. The
// preview check is applied separately (only OffersShowcase renders in preview).
function useScrollyGate(offerCount: number): boolean {
  const isDesktop = useIsDesktop()
  const reduced = usePrefersReducedMotion()
  return offerCount >= 2 && isDesktop === true && reduced === false
}

type Contact = SiteSettings["contact"]

const T = {
  eyebrow: ["ماذا نقدّم", "What we offer"],
  title: ["خدمات تُحاك بإتقان", "Services crafted with care"],
  lead: [
    "من المتجر الإلكتروني إلى الأنظمة الذكية — كل ما يحتاجه مشروعك الرقمي في مكان واحد.",
    "From online stores to smart systems — everything your digital business needs in one place.",
  ],
  details: ["التفاصيل الكاملة", "More details"],
  // Short label — the compact side-by-side CTA sits next to the primary button, so
  // "راسلنا عن هذا" was too wide; "راسلنا" + the WhatsApp icon reads clearly.
  contact: ["راسلنا", "Contact us"],
} as const

function media(rel: string | null | undefined): string | null {
  return rel ? `/media/${rel}` : null
}

// One offer's media (or the embroidered hoop fallback) plus a play-badge for
// video offers. NEVER a live <video> here (perf + the grid is animated) — video
// offers show their poster; real playback is on the /offers/[slug] detail page.
//
// Returns null when the offer has NO usable media — the caller then renders the
// cell WITHOUT a backdrop layer (just the cream face + emoji chip + text), so the
// old giant hoop watermark never sits behind and collides with the copy.
function OfferFaceMedia({ offer, name }: { offer: SiteOffer; name: string }): React.ReactElement | null {
  const m = offer.media[0]
  if (!m) return null
  if (m.kind === "video") {
    if (!m.poster) return null // no poster → no backdrop; the chip carries the icon
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media(m.poster)!} alt={name} loading="lazy" decoding="async" fetchPriority="low" />
        <span className="rmn-offer-playbadge" aria-hidden>&#9654;</span>
      </>
    )
  }
  // The face is a full-bleed object-fit:cover backdrop (the cell box controls size,
  // so no CLS from the img). loading="lazy" (offers are below the fold) + async
  // decode + low priority keep it off the critical path; the source is now a
  // resized webp (see server storeMedia), so the byte cost is small.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={media(m.path)!} alt={name} loading="lazy" decoding="async" fetchPriority="low" />
}

function OfferCtas({ offer, name, contact, detailHrefBase }: {
  offer: SiteOffer; name: string; contact: Contact; detailHrefBase: string
}) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  // "Ask us about this" → WhatsApp when a number is set (opens wa.me directly);
  // falls back to email so the button never breaks if no number is configured.
  const wa = whatsappHref(contact.whatsapp, name)
  return (
    <div className="rmn-offer-ctas">
      <a className="btn btn-primary" href={`${detailHrefBase}/${offer.slug}`}>{p(T.details)}</a>
      {wa ? (
        <a className="btn btn-ghost btn-wa" href={wa} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon /> {p(T.contact)}
        </a>
      ) : (
        <a className="btn btn-ghost" href={mailtoHref(contact.email || "hello@rummanah.dev", name)}>{p(T.contact)}</a>
      )}
    </div>
  )
}

export function OffersShowcase({ offers, contact, detailHrefBase = "/offers", scrolly, hold = false }: {
  offers: SiteOffer[]
  contact: Contact
  detailHrefBase?: string
  // Whether the parent section resolved the scrolly gate. Optional so the
  // standalone CMS-preview mount (which passes nothing) self-computes and always
  // falls to the bento there.
  scrolly?: boolean
  // The landing section: also render the desktop showcase's space-holder (see below).
  hold?: boolean
}) {
  const pick = usePick()
  const selfGate = useScrollyGate(offers.length)
  const wantScrolly = scrolly ?? selfGate
  // The CMS live-preview (.rmn-preview) renders this component at whatever the
  // operator's window width is. The desktop scrollytelling variant pins against
  // the viewport, which the boxed, non-scrolling preview panel doesn't have, so it
  // must NEVER run there: the preview always shows the flat bento (forced to one
  // column by `.rmn-preview` CSS).
  const { ref: rootRef, inPreview } = useInPreview()

  if (offers.length === 0) return null

  // ONE card definition, reused by the bento grid (a swipe track on phones), so
  // media + text + points + the CTAs render identically everywhere. The cell grows to fit its content; media fills it as a full-bleed
  // backdrop with a scrim (see site-css.ts) when the offer has an uploaded
  // image/video, otherwise it's a clean cream face.
  const cell = (o: SiteOffer) => {
    const name = pick(o.name_ar, o.name_en)
    const face = OfferFaceMedia({ offer: o, name })
    return (
      <BentoCell
        key={o.id}
        media={face}
        head={<span className="rmn-offer-chip" aria-hidden>{o.icon || name[0] || "ر"}</span>}
      >
        {pick(o.eyebrow_ar, o.eyebrow_en) && (
          <span className="rmn-offer-eyebrow">{pick(o.eyebrow_ar, o.eyebrow_en)}</span>
        )}
        <h3>{name}</h3>
        <p>{pick(o.summary_ar, o.summary_en)}</p>
        {o.points.length > 0 && (
          <ul className="rmn-bento-points">
            {o.points.map((pt, i) => <li key={i}>{pick(pt.ar, pt.en)}</li>)}
          </ul>
        )}
        <OfferCtas offer={o} name={name} contact={contact} detailHrefBase={detailHrefBase} />
      </BentoCell>
    )
  }

  // The bento: tablets, SSR/reduced-motion, the CMS preview, and — as a swipe
  // track, by CSS alone — phones. `data-count` keeps the desktop span map correct
  // if this ever renders wide.
  const grid = (
    <BentoGrid count={offers.length} label={pick("العروض", "Offers")}>
      {offers.map(cell)}
    </BentoGrid>
  )

  // The landing renders BOTH variants from the first byte, and CSS shows one (the
  // server can't know the viewport): the bento — phones (swipe track), tablets,
  // reduced motion — and, for desktop with motion, the scrollytelling showcase.
  // The showcase loads after hydration, so the server sends a space-holder of its
  // exact height (n steps × 78vh) that it then replaces: the bento→showcase swap
  // used to grow the section by ~3,700px after load, throwing a deep link or a
  // mid-page reload off by that much (CLS ≈ 1.5). The CMS preview: bento only.
  if (!hold || inPreview) return <div ref={rootRef} style={{ display: "contents" }}>{grid}</div>
  return (
    <div ref={rootRef} style={{ display: "contents" }}>
      {grid}
      {wantScrolly
        ? <ServicesShowcase offers={offers} contact={contact} detailHrefBase={detailHrefBase} />
        : <div className="rmn-svc-hold" aria-hidden="true" />}
    </div>
  )
}

export function OffersSection({ offers, contact }: { offers: SiteOffer[]; contact: Contact }) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const scrolly = useScrollyGate(offers.length)
  if (offers.length === 0) return null
  const svc = offers.length >= 2
  return (
    <section
      className={`offers${svc ? " has-svc" : ""}${scrolly ? " offers-scrolly-mode" : ""}`}
      id="features"
      style={svc ? ({ "--svc-n": offers.length } as React.CSSProperties) : undefined}
    >
      <div className="container">
        <div className="section-head reveal">
          <StitchDivider crosses={7} />
          <span className="eyebrow">{p(T.eyebrow)}</span>
          <h2>{p(T.title)}</h2>
          <p>{p(T.lead)}</p>
        </div>
        {/* `reveal in` (not `reveal`) in ALL modes: `.reveal.in` settles to
            opacity:1/transform:none — so (a) no translateY transform makes this
            wrapper a containing block for the scrolly's sticky/fixed layer, and
            (b) visibility never depends on the page's one-shot reveal observer,
            which the desktop↔tablet variant swap would otherwise strand. */}
        <div className="reveal in">
          <OffersShowcase offers={offers} contact={contact} scrolly={scrolly} hold={svc} />
        </div>
      </div>
    </section>
  )
}
