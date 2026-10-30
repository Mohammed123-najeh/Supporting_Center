// Public "AI Solutions" detail page. Reached as /ai-solutions via the
// next.config.mjs rewrite (or /landing/ai-solutions directly). Server component:
// loads the site settings (contact) and the FULL AI-solution rows
// (body/sections/example) and renders the client page.
import type { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { getSettings, loadAiSolutionsFull } from "@/content/site-content"
import { AiSolutionsPage } from "../_sections/ai-solutions-page"
import { RagStatic } from "../_sections/ai-chapter/rag-static"
import { LANG_KEY, resolveRequestLang } from "../../../_ui/lang"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "AI Solutions — Rummanah",
    description: "Custom AI & RAG solutions that understand your business — chatbots, enterprise knowledge, intelligent search, document intelligence, support automation, AI agents, and more.",
    // Public marketing content — index it (the panel stays noindex).
    robots: { index: true, follow: true },
  }
}

export default async function AiSolutionsRoute() {
  // Two independent reads in parallel. NOT getPublicContent(): this page never
  // renders team/packages/clients/offers. The FULL rows add body/sections/example.
  const [settings, solutions, cookieJar, h] = await Promise.all([getSettings(), loadAiSolutionsFull(), cookies(), headers()])
  // the language the root layout renders this request in (same rules), for the demo's no-JS scene
  const lang = resolveRequestLang(cookieJar.get(LANG_KEY)?.value, h.get("accept-language"), true)
  return <AiSolutionsPage contact={settings.contact} solutions={solutions} ragScene={<RagStatic lang={lang} />} />
}
