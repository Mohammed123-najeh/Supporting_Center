// /electronic-payment's live preview: the landing band's six scenes, stepped by a
// timer instead of by scroll. Each scene holds long enough for its CSS
// choreography (pay-duo.css) to finish, then the next one starts; after scene 6 it
// loops. It runs only while the preview is on screen and the tab is visible —
// no rAF, one timeout at a time — and not at all under reduced motion (the static
// layout shows instead). Phones skip scene 2, which is merged into scene 1 there.
"use client"
import { useEffect, type RefObject } from "react"

/** Hold per scene (ms), scenes 1–6. */
const HOLD = [2400, 2200, 3400, 4400, 4800, 5400] as const

export function useSceneAutoplay(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    const stage = root?.querySelector<HTMLElement>("[data-scene]")
    if (!root || !stage) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const phone = window.matchMedia("(max-width: 760px)")

    let scene = 1
    let timer: ReturnType<typeof setTimeout> | undefined
    let onScreen = false
    const advance = () => {
      scene = (scene % 6) + 1
      if (scene === 2 && phone.matches) scene = 3
      stage.dataset.scene = String(scene)
      schedule()
    }
    const schedule = () => {
      clearTimeout(timer)
      if (onScreen && document.visibilityState === "visible") timer = setTimeout(advance, HOLD[scene - 1])
    }
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; schedule() }, { threshold: 0.25 })
    io.observe(root)
    document.addEventListener("visibilitychange", schedule)
    return () => {
      clearTimeout(timer)
      io.disconnect()
      document.removeEventListener("visibilitychange", schedule)
    }
  }, [rootRef])
}
