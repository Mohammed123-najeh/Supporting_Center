import { describe, it, expect } from "vitest"
import type { OfferPalette } from "@/server/site/types"
import {
  smoothstep,
  mixChannel,
  blendZone,
  fractionalProgress,
  paletteAt,
  rgbTriplet,
  twoDigit,
  resolveMockupKind,
  resolveStageVisual,
  effectivePalette,
  DEFAULT_PALETTES,
} from "../scrolly-math"

describe("smoothstep", () => {
  it("clamps below 0 and above 1", () => {
    expect(smoothstep(-1)).toBe(0)
    expect(smoothstep(2)).toBe(1)
  })
  it("hits the endpoints and midpoint exactly", () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 6)
  })
})

describe("mixChannel", () => {
  it("returns endpoints and rounds the blend", () => {
    expect(mixChannel(0, 100, 0)).toBe(0)
    expect(mixChannel(0, 100, 1)).toBe(100)
    expect(mixChannel(0, 255, 0.5)).toBe(128) // 127.5 → 128
  })
  it("clamps t", () => {
    expect(mixChannel(10, 20, -5)).toBe(10)
    expect(mixChannel(10, 20, 5)).toBe(20)
  })
})

describe("blendZone", () => {
  it("is 0 through the settle zone (explicit settle)", () => {
    expect(blendZone(0, 0.5)).toBe(0)
    expect(blendZone(0.4, 0.5)).toBe(0)
    expect(blendZone(0.5, 0.5)).toBe(0)
  })
  it("default settle is small so the blend eases across most of the step", () => {
    // default settle=0.25 → colour has already started blending by mid-step
    expect(blendZone(0.5)).toBeGreaterThan(0)
    expect(blendZone(0.2)).toBe(0)
  })
  it("ramps to 1 by the end of the step", () => {
    expect(blendZone(1)).toBe(1)
    expect(blendZone(0.83)).toBeGreaterThan(0)
    expect(blendZone(0.83)).toBeLessThan(1)
  })
  it("is monotonic across the blend region", () => {
    expect(blendZone(0.9)).toBeGreaterThan(blendZone(0.8))
  })
  it("clamps out-of-range fractions", () => {
    expect(blendZone(-1)).toBe(0)
    expect(blendZone(2)).toBe(1)
  })
})

describe("fractionalProgress", () => {
  const tops = [0, 100, 200]
  const heights = [100, 100, 100]
  it("is 0 before the first step", () => {
    expect(fractionalProgress(tops, heights, -50)).toBe(0)
  })
  it("gives i.0 at each step top and i.5 at its centre", () => {
    expect(fractionalProgress(tops, heights, 100)).toBeCloseTo(1, 6)
    expect(fractionalProgress(tops, heights, 150)).toBeCloseTo(1.5, 6)
  })
  it("clamps to n-1 at/after the last step bottom", () => {
    expect(fractionalProgress(tops, heights, 300)).toBe(2)
    expect(fractionalProgress(tops, heights, 9999)).toBe(2)
  })
  it("handles empty and single-step arrays", () => {
    expect(fractionalProgress([], [], 10)).toBe(0)
    expect(fractionalProgress([0], [100], 50)).toBe(0)
  })
})

describe("paletteAt", () => {
  const A: OfferPalette = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
  const B: OfferPalette = [[100, 100, 100], [100, 100, 100], [100, 100, 100]]
  it("returns the settled palette at an integer progress", () => {
    expect(paletteAt([A, B], 0)).toEqual(A)
    expect(paletteAt([A, B], 1)).toEqual(B)
  })
  it("holds the current palette at the very start of a step (frac ≤ settle)", () => {
    expect(paletteAt([A, B], 0.1)).toEqual(A)
  })
  it("blends toward the next palette across the step", () => {
    const mid = paletteAt([A, B], 0.9)
    expect(mid[0][0]).toBeGreaterThan(0)
    expect(mid[0][0]).toBeLessThan(100)
  })
  it("holds the last palette past the end and handles a single palette", () => {
    expect(paletteAt([A, B], 5)).toEqual(B)
    expect(paletteAt([A], 0.9)).toEqual(A)
  })
  it("falls back to a default palette for an empty list", () => {
    expect(paletteAt([], 0)).toEqual(DEFAULT_PALETTES[0])
  })
})

describe("rgbTriplet + twoDigit", () => {
  it("formats an rgb triplet as a space-separated string", () => {
    expect(rgbTriplet([1, 2, 3])).toBe("1 2 3")
  })
  it("zero-pads to two Latin digits", () => {
    expect(twoDigit(1)).toBe("01")
    expect(twoDigit(6)).toBe("06")
    expect(twoDigit(10)).toBe("10")
  })
})

describe("resolveMockupKind", () => {
  it("honours an explicit visual", () => {
    expect(resolveMockupKind("payments", 0)).toBe("payments")
  })
  it("cycles deterministically for auto", () => {
    expect(resolveMockupKind("auto", 0)).toBe("store")
    expect(resolveMockupKind("auto", 1)).toBe("dashboard")
    expect(resolveMockupKind("auto", 6)).toBe("store") // wraps
  })
})

describe("resolveStageVisual", () => {
  it("uses the mockup when there is no media", () => {
    const v = resolveStageVisual({ media: [], visual: "auto" }, 2)
    expect(v).toEqual({ kind: "mockup", mockup: "payments" })
  })
  it("uses an image when media[0] is an image", () => {
    const v = resolveStageVisual({ media: [{ path: "a.png", kind: "image" }], visual: "store" }, 0)
    expect(v).toEqual({ kind: "image", path: "a.png" })
  })
  it("video WITH poster keeps the poster and mockup fallback", () => {
    const v = resolveStageVisual(
      { media: [{ path: "v.mp4", kind: "video", poster: "p.png" }], visual: "speed" }, 3,
    )
    expect(v).toEqual({ kind: "video", path: "v.mp4", poster: "p.png", fallback: { kind: "mockup", mockup: "speed" } })
  })
  it("poster-less video falls back to a sibling image if present, else the mockup", () => {
    const withImage = resolveStageVisual(
      { media: [{ path: "v.mp4", kind: "video", poster: null }, { path: "b.png", kind: "image" }], visual: "auto" }, 0,
    )
    expect(withImage).toEqual({ kind: "video", path: "v.mp4", poster: null, fallback: { kind: "image", path: "b.png" } })

    const noImage = resolveStageVisual(
      { media: [{ path: "v.mp4", kind: "video", poster: null }], visual: "security" }, 0,
    )
    expect(noImage).toEqual({ kind: "video", path: "v.mp4", poster: null, fallback: { kind: "mockup", mockup: "security" } })
  })
})

describe("effectivePalette", () => {
  it("prefers an explicit custom palette", () => {
    const custom: OfferPalette = [[1, 1, 1], [2, 2, 2], [3, 3, 3]]
    expect(effectivePalette({ palette: custom, visual: "auto" }, 0)).toEqual(custom)
  })
  it("falls back to the curated palette keyed by the resolved visual", () => {
    expect(effectivePalette({ palette: null, visual: "store" }, 0)).toEqual(DEFAULT_PALETTES[0])
    // auto index 1 → dashboard → DEFAULT_PALETTES[1]
    expect(effectivePalette({ palette: null, visual: "auto" }, 1)).toEqual(DEFAULT_PALETTES[1])
  })
})
