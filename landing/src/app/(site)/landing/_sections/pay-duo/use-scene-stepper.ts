// Scroll only TRIGGERS the pay-duo scenes; CSS transitions then play each one at
// its own fixed pace (pay-duo.css). One IntersectionObserver watches the band's
// zone sentinels against the viewport's centre line and writes the active scene
// to `stage.dataset.scene` (+ aria-current on the rail step) only when it changes:
// no scroll listener, no rAF, a few DOM writes per crossing. A fast flick lands
// on the right scene because CSS transitions retarget from wherever they are.
"use client"
import { useEffect, type RefObject } from "react"
import { pickScene, zoneState, type ZoneState } from "./scene"

export function useSceneStepper(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    const stage = root?.querySelector<HTMLElement>("[data-scene]")
    if (!root || !stage) return
    const zones = [...root.querySelectorAll<HTMLElement>("[data-zone]")]
    const steps = [...root.querySelectorAll<HTMLElement>("[data-step]")]
    const states: ZoneState[] = zones.map(() => "below")

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        states[zones.indexOf(e.target as HTMLElement)] =
          zoneState(e.isIntersecting, e.boundingClientRect.top, e.rootBounds?.top ?? innerHeight / 2)
      }
      const scene = String(pickScene(states))
      if (stage.dataset.scene === scene) return
      stage.dataset.scene = scene
      for (const s of steps) {
        if (s.dataset.step === scene) s.setAttribute("aria-current", "step")
        else s.removeAttribute("aria-current")
      }
    }, { rootMargin: "-50% 0px -50% 0px" })
    zones.forEach((z) => io.observe(z))

    // Promote the device's 3D layers (will-change) only while the band is near
    // the viewport, so they exist before the first transition and cost nothing
    // the rest of the time.
    const live = new IntersectionObserver(([e]) => root.classList.toggle("is-live", e.isIntersecting), { rootMargin: "50% 0px" })
    live.observe(root)

    return () => { io.disconnect(); live.disconnect() }
  }, [rootRef])
}
