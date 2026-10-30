// Public offer detail page. Reached as /offers/<slug> via the next.config.mjs
// rewrite (or /landing/offers/<slug> directly). Server component: loads the offer
// + contact settings and renders the client OfferDetail. Unknown/inactive slug → 404.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getSettings, loadOfferBySlug } from "@/content/site-content"
import { OfferDetail } from "../../_sections/offer-detail"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const offer = await loadOfferBySlug(slug).catch(() => null)
  if (!offer) return {}
  const title = `${offer.name_en || offer.name_ar || "Offer"} — Rummanah`
  const description = offer.summary_en || offer.summary_ar || undefined
  return {
    title,
    description,
    // Public marketing content — index it (the panel stays noindex).
    robots: { index: true, follow: true },
  }
}

export default async function OfferPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [offer, settings] = await Promise.all([loadOfferBySlug(slug), getSettings()])
  if (!offer) notFound()
  return <OfferDetail offer={offer} contact={settings.contact} />
}
