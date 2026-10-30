// Public landing page. Served at `/` via a next.config.mjs rewrite to this
// `/landing` route (the source's middleware did the same rewrite on its public
// host), so the source's file layout stays as it was.
//
// This is a server component: it loads the site content (src/content/site-content.ts,
// which stands in for the source's CMS) and passes it as props to pure section
// components.
import type { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { SITE_URL } from "@/config/site"
import { getPublicContent } from "@/content/site-content"
import type { SiteContent } from "@/server/site/types"
import { LANG_KEY, resolveRequestLang } from "../../_ui/lang"
import { LandingPage } from "./_sections/landing-page"
import { ChatStatic } from "./_sections/ai-chapter/chat-static"
import { RagStatic } from "./_sections/ai-chapter/rag-static"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const getContent = getPublicContent

const siteUrl = () => SITE_URL

// The language the root layout renders this request in (same rules).
async function requestLang() {
  const h = await headers()
  return resolveRequestLang((await cookies()).get(LANG_KEY)?.value, h.get("accept-language"), true)
}

export async function generateMetadata(): Promise<Metadata> {
  const [settings, lang] = await Promise.all([
    getContent().then((c) => c.settings, () => null),
    requestLang(),
  ])
  const seo = settings?.seo
  const ar = lang === "ar"
  const title = (ar ? seo?.title_ar || seo?.title_en : seo?.title_en || seo?.title_ar) ||
    (ar ? "رمّانة لحلول التقنية — متاجر إلكترونية متكاملة" : "Rummanah Technology Solutions — complete online stores")
  const description = (ar ? seo?.description_ar || seo?.description_en : seo?.description_en || seo?.description_ar) ||
    (ar
      ? "نصمّم ونبني ونشغّل متاجر إلكترونية حديثة من دبي، الإمارات العربية المتحدة."
      : "We design, build and run modern online stores, from Dubai, United Arab Emirates.")
  const image = seo?.og_image ? `/media/${seo.og_image}` : "/Rummanh_logo.png"
  return {
    metadataBase: new URL(siteUrl()),
    title,
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: "/",
      siteName: ar ? "رمّانة" : "Rummanah",
      title,
      description,
      locale: ar ? "ar_AE" : "en_AE",
      alternateLocale: ar ? "en_AE" : "ar_AE",
      images: [image],
    },
    // Unlike the panel (noindex), the public site SHOULD be indexed.
    robots: { index: true, follow: true },
  }
}

// schema.org Organization with the Dubai address, for search engines. It is a
// data block (never executed), so the script-src CSP doesn't apply and it needs
// no nonce; `<` is escaped so CMS text can't close the tag.
function organizationJsonLd(content: SiteContent): string {
  const { contact } = content.settings
  const url = siteUrl()
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Rummanah Technology Solutions",
    alternateName: "رمّانة",
    url,
    logo: `${url}/Rummanh_logo.png`,
    email: contact.email || undefined,
    telephone: contact.phone || undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dubai",
      addressRegion: "Dubai",
      addressCountry: "AE",
    },
  }).replace(/</g, "\\u003c")
}

export default async function SitePage() {
  const [content, lang] = await Promise.all([getContent(), requestLang()])
  // The AI demos' final scenes, rendered here so they cost the client no JavaScript
  // (shown without JavaScript, or if a demo's chunk fails to load).
  const aiScenes = { chat: <ChatStatic lang={lang} />, rag: <RagStatic lang={lang} /> }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationJsonLd(content) }} />
      <LandingPage content={content} aiScenes={aiScenes} />
    </>
  )
}
