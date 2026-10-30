// Scene picking for the pay-duo scroll band. Pure, so it is unit-tested.
//
// Each scene owns one invisible zone sentinel in the band. An IntersectionObserver
// whose root is shrunk to the viewport's centre line reports, per zone, whether it
// spans that line ("in"), lies wholly below it, or wholly above it.

export type ZoneState = "below" | "in" | "above"

/** A zone's state from its IntersectionObserver entry fields. */
export function zoneState(isIntersecting: boolean, top: number, line: number): ZoneState {
  if (isIntersecting) return "in"
  return top >= line ? "below" : "above"
}

/** The active scene (1-based). The zones are contiguous, so while the band
 *  crosses the centre line one of them holds it. Before the band every zone is
 *  below (scene 1); after it every zone is above (the last scene). With no zone
 *  "in" — the line exactly on a boundary, or a zero-height zone (a scene merged
 *  away on phones) — the scene is the one right after the zones already passed. */
export function pickScene(zones: readonly ZoneState[]): number {
  const inside = zones.lastIndexOf("in")
  if (inside >= 0) return inside + 1
  const passed = zones.filter((z) => z === "above").length
  return Math.max(1, Math.min(zones.length, passed + 1))
}
