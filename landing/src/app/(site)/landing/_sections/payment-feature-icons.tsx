// Curated inline-SVG icon set for the electronic-payment features. Keyed by
// PaymentFeatureIcon so the CMS can pick one; falls back to the free-text emoji
// `icon`, then a generic dot. Strokes use currentColor so they inherit the node's
// accent in light/dark. Shared by the section timeline AND the CMS preview.
import type { PaymentFeatureIcon } from "@/server/site/types"

const S = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true }

const ICONS: Record<PaymentFeatureIcon, React.ReactNode> = {
  globe: <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.4 2.5 15.6 0 18M12 3c-2.5 2.4-2.5 15.6 0 18" /></svg>,
  link: <svg {...S}><path d="M9 15l6-6" /><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1" /><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1" /></svg>,
  repeat: <svg {...S}><path d="M4 9a8 8 0 0 1 13-3l3 3" /><path d="M20 15a8 8 0 0 1-13 3l-3-3" /><path d="M17 3v6h-6M7 21v-6h6" /></svg>,
  card: <svg {...S}><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10h18M7 15h4" /></svg>,
  cards: <svg {...S}><rect x="6" y="7" width="15" height="11" rx="2.2" /><path d="M6 11h15" /><path d="M3 9v9a2 2 0 0 0 2 2h12" opacity=".5" /></svg>,
  currency: <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 2.5-5 1.5-5 4a2.5 2.5 0 0 0 5 0M12 6.5v11" /></svg>,
  plug: <svg {...S}><path d="M9 3v5M15 3v5" /><path d="M6 8h12v3a6 6 0 0 1-12 0z" /><path d="M12 17v4" /></svg>,
  device: <svg {...S}><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></svg>,
  pos: <svg {...S}><rect x="4" y="3" width="16" height="10" rx="2" /><path d="M8 7h8M8 10h5" /><path d="M6 21l1.5-6h9L18 21z" /></svg>,
  shield: <svg {...S}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9.5 12l2 2 3.5-4" /></svg>,
}

export function PaymentFeatureIconGlyph({ iconKey, emoji }: { iconKey: PaymentFeatureIcon | ""; emoji?: string }) {
  if (iconKey && ICONS[iconKey]) return <>{ICONS[iconKey]}</>
  if (emoji) return <span className="rmn-pf-emoji" aria-hidden>{emoji}</span>
  return <span className="rmn-pf-emoji" aria-hidden>•</span>
}
