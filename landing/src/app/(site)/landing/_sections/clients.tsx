// "Our Clients" section: an auto-scrolling logo loop of the shops powered by the
// platform + a laptop/mobile mockup showcase. Each client can carry SEVERAL
// desktop/mobile screenshots — both devices step through them IN SYNC on a
// CMS-configured interval + animation (fade | slide | pan), then roll to the
// next client. Tall page-capture screenshots additionally pan top→bottom while
// displayed ("smart pan"); any-aspect images fill the frames via object-fit.
// The framed logo + showcase are exported so the CMS live-preview renders them
// identically to production. Embroidery-themed (dashed outlines, plum/olive).
"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  normalizeShowcase,
  type SiteClient, type LogoShape, type LogoFit,
  type ShowcaseSettings, type ShowcaseAnimation,
} from "@/server/site/types"
import { usePick } from "./site-lang"
import { LogoLoop, type LogoItem } from "./logo-loop"
import { nextStep, stepCount, shotIndex } from "./showcase-logic"
import { StitchDivider } from "./stitch-divider"

function media(rel: string | null): string | null {
  return rel ? `/media/${rel}` : null
}

// A client's screenshot sets, with legacy single-path fallback (pre-migration
// rows / older CMS drafts) so one screenshot still renders.
function deviceImages(c: SiteClient): { desktop: string[]; mobile: string[] } {
  const desktop = c.desktop_images?.length
    ? c.desktop_images
    : c.desktop_image_path ? [c.desktop_image_path] : []
  const mobile = c.mobile_images?.length
    ? c.mobile_images
    : c.mobile_image_path ? [c.mobile_image_path] : []
  return { desktop, mobile }
}

function shapeRadius(shape: LogoShape): string {
  switch (shape) {
    case "circle": return "50%"
    case "square": return "10px"
    case "rectangle": return "12px"
    default: return "16px" // rounded
  }
}

// A single logo in its chosen shape frame — dashed embroidery outline. Reused by
// the loop's renderItem AND the CMS shape/fit preview.
export function ClientLogoChip({ client, size = 64 }: { client: SiteClient; size?: number }) {
  const pick = usePick()
  const name = pick(client.name_ar, client.name_en) || "—"
  const src = media(client.logo_path)
  const isWide = client.logo_shape === "rectangle"
  const w = isWide ? Math.round(size * 1.9) : size
  return (
    <div
      className="rmn-client-chip"
      title={name}
      style={{
        width: w, height: size, borderRadius: shapeRadius(client.logo_shape),
        display: "grid", placeItems: "center", overflow: "hidden",
        background: "var(--card)", border: "2px dashed var(--dash)",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: client.logo_fit as LogoFit, padding: client.logo_fit === "contain" ? "12%" : 0 }} />
      ) : (
        <span style={{ fontFamily: "var(--font-kufi)", fontWeight: 700, color: "var(--red)", fontSize: size * 0.32 }}>
          {(name[0] ?? "ر")}
        </span>
      )}
    </div>
  )
}

