// The landing's AI chapter (CMS layout key `ai`, right after Services). It shows
// rather than tells: a store's support assistant answering a customer on the
// always-open iPhone Duo, then a knowledge workspace answering questions from
// company files with sources, then the CMS's AI solutions as chips into
// /ai-solutions. Both demos are lazy islands (see island.ts): this file, the
// frames and their skeletons are all the first load carries.
//
// The section keeps the teaser's id (#ai-solutions, the nav and mega-menu target)
// and its .rmn-ais class (the landing pauses its ambient motion off screen).
"use client"
import type { ReactNode } from "react"
import type { AiSolution, SiteSettings } from "@/server/site/types"
import { usePick } from "../site-lang"
import { whatsappHref } from "../offer-links"
import { AiSolutionIconGlyph } from "../ai-solution-icons"
import { StitchDivider } from "../stitch-divider"
import { ChatStage } from "./chat-stage"
import { RagStage } from "./rag-stage"
import "./ai-chapter.css"

type Pair = readonly [string, string]

const T = {
  eyebrow: ["الذكاء الاصطناعي", "AI Solutions"],
  title: ["منصة ذكاء اصطناعي واحدة، وحلول متعددة لأعمالك", "One AI foundation. Multiple business solutions."],
  lead: [
    "بدلاً من بناء كل حل من الصفر، نستخدم منصة معرفية مرنة وقابلة للتوسع، ثم نخصصها بحسب بيانات الشركة وعملياتها وأنظمتها الحالية.",
    "Instead of building every solution from scratch, we use a flexible, scalable knowledge platform, then customize it around your company's data, workflows, and existing systems.",
  ],
  chatKicker: ["مساعد محادثة آمن ومحلي", "Secure local chatbot"],
  chatTitle: ["يرد على عملائك خلال ثانية، بالعربية والإنجليزية", "Answers your customers in a second, in Arabic and English"],
  chatLead: [
    "وكيل ذكاء اصطناعي خاص يعمل على خوادمك. يقرأ طلباتك ومنتجاتك وسياساتك، ثم يرد ويعدّل موعد التوصيل ويحجز الإرجاع على مدار الساعة.",
    "A private AI agent that runs on your own servers. It reads your orders, products and policies, then replies, reschedules deliveries and books returns, around the clock.",
  ],
  chatCta: ["احجز عرضاً تجريبياً", "Book a demo"],
  chatWa: ["مرحباً، أريد عرضاً تجريبياً لمساعد خدمة العملاء الذكي", "Hi, I'd like a demo of the AI support assistant"],
  ragKicker: ["مساعد المعرفة (RAG)", "Knowledge assistant (RAG)"],
  ragTitle: ["اسأل ملفات شركتك، واحصل على الإجابة مع مصدرها", "Ask your company's files. Get answers with their sources."],
  ragLead: [
    "ارفع ملفات PDF وWord وExcel واسأل بلغتك. يبحث في كل صفحة، ويجيب بالأرقام، ويريك المقطع الذي اعتمد عليه.",
    "Upload PDF, Word and Excel files, then ask in your own words. It searches every page, answers with the figures, and shows you the passage it relied on.",
  ],
  more: ["12 حلاً مبنية على الأساس نفسه", "12 solutions built on the same foundation"],
  moreCta: ["اكتشف كل الحلول بالتفصيل", "Explore all solutions in detail"],
} as const

const CHAT_POINTS: ReadonlyArray<{ icon: React.ReactNode; title: Pair; text: Pair }> = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>,
    title: ["خصوصية كاملة", "Private by design"],
    text: ["يعمل على خوادمك، وبيانات عملائك تبقى عندك.", "Hosted on your servers; customer data stays with you."],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" /></svg>,
    title: ["ينفّذ ولا يكتفي بالرد", "Acts, not just answers"],
    text: ["يتتبع الطلبات ويغيّر مواعيد التوصيل ويحجز الإرجاع.", "Tracks orders, reschedules deliveries and books returns."],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="8.5" cy="8" r="3" /><path d="M3 19c.6-3 2.8-4.8 5.5-4.8S13.4 16 14 19" /><path d="M15 6.5h6M18.5 3.5l3 3-3 3" /></svg>,
    title: ["يسلّم لفريقك عند الحاجة", "Hands over when needed"],
    text: ["ينقل المحادثة إلى موظف مع كامل تفاصيلها.", "Passes the chat to your team with its full history."],
  },
]

