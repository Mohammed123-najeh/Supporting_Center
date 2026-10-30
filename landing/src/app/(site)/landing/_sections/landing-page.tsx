// Rummanah public landing — the user's Palestinian-embroidery design ported to
// React and fitted onto our system. The look (cream/pomegranate/olive, stitch
// motifs, hoop medallion, intro loader) is preserved verbatim; enhancements:
//   • DARK-MODE toggle (our theme engine, persists) + AR/EN real-time toggle
//   • Team + Pricing sections render from the CMS (platform DB), so they're
//     editable in the panel while keeping this exact card styling.
// Fonts (Reem Kufi + Tajawal) come from the site layout via next/font.
"use client"
import { Fragment, useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import type { SiteContent, SectionKey } from "@/server/site/types"
import { useLang } from "../../../_ui/lang-context"
import { useTheme } from "../../../_ui/theme"
import { usePick } from "./site-lang"
import { ClientsSection, ClientLogoChip } from "./clients"
import { type LogoItem } from "./logo-loop"
import { OffersSection } from "./offers"
import { CheckoutSection } from "./checkout/checkout-section"
import { PackagesSection } from "./packages"
import { TeamSection } from "./team"
import { BubbleMenuToggle, BubbleMenuOverlay, type BubbleItem } from "./bubble-menu"
import { MegaDropdown, type MegaItem } from "./mega-dropdown"
import { PaymentFeatureIconGlyph } from "./payment-feature-icons"
import { AiSolutionIconGlyph } from "./ai-solution-icons"
import { AiChapter, type AiScenes } from "./ai-chapter/ai-chapter"
import { ContactSection } from "./contact-section"
import { effectivePalette, rgbTriplet } from "./scrolly-math"
import { BrandMark } from "./brand-mark"
import { whatsappHref } from "./offer-links"
import { WhatsAppIcon } from "./whatsapp-icon"
import { StitchDivider } from "./stitch-divider"
import { COMPANY_COPY } from "./site-copy"

// ── copy (bilingual). English is a first draft; refine anytime. ──
const T = {
  navFeatures: ["ميزات النظام", "Features"],
  navPayment: ["الدفع الإلكتروني", "Payments"],
  navAi: ["الذكاء الاصطناعي", "AI Solutions"],
  navAbout: ["من نحن", "About"],
  navTeam: ["الفريق", "Team"],
  navPackages: ["الباقات", "Packages"],
  navClients: ["عملاؤنا", "Clients"],
  navContact: ["تواصل", "Contact"],
  navCta: ["اطلب متجرك", "Get your store"],
  megaFeaturesEyebrow: ["ماذا نصنع", "What we build"],
  megaFeaturesHeading: ["خدمات تُحاك بإتقان", "Services crafted with care"],
  megaFeaturesAll: ["استعرض كل الخدمات", "Explore all services"],
  megaPayEyebrow: ["الدفع الإلكتروني", "Electronic payment"],
  megaPayHeading: ["كل ما تحتاجه لتقبض", "Everything you need to get paid"],
  megaPayAll: ["استعرض تجربة الدفع", "See the payment experience"],
  megaAiEyebrow: ["الذكاء الاصطناعي", "AI Solutions"],
  megaAiHeading: ["حلول ذكاء اصطناعي تفهم أعمالك", "AI solutions that understand your business"],
  megaAiAll: ["استعرض كل الحلول", "Explore all solutions"],
  megaAboutEyebrow: ["من نحن", "Who we are"],
  megaAboutHeading: ["الفريق المؤسِّس", "The founding team"],
  megaAboutAll: ["تعرّف علينا أكثر", "Get to know us"],
  megaTeamEyebrow: ["فريقنا", "Our team"],
  megaTeamHeading: ["العقول خلف رمّانة", "The minds behind Rummanah"],
  megaTeamAll: ["استعرض الفريق كاملًا", "Meet the whole team"],
  megaClientsEyebrow: ["عملاؤنا", "Our clients"],
  megaClientsHeading: ["متاجر تعمل بفخر على منصّتنا", "Stores proudly on our platform"],
  megaClientsAll: ["استعرض كل العملاء", "See all clients"],
  navMenu: ["القائمة", "Menu"],
  brandSub: ["RUMMANAH TECH", "RUMMANAH TECH"],
  heroEyebrow: ["RUMMANAH TECHNOLOGY SOLUTIONS", "RUMMANAH TECHNOLOGY SOLUTIONS"],
  heroTitle: ["متجرك الإلكتروني، مُطرَّزٌ بإتقان", "Your online store, embroidered with care"],
  heroTitleEm: ["غرزةً غرزة", "stitch by stitch"],
  heroSub: COMPANY_COPY.heroSub,
  heroBtn1: ["اكتشف الباقات", "See packages"],
  heroBtn2: ["تعرّف علينا", "About us"],
  heroLoc: COMPANY_COPY.heroLoc,
  stat1: ["متجرًا مطلقًا", "stores launched"],
  stat2: ["توافرية الخدمة", "uptime"],
  stat3: ["دعم يومي", "support"],
  aboutEyebrow: ["من نحن", "About Us"],
  aboutTitle: COMPANY_COPY.aboutTitle,
  // The company story lives in site-copy.ts (shared with the site assistant).
  aboutP1: COMPANY_COPY.aboutP1,
  aboutP2: COMPANY_COPY.aboutP2,
  aboutP3: COMPANY_COPY.aboutP3,
  aboutMore: ["اقرأ المزيد", "Read more"],
  aboutP4: COMPANY_COPY.aboutP4,
  fact1: COMPANY_COPY.fact1,
  fact2: COMPANY_COPY.fact2,
  fact3: COMPANY_COPY.fact3,
  fact4: COMPANY_COPY.fact4,
  ctaTitle: COMPANY_COPY.ctaTitle,
  ctaLead: COMPANY_COPY.ctaLead,
  ctaBtn: COMPANY_COPY.ctaBtn,
  footTagline: ["أنظمة تجارة إلكترونية عربية أولًا، تُبنى بدقّة الحرفيّ وسرعة التقنية الحديثة.", "Arabic-first e-commerce systems, built with a craftsman's precision and modern speed."],
  footCompany: ["الشركة", "Company"],
  footProduct: ["المنتج", "Product"],
  footContact: ["تواصل", "Contact"],
  footFaq: ["الأسئلة الشائعة", "FAQ"],
  footWa: ["واتساب", "WhatsApp"],
  footAddress: COMPANY_COPY.address,
  footRights: ["© 2026 رمّانة لحلول التقنية — جميع الحقوق محفوظة — دبي، الإمارات العربية المتحدة", "© 2026 Rummanah Technology Solutions — All rights reserved — Dubai, United Arab Emirates"],
} as const

// Intro-loader crosses: 12 points on a circle. Computed once at module load so the
// server and client render the identical inline styles (no hydration drift).
const INTRO_CROSSES = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 - Math.PI / 2
  return { tx: `${(Math.cos(a) * 86).toFixed(1)}px`, ty: `${(Math.sin(a) * 86).toFixed(1)}px` }
})

