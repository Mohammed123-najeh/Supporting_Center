// When to mount a demo "island" (its JS + CSS are async chunks). False on the
// server and on the first client render, so an island never renders during
// hydration (a second hydration commit re-styles the whole landing). The chunk is
// fetched when the browser is idle (not with Save-Data on), and the island mounts
// one viewport before it scrolls into view, inside a transition so the mount is
// time-sliced.
"use client"
import { startTransition, useEffect, useState, type RefObject } from "react"

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
}

export function useIsland(ref: RefObject<HTMLElement | null>, load: () => Promise<unknown>): boolean {
  const [near, setNear] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const w = window as IdleWindow
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
    const warm = () => { load().catch(() => {}) }
    let cancelWarm = () => {}
    if (!saveData) {
      if (w.requestIdleCallback && w.cancelIdleCallback) {
        const id = w.requestIdleCallback(warm, { timeout: 5000 })
        cancelWarm = () => w.cancelIdleCallback?.(id)
      } else {
        const id = window.setTimeout(warm, 2500)
        cancelWarm = () => window.clearTimeout(id)
      }
    }
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return
      io.disconnect()
      startTransition(() => setNear(true))
    }, { rootMargin: "100% 0px" })
    io.observe(el)
    return () => { io.disconnect(); cancelWarm() }
  }, [ref, load])
  return near
}
