// Phones (≤760px): a section's cards become ONE horizontal, snap-scrolling
// track — the next card peeks in, dots show where you are — instead of a tall
// scroll-pinned stack. Wider screens: CSS turns the same element back into the
// section's own grid. Server-rendered identically for every viewport (no
// variant swap after hydration, so no layout jump); JS only drives the dots.
// RTL scrolls natively: the track follows the page direction.
"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"

export function SwipeTrack({ className, count, label, children, ...rest }: {
  className: string
  count: number
  /** Accessible name of the dots group, e.g. "Packages". */
  label: string
  children: ReactNode
} & React.HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const track = ref.current
    if (!track) return
    const items = [...track.children] as HTMLElement[]
    // The card mostly inside the track is the current one. On wide screens the
    // track doesn't scroll and every card "intersects" — the dots are hidden there.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setActive(items.indexOf(e.target as HTMLElement))
    }, { root: track, threshold: 0.6 })
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [count])

  const go = (i: number) => {
    const el = ref.current?.children[i] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }

  return (
    <>
      <div ref={ref} className={`${className} rmn-swipe`} {...rest}>{children}</div>
      {count > 1 && (
        <div className="rmn-swipe-dots" role="group" aria-label={label}>
          {Array.from({ length: count }, (_, i) => (
            <button key={i} type="button" className="rmn-swipe-dot" aria-label={`${i + 1} / ${count}`}
              aria-current={i === active ? "true" : undefined} onClick={() => go(i)} />
          ))}
        </div>
      )}
    </>
  )
}