export function LandingPage({ content, aiScenes }: { content: SiteContent; aiScenes?: AiScenes }) {
  const { lang } = useLang()
  const pick = usePick()
  const p = (pair: readonly [string, string] | readonly string[]) => pick(pair[0], pair[1])
  const rootRef = useRef<HTMLDivElement>(null)
  useLandingEffects(rootRef)

  const { team, packages, clients, offers } = content
  const contact = content.settings.contact
  const footEmail = contact.email || "hello@rummanah.dev"
  const footWa = whatsappHref(contact.whatsapp, p(T.navCta))
  const layout = content.settings.layout
  useRevealObserver(rootRef)

  // ── Reorderable middle sections (order + visibility come from the CMS
  // Layout tab). NAV + HERO always lead, FOOTER always closes. Every section
  // keeps its own empty-guard, so an ordered-but-empty section renders nothing.
  const sections: Record<SectionKey, React.ReactNode> = {
    offers: offers.length > 0
      ? <OffersSection offers={offers} contact={content.settings.contact} />
      : null,
    checkout: <CheckoutSection stages={content.settings.checkout.stages} contact={content.settings.contact} />,
    // The AI chapter: the live support-chat and knowledge demos + the solution chips.
    ai: <AiChapter solutions={content.aiSolutions} contact={content.settings.contact} scenes={aiScenes} />,
    about: (
      <section className="about" id="about">
        <div className="container about-grid">
          <div className="about-copy reveal">
            <StitchDivider crosses={5} style={{ justifyContent: "flex-start" }} />
            <span className="eyebrow">{p(T.aboutEyebrow)}</span>
            <h2>{p(T.aboutTitle)}</h2>
            {/* Company story — four paragraphs, **bold** spans rendered via boldSegs. */}
            <p>{boldSegs(p(T.aboutP1))}</p>
            <p>{boldSegs(p(T.aboutP2))}</p>
            {/* Phones fold paragraphs 3–4 behind a native "Read more" (no JS);
                wider screens show them inline. The other copy is display:none, so
                screen readers only ever meet one. */}
            <div className="about-rest">
              <p>{boldSegs(p(T.aboutP3))}</p>
              <p>{boldSegs(p(T.aboutP4))}</p>
            </div>
            <details className="about-more">
              <summary>{p(T.aboutMore)}</summary>
              <p>{boldSegs(p(T.aboutP3))}</p>
              <p>{boldSegs(p(T.aboutP4))}</p>
            </details>
          </div>
          <div className="about-panel reveal" style={{ ["--d" as string]: ".15s" }}>
            <Fact b={p([T.fact1[0], T.fact1[1]])} s={p([T.fact1[2], T.fact1[3]])} />
            <Fact b={p([T.fact2[0], T.fact2[1]])} s={p([T.fact2[2], T.fact2[3]])} />
            <Fact b={p([T.fact3[0], T.fact3[1]])} s={p([T.fact3[2], T.fact3[3]])} />
            <Fact b={p([T.fact4[0], T.fact4[1]])} s={p([T.fact4[2], T.fact4[3]])} />
          </div>
        </div>
      </section>
    ),
    team: <TeamSection team={team} />,
    packages: packages.length > 0 ? <PackagesSection packages={packages} heading={content.settings.packages} /> : null,
    clients: clients.length > 0
      ? <ClientsSection clients={clients} showcase={content.settings.showcase} />
      : null,
    contact: <ContactSection contact={content.settings.contact} />,
    cta: (
      <section className="cta-band" id="contact">
        <div className="container cta-inner reveal">
          <h2>{p(T.ctaTitle)}</h2>
          <p>{p(T.ctaLead)}</p>
          <a href={`mailto:${content.settings.contact.email || "hello@rummanah.dev"}`} className="btn btn-light">{p(T.ctaBtn)}</a>
        </div>
      </section>
    ),
  }

  return (
    <div ref={rootRef} className="rmn">
      {/* Page-wide gradient GROUND: one fixed, calm, warm gradient behind the whole
          landing so every section sits on a single continuous field — no per-section
          flat bands, no hard seams between sections. Built from tokens (adapts to
          dark). The offers section adds its own vivid per-offer morph on top. */}
      <div className="rmn-ground" aria-hidden="true"><span /><span /></div>
      {/* Scroll-progress "thread": a CSS scroll-driven scaleX (compositor, no JS);
          browsers without scroll timelines get a one-write-per-frame fallback in
          useLandingEffects. transform-origin flips with the page dir in CSS. */}
      <div id="progress" aria-hidden="true" />

      {/* Intro loader — pure CSS, so it runs from the first paint (before
          hydration) and never blocks on JS. Shown only on a desktop first visit
          with JS: the root FOUC script stamps data-js / data-intro-seen on <html>
          and site-css hides it otherwise (phones, reduced motion, return visits,
          no JS). ~1.3 s, then a composited fade/scale out; a click skips it. */}
      <div id="rmn-intro" aria-hidden="true">
        <div className="rmn-intro-stage">
          {/* The inline pomegranate SVG, not the logo PNG: it paints with the
              first frame (no request racing the intro) and leaves the hero logo
              as the page's only priority image. */}
          <div className="rmn-intro-mark">
            <BrandMark className="rmn-intro-glyph" />
          </div>
          {INTRO_CROSSES.map((c, i) => (
            <span key={i} className="x" style={{ "--tx": c.tx, "--ty": c.ty, "--i": i } as React.CSSProperties}>✕</span>
          ))}
          <div className="rmn-intro-word">رمّانة&nbsp;·&nbsp;RUMMANAH</div>
        </div>
      </div>

      <NavBar content={content} />

      {/* HERO — every entrance is a CSS keyframe (site-css: .rmn-in / .rmn-w), so it
          plays on the compositor straight from the server HTML, before hydration.
          Delays are offset by --intro while the desktop intro loader is covering
          the page, so the reveal is actually seen. Reduced motion: no animation. */}
      <header className="hero" id="top">
        <div className="rmn-particles" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} style={{ insetInlineStart: `${10 + i * 19}%`, animationDuration: `${13 + i * 3}s`, animationDelay: `${i * 2.4}s` }}>
              {i % 2 ? "✕" : "·"}
            </i>
          ))}
        </div>
        <svg className="thread-line" preserveAspectRatio="none" viewBox="0 0 1200 14" aria-hidden="true">
          <path id="rmn-thread" d="M0 7 H1200" stroke="#A6222C" strokeWidth="2.5" strokeDasharray="10 8" fill="none" opacity=".5" />
        </svg>
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow rmn-in" lang="en" style={{ "--d": ".1s" } as React.CSSProperties}>{p(T.heroEyebrow)}</span>
            {/* Keyed by language: a toggle remounts every word, so the whole
                headline replays in step (index-keyed spans were reused, and only
                the extra words of the longer language animated, late). */}
            <h1 key={lang}>
              <WordReveal text={p(T.heroTitle)} />{" "}
              <WordReveal text={p(T.heroTitleEm)} em base={0.5} />
            </h1>
            <p className="rmn-in" style={{ "--d": ".75s" } as React.CSSProperties}>{p(T.heroSub)}</p>
            <div className="hero-actions rmn-in" style={{ "--d": ".9s" } as React.CSSProperties}>
              <a href="#packages" className="btn btn-primary">{p(T.heroBtn1)}</a>
              <a href="#about" className="btn btn-ghost">{p(T.heroBtn2)}</a>
            </div>
            <p className="hero-loc rmn-in" style={{ "--d": "1s" } as React.CSSProperties}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.4" /></svg>
              <span>{p(T.heroLoc)}</span>
            </p>
            {/* Final numbers are server-rendered (correct with no JS / slow JS);
                the count-up only runs if it can start with this block's entrance. */}
            <div className="hero-stats rmn-in" style={{ "--d": "1.05s" } as React.CSSProperties}>
              <div className="stat"><b dir="ltr"><span className="count" data-to="40">40</span>+</b><span>{p(T.stat1)}</span></div>
              <div className="stat"><b dir="ltr"><span className="count" data-to="99">99</span>.9%</b><span>{p(T.stat2)}</span></div>
              <div className="stat"><b dir="ltr">24/7</b><span>{p(T.stat3)}</span></div>
            </div>
          </div>
          {/* One transform owner per wrapper (they used to fight over one node):
              entrance scale → scroll parallax → pointer tilt → idle float → scroll rotate. */}
          <div className="hero-art">
            <div className="hero-par">
              <div className="tilt" id="rmn-tilt">
                <div className="hoop-float">
                  <div className="hoop" id="rmn-hoop">
                    <svg className="hoop-ring" viewBox="0 0 100 100" aria-hidden="true">
                      <circle cx="50" cy="50" r="48.6" pathLength={1} />
                    </svg>
                    {/* LCP candidate on desktop: priority-loaded, entrance by transform only. */}
                    <Image className="hoop-logo" src="/Rummanh_logo.png" alt="Rummanah Technology Solutions"
                      width={500} height={500} sizes="(max-width: 760px) 176px, (max-width: 980px) 300px, 360px" priority />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Middle sections in the CMS-configured order (hidden ones skipped). One
          hydration pass on purpose: per-section Suspense boundaries hydrate in
          separate commits, and each re-styled the whole page (TBT ×5 measured). */}
      {layout.order
        .filter((k) => !layout.hidden.includes(k))
        .map((k) => <Fragment key={k}>{sections[k]}</Fragment>)}

      {/* FOOTER */}
      <footer className="rmn-foot">
        <div className="container">
          <div className="foot-grid">
            <div className="foot-brand">
              <div className="foot-brand-row">
                <BrandMark />
                <span className="brand-name">رمّانة<small style={{ letterSpacing: ".32em", fontSize: ".58rem", color: "var(--pink)", display: "block", fontFamily: "var(--font-tajawal)" }}>RUMMANAH TECHNOLOGY SOLUTIONS</small></span>
              </div>
              <p>{p(T.footTagline)}</p>
            </div>
            <div className="foot-links">
              <div>
                <h4>{p(T.footCompany)}</h4>
                <a href="#about">{p(T.navAbout)}</a>
                <a href="#team">{p(T.navTeam)}</a>
                <a href="/contact">{p(T.footContact)}</a>
              </div>
              <div>
                <h4>{p(T.footProduct)}</h4>
                <a href="#features">{p(T.navFeatures)}</a>
                <a href="#packages">{p(T.navPackages)}</a>
                <a href="/contact#faq">{p(T.footFaq)}</a>
              </div>
              <div>
                <h4>{p(T.footContact)}</h4>
                <a href={`mailto:${footEmail}`} dir="ltr">{footEmail}</a>
                {contact.phone && <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} dir="ltr">{contact.phone}</a>}
                {footWa && <a href={footWa} target="_blank" rel="noopener noreferrer">{p(T.footWa)}</a>}
                <address className="foot-addr">{pick(contact.address_ar, contact.address_en) || p(T.footAddress)}</address>
              </div>
            </div>
          </div>
          <div className="foot-base">{p(T.footRights)}</div>
        </div>
      </footer>

      <ActionBar whatsapp={footWa} waLabel={p(T.footWa)} ctaLabel={p(T.navCta)} />
    </div>
  )
}

