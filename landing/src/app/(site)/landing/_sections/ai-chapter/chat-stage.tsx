// The support-chat demo's stage: the always-open Duo with a quiet skeleton on its
// screen (server-rendered, sized by CSS, so nothing ever moves), the live demo
// mounted as a lazy island one viewport before it scrolls in, the final scene
// (rendered on the server and passed in) in <noscript> for visitors without
// JavaScript, and its one control (pause / play / replay) in the corner under it.
"use client"
import dynamic from "next/dynamic"
import { useRef, useState, type ReactNode } from "react"
import type { SiteSettings } from "@/server/site/types"
import { DuoOpen } from "./duo-open"
import { StaticScene, StaticSceneView } from "./demo-fallback"
import { useIsland } from "./island"
import { DemoControls, IDLE_STATUS, type DemoStatus } from "./demo-controls"
import type { ChatIslandProps } from "./chat-island"
import "./chat-stage.css"

const loadChat = () => import("./chat-island")
// A chunk that fails to load shows the final scene instead of an empty phone.
const ChatIsland = dynamic<ChatIslandProps>(
  () => import("./chat-island").catch(() => ({ default: StaticSceneView })),
  { ssr: false, loading: () => null },
)

export function ChatStage({ contact, staticScene }: { contact: SiteSettings["contact"]; staticScene?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const near = useIsland(ref, loadChat)
  const [paused, setPaused] = useState(false)
  const [replay, setReplay] = useState(0)
  const [status, setStatus] = useState<DemoStatus>(IDLE_STATUS)

  return (
    <div className="rmn-aic-stage" ref={ref}>
      <DuoOpen below={
        <DemoControls status={status} paused={paused}
          onToggle={() => setPaused((v) => !v)} onReplay={() => { setPaused(false); setReplay((r) => r + 1) }} />
      }>
        <div className="rmn-aic-skel" aria-hidden="true"><i className="o" /><i className="h" /><i className="c" /></div>
        <StaticScene.Provider value={staticScene ?? null}>
          {near && <ChatIsland contact={contact} paused={paused} replay={replay} onStatus={setStatus} />}
        </StaticScene.Provider>
        {staticScene && <noscript>{staticScene}</noscript>}
      </DuoOpen>
    </div>
  )
}
