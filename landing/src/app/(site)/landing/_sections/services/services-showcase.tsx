// Desktop "services showcase" — the refreshed design for the offers section
// (خدمات تُحاك بإتقان). Scrolling text STEPS on one side drive a STICKY visual
// panel on the other; a soft colour field paints behind (one wash per offer,
// cross-faded as the active step changes); a "tatreez weave" thread fills as you
// advance. This is the DESKTOP variant only — gated + dynamically imported
// `{ssr:false}` by offers.tsx (phones and tablets get the bento / swipe track).
// It is CMS-DRIVEN: every step reads a SiteOffer, so what an operator edits shows
// here AND in the bento (single source of truth).
//
// Reuses the offers pipeline (effectivePalette/resolveStageVisual from
// scrolly-math + the built-in Mockup). Scroll only picks the active step
// (use-services-scroll); every motion is a CSS transition on transform/opacity.
"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import type { SiteOffer, SiteSettings } from "@/server/site/types"
import { usePick } from "../site-lang"
import { useLang } from "../../../../_ui/lang-context"
import { mailtoHref, whatsappHref } from "../offer-links"
import { WhatsAppIcon } from "../whatsapp-icon"
import { Mockup } from "../scrolly-mockups"
import { effectivePalette, resolveStageVisual, rgbTriplet, twoDigit, type StageVisual } from "../scrolly-math"
import { useServicesScroll } from "./use-services-scroll"
import "./services-showcase.css"

type Contact = SiteSettings["contact"]

const T = {
  details: ["التفاصيل الكاملة", "More details"],
  contact: ["راسلنا", "Contact us"],
} as const

const media = (rel: string): string => `/media/${rel}`

// One stage visual — image / video / mockup. Video shows a fallback face until it
// can paint; the parent attaches src once the step comes within one of the active.
function StageFace({ visual, live, videoRef }: {
  visual: StageVisual
  live: boolean
  videoRef: (el: HTMLVideoElement | null) => void
}) {
  const [ready, setReady] = useState(false)
  if (visual.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media(visual.path)} alt="" loading="lazy" decoding="async" fetchPriority="low" />
  }
  if (visual.kind === "mockup") {
    return <div className="rmn-svc-mock"><Mockup kind={visual.mockup} /></div>
  }
  return (
    <>
      {!ready && (
        visual.fallback.kind === "image"
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={media(visual.fallback.path)} alt="" loading="lazy" decoding="async" fetchPriority="low" />
          : <div className="rmn-svc-mock"><Mockup kind={visual.fallback.mockup} /></div>
      )}
      <video
        ref={videoRef}
        className={ready ? "is-ready" : ""}
        muted loop playsInline preload="metadata"
        poster={visual.poster ? media(visual.poster) : undefined}
        data-live={live ? "1" : "0"}
        onLoadedData={() => setReady(true)}
      />
    </>
  )
}

function StepCtas({ offer, name, contact, detailHrefBase }: {
  offer: SiteOffer; name: string; contact: Contact; detailHrefBase: string
}) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const wa = whatsappHref(contact.whatsapp, name)
  return (
    <div className="rmn-svc-ctas">
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

export function ServicesShowcase({ offers, contact, detailHrefBase = "/offers" }: {
  offers: SiteOffer[]
  contact: Contact
  detailHrefBase?: string
}) {
  const pick = usePick()
  const { dir } = useLang()
  const rootRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])

  const total = offers.length

  const stage = useMemo(
    () => offers.map((o, i) => ({ visual: resolveStageVisual(o, i), palette: effectivePalette(o, i) })),
    [offers],
  )
  const active = useServicesScroll({ rootRef, stepsRef, bgRef })

  // A video gets its src the first time its step comes within one of the active
  // one, then KEEPS it (re-attaching on every step re-downloaded and flashed the
  // fallback face); only the active video plays. Released on unmount.
  useEffect(() => {
    const vids = videoRefs.current
    for (let i = 0; i < vids.length; i++) {
      const v = vids[i]
      if (!v) continue
      const s = stage[i]?.visual
      if (!s || s.kind !== "video") continue
      if (Math.abs(i - active) <= 1 && !v.getAttribute("src")) v.setAttribute("src", media(s.path))
      if (i === active && v.getAttribute("src")) v.play().catch(() => {}); else v.pause()
    }
    return () => {
      for (const v of vids) {
        if (v?.getAttribute("src")) { v.pause(); v.removeAttribute("src"); v.load() }
      }
    }
  }, [active, stage])

  if (total < 2) return null

  return (
    <div ref={rootRef} className="rmn-svc" data-dir={dir}>
      {/* colour field (section-clipped, sticky — never paints over neighbours):
          one pre-softened wash per offer, the active one faded in */}
      <div className="rmn-svc-bgwrap" aria-hidden>
        <div ref={bgRef} className="rmn-svc-bg">
          {stage.map((s, i) => (
            <span
              key={offers[i].id}
              className={`rmn-svc-wash${i === active ? " on" : ""}`}
              style={{ "--b1": rgbTriplet(s.palette[0]), "--b2": rgbTriplet(s.palette[1]), "--b3": rgbTriplet(s.palette[2]) } as React.CSSProperties}
            />
          ))}
        </div>
      </div>

      <div className="rmn-svc-stage">
        {/* steps */}
        <div ref={stepsRef} className="rmn-svc-steps">
          {offers.map((o, i) => {
            const name = pick(o.name_ar, o.name_en)
            const eyebrow = pick(o.eyebrow_ar, o.eyebrow_en)
            return (
              <section
                key={o.id}
                data-step={i}
                className={`rmn-svc-step${i === active ? " is-active" : ""}`}
              >
                <span className="rmn-svc-chip" aria-hidden>{o.icon || name[0] || "ر"}</span>
                {eyebrow && <span className="rmn-svc-eyebrow">{eyebrow}</span>}
                <h3>{name}</h3>
                <p>{pick(o.summary_ar, o.summary_en)}</p>
                {o.points.length > 0 && (
                  <ul className="rmn-svc-points">
                    {o.points.map((pt, k) => <li key={k}>{pick(pt.ar, pt.en)}</li>)}
                  </ul>
                )}
                <StepCtas offer={o} name={name} contact={contact} detailHrefBase={detailHrefBase} />
              </section>
            )
          })}
        </div>

        {/* sticky glass panel — decorative echo of the active step (aria-hidden) */}
        <div className="rmn-svc-panel">
          <div ref={cardRef} className="rmn-svc-card" aria-hidden>
            <div className="rmn-svc-head">
              <span className="rmn-svc-count" dir="ltr">{twoDigit(active + 1)} / {twoDigit(total)}</span>
              {/* tatreez weave: a stitched thread that fills as you advance */}
              <div className="rmn-svc-weave" style={{ "--p": total > 1 ? active / (total - 1) : 0 } as React.CSSProperties}>
                {offers.map((o, i) => (
                  <i key={o.id} className={i <= active ? "woven" : ""}>✕</i>
                ))}
              </div>
            </div>
            <div className="rmn-svc-visuals">
              {stage.map((s, i) => (
                <div key={offers[i].id} className={`rmn-svc-vis${i === active ? " on" : ""}${Math.abs(i - active) <= 1 ? " near" : ""}`}>
                  <StageFace
                    visual={s.visual}
                    live={Math.abs(i - active) <= 1}
                    videoRef={(el) => { videoRefs.current[i] = el }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServicesShowcase
