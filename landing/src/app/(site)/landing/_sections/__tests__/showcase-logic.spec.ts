import { describe, it, expect } from "vitest"
import { nextStep, stepCount, shotIndex } from "../showcase-logic"

describe("stepCount", () => {
  it("is the max of the two device counts", () => {
    expect(stepCount(3, 1)).toBe(3)
    expect(stepCount(1, 4)).toBe(4)
  })
  it("is at least 1 even with no screenshots", () => {
    expect(stepCount(0, 0)).toBe(1)
  })
})

describe("nextStep", () => {
  it("advances within the active client's shots", () => {
    expect(nextStep({ ci: 0, si: 0 }, [3, 2])).toEqual({ ci: 0, si: 1 })
    expect(nextStep({ ci: 0, si: 1 }, [3, 2])).toEqual({ ci: 0, si: 2 })
  })

  it("rolls to the next client after the last shot", () => {
    expect(nextStep({ ci: 0, si: 2 }, [3, 2])).toEqual({ ci: 1, si: 0 })
  })

  it("wraps to the first client at the end", () => {
    expect(nextStep({ ci: 1, si: 1 }, [3, 2])).toEqual({ ci: 0, si: 0 })
  })

  it("single-image clients behave like the classic rotation", () => {
    expect(nextStep({ ci: 0, si: 0 }, [1, 1, 1])).toEqual({ ci: 1, si: 0 })
    expect(nextStep({ ci: 2, si: 0 }, [1, 1, 1])).toEqual({ ci: 0, si: 0 })
  })

  it("a single client with multiple shots loops its own shots", () => {
    expect(nextStep({ ci: 0, si: 1 }, [2])).toEqual({ ci: 0, si: 0 })
  })

  it("clamps an out-of-range client index (list shrank)", () => {
    expect(nextStep({ ci: 5, si: 0 }, [1, 1])).toEqual({ ci: 0, si: 0 })
  })

  it("degenerate inputs return the zero state", () => {
    expect(nextStep({ ci: 0, si: 0 }, [])).toEqual({ ci: 0, si: 0 })
    expect(nextStep({ ci: 0, si: 3 }, [0])).toEqual({ ci: 0, si: 0 })
  })
})

describe("shotIndex (clamp/hold on mismatched counts)", () => {
  it("follows the step while in range", () => {
    expect(shotIndex(3, 0)).toBe(0)
    expect(shotIndex(3, 2)).toBe(2)
  })
  it("holds the last shot when the other device has more", () => {
    expect(shotIndex(2, 4)).toBe(1)
  })
  it("returns -1 for a device with no images", () => {
    expect(shotIndex(0, 0)).toBe(-1)
  })
})