// The fixed nav, its mega-dropdowns and the compact (bubble) menu. Their open/
// hover state lives HERE, so hovering a nav item re-renders only this subtree —
// it used to re-render the whole landing (every section) on each hover.
function NavBar({ content }: { content: SiteContent }) {
  const { lang, dir, toggle } = useLang()
  const { theme, toggle: toggleTheme } = useTheme()
  const pick = usePick()
  const p = (pair: readonly [string, string] | readonly string[]) => pick(pair[0], pair[1])
  const menuWa = whatsappHref(content.settings.contact.whatsapp, p(T.navCta))
  const [menuOpen, setMenuOpen] = useState(false)
  const menuToggleRef = useRef<HTMLButtonElement>(null)
  // Stable handlers so the overlay's focus/animation effects don't re-run on every
  // NavBar re-render (e.g. when the in-menu AR/EN or theme toggle fires).
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), [])

  // Mobile menu items — the same section anchors as the desktop nav, plus the CTA.
  // Deliberately FLAT: the Features/Payments mega-dropdowns are a wide-screen
  // (≥1101px) affordance; below that the bubble menu jumps to the sections, which
  // themselves list everything (no nested mobile menu).
  const menuItems: BubbleItem[] = [
    { label: p(T.navFeatures), href: "#features" },
    { label: p(T.navAi), href: "#ai-solutions" },
    { label: p(T.navPayment), href: "#electronic-payment" },
    { label: p(T.navAbout), href: "#about" },
    { label: p(T.navTeam), href: "#team" },
    { label: p(T.navPackages), href: "#packages" },
    { label: p(T.navClients), href: "#clients" },
    { label: p(T.navContact), href: "/contact" },
    { label: p(T.navCta), href: "#contact" },
  ]

  // ── Nav mega-dropdowns (Features, Payments, About, Team, Clients), pointer-gated. ──
  const { offers: navOffers, paymentFeatures: navPayFeats, aiSolutions: navAi, team: navTeam, clients: navClients } = content
  type MenuKey = "features" | "payments" | "ai" | "about" | "team" | "clients"
  const [openMenu, setOpenMenu] = useState<null | MenuKey>(null)
  // Fine pointer (mouse) → open on hover with a small close delay; coarse (touch)
  // → tap toggles. Read once on mount (SSR-safe: assume no hover until known).
  const finePointer = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    finePointer.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches
  }, [])
  const clearClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = undefined } }
  const openNow = useCallback((which: MenuKey) => { clearClose(); setOpenMenu(which) }, [])
  const scheduleClose = useCallback(() => {
    clearClose()
    closeTimer.current = setTimeout(() => setOpenMenu(null), 140)
  }, [])
  const closeMega = useCallback(() => { clearClose(); setOpenMenu(null) }, [])
  // Pin the nav (don't auto-hide on scroll) while a dropdown is open — mirrors the
  // existing menuOpen guard in applyNav. Read from the DOM attribute there.
  useEffect(() => {
    const nav = document.getElementById("rmn-nav")
    if (nav) { if (openMenu) nav.dataset.dropdownOpen = "1"; else delete nav.dataset.dropdownOpen }
  }, [openMenu])

  const featureItems: MegaItem[] = navOffers
    .filter((o) => o.is_active !== false)
    .map((o, i) => ({
      key: o.id,
      icon: o.icon ? <span className="rmn-mega-ic-emoji">{o.icon}</span> : <span className="rmn-mega-ic-emoji">{(o.name_en || o.name_ar || "•")[0]}</span>,
      title: pick(o.name_ar, o.name_en),
      subtitle: pick(o.summary_ar, o.summary_en),
      href: `/offers/${o.slug}`,
      accent: `rgb(${rgbTriplet(effectivePalette(o, i)[0])})`,
    }))
  const payItems: MegaItem[] = navPayFeats
    .filter((f) => f.is_active !== false)
    .map((f) => ({
      key: f.id,
      icon: <PaymentFeatureIconGlyph iconKey={f.icon_key} emoji={f.icon} />,
      title: pick(f.title_ar, f.title_en),
      subtitle: pick(f.summary_ar, f.summary_en),
      // The thread now lives on /electronic-payment, so deep-link to that page's node.
      href: `/electronic-payment#pay-feat-${f.slug}`,
    }))
  const aiItems: MegaItem[] = navAi
    .filter((s) => s.is_active !== false)
    .map((s) => ({
      key: s.id,
      icon: <AiSolutionIconGlyph iconKey={s.icon_key} emoji={s.icon} />,
      title: pick(s.title_ar, s.title_en),
      subtitle: pick(s.summary_ar, s.summary_en),
      // Full detail lives on /ai-solutions, so deep-link to that page's block.
      href: `/ai-solutions#ai-${s.slug}`,
    }))

  // A hoop-framed avatar for the About/Team rows — echoes the Team section's look
  // (dashed embroidery ring), with an initials fallback when there's no photo.
  const teamAvatar = (m: (typeof navTeam)[number]) => {
    const name = pick(m.name_ar, m.name_en)
    const src = m.image_path ? `/media/${m.image_path}` : null
    return src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" loading="lazy" className="rmn-mega-avatar-img" />
    ) : (
      <span className="rmn-mega-avatar-fb">{(name.trim()[0] ?? "ر")}</span>
    )
  }
  const teamToItem = (m: (typeof navTeam)[number]): MegaItem => ({
    key: m.id,
    icon: teamAvatar(m),
    title: pick(m.name_ar, m.name_en),
    subtitle: pick(m.role_ar, m.role_en),
    href: "#team",
  })
  const activeTeam = navTeam.filter((m) => m.is_active !== false)
  // About = the featured founders (CEO/co-founders); fall back to the first member
  // if none are flagged (mirrors the Team section). Team = the full roster.
  const founders = activeTeam.filter((m) => m.is_featured)
  const aboutItems: MegaItem[] = (founders.length > 0 ? founders : activeTeam.slice(0, 1)).map(teamToItem)
  const teamItems: MegaItem[] = activeTeam.map(teamToItem)

  // Clients dropdown = a LogoLoop marquee (constant height at ANY count → scales to
  // 100+ without overflowing the fixed panel). Adaptive sizing mirrors ClientsSection.
  const activeClients = navClients.filter((c) => c.is_active !== false)
  const clientChip = activeClients.length <= 4 ? 72 : activeClients.length <= 8 ? 60 : 52
  const clientLogos: LogoItem[] = activeClients.map((c) => ({
    node: <ClientLogoChip client={c} size={clientChip} />,
    title: pick(c.name_ar, c.name_en),
    href: c.href || undefined,
    ariaLabel: pick(c.name_ar, c.name_en),
  }))

  // Shared props for a nav trigger that owns a dropdown.
  const triggerProps = (which: MenuKey) => ({
    onMouseEnter: () => { if (finePointer.current) openNow(which) },
    onMouseLeave: () => { if (finePointer.current) scheduleClose() },
    onFocus: () => openNow(which),
    onClick: (e: React.MouseEvent) => {
      // Coarse pointer: first tap opens the panel instead of jumping to the anchor.
      if (!finePointer.current && openMenu !== which) { e.preventDefault(); openNow(which) }
    },
  })

  return (
    <>
        {/* NAV */}
        <nav className="rmn-nav" id="rmn-nav" data-menu-open={menuOpen ? "1" : undefined}>
          <div className="nav-inner">
            <a href="#top" className="brand">
              <BrandMark />
              <span className="brand-name">رمّانة<small>{p(T.brandSub)}</small></span>
            </a>
            <div className="nav-links">
              <span className="nav-has-mega" onMouseEnter={triggerProps("features").onMouseEnter} onMouseLeave={triggerProps("features").onMouseLeave}>
                <a href="#features" id="nav-features" aria-haspopup="true" aria-expanded={openMenu === "features"} aria-controls="mega-features"
                  onFocus={triggerProps("features").onFocus} onClick={triggerProps("features").onClick}>{p(T.navFeatures)}</a>
              </span>
              {aiItems.length > 0 ? (
                <span className="nav-has-mega" onMouseEnter={triggerProps("ai").onMouseEnter} onMouseLeave={triggerProps("ai").onMouseLeave}>
                  <a href="#ai-solutions" id="nav-ai" aria-haspopup="true" aria-expanded={openMenu === "ai"} aria-controls="mega-ai"
                    onFocus={triggerProps("ai").onFocus} onClick={triggerProps("ai").onClick}>{p(T.navAi)}</a>
                </span>
              ) : <a href="#ai-solutions">{p(T.navAi)}</a>}
              <span className="nav-has-mega" onMouseEnter={triggerProps("payments").onMouseEnter} onMouseLeave={triggerProps("payments").onMouseLeave}>
                <a href="#electronic-payment" id="nav-payments" aria-haspopup="true" aria-expanded={openMenu === "payments"} aria-controls="mega-payments"
                  onFocus={triggerProps("payments").onFocus} onClick={triggerProps("payments").onClick}>{p(T.navPayment)}</a>
              </span>
              {aboutItems.length > 0 ? (
                <span className="nav-has-mega" onMouseEnter={triggerProps("about").onMouseEnter} onMouseLeave={triggerProps("about").onMouseLeave}>
                  <a href="#about" id="nav-about" aria-haspopup="true" aria-expanded={openMenu === "about"} aria-controls="mega-about"
                    onFocus={triggerProps("about").onFocus} onClick={triggerProps("about").onClick}>{p(T.navAbout)}</a>
                </span>
              ) : <a href="#about">{p(T.navAbout)}</a>}
              {teamItems.length > 0 ? (
                <span className="nav-has-mega" onMouseEnter={triggerProps("team").onMouseEnter} onMouseLeave={triggerProps("team").onMouseLeave}>
                  <a href="#team" id="nav-team" aria-haspopup="true" aria-expanded={openMenu === "team"} aria-controls="mega-team"
                    onFocus={triggerProps("team").onFocus} onClick={triggerProps("team").onClick}>{p(T.navTeam)}</a>
                </span>
              ) : <a href="#team">{p(T.navTeam)}</a>}
              <a href="#packages">{p(T.navPackages)}</a>
              {clientLogos.length > 0 ? (
                <span className="nav-has-mega" onMouseEnter={triggerProps("clients").onMouseEnter} onMouseLeave={triggerProps("clients").onMouseLeave}>
                  <a href="#clients" id="nav-clients" aria-haspopup="true" aria-expanded={openMenu === "clients"} aria-controls="mega-clients"
                    onFocus={triggerProps("clients").onFocus} onClick={triggerProps("clients").onClick}>{p(T.navClients)}</a>
                </span>
              ) : <a href="#clients">{p(T.navClients)}</a>}
              {/* Plain <a> (not next/link) → full navigation to the standalone /contact
                  page (middleware rewrites it on the public host). */}
              <a href="/contact">{p(T.navContact)}</a>
            </div>
            <div className="nav-tools">
              <button className="tool-btn" onClick={toggle} aria-label="Language" title="AR / EN">
                {lang === "ar" ? "EN" : "ع"}
              </button>
              <button className="tool-btn" onClick={toggleTheme} aria-label="Theme" title="Light / Dark">
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
                )}
              </button>
              <MagneticCTA label={p(T.navCta)} />
              <BubbleMenuToggle open={menuOpen} onToggle={toggleMenu} label={p(T.navMenu)} btnRef={menuToggleRef} />
            </div>
          </div>
        </nav>

        {/* Nav mega-dropdowns — FIXED siblings of <nav> (not absolute children: the
            nav's backdrop-filter would trap them and its auto-hide translate would
            drag them off-screen). Keep open while the panel itself is hovered so the
            pointer can travel from the trigger into the panel. Wide screens only
            (CSS hides the whole thing ≤1100px, where the bubble menu takes over). */}
        {featureItems.length > 0 && (
          <div
            onMouseEnter={() => { if (finePointer.current) openNow("features") }}
            onMouseLeave={() => { if (finePointer.current) scheduleClose() }}
          >
            <MegaDropdown
              id="mega-features" labelledBy="nav-features" open={openMenu === "features"}
              items={featureItems} eyebrow={p(T.megaFeaturesEyebrow)} heading={p(T.megaFeaturesHeading)}
              footerLabel={p(T.megaFeaturesAll)} footerHref="#features" onRequestClose={closeMega}
            />
          </div>
        )}
        {payItems.length > 0 && (
          <div
            onMouseEnter={() => { if (finePointer.current) openNow("payments") }}
            onMouseLeave={() => { if (finePointer.current) scheduleClose() }}
          >
            <MegaDropdown
              id="mega-payments" labelledBy="nav-payments" open={openMenu === "payments"}
              items={payItems} eyebrow={p(T.megaPayEyebrow)} heading={p(T.megaPayHeading)}
              footerLabel={p(T.megaPayAll)} footerHref="#electronic-payment" onRequestClose={closeMega}
            />
          </div>
        )}
        {aiItems.length > 0 && (
          <div
            onMouseEnter={() => { if (finePointer.current) openNow("ai") }}
            onMouseLeave={() => { if (finePointer.current) scheduleClose() }}
          >
            <MegaDropdown
              id="mega-ai" labelledBy="nav-ai" open={openMenu === "ai"}
              items={aiItems} eyebrow={p(T.megaAiEyebrow)} heading={p(T.megaAiHeading)}
              footerLabel={p(T.megaAiAll)} footerHref="#ai-solutions" onRequestClose={closeMega}
            />
          </div>
        )}
        {aboutItems.length > 0 && (
          <div
            onMouseEnter={() => { if (finePointer.current) openNow("about") }}
            onMouseLeave={() => { if (finePointer.current) scheduleClose() }}
          >
            <MegaDropdown
              id="mega-about" labelledBy="nav-about" open={openMenu === "about"}
              items={aboutItems} eyebrow={p(T.megaAboutEyebrow)} heading={p(T.megaAboutHeading)}
              footerLabel={p(T.megaAboutAll)} footerHref="#about" onRequestClose={closeMega}
            />
          </div>
        )}
        {teamItems.length > 0 && (
          <div
            onMouseEnter={() => { if (finePointer.current) openNow("team") }}
            onMouseLeave={() => { if (finePointer.current) scheduleClose() }}
          >
            <MegaDropdown
              id="mega-team" labelledBy="nav-team" open={openMenu === "team"}
              items={teamItems} eyebrow={p(T.megaTeamEyebrow)} heading={p(T.megaTeamHeading)}
              footerLabel={p(T.megaTeamAll)} footerHref="#team" onRequestClose={closeMega}
            />
          </div>
        )}
        {clientLogos.length > 0 && (
          <div
            onMouseEnter={() => { if (finePointer.current) openNow("clients") }}
            onMouseLeave={() => { if (finePointer.current) scheduleClose() }}
          >
            <MegaDropdown
              id="mega-clients" labelledBy="nav-clients" open={openMenu === "clients"}
              items={[]} variant="logos" logos={clientLogos} logoHeight={clientChip}
              logoGap={clientChip <= 52 ? 44 : 52} logoSpeed={clientLogos.length > 8 ? 45 : 34}
              logosAriaLabel={p(T.navClients)}
              eyebrow={p(T.megaClientsEyebrow)} heading={p(T.megaClientsHeading)}
              footerLabel={p(T.megaClientsAll)} footerHref="#clients" onRequestClose={closeMega}
            />
          </div>
        )}

        {/* MOBILE MENU overlay — sibling of <nav> (the nav's backdrop-filter would
            trap a fixed child). Carries the section anchors + AR/EN + theme toggles. */}
        <BubbleMenuOverlay
          open={menuOpen}
          onClose={closeMenu}
          items={menuItems}
          dir={dir}
          returnFocusTo={menuToggleRef}
          controls={
            <>
              {menuWa && (
                <a className="btn btn-primary btn-wa rmn-bubble-wa" href={menuWa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> {p(T.footWa)}</a>
              )}
              <button className="tool-btn" onClick={toggle} aria-label="Language" title="AR / EN">
                {lang === "ar" ? "EN" : "ع"}
              </button>
              <button className="tool-btn" onClick={toggleTheme} aria-label="Theme" title="Light / Dark">
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
                )}
              </button>
            </>
          }
        />
    </>
  )
}

