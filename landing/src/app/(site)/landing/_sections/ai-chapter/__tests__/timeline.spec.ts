import { describe, it, expect } from "vitest"
import { createTimeline, type Clock } from "../timeline"

// A hand-driven clock: advance(ms) moves time and fires due timers in order.
function manualClock() {
  let now = 0
  let seq = 0
  const timers = new Map<number, { at: number; fn: () => void }>()
  const clock: Clock = {
    now: () => now,
    set: (fn, ms) => { const id = ++seq; timers.set(id, { at: now + ms, fn }); return id },
    clear: (id) => { timers.delete(id as number) },
  }
  const advance = async (ms: number) => {
    const end = now + ms
    for (;;) {
      const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
      if (!due) break
      timers.delete(due[0])
      now = due[1].at
      due[1].fn()
      await Promise.resolve()
    }
    now = end
    await Promise.resolve()
  }
  return { clock, advance, live: () => timers.size }
}

describe("createTimeline", () => {
  it("resolves a wait after its running time", async () => {
    const { clock, advance } = manualClock()
    const tl = createTimeline(clock)
    let done: boolean | null = null
    void tl.wait(300).then((v) => { done = v })
    await advance(299)
    expect(done).toBeNull()
    await advance(1)
    expect(done).toBe(true)
  })

  it("parks while paused, with no timer running, and keeps the time it had left", async () => {
    const { clock, advance, live } = manualClock()
    const tl = createTimeline(clock)
    let done = false
    void tl.wait(500).then(() => { done = true })
    await advance(200)
    tl.pause()
    expect(live()).toBe(0)
    await advance(10_000)
    expect(done).toBe(false)
    tl.resume()
    await advance(299)
    expect(done).toBe(false)
    await advance(1)
    expect(done).toBe(true)
  })

  it("arms a wait created while paused only on resume", async () => {
    const { clock, advance } = manualClock()
    const tl = createTimeline(clock, true)
    let done = false
    void tl.wait(100).then(() => { done = true })
    await advance(1_000)
    expect(done).toBe(false)
    tl.resume()
    await advance(100)
    expect(done).toBe(true)
  })

  it("cancel resolves pending waits with false and refuses new ones", async () => {
    const { clock, advance, live } = manualClock()
    const tl = createTimeline(clock)
    const a = tl.wait(400)
    tl.cancel()
    expect(await a).toBe(false)
    expect(live()).toBe(0)
    expect(await tl.wait(10)).toBe(false)
    await advance(1_000)
    expect(tl.cancelled).toBe(true)
  })

  it("runs a script step by step", async () => {
    const { clock, advance } = manualClock()
    const tl = createTimeline(clock)
    const seen: number[] = []
    void (async () => {
      for (const step of [1, 2, 3]) {
        if (!(await tl.wait(100))) return
        seen.push(step)
      }
    })()
    await advance(250)
    expect(seen).toEqual([1, 2])
    tl.cancel()
    await advance(1_000)
    expect(seen).toEqual([1, 2])
  })
})
