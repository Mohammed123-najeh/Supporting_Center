// A demo's one control, in the corner under it (outside the device, so it never
// reads as part of the app being shown): pause while the scene plays, play while
// it is paused, replay once it is over. The ring around it is the scene in parts
// (each exchange, or each stage of the work), lit as each is reached. A scene that
// plays for more than 5 seconds needs a way to pause it (WCAG 2.2.2). The ring
// changes only when a part does: nothing in it animates frame by frame.
"use client"
import { usePick } from "../site-lang"
import "./demo-stage.css"

/** What a demo island tells its stage: where the scene is, and which of its parts
 *  (`seg` of `segs`) is playing. */
export type DemoPhase = "idle" | "playing" | "done" | "live"
export type DemoStatus = { phase: DemoPhase; seg: number; segs: number }
export const IDLE_STATUS: DemoStatus = { phase: "idle", seg: 0, segs: 3 }

const T = {
  pause: ["إيقاف العرض مؤقتاً", "Pause the demo"],
  play: ["تشغيل العرض", "Play the demo"],
  replay: ["إعادة العرض من البداية", "Replay the demo"],
} as const

const GAP = 14 // degrees between the ring's parts

export function DemoControls({ status, paused, onToggle, onReplay }: {
  status: DemoStatus
  paused: boolean
  onToggle: () => void
  onReplay: () => void
}) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const { phase, seg, segs } = status
  const over = phase === "done" || phase === "live"
  const label = over ? p(T.replay) : paused ? p(T.play) : p(T.pause)
  const arc = 360 / segs
  return (
    <div className="rmn-aic-ctl" data-phase={phase}>
      <button type="button" className="rmn-aic-ring" aria-label={label} title={label} onClick={over ? onReplay : onToggle}>
        <svg className="rmn-aic-ring-p" viewBox="0 0 46 46" aria-hidden="true">
          {Array.from({ length: segs }, (_, i) => (
            <circle key={i} className="s" cx="23" cy="23" r="21.5" pathLength={360}
              strokeDasharray={`${arc - GAP} 360`} transform={`rotate(${-90 + i * arc + GAP / 2} 23 23)`}
              data-s={over || i < seg ? "done" : i === seg && phase === "playing" ? "now" : undefined} />
          ))}
        </svg>
        {over ? ReplayIcon : paused ? PlayIcon : PauseIcon}
      </button>
    </div>
  )
}

const PauseIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" /></svg>
)
const PlayIcon = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.2-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg>
)
const ReplayIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7" /><path d="M4 4v4.3h4.3" /></svg>
)
