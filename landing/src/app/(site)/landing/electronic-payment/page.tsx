// Public "electronic payment" detail page. Reached as /electronic-payment via the
// next.config.mjs rewrite (or /landing/electronic-payment directly). Server
// component: loads the site settings (contact) and the payment features and
// renders the client page.
import type { Metadata } from "next"
import { getSettings, loadPaymentFeatures } from "@/content/site-content"
import { ElectronicPaymentPage } from "../_sections/electronic-payment-page"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Electronic payment — Rummanah",
    description: "Secure, Arabic-first electronic payments for your online store — local and global cards, wallets, and a fast, familiar checkout.",
    // Public marketing content — index it (the panel stays noindex).
    robots: { index: true, follow: true },
  }
}

export default async function ElectronicPaymentRoute() {
  // Two independent reads in parallel. NOT getPublicContent(): this page never
  // renders team/packages/clients/offers.
  const [settings, paymentFeatures] = await Promise.all([getSettings(), loadPaymentFeatures()])
  return <ElectronicPaymentPage contact={settings.contact} paymentFeatures={paymentFeatures} />
}