// Phones: WhatsApp + "Get your store", pinned to the bottom once the hero has
// scrolled away, hidden again over the footer (and, by CSS, while the menu is
// open). One observer; the slide is a CSS transform.
function ActionBar({ whatsapp, waLabel, ctaLabel }: { whatsapp: string | null; waLabel: string; ctaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bar = ref.current
    const hero = document.querySelector<HTMLElement>(".rmn .hero")
    const foot = document.querySelector<HTMLElement>(".rmn footer.rmn-foot")
    if (!bar || !hero || !foot) return
    let pastHero = false
    let atFoot = false
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) pastHero = !e.isIntersecting && e.boundingClientRect.top < 0
        else atFoot = e.isIntersecting
      }
      bar.classList.toggle("on", pastHero && !atFoot)
    })
    io.observe(hero)
    io.observe(foot)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} className="rmn-actionbar">
      {whatsapp && (
        <a className="btn btn-primary btn-wa" href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> {waLabel}</a>
      )}
      <a className="btn btn-primary" href="#contact">{ctaLabel}</a>
    </div>
  )
}

// Headline text split into WORDS (not chars — Arabic shaping), each rising out of
// its own clip mask, staggered — a CSS keyframe (site-css `.rmn-w i`), so it runs
// before hydration. The separating space is a plain text node BETWEEN the
// inline-block word boxes: inside one, the browser strips it as end-of-line
// whitespace (that is what glued "Youronlinestore" together). `em` = red, kept on
// one line, with ONE stitch underline sewn across the whole group.
function WordReveal({ text, em, base = 0.28 }: { text: string; em?: boolean; base?: number }) {
  const words = text.split(/\s+/).filter(Boolean).map((w, i) => (
    <Fragment key={i}>
      {i > 0 && " "}
      <span className="rmn-w" style={{ "--i": i, "--b": `${base}s` } as React.CSSProperties}>
        <i>{w}</i>
      </span>
    </Fragment>
  ))
  return em ? <span className="em-group">{words}</span> : <>{words}</>
}

