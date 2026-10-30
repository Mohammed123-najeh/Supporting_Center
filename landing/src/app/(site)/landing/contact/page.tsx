// Public "Contact" page. Reached as /contact via the next.config.mjs rewrite (or
// /landing/contact directly). Server component: loads the site settings (contact
// channels) and renders the client page.
import type { Metadata } from "next"
import { getSettings } from "@/content/site-content"
import { ContactPage } from "../_sections/contact-page"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Contact — Rummanah · تواصل معنا",
    description: "Get in touch with Rummanah — send us a message, or reach us directly by email or WhatsApp. We reply within one business day.",
    robots: { index: true, follow: true },
  }
}

export default async function ContactRoute() {
  const settings = await getSettings()
  return <ContactPage contact={settings.contact} />
}