const RAG_POINTS: ReadonlyArray<{ icon: React.ReactNode; title: Pair; text: Pair }> = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h3" /></svg>,
    title: ["إجابات موثّقة", "Cited answers"],
    text: ["كل رقم مرتبط بالصفحة التي جاء منها.", "Every figure links to the page it came from."],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8" /><rect x="15" y="10" width="6" height="5" rx="1.2" /><path d="M16.5 10V8.5a1.5 1.5 0 0 1 3 0V10" /></svg>,
    title: ["صلاحيات لكل فريق", "Access by team"],
    text: ["كل قسم يرى ملفاته فقط.", "Each team sees only its own files."],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="6" rx="1.5" /><rect x="4" y="14" width="16" height="6" rx="1.5" /><path d="M8 7h.01M8 17h.01" /></svg>,
    title: ["على خوادمك", "On your servers"],
    text: ["ملفاتك لا تغادر شبكتك.", "Your files never leave your network."],
  },
]

// The demos' final scenes, rendered on the server (chat-static.tsx, rag-static.tsx).
export type AiScenes = { chat?: ReactNode; rag?: ReactNode }

export function AiChapter({ solutions, contact, scenes }: {
  solutions: AiSolution[]; contact: SiteSettings["contact"]; scenes?: AiScenes
}) {
  const pick = usePick()
  const p = (pair: Pair) => pick(pair[0], pair[1])
  const active = solutions.filter((s) => s.is_active)
  const demoHref = whatsappHref(contact.whatsapp, p(T.chatWa))

  return (
    <section className="rmn-ais rmn-aic" id="ai-solutions" aria-labelledby="rmn-ais-title">
      <div className="container">
        <div className="rmn-ais-head reveal">
          <StitchDivider crosses={5} />
          <span className="eyebrow">{p(T.eyebrow)}</span>
          <h2 id="rmn-ais-title" className="kufi">{p(T.title)}</h2>
          <p>{p(T.lead)}</p>
        </div>

        {/* For your customers: the copy sits around the device, so on phones it
            reads heading → phone → proof points. */}
        <div className="rmn-aic-b1">
          <div className="rmn-aic-copy rmn-aic-top reveal">
            <span className="rmn-aic-kicker"><i aria-hidden="true" />{p(T.chatKicker)}</span>
            <h3 className="kufi">{p(T.chatTitle)}</h3>
            <p>{p(T.chatLead)}</p>
          </div>
          <ChatStage contact={contact} staticScene={scenes?.chat} />
          <div className="rmn-aic-copy rmn-aic-bottom reveal">
            <ul className="rmn-aic-points">
              {CHAT_POINTS.map((pt, i) => (
                <li key={i}>{pt.icon}<span><b>{p(pt.title)}</b>{p(pt.text)}</span></li>
              ))}
            </ul>
            {demoHref ? (
              <a className="btn btn-primary" href={demoHref} target="_blank" rel="noopener noreferrer">{p(T.chatCta)}</a>
            ) : (
              <a className="btn btn-primary" href="#contact-section">{p(T.chatCta)}</a>
            )}
          </div>
        </div>

        {/* For your team: the copy above the full-width workspace. */}
        <div className="rmn-aic-b2">
          <div className="rmn-aic-b2-head">
            <div className="rmn-aic-copy reveal">
              <span className="rmn-aic-kicker"><i aria-hidden="true" />{p(T.ragKicker)}</span>
              <h3 className="kufi">{p(T.ragTitle)}</h3>
              <p>{p(T.ragLead)}</p>
            </div>
            <ul className="rmn-aic-points rmn-aic-points--row reveal">
              {RAG_POINTS.map((pt, i) => (
                <li key={i}>{pt.icon}<span><b>{p(pt.title)}</b>{p(pt.text)}</span></li>
              ))}
            </ul>
          </div>
          <RagStage contact={contact} staticScene={scenes?.rag} />
        </div>

        {active.length > 0 && (
          <>
            <p className="rmn-aic-more reveal">{p(T.more)}</p>
            {/* `.reveal` so the shared observer toggles `.in` → the chips stagger in. */}
            <div className="rmn-ais-core reveal">
              {active.map((s, i) => (
                <a key={s.id} href={`/ai-solutions#ai-${s.slug}`} className="rmn-ais-chip" style={{ ["--d" as string]: `${(i % 6) * 0.06}s` }}>
                  <span className="rmn-ais-ic" aria-hidden><AiSolutionIconGlyph iconKey={s.icon_key} emoji={s.icon} /></span>
                  {pick(s.title_ar, s.title_en)}
                </a>
              ))}
            </div>
          </>
        )}
        <div className="rmn-ais-cta">
          <a href="/ai-solutions" className="btn btn-ghost">{p(T.moreCta)}</a>
        </div>
      </div>
    </section>
  )
}
