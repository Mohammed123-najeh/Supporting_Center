// A vertical scroll-thread timeline of the electronic-payment features. A single
// continuous line DRAWS DOWNWARD as you scroll through the section (transform
// scaleY — GPU-composited, no repaint, like the founders thread), and each feature
// node reveals as it enters view. Each node carries its own icon, a short line, and
// an inline "more details" disclosure. Deep-linkable: #pay-feat-<slug> (the Payments
// nav dropdown scrolls here + highlights).
//
// Scroll discipline mirrors use-services-scroll.ts: ONE visibility IO gate + ONE
// passive-scroll→rAF writing a change-gated CSS var + ONE ResizeObserver; per-node
// reveal via a second IO. Bails on reduced-motion (line full, all nodes revealed).
"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import type { PaymentFeature } from "@/server/site/types"
import { usePick } from "./site-lang"
import { useLang } from "../../../_ui/lang-context"
import { PaymentFeatureIconGlyph } from "./payment-feature-icons"
import "./payment-features-thread.css"

const T = {
  eyebrow: ["ماذا نوفّر في الدفع", "Inside the payment service"],
  title: ["كل ما تحتاجه لتقبض ثمن عملك", "Everything you need to get paid"],
  more: ["تفاصيل أكثر", "More details"],
  less: ["إخفاء", "Show less"],
} as const

export function PaymentFeaturesThread({ features }: { features: PaymentFeature[] }) {
  const pick = usePick()
  const { dir } = useLang()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const rootRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLSpanElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  // Memoised: as a fresh array every render it re-ran the deep-link effect below on
  // each re-render (e.g. expanding a node), scrolling back to the #hash target.
  const active = useMemo(() => features.filter((f) => f.is_active), [features])

  // Scroll-linked line draw + per-node reveal.
  useEffect(() => {
    const root = rootRef.current
    const line = lineRef.current
    if (!root) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const nodes = Array.from(root.querySelectorAll<HTMLElement>(".rmn-pf-node"))

    if (reduced) {
      if (line) line.style.transform = "scaleY(1)"
      nodes.forEach((n) => n.classList.add("in"))
      return
    }

    // Reveal each node once, as it crosses into the lower-middle of the viewport.
    const revealIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target) }
        }
      },
      { rootMargin: "0px 0px -18% 0px", threshold: 0.2 },
    )
    nodes.forEach((n) => revealIO.observe(n))

    // The line fills proportionally to how far the section has scrolled past the
    // viewport middle. ONE passive scroll listener → ONE rAF → one transform write,
    // gated by a visibility observer so it never runs off-screen.
    let raf = 0
    let running = false
    let lastFill = -1
    const compute = () => {
      raf = 0
      const r = root.getBoundingClientRect()
      const vh = window.innerHeight
      // 0 when the section top reaches the viewport middle, 1 when its bottom does.
      const span = r.height + vh * 0.5
      const fill = Math.max(0, Math.min(1, (vh * 0.75 - r.top) / span))
      if (line && Math.abs(fill - lastFill) > 0.002) {
        lastFill = fill
        line.style.transform = `scaleY(${fill.toFixed(3)})`
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute) }
    const gateIO = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !running) {
            running = true
            window.addEventListener("scroll", onScroll, { passive: true })
            compute()
          } else if (!e.isIntersecting && running) {
            running = false
            window.removeEventListener("scroll", onScroll)
          }
        }
      },
      { rootMargin: "20% 0px 20% 0px", threshold: 0 },
    )
    gateIO.observe(root)

    const ro = new ResizeObserver(() => { if (running) compute() })
    ro.observe(root)

    return () => {
      revealIO.disconnect(); gateIO.disconnect(); ro.disconnect()
      window.removeEventListener("scroll", onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [active.length])

  // Deep-link: when navigated to #pay-feat-<slug> (from the Payments dropdown, now a
  // full-page load onto /electronic-payment), expand + scroll to + flash that node.
  // On a cold load the target starts opacity:0 (its reveal IO hasn't fired) and the
  // rmn-pf-flash keyframes animate only box-shadow — so we must force it visible, and
  // scroll it into view ourselves, or the deep-link lands on an invisible/top-jammed
  // card. scroll-margin-block on .rmn-pf-node keeps it clear of any fixed header.
  useEffect(() => {
    const flash = () => {
      const id = window.location.hash.replace(/^#/, "")
      if (!id.startsWith("pay-feat-")) return
      const el = document.getElementById(id)
      if (!el) return
      const feat = active.find((f) => `pay-feat-${f.slug}` === id)
      if (feat) setOpenId(feat.id)
      el.classList.add("in") // force-reveal (idempotent — the reveal IO also just adds .in)
      el.scrollIntoView({ block: "center", behavior: "smooth" })
      el.classList.remove("rmn-pf-flash")
      // force reflow so re-adding the class restarts the animation
      void el.offsetWidth
      el.classList.add("rmn-pf-flash")
    }
    // Defer the initial run to after first paint + the browser's native pre-hydration
    // hash jump, so the node exists and our scroll wins.
    const raf = requestAnimationFrame(flash)
    window.addEventListener("hashchange", flash)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("hashchange", flash)
    }
  }, [active])

  if (active.length === 0) return null

  return (
    <section className="rmn-pf" id="payment-features" aria-labelledby="rmn-pf-title">
      {/* No `.reveal`: this thread now mounts in THREE hosts — the /electronic-payment
          page, the CMS Payments-tab preview, and (historically) the landing — but only
          the landing runs the reveal IntersectionObserver. `.reveal` without `.in` is
          opacity:0, so the header would be stranded invisible on the other two. */}
      <div className="rmn-pf-head">
        <span className="eyebrow">{p(T.eyebrow)}</span>
        <h2 id="rmn-pf-title" className="kufi">{p(T.title)}</h2>
      </div>

      <div ref={rootRef} className="rmn-pf-track" data-dir={dir}>
        {/* the drawing thread (a track + a filling line) */}
        <span className="rmn-pf-rail" aria-hidden />
        <span ref={lineRef} className="rmn-pf-line" aria-hidden />

        <ol className="rmn-pf-list">
          {active.map((f, i) => {
            const open = openId === f.id
            const num = i + 1 < 10 ? `0${i + 1}` : `${i + 1}`
            return (
              <li
                key={f.id}
                id={`pay-feat-${f.slug}`}
                className={`rmn-pf-node${open ? " is-expanded" : ""}`}
                style={{ ["--d" as string]: `${(i % 3) * 0.08}s` }}
              >
                <span className="rmn-pf-knot" aria-hidden>
                  <PaymentFeatureIconGlyph iconKey={f.icon_key} emoji={f.icon} />
                </span>
                <div className="rmn-pf-card">
                  <span className="rmn-pf-num" dir="ltr" aria-hidden>{num}</span>
                  <h3>{pick(f.title_ar, f.title_en)}</h3>
                  <p className="rmn-pf-sum">{pick(f.summary_ar, f.summary_en)}</p>
                  {(f.body_ar || f.body_en) && (
                    <>
                      <div className="rmn-pf-body" id={`pay-feat-body-${f.slug}`} hidden={!open}>
                        <p>{pick(f.body_ar, f.body_en)}</p>
                      </div>
                      <button
                        type="button"
                        className="rmn-pf-more"
                        aria-expanded={open}
                        aria-controls={`pay-feat-body-${f.slug}`}
                        onClick={() => setOpenId(open ? null : f.id)}
                      >
                        {open ? p(T.less) : p(T.more)}
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default PaymentFeaturesThread
