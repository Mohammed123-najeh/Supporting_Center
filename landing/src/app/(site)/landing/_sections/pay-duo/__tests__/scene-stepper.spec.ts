import { describe, it, expect } from "vitest"
import { pickScene, zoneState, type ZoneState } from "../scene"

// Six contiguous zones, the centre line at `line` px from the band's top: the
// states every zone would report (top/bottom in band coordinates).
function zonesAt(line: number, heights = [100, 100, 100, 100, 100, 100]): ZoneState[] {
  let top = 0
  return heights.map((h) => {
    const s: ZoneState = line < top ? "below" : line < top + h || (h === 0 && line === top) ? "in" : "above"
    top += h
    return s
  })
}

describe("zoneState", () => {
  it("classifies an entry against the centre line", () => {
    expect(zoneState(true, -40, 400)).toBe("in")
    expect(zoneState(false, 500, 400)).toBe("below")
    expect(zoneState(false, 400, 400)).toBe("below") // its top is exactly on the line
    expect(zoneState(false, -300, 400)).toBe("above")
  })
})

describe("pickScene", () => {
  it("is scene 1 before the band and the last scene after it", () => {
    expect(pickScene(zonesAt(-50))).toBe(1)
    expect(pickScene(zonesAt(900))).toBe(6)
  })

  it("follows the zone that holds the line", () => {
    expect([50, 150, 250, 350, 450, 550].map((y) => pickScene(zonesAt(y)))).toEqual([1, 2, 3, 4, 5, 6])
  })

  it("lands on the right scene after a flick, whatever was reported before", () => {
    // One observer pass after a jump from the top of the band to its bottom:
    // zone 1 left the line and zone 6 took it; nothing in between was ever "in".
    expect(pickScene(["above", "above", "above", "above", "above", "in"])).toBe(6)
    // …and straight back up.
    expect(pickScene(["in", "below", "below", "below", "below", "below"])).toBe(1)
  })

  it("resolves a line sitting exactly on a boundary to the next scene", () => {
    expect(pickScene(["above", "above", "below", "below", "below", "below"])).toBe(3)
  })

  it("skips a zero-height (merged) zone on phones", () => {
    const phone = [135, 0, 100, 100, 100, 100] // scene 2 is folded into scene 1
    expect(pickScene(zonesAt(100, phone))).toBe(1)
    expect(pickScene(zonesAt(180, phone))).toBe(3)
  })

  it("never leaves 1…n", () => {
    expect(pickScene([])).toBe(1)
    expect(pickScene(["above"])).toBe(1)
  })
})
