// Standalone "AI Solutions" detail page (/ai-solutions on the public host via the
// middleware rewrite; /landing/ai-solutions on the panel host). Own .rmn wrapper
// (SITE_CSS comes from the (site) layout). Renders the 12 solutions as a tab rail
// with one deep-linkable detail block (#ai-<slug>) at a time, then a "why our AI
// solutions" grid + a contact CTA.
//
// The block itself lives in ai-solution-blocks.tsx, which the CMS AI-solutions tab
// also imports for its WYSIWYG preview (so the dashboard never loads this page).
"use client"
import type { ReactNode } from "react"
import { BrandMark } from "./brand-mark"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import type { SiteSettings, AiSolutionFull } from "@/server/site/types"
import { useLang } from "../../../_ui/lang-context"
import { usePick } from "./site-lang"
import { mailtoHref, whatsappHref } from "./offer-links"
import { WhatsAppIcon } from "./whatsapp-icon"
import { AiSolutionIconGlyph } from "./ai-solution-icons"
import { AiSolutionBlock } from "./ai-solution-blocks"
import { RagStage } from "./ai-chapter/rag-stage"
import "./ai-solutions-page.css"
import { StitchDivider } from "./stitch-divider"

type Contact = SiteSettings["contact"]

// Page-level copy — HARDCODED per AI-SOLUTIONS-CONTENT.md (NOT CMS). The 12
// solutions ARE CMS-editable; this surrounding page chrome is fixed.
const T = {
  back: ["← العودة إلى الرئيسية", "← Back to home"],
  eyebrow: ["حلول الذكاء الاصطناعي", "AI Solutions"],
  title: ["حلول ذكاء اصطناعي تفهم أعمالك", "AI Solutions That Understand Your Business"],
  sub: ["حوّل بيانات شركتك إلى معرفة ذكية وعمليات قابلة للأتمتة", "Transform your company data into intelligent knowledge and automated workflows"],
  lead: [
    "نطوّر حلول ذكاء اصطناعي مخصصة تساعد الشركات على فهم بياناتها، البحث داخل مستنداتها، الإجابة عن الأسئلة، تحليل المعلومات وتنفيذ المهام بشكل أسرع وأكثر دقة. تعتمد حلولنا على بنية متقدمة للبحث المعزز بالتوليد RAG، تتيح للذكاء الاصطناعي الوصول إلى مصادر المعرفة الخاصة بمؤسستك وتقديم إجابات مرتبطة بالمعلومات الفعلية داخل الشركة.",
    "We build custom AI solutions that help organizations understand their data, search across documents, answer questions, analyze information, and execute business tasks faster and more accurately. Our solutions are powered by an advanced Retrieval-Augmented Generation (RAG) architecture, letting AI access your organization's trusted knowledge sources and generate responses grounded in your actual business information.",
  ],
  tagline: ["بياناتك لا تبقى مخزنة فقط، بل تتحول إلى نظام ذكي يستطيع فهمها واستخدامها.", "Your data should not just remain stored — it becomes accessible, understandable, and actionable."],
  demoEyebrow: ["شاهدها تعمل", "See it in action"],
  demoLead: ["عرض تفاعلي: ارفع ملفاً، اسأل بطبيعية، واحصل على إجابة موثّقة بمصدرها.", "An interactive walkthrough: upload a file, ask naturally, and get an answer backed by its source."],
  whyTitle: ["لماذا حلولنا؟", "Why Our AI Solutions?"],
  ctaTitle: ["ابنِ نظام الذكاء الاصطناعي الخاص بشركتك", "Build Your Company's AI System"],
  ctaLead: ["ابدأ بمساعد ذكي متصل ببياناتك، ثم طوّره إلى منصة متكاملة للمعرفة والأتمتة واتخاذ القرار.", "Start with an intelligent assistant connected to your business data, then expand it into a complete platform for knowledge, automation, and decision support."],
  ctaBtn: ["احجز جلسة استكشاف", "Book a discovery session"],
} as const

