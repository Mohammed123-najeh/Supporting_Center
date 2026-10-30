// Active-step driver for the desktop "services showcase". Scroll only decides
// WHICH step is active; everything that moves (the colour washes cross-fading,
// the weave filling, the visual swapping) is a CSS transition keyed off that one
// piece of state. No scroll listener, no rAF:
//
//   • ONE IntersectionObserver on a middle band of the viewport sets the step.
//   • ONE more fades the sticky colour field in while the section is on screen.
"use client"
import { type RefObject, useEffect, useState } from "react"

interface Options {
  rootRef: RefObject<HTMLElement | null>
  stepsRef: RefObject<HTMLElement | null>
  bgRef: RefObject<HTMLElement | null>
}

export function useServicesScroll({ rootRef, stepsRef, bgRef }: Options): number {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const root = rootRef.current
    const stepsEl = stepsRef.current
    const bg = bgRef.current
    if (!root || !stepsEl || !bg) return
    const steps = Array.from(stepsEl.querySelectorAll<HTMLElement>("[data-step]"))
    if (steps.length < 2) return

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const i = Number((e.target as HTMLElement).dataset.step)
        if (!Number.isNaN(i)) setActive(i)
      }
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 })
    steps.forEach((s) => io.observe(s))

    const visIo = new IntersectionObserver(([e]) => bg.classList.toggle("on", e.isIntersecting), { rootMargin: "15% 0px 15% 0px" })
    visIo.observe(root)

    return () => { io.disconnect(); visIo.disconnect() }
  }, [rootRef, stepsRef, bgRef])

  return active
}
