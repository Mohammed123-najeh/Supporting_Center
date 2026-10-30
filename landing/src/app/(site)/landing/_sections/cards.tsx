// Shared embroidery-style cards used by BOTH the public landing AND the CMS
// live preview, so what the operator previews is what ships. Pure + prop-driven;
// read the active language via usePick. Styled by the scoped .rmn stylesheet.
"use client"
import type { PricingPackage } from "@/server/site/types"
import { useLang } from "../../../_ui/lang-context"
import { usePick } from "./site-lang"
import { formatPrice } from "./price"

const PERIOD: Record<PricingPackage["billing_period"], { ar: string; en: string }> = {
  monthly: { ar: "/ شهريًا", en: "/ month" },
  yearly: { ar: "/ سنويًا", en: "/ year" },
  one_time: { ar: "/ دفعة واحدة", en: "/ one-time" },
}

// `ctaFallback` = when true (landing use), the CTA button always renders with a
// default label ("اطلب الآن" / "ابدأ") even if the package has no cta_label — the
// landing wants every card to have a button. The CMS preview passes nothing, so it
// keeps the gate-on-non-empty behaviour (no phantom button while editing a draft).
export function PricingCard({ pkg, ctaFallback = false }: { pkg: PricingPackage; ctaFallback?: boolean }) {
  const pick = usePick()
  const { lang } = useLang()
  const name = pick(pkg.name_ar, pkg.name_en)
  const ctaLabel = pick(pkg.cta_label_ar, pkg.cta_label_en)
  const cta = ctaLabel || (ctaFallback ? (pkg.highlighted ? pick("اطلب الآن", "Order now") : pick("ابدأ", "Get started")) : "")
  const per = PERIOD[pkg.billing_period]
  const price = pkg.price_amount != null ? formatPrice(pkg.price_amount, pkg.price_currency, lang) : null
  return (
    <div className={`pkg${pkg.highlighted ? " featured" : ""}`}>
      {pkg.highlighted && <span className="ribbon">{pick("الأكثر طلبًا ✕", "Most popular ✕")}</span>}
      {pkg.name_en && <span className="pkg-tag" dir="ltr">{pkg.name_en.toUpperCase()}</span>}
      <h3 className="pkg-name">{name || "—"}</h3>
      <div className="pkg-price">
        {price
          ? <><bdi dir={price.dir}>{price.text}</bdi> <small>{pick(per.ar, per.en)}</small></>
          : pick("حسب الطلب", "On request")}
      </div>
      <ul>
        {pkg.features.map((f, i) => <li key={i}>{pick(f.ar, f.en)}</li>)}
      </ul>
      {cta && <a href={pkg.cta_url || "#contact"} className={`btn ${pkg.highlighted ? "btn-light" : "btn-ghost"}`}>{cta}</a>}
    </div>
  )
}
