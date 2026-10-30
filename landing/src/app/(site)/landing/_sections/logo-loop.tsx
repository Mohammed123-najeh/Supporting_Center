// LogoLoop — auto-scrolling logo marquee (ported from React Bits, TS variant).
// Styles in logo-loop.css (scoped `.rmn-logoloop`). rAF-driven with smooth
// velocity easing; decelerates on hover; edge fade. The loop only runs while it
// is near the viewport and not `paused` (the closed nav mega-dropdown passes
// paused — its hidden panel still "intersects" at the top of the screen), and
// never under prefers-reduced-motion. Laid out LTR in every language; on Arabic
// pages it travels the other way, following the reading direction. Feed
// fadeOutColor = the page's cream/dark token so the edges melt into the ground.
"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLang } from "../../../_ui/lang-context"
import "./logo-loop.css"

export type LogoItem =
  | { node: React.ReactNode; href?: string; title?: string; ariaLabel?: string }
  | { src: string; alt?: string; href?: string; title?: string; width?: number; height?: number }

export interface LogoLoopProps {
  logos: LogoItem[]
  speed?: number
  direction?: "left" | "right"
  width?: number | string
  logoHeight?: number
  gap?: number
  hoverSpeed?: number
  fadeOut?: boolean
  fadeOutColor?: string
  scaleOnHover?: boolean
  renderItem?: (item: LogoItem, key: React.Key) => React.ReactNode
  ariaLabel?: string
  className?: string
  style?: React.CSSProperties
  /** Stop the motion (e.g. while the panel that holds the loop is closed). */
  paused?: boolean
}

const CFG = { SMOOTH_TAU: 0.25, MIN_COPIES: 2, COPY_HEADROOM: 2 } as const
const px = (v?: number | string) => (typeof v === "number" ? `${v}px` : v ?? undefined)

export function LogoLoop({
  logos, speed = 90, direction = "left", width = "100%", logoHeight = 40, gap = 48,
  hoverSpeed = 0, fadeOut = true, fadeOutColor, scaleOnHover = true,
  renderItem, ariaLabel = "Client logos", className, style, paused = false,
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const seqRef = useRef<HTMLUListElement>(null)
  const [seqW, setSeqW] = useState(0)
  const [copies, setCopies] = useState<number>(CFG.MIN_COPIES)
  // Hover and the scroll position live in refs: as state they restarted the loop
  // effect on every hover, which snapped the strip back to its start.
  const hovered = useRef(false)
  const offset = useRef(0)
  const vel = useRef(0)
  const { dir: pageDir } = useLang()

  const targetV = useMemo(() => {
    const mag = Math.abs(speed)
    const sign = direction === "left" ? 1 : -1
    return mag * sign * (speed < 0 ? -1 : 1) * (pageDir === "rtl" ? -1 : 1)
  }, [speed, direction, pageDir])

  const measure = useCallback(() => {
    const cW = containerRef.current?.clientWidth ?? 0
    const w = seqRef.current?.getBoundingClientRect().width ?? 0
    if (w > 0) {
      setSeqW(Math.ceil(w))
      setCopies(Math.max(CFG.MIN_COPIES, Math.ceil(cW / w) + CFG.COPY_HEADROOM))
    }
  }, [])

  // Re-measure on resize + after images load.
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure); measure()
      return () => window.removeEventListener("resize", measure)
    }
    const obs = [containerRef.current, seqRef.current].map((el) => {
      if (!el) return null
      const o = new ResizeObserver(measure); o.observe(el); return o
    })
    measure()
    return () => obs.forEach((o) => o?.disconnect())
  }, [measure, logos, gap, logoHeight])

  useEffect(() => {
    const imgs = seqRef.current?.querySelectorAll("img") ?? []
    if (imgs.length === 0) { measure(); return }
    let left = imgs.length
    const done = () => { if (--left === 0) measure() }
    imgs.forEach((img) => {
      const i = img as HTMLImageElement
      if (i.complete) done()
      else { i.addEventListener("load", done, { once: true }); i.addEventListener("error", done, { once: true }) }
    })
  }, [measure, logos])

  // rAF loop with velocity easing, parked by an IntersectionObserver while
  // off-screen (the marquee stays mounted for the page's lifetime).
  useEffect(() => {
    const track = trackRef.current
    const container = containerRef.current
    if (!track || paused || seqW <= 0) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    let last: number | null = null
    const step = (t: number) => {
      if (last === null) last = t
      const dt = Math.max(0, t - last) / 1000
      last = t
      const target = hovered.current ? hoverSpeed : targetV
      vel.current += (target - vel.current) * (1 - Math.exp(-dt / CFG.SMOOTH_TAU))
      offset.current = (((offset.current + vel.current * dt) % seqW) + seqW) % seqW
      track.style.transform = `translate3d(${-offset.current}px,0,0)`
      raf = requestAnimationFrame(step)
    }
    // `offset` survives parks (no visual jump); only `last` resets so the first
    // frame after a resume doesn't apply a huge dt.
    const play = () => { if (!raf) { last = null; raf = requestAnimationFrame(step) } }
    const pause = () => { if (raf) { cancelAnimationFrame(raf); raf = 0 } }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) play(); else pause() }, { rootMargin: "20% 0px 20% 0px" })
    if (container) io.observe(container)
    else play()
    return () => { pause(); io.disconnect() }
  }, [targetV, seqW, hoverSpeed, paused])

  const renderOne = useCallback((item: LogoItem, key: React.Key) => {
    if (renderItem) return <li className="rmn-logoloop__item" key={key}>{renderItem(item, key)}</li>
    const isNode = "node" in item
    const content = isNode
      ? <span className="rmn-logoloop__node">{item.node}</span>
      : <img src={item.src} width={item.width} height={item.height} alt={item.alt ?? ""} title={item.title} loading="lazy" decoding="async" draggable={false} />
    const label = isNode ? (item.ariaLabel ?? item.title) : (item.alt ?? item.title)
    const inner = item.href
      ? <a className="rmn-logoloop__link" href={item.href} aria-label={label || "logo"} target="_blank" rel="noreferrer noopener">{content}</a>
      : content
    return <li className="rmn-logoloop__item" key={key}>{inner}</li>
  }, [renderItem])

  const lists = useMemo(() =>
    Array.from({ length: copies }, (_, ci) => (
      <ul className="rmn-logoloop__list" key={ci} aria-hidden={ci > 0} ref={ci === 0 ? seqRef : undefined}>
        {logos.map((it, i) => renderOne(it, `${ci}-${i}`))}
      </ul>
    )), [copies, logos, renderOne])

  const cls = ["rmn-logoloop", fadeOut && "rmn-logoloop--fade", scaleOnHover && "rmn-logoloop--scale", className]
    .filter(Boolean).join(" ")

  const rootStyle: React.CSSProperties = {
    width: px(width) ?? "100%",
    ["--ll-gap" as string]: `${gap}px`,
    ["--ll-h" as string]: `${logoHeight}px`,
    ...(fadeOutColor ? { ["--ll-fade" as string]: fadeOutColor } : {}),
    ...style,
  }

  return (
    <div ref={containerRef} className={cls} style={rootStyle} role="region" aria-label={ariaLabel} dir="ltr">
      <div className="rmn-logoloop__track" ref={trackRef}
        onMouseEnter={() => { hovered.current = true }} onMouseLeave={() => { hovered.current = false }}>
        {lists}
      </div>
    </div>
  )
}

export default LogoLoop