// "Why our AI solutions" — 6 hardcoded points.
const WHY: readonly { t: readonly [string, string]; d: readonly [string, string] }[] = [
  { t: ["مبنية على بيانات شركتك", "Built Around Your Business Data"], d: ["يتم تخصيص النظام ليفهم منتجاتك، خدماتك، سياساتك ومستنداتك.", "The system is customized to understand your products, services, policies, and workflows."] },
  { t: ["إجابات مرتبطة بالمصادر", "Grounded, Source-Backed Responses"], d: ["يمكن للنظام إظهار المصادر والمستندات المستخدمة في بناء الإجابة.", "Responses can be linked to the documents and knowledge sources used to generate them."] },
  { t: ["قابلة للتكامل", "Designed for Integration"], d: ["نربط الحل مع الأنظمة والأدوات التي تستخدمها شركتك حالياً.", "Our solutions connect with the platforms and tools your company already uses."] },
  { t: ["صلاحيات وتحكم", "Access Control and Governance"], d: ["يمكن تحديد ما يستطيع كل مستخدم أو قسم الوصول إليه.", "Define what each user, team, or department is allowed to access and perform."] },
  { t: ["قابلة للتوسع", "Modular and Scalable"], d: ["ابدأ بمساعد معرفي بسيط، ثم أضف البحث، التحليل، الأتمتة والوكلاء الذكيين حسب احتياجات العمل.", "Start with an intelligent knowledge assistant, then expand into search, analytics, automation, and AI agents as your requirements grow."] },
  { t: ["مصممة لحالة استخدامك", "Built for Your Use Case"], d: ["لا نقدّم Chatbot عاماً، بل نبني حلاً يتوافق مع بيانات الشركة وعملياتها وأهدافها.", "We don't provide a generic chatbot. We design an AI solution around your company's data, workflows, users, and objectives."] },
]

// Public-page layout: a compact chip/tab rail (all solutions at a glance) + a single
// detail panel (the selected solution's full block). Replaces the tall 12-block thread
// so the user sees everything without scrolling and reads only what they pick. Scales
// to any N (chips wrap / scroll). Deep-linkable (#ai-<slug> selects + scrolls the tab).
export function AiSolutionsExplorer({ solutions }: { solutions: AiSolutionFull[] }) {
  const pick = usePick()
  const { dir } = useLang()
  const active = solutions.filter((s) => s.is_active)
  const [activeSlug, setActiveSlug] = useState<string>(active[0]?.slug ?? "")
  const railRef = useRef<HTMLDivElement>(null)

  // Deep-link: select the tab for the hash BEFORE scrolling (else we'd scroll to a
  // hidden panel). Mirrors payment-features-thread's setOpenId→scroll→flash. Runs on
  // mount (after the browser's native hash jump) and on hashchange.
  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.replace(/^#/, "")
      if (!id.startsWith("ai-")) return
      const slug = id.slice(3)
      if (!active.some((s) => s.slug === slug)) return
      setActiveSlug(slug)
      // wait a frame so the panel for the new slug is mounted, then scroll + flash
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        if (!el) return
        el.scrollIntoView({ block: "center", behavior: "smooth" })
        el.classList.remove("rmn-ai-flash"); void el.offsetWidth; el.classList.add("rmn-ai-flash")
      })
    }
    const raf = requestAnimationFrame(openFromHash)
    window.addEventListener("hashchange", openFromHash)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("hashchange", openFromHash) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.length])

  if (active.length === 0) return null
  const activeIndex = Math.max(0, active.findIndex((s) => s.slug === activeSlug))
  const current = active[activeIndex]

  // roving keyboard nav on the tab rail (dir-aware: ArrowLeft/Right flip in RTL).
  const onKey = (e: React.KeyboardEvent) => {
    const rtl = dir === "rtl"
    let next = -1
    if (e.key === "ArrowRight") next = activeIndex + (rtl ? -1 : 1)
    else if (e.key === "ArrowLeft") next = activeIndex + (rtl ? 1 : -1)
    else if (e.key === "Home") next = 0
    else if (e.key === "End") next = active.length - 1
    else return
    e.preventDefault()
    next = (next + active.length) % active.length
    setActiveSlug(active[next].slug)
    requestAnimationFrame(() => railRef.current?.querySelector<HTMLButtonElement>(`#ai-tab-${active[next].slug}`)?.focus())
  }

  return (
    <div className="rmn-ai-explorer">
      <div className="rmn-ai-tabs" role="tablist" aria-label={pick("حلول الذكاء الاصطناعي", "AI solutions")} ref={railRef} onKeyDown={onKey}>
        {active.map((s) => {
          const on = s.slug === activeSlug
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`ai-tab-${s.slug}`}
              aria-selected={on}
              aria-controls={`ai-panel-${s.slug}`}
              tabIndex={on ? 0 : -1}
              className={`rmn-ai-tab${on ? " on" : ""}`}
              onClick={() => setActiveSlug(s.slug)}
            >
              <span className="rmn-ai-tab-ic" aria-hidden>
                <AiSolutionIconGlyph iconKey={s.icon_key} emoji={s.icon} />
              </span>
              <span className="rmn-ai-tab-t">{pick(s.title_ar, s.title_en)}</span>
            </button>
          )
        })}
      </div>

      <div
        className="rmn-ai-panel"
        role="tabpanel"
        id={`ai-panel-${current.slug}`}
        aria-labelledby={`ai-tab-${current.slug}`}
        key={current.slug}
      >
        <AiSolutionBlock s={current} index={activeIndex} />
      </div>
    </div>
  )
}

