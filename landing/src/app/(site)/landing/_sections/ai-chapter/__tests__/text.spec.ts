import { describe, it, expect } from "vitest"
import { graphemes } from "../graphemes"
import { chunks, tokenize, wordStep } from "../words"
import { detectScript, matchIntent, normalize, type Rule } from "../intents"

const FSI = "⁨"
const PDI = "⁩"
const strip = (s: string) => s.replace(/[⁨⁩]/g, "")

describe("graphemes", () => {
  it("keeps Arabic marks and emoji with their character", () => {
    expect(graphemes("أهلاً 👋")).toEqual(["أ", "ه", "ل", "اً", " ", "👋"])
    expect(graphemes("Hi!").join("")).toBe("Hi!")
  })
})

describe("tokenize", () => {
  it("keeps a run of left-to-right words as one isolated token inside Arabic", () => {
    const t = tokenize("المبلغ AED 412,000 متأخر", true)
    expect(t.map((x) => x.text)).toEqual(["المبلغ", `${FSI}AED 412,000${PDI}`, "متأخر"])
    expect(tokenize("طلبك #RM-2048 خرج", true)[1].text).toBe(`${FSI}#RM-2048${PDI}`)
  })

  it("leaves Arabic words that carry digits alone", () => {
    expect(tokenize("بين 4 و6 مساءً", true).map((x) => x.text)).toEqual(["بين", `${FSI}4${PDI}`, "و6", "مساءً"])
  })

  it("does not isolate anything in left-to-right text", () => {
    expect(tokenize("Your order #RM-2048 is out", false).map((x) => x.text)).toEqual(["Your", "order", "#RM-2048", "is", "out"])
  })

  it("loses no text: the tokens rebuild the sentence", () => {
    for (const [s, rtl] of [["هلا،  وين صار طلبي؟ 👋", true], ["Done. Tomorrow, 10 AM to 1 PM.", false], ["غداً من 10 AM حتى 1 PM", true]] as const) {
      const t = tokenize(s, rtl)
      expect(t.map((x) => strip(x.text) + (x.space ? " " : "")).join("")).toBe(s.replace(/\s+/g, " ").trim())
      expect(t[t.length - 1].space).toBe(false)
    }
  })

  it("streams a reply in chunks whose every prefix is the sentence so far", () => {
    const s = "Done. It's now booked for tomorrow, 10 AM to 1 PM."
    const c = chunks(s, false, 3)
    expect(c.join("")).toBe(s)
    expect(c[0]).toBe("Done. It's now")
    expect(c[1].startsWith(" ")).toBe(true)
    const ar = chunks("أصبح موعد التوصيل غداً من 10 صباحاً حتى 1 ظهراً", true, 4)
    expect(strip(ar.join(""))).toBe("أصبح موعد التوصيل غداً من 10 صباحاً حتى 1 ظهراً")
    expect(ar.join("")).toContain(`${FSI}10${PDI}`)
  })

  it("caps a whole reply's fade-in", () => {
    expect(wordStep(10)).toBe(30)
    expect(wordStep(70)).toBe(10)
    expect(wordStep(0)).toBe(30)
  })
})

describe("intents", () => {
  type K = "order" | "returns" | "human" | "greet" | "fallback"
  const rules: Rule<K>[] = [
    { key: "human", words: ["human", "person", "موظف"] },
    { key: "returns", words: ["return", "refund", "ارجاع", "استبدال", "مقاس"] },
    { key: "order", words: ["order", "track", "طلب", "وين"] },
    { key: "greet", words: ["hello", "hi", "مرحب", "اهلا"] },
  ]

  it("normalises Arabic spelling variants and marks", () => {
    expect(normalize("إرجاعٌ")).toBe("ارجاع")
    expect(normalize("مُوظَّفة")).toBe("موظفه")
    expect(normalize("  Where IS   my order ")).toBe("where is my order")
  })

  it("detects the script the visitor wrote in", () => {
    expect(detectScript("وين طلبي؟")).toBe("ar")
    expect(detectScript("where is my order")).toBe("en")
    expect(detectScript("👍 123")).toBeNull()
  })

  it("matches by rule order, Arabic anywhere, Latin at a word start", () => {
    expect(matchIntent("Can I talk to a person about my order?", rules, "fallback")).toBe("human")
    expect(matchIntent("بدي أرجع المنتج، وين سياسة الإرجاع؟", rules, "fallback")).toBe("returns")
    expect(matchIntent("tracking please", rules, "fallback")).toBe("order")
    expect(matchIntent("this is great", rules, "fallback")).toBe("fallback")
    expect(matchIntent("أهلاً", rules, "fallback")).toBe("greet")
    expect(matchIntent("", rules, "fallback")).toBe("fallback")
  })

  it("matches '=' words only as whole words", () => {
    const price: Rule<"price" | "thanks" | "x">[] = [
      { key: "price", words: ["=كم", "=hi"] },
      { key: "thanks", words: ["شكرا"] },
    ]
    expect(matchIntent("شكراً لكم", price, "x")).toBe("thanks")
    expect(matchIntent("بكم السعر؟ كم", price, "x")).toBe("price")
    expect(matchIntent("كم سعر الباقة؟", price, "x")).toBe("price")
    expect(matchIntent("his order", price, "x")).toBe("x")
    expect(matchIntent("hi!", price, "x")).toBe("price")
  })
})
