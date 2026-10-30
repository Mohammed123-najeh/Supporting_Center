import { describe, it, expect } from "vitest"
import { matchIntent } from "../intents"
import { APP, SCENE, REPLIES, LINKS, RULES, type ReplyKey } from "../chat-script"

const reply = (text: string) => matchIntent(text, RULES, "fallback" as ReplyKey)

describe("support-chat replies", () => {
  it("routes what visitors actually type, in both languages", () => {
    const cases: Array<[string, ReplyKey]> = [
      ["Where is my order?", "order"],
      ["can you track it", "order"],
      ["وين طلبي؟", "order"],
      ["متى يوصل الطلب", "order"],
      ["I want to return it", "returns"],
      ["بدي أرجع المنتج", "returns"],
      ["إذا المقاس ما ضبط؟", "returns"],
      ["Book a pickup", "pickup"],
      ["احجز موعد استلام", "pickup"],
      ["Talk to a person", "human"],
      ["أريد التحدث مع موظف", "human"],
      ["how much does it cost?", "price"],
      ["كم سعر الباقة؟", "price"],
      ["شكراً لكم", "thanks"],
      ["thanks!", "thanks"],
      ["hi", "greet"],
      ["مرحبا", "greet"],
      ["هلا", "greet"],
      ["what's the weather like", "fallback"],
      ["🙂", "fallback"],
    ]
    for (const [text, key] of cases) expect([text, reply(text)]).toEqual([text, key])
  })

  it("answers its own quick replies", () => {
    expect(reply(SCENE.quickPickup[0])).toBe("pickup")
    expect(reply(SCENE.quickPickup[1])).toBe("pickup")
    expect(reply(SCENE.quickHuman[0])).toBe("human")
    expect(reply(SCENE.quickHuman[1])).toBe("human")
  })

  it("has both languages everywhere, and no em dashes", () => {
    const all = [
      ...Object.values(APP),
      ...Object.values(SCENE),
      ...Object.values(LINKS),
      ...Object.values(REPLIES).flatMap((r) => [r.text, ...(r.status ? [r.status] : [])]),
    ]
    for (const [ar, en] of all) {
      expect(ar.trim().length).toBeGreaterThan(0)
      expect(en.trim().length).toBeGreaterThan(0)
      expect(ar + en).not.toMatch(/—/)
    }
  })
})
