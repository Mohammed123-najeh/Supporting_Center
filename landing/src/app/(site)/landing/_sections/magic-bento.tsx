// Bento grid for the offers section — the layout used by tablets (600-980px),
// SSR/reduced-motion and the CMS preview (desktop renders the scrollytelling
// variant). On phones the same grid is a horizontal swipe track (SwipeTrack;
// site-css turns it into snap-scrolling cards). Structure only: an optional
// media backdrop, a header row (chip, pinned top) and a content block (eyebrow/
// title/summary/CTAs). The premium cursor effects (spotlight/tilt/particles/
// ripple) were removed when the desktop grid was replaced by the scrolly variant
// — after that change they were only ever reachable for a single-offer desktop
// grid, so ~170 lines of GSAP/rAF wiring were dead weight.
"use client"
import type { ReactNode } from "react"
import { SwipeTrack } from "./swipe"
import "./magic-bento.css"

export function BentoGrid({ count, label, children }: {
  count: number
  /** Accessible name of the phone swipe dots. */
  label: string
  children: ReactNode
}) {
  return (
    <SwipeTrack className="rmn-bento" count={count} label={label} data-count={count}>
      {children}
    </SwipeTrack>
  )
}

// A bento cell: an optional media backdrop, a header row (chip, pinned top) and a
// content block (title/summary/CTAs, at the bottom) — the card's flex column
// pushes them apart.
export function BentoCell({ media, head, children }: { media?: ReactNode; head?: ReactNode; children: ReactNode }) {
  return (
    <div className="rmn-bento-cell">
      {media != null && <div className="rmn-bento-cell-media">{media}</div>}
      <div className="rmn-bento-cell-body">
        {head != null && <div className="rmn-bento-cell-head">{head}</div>}
        <div className="rmn-bento-cell-content">{children}</div>
      </div>
    </div>
  )
}
