// The six built-in CSS "mockups" shown on the scrolly stage when an offer has no
// uploaded media (and in the CMS editor's mini-preview). Purely presentational —
// every colour comes from `.rmn` design tokens (scrolly-mockups.css) so light
// and dark themes adapt for free. No media, no JS, no external assets.
"use client"
import type { MockupKind } from "./scrolly-math"
import "./scrolly-mockups.css"

// Small inline glyphs (stroke = currentColor) — no icon dependency.
const Lock = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)
const Cart = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
    <circle cx="9" cy="20" r="1" /><circle cx="17" cy="20" r="1" /><path d="M3 4h2l2 11h11l2-7H6" />
  </svg>
)

function Dashboard() {
  return (
    <div className="mk mk-dash" aria-hidden>
      <div className="mk-row3">
        <div className="mk-stat"><span className="mk-num">1,240</span><span className="mk-lab">الطلبات</span></div>
        <div className="mk-stat"><span className="mk-num">8,560 د.إ</span><span className="mk-lab">المبيعات</span></div>
        <div className="mk-stat"><span className="mk-num">3,40</span><span className="mk-lab">الزوّار</span></div>
      </div>
      <div className="mk-chart">
        <div className="mk-bars">
          {[42, 66, 50, 82, 60, 96, 72].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}
        </div>
        <div className="mk-cap">المبيعات — آخر ٧ أيام</div>
      </div>
    </div>
  )
}

function Store() {
  return (
    <div className="mk mk-store" aria-hidden>
      <div className="mk-phone">
        <div className="mk-ph-top"><span className="mk-ph-logo">رمّانة</span><span className="mk-ph-cart">{Cart}</span></div>
        <div className="mk-grid">
          {[["99 د.إ", "a"], ["149 د.إ", "b"], ["79 د.إ", "c"], ["199 د.إ", "d"]].map(([price, k]) => (
            <div className="mk-prod" key={k}><div className={`mk-img mk-img-${k}`} /><span className="mk-price">{price}</span></div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Payments() {
  return (
    <div className="mk mk-pay" aria-hidden>
      <div className="mk-check">
        <div className="mk-check-top"><span>الإجمالي</span><b className="mk-num">420 د.إ</b></div>
        <div className="mk-pms"><span className="mk-pm">Visa</span><span className="mk-pm">Mastercard</span><span className="mk-pm">Apple Pay</span></div>
      </div>
      <div className="mk-ship">
        <div className="mk-track"><span className="mk-line"><b /></span><i className="on" /><i className="on" /><i /></div>
        <div className="mk-steps"><span>تم الطلب</span><span>قيد التجهيز</span><span>في الطريق</span></div>
      </div>
    </div>
  )
}

function Marketing() {
  return (
    <div className="mk mk-mkt" aria-hidden>
      <div className="mk-coupon"><span className="mk-cp-off">20%</span><span className="mk-cp-lab">خصم على أول طلب</span></div>
      <div className="mk-wa">
        <div className="mk-wa-bubble">وصلك عرض جديد — لا يفوتك!</div>
        <span className="mk-wa-tag">حملة واتساب مجدولة</span>
      </div>
    </div>
  )
}

function Speed() {
  return (
    <div className="mk mk-speed" aria-hidden>
      <div className="mk-time"><b className="mk-num">0.8</b><span>ثانية حتى يفتح المتجر</span></div>
      <div className="mk-rings">
        {["98", "100", "95"].map((n) => <div className="mk-ring" key={n}><span>{n}</span></div>)}
      </div>
      <div className="mk-cap">الأداء • الوصول • أفضل الممارسات</div>
    </div>
  )
}

function Security() {
  return (
    <div className="mk mk-host" aria-hidden>
      <div className="mk-shield">{Lock}</div>
      <div className="mk-badges">
        <span className="mk-badge">شهادة SSL موقّعة</span>
        <span className="mk-badge">وقت التشغيل ٩٩٫٩٪</span>
        <span className="mk-badge">نسخة احتياطية يومية</span>
      </div>
      <div className="mk-uptime">{Array.from({ length: 12 }, (_, i) => <i key={i} />)}</div>
    </div>
  )
}

const MAP: Record<MockupKind, () => React.ReactElement> = {
  dashboard: Dashboard, store: Store, payments: Payments,
  marketing: Marketing, speed: Speed, security: Security,
}

export function Mockup({ kind }: { kind: MockupKind }) {
  const El = MAP[kind] ?? Store
  return <El />
}
