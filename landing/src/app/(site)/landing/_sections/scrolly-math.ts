// Pure math + resolution helpers for the desktop "scrollytelling" offers
// showcase. No React, no DOM — unit-tested (see __tests__/scrolly-math.spec.ts).
// The component wires the DOM/rAF around these.
import type { RGB, OfferPalette, OfferVisual, SiteOffer } from "@/server/site/types"

// ── colour + progress math (drives the morphing blob background) ──

const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t)

// Smoothstep easing (clamped) — soft in/out, no overshoot.
export function smoothstep(t: number): number {
  const x = clamp01(t)
  return x * x * (3 - 2 * x)
}

// Linear blend of one 0-255 channel, rounded to an int.
export function mixChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * clamp01(t))
}

// "Settle then blend" rhythm: a colour holds for the first `settle` fraction of a
// step, then smoothsteps to the next over the remainder. A SMALL settle window
// means the colour eases across most of the step — a slow, smooth crossfade rather
// than an abrupt late shift (settle=0.25 → the blend runs over 75% of each step).
// `frac` is the fractional part of the step progress in [0, 1). Returns the blend
// amount toward the NEXT palette in [0, 1].
export function blendZone(frac: number, settle = 0.25): number {
  const f = clamp01(frac)
  if (settle >= 1) return 0
  if (f <= settle) return 0
  return smoothstep((f - settle) / (1 - settle))
}

// Which step (float index) the viewport centre currently sits on, given each
// step's document-offset top + height. Returns 0 before the first step and
// n-1 at/after the last. The fractional part is how far INTO that step the
// centre has travelled — fed to blendZone.
export function fractionalProgress(
  stepTops: number[],
  stepHeights: number[],
  scrollCenter: number,
): number {
  const n = stepTops.length
  if (n === 0) return 0
  if (n === 1) return 0
  if (scrollCenter < stepTops[0]) return 0
  const lastBottom = stepTops[n - 1] + (stepHeights[n - 1] || 0)
  if (scrollCenter >= lastBottom) return n - 1
  for (let i = 0; i < n; i++) {
    const top = stepTops[i]
    const h = stepHeights[i] || 0
    if (scrollCenter >= top && scrollCenter < top + h) {
      return i + (h > 0 ? (scrollCenter - top) / h : 0)
    }
  }
  return n - 1
}

// Interpolate the active palette from a settled progress value. `progress` is
// the float step index (from fractionalProgress). Holds the last palette past
// the end; degrades gracefully with a single palette.
export function paletteAt(palettes: OfferPalette[], progress: number, settle = 0.25): OfferPalette {
  const n = palettes.length
  if (n === 0) return DEFAULT_PALETTES[0]
  if (n === 1) return palettes[0]
  const i = Math.min(Math.max(Math.floor(progress), 0), n - 1)
  const frac = progress - i
  const a = palettes[i]
  const b = palettes[Math.min(i + 1, n - 1)]
  const t = blendZone(frac, settle)
  if (t === 0) return a
  return [
    [mixChannel(a[0][0], b[0][0], t), mixChannel(a[0][1], b[0][1], t), mixChannel(a[0][2], b[0][2], t)],
    [mixChannel(a[1][0], b[1][0], t), mixChannel(a[1][1], b[1][1], t), mixChannel(a[1][2], b[1][2], t)],
    [mixChannel(a[2][0], b[2][0], t), mixChannel(a[2][1], b[2][1], t), mixChannel(a[2][2], b[2][2], t)],
  ]
}

// `"r g b"` string for a CSS custom prop consumed as `rgb(var(--b1) / .55)`.
export function rgbTriplet(c: RGB): string {
  return `${c[0]} ${c[1]} ${c[2]}`
}

// ── counter digits ──
// Latin two-digit ("01", "06", "10"). Deliberately NOT Arabic-Indic: the app
// forces Latin digits in Arabic (ar-EG-u-nu-latn) and the landing's own stats /
// prices are Latin, so the counter stays consistent in both languages.
export function twoDigit(n: number): string {
  const v = Math.max(0, Math.floor(n))
  return v < 10 ? `0${v}` : String(v)
}

// ── stage-visual resolution ──

// The curated fallback palettes, one per mockup visual (used when an offer has
// no custom palette). Warm, cohesive, keep the cream base readable.
const PALETTE_BY_VISUAL: Record<Exclude<OfferVisual, "auto">, OfferPalette> = {
  store:     [[232, 180, 143], [223, 165, 122], [240, 205, 175]],
  dashboard: [[224, 149, 154], [217, 128, 137], [238, 190, 193]],
  payments:  [[232, 201, 138], [224, 185, 110], [242, 222, 180]],
  speed:     [[235, 169, 140], [232, 152, 122], [243, 205, 185]],
  marketing: [[223, 160, 184], [212, 138, 166], [238, 200, 214]],
  security:  [[201, 166, 196], [185, 143, 182], [223, 200, 220]],
}

// The mockup kinds in a stable cycle order for "auto" (by offer position).
export const MOCKUP_CYCLE = [
  "store", "dashboard", "payments", "speed", "marketing", "security",
] as const
export type MockupKind = (typeof MOCKUP_CYCLE)[number]

// Ordered list of the curated palettes for cyclic fallback.
export const DEFAULT_PALETTES: OfferPalette[] = MOCKUP_CYCLE.map((k) => PALETTE_BY_VISUAL[k])

// Resolve the mockup kind for an offer's `visual`: honour an explicit kind,
// else cycle deterministically by index.
export function resolveMockupKind(visual: OfferVisual, index: number): MockupKind {
  if (visual !== "auto") return visual
  return MOCKUP_CYCLE[((index % MOCKUP_CYCLE.length) + MOCKUP_CYCLE.length) % MOCKUP_CYCLE.length]
}

export type StageVisual =
  | { kind: "image"; path: string }
  | { kind: "video"; path: string; poster: string | null; fallback: StageFallback }
  | ({ kind: "mockup" } & { mockup: MockupKind })

type StageFallback = { kind: "image"; path: string } | { kind: "mockup"; mockup: MockupKind }

// What to paint on the sticky stage for an offer:
//   • image media[0]           → the image (full-bleed)
//   • video media[0]           → the video, plus a fallback face shown until the
//                                video is ready AND when the poster is null (the
//                                CMS default) — an image from the offer's media
//                                if any, else the resolved mockup, so the stage
//                                is never blank.
//   • no media                 → the resolved mockup (explicit `visual` or auto)
export function resolveStageVisual(
  offer: Pick<SiteOffer, "media" | "visual">,
  index: number,
): StageVisual {
  const mockup = resolveMockupKind(offer.visual, index)
  const first = offer.media[0]
  if (!first) return { kind: "mockup", mockup }
  if (first.kind === "video") {
    const firstImage = offer.media.find((m) => m.kind === "image")
    const fallback: StageFallback = firstImage
      ? { kind: "image", path: firstImage.path }
      : { kind: "mockup", mockup }
    return { kind: "video", path: first.path, poster: first.poster ?? null, fallback }
  }
  return { kind: "image", path: first.path }
}

// The palette that actually drives the blobs for an offer: an explicit custom
// palette wins, else a curated one keyed by the resolved mockup (so the
// background always harmonises with the stage), cyclic by index.
export function effectivePalette(
  offer: Pick<SiteOffer, "palette" | "visual">,
  index: number,
): OfferPalette {
  if (offer.palette) return offer.palette
  const kind = resolveMockupKind(offer.visual, index)
  return PALETTE_BY_VISUAL[kind]
}
