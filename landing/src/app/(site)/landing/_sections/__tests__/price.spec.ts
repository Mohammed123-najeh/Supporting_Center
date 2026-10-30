import { describe, it, expect } from "vitest"
import { formatPrice } from "../price"

describe("formatPrice", () => {
  it("shows dirhams in the reader's order", () => {
    expect(formatPrice(590, "AED", "en")).toEqual({ text: "AED 590", dir: "ltr" })
    expect(formatPrice(590, "AED", "ar")).toEqual({ text: "590 د.إ", dir: "rtl" })
  })

  it("puts symbols first in both languages", () => {
    expect(formatPrice(290, "USD", "en")).toEqual({ text: "$290", dir: "ltr" })
    expect(formatPrice(290, "USD", "ar")).toEqual({ text: "$290", dir: "ltr" })
    expect(formatPrice(12.5, "eur", "en").text).toBe("€12.5")
  })

  it("tolerates messy CMS codes", () => {
    expect(formatPrice(10, " aed ", "en").text).toBe("AED 10")
    expect(formatPrice(10, "", "en").text).toBe("$10") // blank = the CMS default, USD
    expect(formatPrice(10, "JOD", "ar")).toEqual({ text: "JOD 10", dir: "ltr" }) // unknown → the code
  })

  it("never shows shekels", () => {
    expect(formatPrice(420, "ILS", "ar").text).not.toContain("₪")
  })
})
