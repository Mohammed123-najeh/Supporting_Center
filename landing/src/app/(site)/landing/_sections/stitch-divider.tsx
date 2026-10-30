// The embroidered row of ✕ stitches above a section heading. Rendered by React
// (on the server too), so hydration finds exactly the HTML the server sent — the
// crosses used to be appended by an effect, which broke hydration of sections
// that hydrate later than the page root. Each cross "sews in" (CSS, staggered)
// when the page's reveal observer adds `.in`; `revealed` starts it sewn.
import type { CSSProperties } from "react"

export function StitchDivider({ crosses = 7, revealed = false, style }: {
  crosses?: number
  revealed?: boolean
  style?: CSSProperties
}) {
  return (
    <div className={revealed ? "stitch-divider in" : "stitch-divider"} style={style} aria-hidden="true">
      {Array.from({ length: crosses }, (_, i) => (
        <span key={i} style={{ transitionDelay: `${i * 70}ms` }}>✕</span>
      ))}
    </div>
  )
}