// Magnetic nav CTA — on fine pointers the button eases toward the cursor. The
// offset lives in two CSS variables (one rAF-coalesced write per pointer frame);
// the CSS transition supplies the spring-like follow and :active the tap squash.
// The server and the first client render are identical (plain link), and coarse /
// reduced-motion pointers never attach the listeners.
function MagneticCTA({ label }: { label: string }) {
  const ref = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia("(pointer: fine)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let rect: DOMRect | null = null
    let raf = 0
    let mx = 0
    let my = 0
    const apply = () => {
      raf = 0
      el.style.setProperty("--mx", `${mx.toFixed(1)}px`)
      el.style.setProperty("--my", `${my.toFixed(1)}px`)
    }
    const onEnter = () => { rect = el.getBoundingClientRect() }
    const onMove = (e: PointerEvent) => {
      const r = rect ?? (rect = el.getBoundingClientRect())
      mx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 12
      my = ((e.clientY - (r.top + r.height / 2)) / r.height) * 8
      if (!raf) raf = requestAnimationFrame(apply)
    }
    const onLeave = () => { rect = null; mx = 0; my = 0; if (!raf) raf = requestAnimationFrame(apply) }
    el.addEventListener("pointerenter", onEnter)
    el.addEventListener("pointermove", onMove)
    el.addEventListener("pointerleave", onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("pointerenter", onEnter)
      el.removeEventListener("pointermove", onMove)
      el.removeEventListener("pointerleave", onLeave)
    }
  }, [])
  return <a ref={ref} href="#contact" className="btn btn-primary nav-cta">{label}</a>
}

