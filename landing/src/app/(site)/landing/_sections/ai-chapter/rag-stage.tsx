// The knowledge-workspace demo's stage: a browser-style app window at its exact
// size with a quiet skeleton inside (server-rendered, so nothing ever moves), the
// live demo mounted as a lazy island one viewport before it scrolls in, the answer
// (rendered on the server and passed in) in <noscript> for visitors without
// JavaScript, and its one control (pause / play / replay) in the corner under it.
// Used by the landing's AI chapter and by /ai-solutions.
"use client"
import dynamic from "next/dynamic"
import { useRef, useState, type ReactNode } from "react"
import type { SiteSettings } from "@/server/site/types"
import { StaticScene, StaticSceneView } from "./demo-fallback"
import { useIsland } from "./island"
import { DemoControls, IDLE_STATUS, type DemoStatus } from "./demo-controls"
import type { RagIslandProps } from "./rag-island"
import "./rag-stage.css"

const loadRag = () => import("./rag-island")
// A chunk that fails to load shows the answer instead of an empty window.
const RagIsland = dynamic<RagIslandProps>(
  () => import("./rag-island").catch(() => ({ default: StaticSceneView })),
  { ssr: false, loading: () => null },
)

// the workspace lives on the client's own domain (kept in sync with rag-script UI.url)
const URL = "ai.yourcompany.ae"

export function RagStage({ contact, staticScene }: { contact: SiteSettings["contact"]; staticScene?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const near = useIsland(ref, loadRag)
  const [paused, setPaused] = useState(false)
  const [replay, setReplay] = useState(0)
  const [status, setStatus] = useState<DemoStatus>({ ...IDLE_STATUS, segs: 4 })

  return (
    <div className="rmn-rgw-stage" ref={ref}>
      <div className="rmn-rgw-win">
        <div className="rmn-rgw-winbar" dir="ltr" aria-hidden="true">
          <span className="rmn-rgw-dots"><i /><i /><i /></span>
          <span className="rmn-rgw-url">{Lock}{URL}</span>
          <span />
        </div>
        <div className="rmn-rgw-screen">
          <div className="rmn-rgw-skel" aria-hidden="true"><i className="s" /><i className="h" /><i className="c" /><i className="r" /></div>
          <StaticScene.Provider value={staticScene ?? null}>
            {near && <RagIsland contact={contact} paused={paused} replay={replay} onStatus={setStatus} />}
          </StaticScene.Provider>
          {staticScene && <noscript>{staticScene}</noscript>}
        </div>
      </div>
      <DemoControls status={status} paused={paused}
        onToggle={() => setPaused((v) => !v)} onReplay={() => { setPaused(false); setReplay((r) => r + 1) }} />
    </div>
  )
}

const Lock = (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.2" fill="currentColor" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2.2" /></svg>
)
