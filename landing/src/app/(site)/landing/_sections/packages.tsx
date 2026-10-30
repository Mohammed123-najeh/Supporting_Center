// Packages / الباقات section. On desktop + tablet the plans render as a plain,
// full-width 3-across grid (.pkg-grid); on phones the same element is a
// horizontal swipe track with dots (SwipeTrack + site-css), so the section stays
// one screen tall instead of a long pinned stack. Each card is the SHARED
// PricingCard (also used by the CMS live-preview), so what the operator previews
// is what ships. The section HEADING
// (eyebrow/title/lead/note) is CMS-editable via site_settings.packages; empty
// fields fall back to the defaults below. Keeps id="packages" for nav anchors +
// CMS layout ordering.
"use client"
import type { PricingPackage, PackagesHeading } from "@/server/site/types"
import { usePick } from "./site-lang"
import { PricingCard } from "./cards"
import { SwipeTrack } from "./swipe"
import { StitchDivider } from "./stitch-divider"
import { PACKAGES_COPY } from "./site-copy"

// Default heading copy — used verbatim when the matching CMS field is empty, so a
// blank field never ships an empty heading (mirrors normalizeCheckout's per-field
// fallback). AR authored, EN translated.
// (The copy lives in site-copy.ts, shared with the site assistant.)
const DEF = PACKAGES_COPY

export function PackagesSection({ packages, heading }: { packages: PricingPackage[]; heading?: PackagesHeading }) {
  const pick = usePick()
  // Pick the operator's value for the current lang; fall back to the default pair
  // when that side is blank (a half-filled bilingual field still renders sensibly).
  const h = (ar: string | undefined, en: string | undefined, def: readonly [string, string]) =>
    pick(ar || def[0], en || def[1])
  if (packages.length === 0) return null

  return (
    <section className="packages" id="packages">
      <div className="container">
        <div className="section-head reveal">
          <StitchDivider crosses={7} />
          <span className="eyebrow">{h(heading?.eyebrow_ar, heading?.eyebrow_en, DEF.eyebrow)}</span>
          <h2>{h(heading?.title_ar, heading?.title_en, DEF.title)}</h2>
          <p>{h(heading?.lead_ar, heading?.lead_en, DEF.lead)}</p>
        </div>
        <SwipeTrack className="pkg-grid" count={packages.length} label={h(heading?.eyebrow_ar, heading?.eyebrow_en, DEF.eyebrow)}>
          {packages.map((pk) => <PricingCard key={pk.id} pkg={pk} ctaFallback />)}
        </SwipeTrack>
        <p className="pkg-note reveal">{h(heading?.note_ar, heading?.note_en, DEF.note)}</p>
      </div>
    </section>
  )
}