function Fact({ b, s }: { b: string; s: string }) {
  return <div className="fact"><span className="fact-x">✚</span><div><b>{b}</b><span>{s}</span></div></div>
}

// Render a string with **bold** markdown spans as React nodes (<strong> for the
// bold parts, plain text otherwise). Used for the About company copy so operator-
// authored emphasis (founder names, service pillars) renders as bold. Splitting on
// the paired ** keeps it dependency-free; odd/unclosed markers just render literally.
function boldSegs(text: string): React.ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    // Odd indices are the captured (bold) groups; even indices are plain runs.
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>
  )
}


// Reveals + stitch dividers: one observer adds `.in` as each enters the
// viewport. It runs after the page has hydrated (a class added to server HTML
// React hasn't hydrated yet is a mismatch). Nodes a section mounts LATER (a
// variant swapped in after hydration) are picked up by the MutationObserver, so
// nothing can stay stranded at opacity 0.
function useRevealObserver(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in")
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.18 })
    const SEL = ".reveal:not(.in), .stitch-divider:not(.in)"
    root.querySelectorAll<HTMLElement>(SEL).forEach((el) => io.observe(el))
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches(SEL)) io.observe(node)
          node.querySelectorAll<HTMLElement>(SEL).forEach((el) => io.observe(el))
        })
      }
    })
    mo.observe(root, { childList: true, subtree: true })
    return () => { io.disconnect(); mo.disconnect() }
  }, [rootRef])
}