// One device screen: the active client's shots stacked as absolutely-positioned
// layers (stacking preloads them — no flash on advance). The layer at `index`
// gets `.on`, the previously shown one `.prev` (slide direction). A shot whose
// natural ratio is meaningfully taller than the frame gets `.tall` + the slow
// rmnPan while displayed; hovering the showcase PAUSES the pan in place (CSS
// animation-play-state) — dropping the class used to snap it back to the top.
// `pan` animation renders ONLY the active shot, keyed by src, so the remount
// restarts the pan from the top (original behavior).
function DeviceScreen({ images, alt, index, animation, tallRatio }: {
  images: string[]
  alt: string
  index: number
  animation: ShowcaseAnimation
  tallRatio: number   // frame height/width — laptop 10/16, phone ≈19/9
}) {
  const show = shotIndex(images.length, index)
  const prevRef = useRef(show)
  const prevShown = prevRef.current
  useEffect(() => { prevRef.current = show }, [show])
  // Which shots are "tall" (need the pan) — measured on load, keyed by index.
  const [tall, setTall] = useState<Record<number, boolean>>({})
  const imagesKey = images.join("|")
  useEffect(() => { setTall({}) }, [imagesKey])

  if (show < 0) return <div className="rmn-mock-empty">—</div>

  const measure = (el: HTMLImageElement, i: number) => {
    if (el.naturalWidth > 0 && el.naturalHeight / el.naturalWidth > tallRatio * 1.2) {
      setTall((t) => (t[i] ? t : { ...t, [i]: true }))
    }
  }
  const onLoad = (i: number) => (e: React.SyntheticEvent<HTMLImageElement>) => measure(e.currentTarget, i)
  // Cached images may never fire onLoad (already complete at mount) — measure
  // via the ref too.
  const refCheck = (i: number) => (el: HTMLImageElement | null) => {
    if (el && el.complete) measure(el, i)
  }
  const cls = (i: number, isOn: boolean, isPrev: boolean) =>
    "rmn-shot" +
    (isOn ? " on" : "") +
    (isPrev ? " prev" : "") +
    (tall[i] ? " tall" : "") +
    (tall[i] && isOn ? " rmn-pan run" : "")

  if (animation === "pan") {
    // Single active layer; remount per src restarts rmnPan from the top.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={images[show]} src={media(images[show])!} alt={`${alt} — ${show + 1}`}
        className={cls(show, true, false)} loading="lazy"
        onLoad={onLoad(show)} ref={refCheck(show)} />
    )
  }
  return (
    <>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={media(src)!} alt={`${alt} — ${i + 1}`}
          className={cls(i, i === show, i === prevShown && prevShown !== show)}
          loading="lazy" onLoad={onLoad(i)} ref={refCheck(i)} />
      ))}
    </>
  )
}

// Laptop frame — 16:10 screen.
export function LaptopMock({ images, alt, index, animation }: {
  images: string[]; alt: string; index: number; animation: ShowcaseAnimation
}) {
  return (
    <div className="rmn-laptop">
      <div className="rmn-laptop-screen">
        <DeviceScreen images={images} alt={alt} index={index} animation={animation}
          tallRatio={10 / 16} />
      </div>
      <div className="rmn-laptop-base" aria-hidden />
    </div>
  )
}

// Phone frame — ≈9:19 screen.
export function PhoneMock({ images, alt, index, animation }: {
  images: string[]; alt: string; index: number; animation: ShowcaseAnimation
}) {
  return (
    <div className="rmn-phone">
      <div className="rmn-phone-notch" aria-hidden />
      <div className="rmn-phone-screen">
        <DeviceScreen images={images} alt={alt} index={index} animation={animation}
          tallRatio={19 / 9} />
      </div>
    </div>
  )
}

