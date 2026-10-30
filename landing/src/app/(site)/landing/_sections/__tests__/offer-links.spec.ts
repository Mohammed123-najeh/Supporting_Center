import { describe, it, expect } from "vitest"
import { mailtoHref, whatsappHref, bodyParagraphs } from "../offer-links"

describe("mailtoHref", () => {
  it("builds a mailto with encoded subject", () => {
    expect(mailtoHref("hi@rummanah.dev", "Smart Dashboard & more")).toBe(
      "mailto:hi@rummanah.dev?subject=Smart%20Dashboard%20%26%20more"
    )
  })
})

describe("whatsappHref", () => {
  it("strips non-digits and builds a wa.me link", () => {
    expect(whatsappHref("+970 (59) 123-4567", "hello")).toBe(
      "https://wa.me/970591234567?text=hello"
    )
  })
  it("returns null for empty/short numbers", () => {
    expect(whatsappHref("", "x")).toBeNull()
    expect(whatsappHref(null, "x")).toBeNull()
    expect(whatsappHref("12345", "x")).toBeNull()
  })
})

describe("bodyParagraphs", () => {
  it("splits on blank lines and trims", () => {
    expect(bodyParagraphs("First para.\n\nSecond para.")).toEqual(["First para.", "Second para."])
  })
  it("handles CRLF blank lines", () => {
    expect(bodyParagraphs("a\r\n\r\nb")).toEqual(["a", "b"])
  })
  it("keeps single newlines inside a paragraph", () => {
    expect(bodyParagraphs("line1\nline2")).toEqual(["line1\nline2"])
  })
  it("drops empty paragraphs", () => {
    expect(bodyParagraphs("\n\n  \n\nreal\n\n")).toEqual(["real"])
    expect(bodyParagraphs("")).toEqual([])
  })
})