// All the imperative animations from the original, as one effect. Guards on
// prefers-reduced-motion. Cleans up listeners/observers on unmount.
function useLandingEffects(rootRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cleanups: Array<() => void> = []

    // Hero count-up. The final numbers are server-rendered, so with no JS, slow
    // JS or reduced motion they are already right. The count-up only runs when
    // the stats block's CSS entrance has NOT started yet (it is still invisible in
    // its delay phase): the digits are zeroed then and counted up in sync with the
    // entrance's `animationstart`. A late hydration simply keeps the final numbers.
    const stats = root.querySelector<HTMLElement>(".hero-stats")
    const counters = root.querySelectorAll<HTMLElement>(".hero-stats .count")
    const statsAnim = stats?.getAnimations?.()[0]
    const statsTiming = statsAnim?.effect?.getComputedTiming()
    const statsPending = !reduced && !!statsAnim && typeof statsTiming?.localTime === "number" &&
      statsTiming.localTime < (Number(statsAnim.effect?.getTiming().delay) || 0)
    if (stats && counters.length && statsPending) {
      counters.forEach((c) => { c.textContent = "0" })
      const countUp = () => {
        counters.forEach((c) => {
          const to = Number(c.dataset.to), dur = 1400, t0 = performance.now()
          const tick = (now: number) => {
            const pr = Math.min((now - t0) / dur, 1)
            c.textContent = String(Math.round(to * (1 - Math.pow(1 - pr, 3))))
            if (pr < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        })
      }
      stats.addEventListener("animationstart", countUp, { once: true })
      cleanups.push(() => stats.removeEventListener("animationstart", countUp))
    }


    // Sections with ambient, never-ending CSS animations (hero particles + float,
    // the showcase blobs, the AI pulse, the clients pan) get data-off while
    // out of view, which pauses them (site-css). Invisible motion still costs
    // frames; a paused animation resumes exactly where it stopped.
    const offIO = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.toggleAttribute("data-off", !e.isIntersecting)
    }, { rootMargin: "120px 0px" })
    root.querySelectorAll(".hero, .offers, .rmn-ais, .rmn-clients").forEach((el) => offIO.observe(el))
    cleanups.push(() => offIO.disconnect())

    // Intro loader — the animation itself is pure CSS (see the JSX). JS only
    // remembers that it played (sessionStorage → the FOUC script stamps
    // data-intro-seen on the next load) and lets a click skip it. When it ends,
    // data-intro-seen is also set on THIS document, so a client-side return to "/"
    // doesn't replay it. The exit animation's `finished` promise is used rather
    // than `animationend`: a slow hydration can attach a listener after the event
    // already fired, while the promise also resolves for a finished animation.
    // sessionStorage can throw (privacy mode) → guarded.
    const intro = root.querySelector<HTMLElement>("#rmn-intro")
    if (intro && getComputedStyle(intro).display !== "none") {
      try { sessionStorage.setItem("rmn-intro-seen", "1") } catch {}
      const skip = () => intro.classList.add("skip")
      intro.addEventListener("click", skip)
      intro.getAnimations?.()[0]?.finished.then(
        () => document.documentElement.setAttribute("data-intro-seen", ""),
        () => {}, // cancelled (e.g. unmounted mid-intro)
      )
      cleanups.push(() => intro.removeEventListener("click", skip))
    }

    // Hoop tilt (fine pointer only). The tilt box is measured on pointerenter and
    // re-measured lazily after a scroll/resize — never on every pointermove — and
    // the transform write is coalesced to one per frame.
    const tilt = root.querySelector<HTMLElement>("#rmn-tilt")
    const heroEl = root.querySelector<HTMLElement>(".hero")
    if (tilt && heroEl && !reduced && window.matchMedia("(pointer: fine)").matches) {
      let rect: DOMRect | null = null
      let raf = 0
      let px = 0
      let py = 0
      const apply = () => {
        raf = 0
        const r = rect ?? (rect = tilt.getBoundingClientRect())
        const dx = (px - (r.left + r.width / 2)) / r.width
        const dy = (py - (r.top + r.height / 2)) / r.height
        tilt.style.transform = `perspective(900px) rotateY(${(dx * 7).toFixed(2)}deg) rotateX(${(-dy * 7).toFixed(2)}deg)`
      }
      const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply) }
      const onLeave = () => { cancelAnimationFrame(raf); raf = 0; rect = null; tilt.style.transform = "" }
      const invalidate = () => { rect = null }
      heroEl.addEventListener("pointermove", onMove)
      heroEl.addEventListener("pointerleave", onLeave)
      window.addEventListener("scroll", invalidate, { passive: true })
      window.addEventListener("resize", invalidate)
      cleanups.push(() => {
        cancelAnimationFrame(raf)
        heroEl.removeEventListener("pointermove", onMove)
        heroEl.removeEventListener("pointerleave", onLeave)
        window.removeEventListener("scroll", invalidate)
        window.removeEventListener("resize", invalidate)
      })
    }

    // Page progress bar fallback — only where CSS scroll timelines are missing
    // (site-css drives it natively elsewhere). The scrollable height is cached and
    // refreshed by a ResizeObserver, so a scroll frame does one transform write.
    const progress = root.querySelector<HTMLElement>("#progress")
    if (progress && !reduced && !CSS.supports("animation-timeline: scroll()")) {
      let max = 1
      let raf = 0
      const measure = () => { max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight) }
      const apply = () => { raf = 0; progress.style.transform = `scaleX(${Math.min(1, window.scrollY / max).toFixed(4)})` }
      const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply) }
      const ro = new ResizeObserver(() => { measure(); onScroll() })
      ro.observe(document.body)
      measure()
      apply()
      window.addEventListener("scroll", onScroll, { passive: true })
      cleanups.push(() => { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener("scroll", onScroll) })
    }

    // Nav: stays a FIXED height (no shrink jump). Adds a subtle shadow once
    // scrolled off the top, and hides on scroll-DOWN / reveals on scroll-UP
    // (the efficient auto-hide pattern). Direction is tracked against the last
    // position; small deltas are ignored so it doesn't flicker.
    const nav = root.querySelector<HTMLElement>("#rmn-nav")
    let lastY = window.scrollY
    let ticking = false
    // Mobile needs a taller never-hide zone (the reserved hero top-padding is
    // bigger on phones) and a larger scroll-DOWN threshold, otherwise the short
    // mobile bar hides on the tiniest scroll and appears to "jump" at the top.
    // Read once (imperative, run-once effect — same style as the pointer:fine
    // matchMedia below) and keep it fresh with a change listener.
    const mqMobile = window.matchMedia("(max-width: 760px)")
    let isMobileNav = mqMobile.matches
    const onMqChange = (e: MediaQueryListEvent) => { isMobileNav = e.matches }
    mqMobile.addEventListener("change", onMqChange)
    cleanups.push(() => mqMobile.removeEventListener("change", onMqChange))
    const applyNav = () => {
      ticking = false
      // While the mobile menu OR a mega-dropdown is open, the nav bar must stay put
      // (a hidden bar would drag its dropdown off-screen). data-menu-open /
      // data-dropdown-open are set by LandingPage — read from the DOM here so this
      // once-on-mount effect never needs to re-run.
      if (nav?.dataset.menuOpen || nav?.dataset.dropdownOpen) { nav.classList.remove("nav-hidden"); return }
      const y = window.scrollY
      nav?.classList.toggle("scrolled", y > 40)
      // Never-hide zone near the top (larger on mobile) — force the bar visible
      // there so it can't detach/jump while the hero is still on screen.
      const hideAfter = isMobileNav ? 240 : 120
      if (y < hideAfter) {
        nav?.classList.remove("nav-hidden")
        lastY = y
        return
      }
      const delta = y - lastY
      // Asymmetric hysteresis: a bigger DOWN delta to commit to hiding (anti-jitter,
      // especially on mobile), a small UP delta so revealing stays responsive.
      const downTrip = isMobileNav ? 14 : 6
      if (delta > downTrip) {
        nav?.classList.add("nav-hidden")
        lastY = y
      } else if (delta < -6) {
        nav?.classList.remove("nav-hidden")
        lastY = y
      }
    }
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(applyNav) }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    applyNav()
    cleanups.push(() => window.removeEventListener("scroll", onScroll))

    return () => cleanups.forEach((fn) => fn())
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
