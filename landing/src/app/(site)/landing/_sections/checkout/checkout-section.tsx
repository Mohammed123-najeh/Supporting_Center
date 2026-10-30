// "Electronic payment" (الدفع الإلكتروني) landing section — the CMS layout key
// `checkout`. The six-scene story now plays on the iPhone Duo with Stripe; see
// ../pay-duo/pay-duo-section.tsx. Only the rail copy (`stages`) is CMS-editable.
"use client"
import type { SiteSettings, CheckoutStage } from "@/server/site/types"
import { PayDuoSection } from "../pay-duo/pay-duo-section"

export function CheckoutSection({ stages, contact }: {
  stages: CheckoutStage[]
  contact: SiteSettings["contact"]
}) {
  if (stages.length === 0) return null
  return <PayDuoSection stages={stages} contact={contact} />
}
