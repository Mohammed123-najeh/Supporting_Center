// Curated inline-SVG icon set for the AI solutions. Keyed by AiSolutionIcon so the
// CMS can pick one; falls back to the free-text emoji `icon`, then a generic dot.
// Strokes use currentColor so they inherit the node's accent in light/dark. Shared
// by the landing teaser, the /ai-solutions thread, AND the CMS preview.
import type { AiSolutionIcon } from "@/server/site/types"

const S = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true }

const ICONS: Record<AiSolutionIcon, React.ReactNode> = {
  // chatbots — speech bubble with a spark
  chat: <svg {...S}><path d="M4 5h16v11H9l-4 3v-3H4z" /><path d="M9 10h6M9 13h3" /></svg>,
  // enterprise knowledge — stacked books
  knowledge: <svg {...S}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5A1.5 1.5 0 0 1 20 20.5z" /></svg>,
  // intelligent search — magnifier with a spark
  search: <svg {...S}><circle cx="11" cy="11" r="6" /><path d="M20 20l-3.5-3.5" /><path d="M11 8.5v5M8.5 11h5" opacity=".6" /></svg>,
  // document intelligence — page with lines + fold
  document: <svg {...S}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4" /><path d="M9 12h6M9 15h6M9 18h3" /></svg>,
  // support automation — headset
  support: <svg {...S}><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /><path d="M20 19a4 4 0 0 1-4 3h-2" /></svg>,
  // sales assistant — handshake / rising chart
  sales: <svg {...S}><path d="M3 20h18" /><path d="M6 20v-5M11 20V9M16 20v-8" /><path d="M4 8l5-3 4 2 6-4" /><path d="M19 3v3h-3" /></svg>,
  // recommendations — sparkle star
  recommend: <svg {...S}><path d="M12 3l1.8 4.9L19 9.6l-4.2 3.4L16 18l-4-2.7L8 18l1.2-5-4.2-3.4 5.2-.7z" /></svg>,
  // AI agents — robot head
  agent: <svg {...S}><rect x="5" y="8" width="14" height="10" rx="2.5" /><path d="M12 4v4M12 4h-.01" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" /><path d="M2 12v3M22 12v3" /></svg>,
  // data analysis — bar chart in a frame
  analytics: <svg {...S}><path d="M4 4v16h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></svg>,
  // knowledge platform — brain / network
  platform: <svg {...S}><circle cx="12" cy="12" r="3" /><circle cx="5" cy="6" r="1.6" /><circle cx="19" cy="6" r="1.6" /><circle cx="5" cy="18" r="1.6" /><circle cx="19" cy="18" r="1.6" /><path d="M9.6 10.4 6.3 7.1M14.4 10.4l3.3-3.3M9.6 13.6l-3.3 3.3M14.4 13.6l3.3 3.3" /></svg>,
  // private AI — shield with lock
  shield: <svg {...S}><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><rect x="9.5" y="11" width="5" height="4" rx="1" /><path d="M10.5 11v-1.2a1.5 1.5 0 0 1 3 0V11" /></svg>,
  // custom integrations — plug / connector
  integrate: <svg {...S}><path d="M4 12h4M16 12h4" /><rect x="8" y="8" width="8" height="8" rx="2" /><path d="M11 8V5M15 8V5M11 19v-3M15 19v-3" opacity=".7" /></svg>,
}

export function AiSolutionIconGlyph({ iconKey, emoji }: { iconKey: AiSolutionIcon | ""; emoji?: string }) {
  if (iconKey && ICONS[iconKey]) return <>{ICONS[iconKey]}</>
  if (emoji) return <span className="rmn-pf-emoji" aria-hidden>{emoji}</span>
  return <span className="rmn-pf-emoji" aria-hidden>•</span>
}
