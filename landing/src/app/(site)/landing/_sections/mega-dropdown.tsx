// A big, on-brand nav mega-dropdown, data-driven and reused by BOTH the "Features"
// and "Payments" nav items. Rendered as a FIXED sibling of <nav> (positioned below
// the bar) so it is never trapped/clipped by the nav's backdrop-filter containing
// block nor dragged off-screen by the nav's translateY(-100%) auto-hide.
//
// Interaction is pointer-aware (handled by the parent): hover on fine pointers, tap
// on coarse. This component only renders the panel + rows; open/close + a11y wiring
// live in the parent so a single controller coordinates the two dropdowns and the
// nav's data-dropdown-open pin. Enter/exit is a CSS `.is-open` transition — no JS
// animation lib — matching the landing's "avoid unnecessary JS" idiom.
"use client"
import { useEffect, useRef } from "react"
import { LogoLoop, type LogoItem } from "./logo-loop"
import "./mega-dropdown.css"

export type MegaItem = {
  key: string
  icon: React.ReactNode
  title: string
  subtitle?: string
  href: string
  accent?: string // an rgb() / hex accent for the row's icon chip
}

export function MegaDropdown({
  id,
  labelledBy,
  open,
  items,
  eyebrow,
  heading,
  footerLabel,
  footerHref,
  onRequestClose,
  onItemActivate,
  variant = "rows",
  logos,
  logoHeight,
  logoGap,
  logoSpeed,
  logosAriaLabel,
}: {
  id: string
  labelledBy: string
  open: boolean
  items: MegaItem[]
  eyebrow: string
  heading: string
  footerLabel: string
  footerHref: string
  onRequestClose: () => void
  onItemActivate?: (href: string) => void
  // "logos" swaps the row grid for a LogoLoop marquee — constant height at ANY
  // count, so a Clients dropdown scales to 100+ without overflowing the viewport
  // (the panel has no scroll). `items` is ignored in that mode.
  variant?: "rows" | "logos"
  logos?: LogoItem[]
  logoHeight?: number
  logoGap?: number
  logoSpeed?: number
  logosAriaLabel?: string
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Roving-ish keyboard help: ArrowDown/Up move between links; Esc closes. Focus
  // return is handled by the parent (it owns the trigger).
  useEffect(() => {
    if (!open) return
    const el = panelRef.current
    if (!el) return
    const links = () => Array.from(el.querySelectorAll<HTMLAnchorElement>("a.rmn-mega-row, a.rmn-mega-foot"))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onRequestClose(); return }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
      const all = links()
      const idx = all.indexOf(document.activeElement as HTMLAnchorElement)
      if (idx === -1) return
      e.preventDefault()
      const next = e.key === "ArrowDown" ? Math.min(all.length - 1, idx + 1) : Math.max(0, idx - 1)
      all[next]?.focus()
    }
    el.addEventListener("keydown", onKey)
    return () => el.removeEventListener("keydown", onKey)
  }, [open, onRequestClose])

  return (
    <div
      ref={panelRef}
      id={id}
      role="region"
      aria-labelledby={labelledBy}
      className={`rmn-mega${open ? " is-open" : ""}`}
      hidden={!open}
    >
      <div className="rmn-mega-inner">
        <div className="rmn-mega-head">
          <span className="rmn-mega-eyebrow">{eyebrow}</span>
          <h3 className="kufi">{heading}</h3>
        </div>
        {variant === "logos" && logos ? (
          <div className="rmn-mega-logos">
            <LogoLoop
              logos={logos}
              logoHeight={logoHeight ?? 56}
              gap={logoGap ?? 44}
              speed={logoSpeed ?? 40}
              fadeOut
              paused={!open}
              fadeOutColor="var(--card)"
              scaleOnHover
              hoverSpeed={0}
              ariaLabel={logosAriaLabel}
            />
          </div>
        ) : (
          <div className="rmn-mega-grid">
            {items.map((it) => (
              <a
                key={it.key}
                href={it.href}
                className="rmn-mega-row"
                onClick={() => { onItemActivate?.(it.href); onRequestClose() }}
              >
                <span
                  className="rmn-mega-ic"
                  style={it.accent ? ({ ["--acc" as string]: it.accent } as React.CSSProperties) : undefined}
                  aria-hidden
                >
                  {it.icon}
                </span>
                <span className="rmn-mega-txt">
                  <span className="rmn-mega-title">{it.title}</span>
                  {it.subtitle && <span className="rmn-mega-sub">{it.subtitle}</span>}
                </span>
                <svg className="rmn-mega-arrow" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ))}
          </div>
        )}
        <a href={footerHref} className="rmn-mega-foot" onClick={onRequestClose}>
          {footerLabel}
          <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </a>
      </div>
    </div>
  )
}

export default MegaDropdown
