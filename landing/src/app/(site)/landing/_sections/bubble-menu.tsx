// BubbleMenu — the compact navigation menu (the desktop nav has no menu below
// 1100px; the links just vanish). Adapted from React Bits' BubbleMenu but rebuilt
// on this project's constraints: embroidery-skinned (cream pills, dashed stitch
// outlines, pomegranate hover, .rmn tokens — not the shipped purple), real section
// anchors + the AR/EN + theme toggles, RTL-aware pill rotations, a CSS scale-in
// stagger (a keyframe; skipped entirely under reduced-motion), scroll
// lock + full focus management (trap, restore, Escape).
//
// Two pieces:
//   • BubbleMenuToggle — the hamburger/✕ button; lives in the existing .nav-tools,
//     shown only ≤1100px via CSS. It IS the close button when open.
//   • BubbleMenuOverlay — the full-screen pill menu, mounted as a SIBLING of <nav>
//     (NOT inside it: the nav's backdrop-filter would become the containing block
//     for the fixed overlay and trap/clip it).
"use client"
import { useCallback, useEffect, useRef } from "react"
import { dirSign } from "./motion"

export type BubbleItem = { label: string; href: string }

export function BubbleMenuToggle({ open, onToggle, label, btnRef }: {
  open: boolean; onToggle: () => void; label: string; btnRef?: React.Ref<HTMLButtonElement>
}) {
  return (
    <button
      type="button"
      ref={btnRef}
      className={`tool-btn rmn-bubble-toggle${open ? " open" : ""}`}
      onClick={onToggle}
      aria-label={label}
      aria-expanded={open}
      aria-controls="rmn-bubble-overlay"
    >
      <span className="rmn-bubble-line" />
      <span className="rmn-bubble-line" />
    </button>
  )
}

export function BubbleMenuOverlay({ open, onClose, items, dir, controls, returnFocusTo }: {
  open: boolean
  onClose: () => void
  items: BubbleItem[]
  dir: "rtl" | "ltr"
  controls: React.ReactNode
  /** Element focus returns to on close (the hamburger toggle) — a11y. */
  returnFocusTo?: React.RefObject<HTMLElement | null>
}) {
  const overlayRef = useRef<HTMLElement>(null)
  const pillsRef = useRef<Array<HTMLAnchorElement | null>>([])
  // Keep the latest onClose in a ref so the effects don't re-run when the parent
  // passes a fresh closure each render (which would otherwise re-fire focus/anim).
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  // Scroll lock while open; restore on close/unmount. `prev` is captured only when
  // the effect (re)runs on an open→ change, so it can't latch "hidden".
  useEffect(() => {
    if (!open) return
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = "hidden"
    return () => { html.style.overflow = prev }
  }, [open])

  // Open-transition work: focus the first pill and wire Escape + the focus trap.
  // The staggered pill entrance is a CSS keyframe that plays on mount (site-css
  // .rmn-bubble-pill) — no GSAP download when the menu opens. Depends ONLY on
  // `open`, so a language/theme toggle while open doesn't steal focus.
  useEffect(() => {
    if (!open) return
    const first = pillsRef.current.find(Boolean)
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onCloseRef.current(); return }
      if (e.key !== "Tab") return
      // Focus trap: keep Tab / Shift+Tab inside the overlay.
      const focusables = overlayRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || focusables.length === 0) return
      const list = Array.from(focusables)
      const firstEl = list[0]
      const lastEl = list[list.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && active === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener("keydown", onKey)

    return () => {
      document.removeEventListener("keydown", onKey)
      // Return focus to the toggle that opened the menu (a11y).
      returnFocusTo?.current?.focus()
    }
  }, [open, returnFocusTo])

  // Per-pill rotation accent (mirrored for RTL) and entrance stagger index, as
  // CSS vars the keyframe composes with.
  const pillStyle = useCallback((i: number): React.CSSProperties =>
    ({ ["--rot" as string]: `${(i % 2 ? 5 : -5) * dirSign(dir)}deg`, ["--i" as string]: i }), [dir])

  if (!open) return null
  return (
    <nav
      id="rmn-bubble-overlay"
      className="rmn-bubble-overlay"
      ref={overlayRef}
      aria-label="Mobile navigation"
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <ul className="rmn-bubble-list">
        {items.map((it, i) => (
          <li key={it.href}>
            <a
              ref={(el) => { pillsRef.current[i] = el }}
              href={it.href}
              className="rmn-bubble-pill"
              style={pillStyle(i)}
              onClick={onClose}
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="rmn-bubble-controls">{controls}</div>
    </nav>
  )
}
