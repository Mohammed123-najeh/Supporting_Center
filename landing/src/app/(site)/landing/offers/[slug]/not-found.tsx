// Branded 404 for unknown offer slugs on the public host (the default Next
// 404 would break the embroidery identity). Server component — static copy in
// both languages, no client hooks needed.
import { BrandMark } from "../../_sections/brand-mark"

export default function OfferNotFound() {
  return (
    <div className="rmn">
      <div className="rmn-detail">
        <div className="container" style={{ textAlign: "center", paddingBlock: "6rem" }}>
          <BrandMark style={{ display: "inline-grid", marginBottom: "1.4rem" }} />
          <h1 style={{ marginBottom: ".6rem" }}>الصفحة غير موجودة · Not found</h1>
          <p className="rmn-detail-lead" style={{ marginInline: "auto", marginBottom: "2rem" }}>
            هذا العرض غير متوفر — ربما تغيّر رابطه. · This offer isn&apos;t available — its link may have changed.
          </p>
          <a href="/" className="btn btn-primary">العودة إلى الرئيسية · Back to home</a>
        </div>
      </div>
    </div>
  )
}
