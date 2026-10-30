// The Rummanah pomegranate mark — the same artwork as src/app/icon.svg, cropped to
// the fruit. Replaces the old single-letter "ر" badge, which both Reem Kufi and
// Tajawal drew close to a Latin "J". Inline SVG: crisp at any size, no image
// request, identical in AR/EN and in both themes (the plate is always cream, like
// the favicon). Decorative — the brand NAME beside it carries the meaning.
import type { CSSProperties } from "react"

export function BrandMark({ className = "brand-mark", style }: { className?: string; style?: CSSProperties }) {
  return (
    <span className={className} style={style} aria-hidden="true">
      <svg viewBox="6.25 7 19.5 19.5" focusable="false">
        <path d="M16 9c-3.2-1.6-6-1.3-7.4-.6 1 1.9 3.2 3.3 6 3.2z" fill="#6E6E44" />
        <path d="M16 9c3.2-1.6 6-1.3 7.4-.6-1 1.9-3.2 3.3-6 3.2z" fill="#4C4C29" />
        <path d="M16 10.5c4 0 6.4 3 6.4 7 0 4.6-3 8-6.4 8s-6.4-3.4-6.4-8c0-4 2.4-7 6.4-7z" fill="#A6222C" />
        <path d="M13.8 9.2l1 2 1.2-2.2 1.2 2.2 1-2-.6 2.2h-3.2z" fill="#7E161F" />
        <g fill="#FDF4ED" fillOpacity="0.92">
          <circle cx="16" cy="16.4" r="1" />
          <circle cx="13.6" cy="18" r="1" />
          <circle cx="18.4" cy="18" r="1" />
          <circle cx="16" cy="19.4" r="1" />
          <circle cx="14.4" cy="20.8" r="0.9" />
          <circle cx="17.6" cy="20.8" r="0.9" />
        </g>
      </svg>
    </span>
  )
}