// The device showcase: laptop + phone side by side. Walks clients (dots), and
// within a client both devices step through its shots together every
// interval_ms; the device with fewer shots holds its last one. Pauses on hover,
// while scrolled out of view or the tab is hidden (a background interval would
// churn transitions unseen), and entirely under prefers-reduced-motion (first
// shot only). Clients cross-fade inside the SAME device frames (no remount), and
// the next client's first shots are fetched ahead so they never flash in.
export function ClientShowcase({ clients, showcase }: {
  clients: SiteClient[]
  showcase?: ShowcaseSettings
}) {
  const pick = usePick()
  const cfg = useMemo(() => normalizeShowcase(showcase ?? {}), [showcase])
  const [step, setStep] = useState({ ci: 0, si: 0 })
  const [paused, setPaused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [inView, setInView] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const withScreens = clients.filter((c) => {
    const { desktop, mobile } = deviceImages(c)
    return desktop.length > 0 || mobile.length > 0
  })
  const list = withScreens.length ? withScreens : clients
  const counts = useMemo(
    () => list.map((c) => {
      const { desktop, mobile } = deviceImages(c)
      return stepCount(desktop.length, mobile.length)
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [list.map((c) => `${c.id}:${deviceImages(c).desktop.length}:${deviceImages(c).mobile.length}`).join(",")]
  )

  // Reset when the client set changes (CMS preview swaps drafts).
  const idsKey = list.map((c) => c.id).join(",")
  useEffect(() => { setStep({ ci: 0, si: 0 }) }, [idsKey])

  // Pause while the tab is hidden.
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === "hidden")
    document.addEventListener("visibilitychange", onVis)
    onVis()
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [])

  // Only cycle while on screen.
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "10% 0px" })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const totalSteps = counts.reduce((a, b) => a + b, 0)
  useEffect(() => {
    if (paused || hidden || !inView || totalSteps <= 1) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced) return
    const t = setInterval(() => setStep((s) => nextStep(s, counts)), cfg.interval_ms)
    return () => clearInterval(t)
  }, [paused, hidden, inView, totalSteps, counts, cfg.interval_ms])

  // Warm the cache with the NEXT client's first shots while this one shows.
  const nextIdx = list.length > 1 ? (Math.min(step.ci, list.length - 1) + 1) % list.length : -1
  const nextClient = nextIdx >= 0 ? list[nextIdx] : undefined
  useEffect(() => {
    if (!inView || !nextClient) return
    const { desktop, mobile } = deviceImages(nextClient)
    for (const src of [desktop[0], mobile[0]]) if (src) new Image().src = media(src)!
  }, [inView, nextClient])

  if (list.length === 0) return null
  const ci = Math.min(step.ci, list.length - 1)
  const c = list[ci]
  const { desktop, mobile } = deviceImages(c)
  const name = pick(c.name_ar, c.name_en)

  return (
    <div ref={rootRef} className="rmn-showcase" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={`rmn-showcase-devices rmn-anim-${cfg.animation}`}>
        <LaptopMock images={desktop} alt={name} index={step.si} animation={cfg.animation} />
        <PhoneMock images={mobile} alt={name} index={step.si} animation={cfg.animation} />
      </div>
      {list.length > 1 && (
        <div className="rmn-showcase-dots" role="tablist" aria-label={name}>
          {list.map((cl, i) => (
            <button key={cl.id} className={`rmn-dot${i === ci ? " on" : ""}`} aria-label={pick(cl.name_ar, cl.name_en)}
              onClick={() => setStep({ ci: i, si: 0 })} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ClientsSection({ clients, showcase }: {
  clients: SiteClient[]
  showcase?: ShowcaseSettings
}) {
  const pick = usePick()
  const active = useMemo(() => clients.filter((c) => c.is_active !== false), [clients])

  // Adaptive strip: few logos read as a premium row of BIG tiles drifting
  // slowly; many logos fall back to the compact marquee. logoHeight must equal
  // the chip size (it drives the loop row height).
  const n = active.length
  const { chip, gap, speed } =
    n <= 4 ? { chip: 88, gap: 72, speed: 28 } :
    n <= 8 ? { chip: 64, gap: 52, speed: 38 } :
             { chip: 56, gap: 44, speed: 45 }

  // Stable per language, so the marquee doesn't rebuild its copies on every render.
  const logos: LogoItem[] = useMemo(() => active.map((c) => ({
    node: <ClientLogoChip client={c} size={chip} />,
    title: pick(c.name_ar, c.name_en),
    href: c.href || undefined,
    ariaLabel: pick(c.name_ar, c.name_en),
  })), [active, chip, pick])

  if (active.length === 0) return null

  return (
    <section className="rmn-section rmn-clients" id="clients">
      <div className="container">
        <div className="section-head reveal">
          <StitchDivider crosses={7} />
          <span className="eyebrow">{pick("عملاؤنا", "Our clients")}</span>
          <h2>{pick("متاجر تعمل بفخر على منصّتنا", "Stores proudly running on our platform")}</h2>
          <p>{pick("علامات تجارية اختارت رمّانة لتشغيل تجارتها الإلكترونية.", "Brands that chose Rummanah to power their commerce.")}</p>
        </div>
      </div>

      {/* Logo loop — full-bleed */}
      <div className="rmn-clients-loop reveal">
        <LogoLoop logos={logos} logoHeight={chip} gap={gap} speed={speed} fadeOut
          fadeOutColor="var(--page)" scaleOnHover hoverSpeed={0}
          ariaLabel={pick("شعارات عملائنا", "Our client logos")} />
      </div>

      {/* Device showcase */}
      <div className="container reveal" style={{ ["--d" as string]: ".1s" }}>
        <ClientShowcase clients={active} showcase={showcase} />
      </div>
    </section>
  )
}