export function AiSolutionsPage({ contact, solutions, ragScene }: {
  contact: Contact; solutions: AiSolutionFull[]; ragScene?: ReactNode
}) {
  const { dir } = useLang()
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const name = pick("حلول الذكاء الاصطناعي", "AI Solutions")
  const wa = whatsappHref(contact.whatsapp, name)

  // Deep-linking (#ai-<slug>) is owned by <AiSolutionsExplorer> — it selects the
  // matching tab BEFORE scrolling/flashing, so a hash link opens the right panel.

  return (
    <div className="rmn" dir={dir}>
      <div className="rmn-ai">
        <div className="container">
          <div className="rmn-ai-top">
            <Link href="/" className="brand">
              <BrandMark />
              <span className="brand-name">رمّانة</span>
            </Link>
            <Link href="/#ai-solutions" className="btn btn-ghost">{p(T.back)}</Link>
          </div>

          <div className="rmn-ai-hero">
            <span className="eyebrow">{p(T.eyebrow)}</span>
            <h1>{p(T.title)}</h1>
            <p className="rmn-ai-sub">{p(T.sub)}</p>
            <p className="rmn-ai-lead">{p(T.lead)}</p>
            <p className="rmn-ai-tagline">{p(T.tagline)}</p>
          </div>

          {/* The knowledge-workspace demo (the same one as the landing's AI chapter):
              the frame is server-rendered at its exact size, the demo itself is a lazy
              island that mounts as the visitor approaches. */}
          <div className="rmn-ai-demo-wrap">
            <div className="rmn-ai-demo-head">
              <span className="rmn-ai-demo-eyebrow">{p(T.demoEyebrow)}</span>
              <p className="rmn-ai-demo-lead">{p(T.demoLead)}</p>
            </div>
            <RagStage contact={contact} staticScene={ragScene} />
          </div>

          <AiSolutionsExplorer solutions={solutions} />

          <div className="rmn-ai-why">
            <div className="rmn-ai-why-head">
              <StitchDivider crosses={5} revealed />
              <h2 className="kufi">{p(T.whyTitle)}</h2>
            </div>
            <div className="rmn-ai-why-grid">
              {WHY.map((w, i) => (
                <div key={i} className="rmn-ai-why-card">
                  <h3>{p(w.t)}</h3>
                  <p>{p(w.d)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rmn-ai-cta">
            <h2>{p(T.ctaTitle)}</h2>
            <p>{p(T.ctaLead)}</p>
            <div className="rmn-offer-ctas" style={{ marginTop: 0, justifyContent: "center", display: "flex" }}>
              {wa ? (
                <a className="btn btn-primary btn-wa" href={wa} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> {p(T.ctaBtn)}
                </a>
              ) : (
                <a className="btn btn-primary" href={mailtoHref(contact.email || "hello@rummanah.dev", name)}>{p(T.ctaBtn)}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
