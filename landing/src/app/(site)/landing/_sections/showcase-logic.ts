// Pure state machine for the synced device-showcase carousel (no React — unit
// testable). The showcase walks CLIENTS (ci) and, within the active client, its
// screenshot STEPS (si). Both devices advance together on the same tick; a
// device with fewer shots than the other clamps to its last one (steps = max of
// the two counts), so the pair always stays in narrative sync.

export type ShowcaseStep = { ci: number; si: number }

// Steps for one client = max(desktop count, mobile count, 1). A client with no
// screenshots still occupies one step (renders empty frames).
export function stepCount(desktopCount: number, mobileCount: number): number {
  return Math.max(desktopCount, mobileCount, 1)
}

// One tick: advance the shot index within the active client, or roll to the
// next client (wrapping) after its last shot. `counts[i]` is stepCount() for
// client i. Degenerate inputs return the zero state.
export function nextStep(state: ShowcaseStep, counts: number[]): ShowcaseStep {
  if (counts.length === 0) return { ci: 0, si: 0 }
  const ci = Math.min(Math.max(state.ci, 0), counts.length - 1)
  const steps = Math.max(counts[ci] ?? 1, 1)
  if (state.si + 1 < steps) return { ci, si: state.si + 1 }
  return { ci: (ci + 1) % counts.length, si: 0 }
}

// The shot a device shows at step si: clamp/hold on its last image when the
// other device has more shots. Returns -1 when the device has no images.
export function shotIndex(imageCount: number, si: number): number {
  if (imageCount <= 0) return -1
  return Math.min(si, imageCount - 1)
}
