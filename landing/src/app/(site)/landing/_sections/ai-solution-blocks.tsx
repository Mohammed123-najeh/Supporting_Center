// One AI solution's full detail block (header + body + capability groups +
// example), and the blocks as a vertical list. Its own module so the CMS
// AI-solutions tab can preview a block (WYSIWYG) without pulling in the
// /ai-solutions page and its live demo; the page's tabbed explorer renders the
// same block.
"use client"
import type { AiSolutionFull } from "@/server/site/types"
import { usePick } from "./site-lang"
import { bodyParagraphs } from "./offer-links"
import { AiSolutionIconGlyph } from "./ai-solution-icons"
import "./ai-solution-blocks.css"

const T = {
  qaLabel: ["مثال", "Example"],
  stepsLabel: ["كيف يعمل", "How it works"],
} as const

// `index` drives the 0N number.
export function AiSolutionBlock({ s, index }: { s: AiSolutionFull; index: number }) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  const num = index + 1 < 10 ? `0${index + 1}` : `${index + 1}`
  const body = bodyParagraphs(pick(s.body_ar, s.body_en))
  const twoCol = s.sections.length >= 2
  return (
    <article id={`ai-${s.slug}`} className="rmn-ai-block">
      <div className="rmn-ai-block-head">
        <span className="rmn-ai-ic" aria-hidden>
          <AiSolutionIconGlyph iconKey={s.icon_key} emoji={s.icon} />
        </span>
        <div>
          <span className="rmn-ai-num" dir="ltr">{num}</span>
          <h2>{pick(s.title_ar, s.title_en)}</h2>
          <p className="rmn-ai-summary">{pick(s.summary_ar, s.summary_en)}</p>
        </div>
      </div>

      {body.length > 0 && (
        <div className="rmn-ai-body">
          {body.map((par, j) => <p key={j}>{par}</p>)}
        </div>
      )}

      {s.sections.length > 0 && (
        <div className={`rmn-ai-groups${twoCol ? " two" : ""}`}>
          {s.sections.map((g, gi) => (
            <div key={gi} className="rmn-ai-group">
              {(g.heading_ar || g.heading_en) && (
                <div className="rmn-ai-group-h">{pick(g.heading_ar, g.heading_en)}</div>
              )}
              <div className="rmn-ai-items">
                {g.items.map((it, ii) => (
                  <span key={ii} className="rmn-ai-item">{pick(it.ar, it.en)}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {s.example?.kind === "qa" && (
        <div className="rmn-ai-example">
          <span className="rmn-ai-ex-lab">{p(T.qaLabel)}</span>
          <div className="rmn-ai-chat">
            <span className="rmn-ai-bubble q">{pick(s.example.q_ar, s.example.q_en)}</span>
            <span className="rmn-ai-bubble a">{pick(s.example.a_ar, s.example.a_en)}</span>
          </div>
        </div>
      )}
      {s.example?.kind === "steps" && s.example.steps.length > 0 && (
        <div className="rmn-ai-example">
          <span className="rmn-ai-ex-lab">{p(T.stepsLabel)}</span>
          {(s.example.intro_ar || s.example.intro_en) && (
            <p className="rmn-ai-ex-intro">{pick(s.example.intro_ar, s.example.intro_en)}</p>
          )}
          <div className="rmn-ai-steps">
            {s.example.steps.map((st, si) => (
              <span key={si} className="rmn-ai-step">{pick(st.ar, st.en)}</span>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

// The solution blocks as a vertical list: the CMS AI-solutions tab previews a
// single one (it passes one draft solution). The public page uses the tabbed
// AiSolutionsExplorer instead.
export function AiSolutionBlocks({ solutions }: { solutions: AiSolutionFull[] }) {
  const active = solutions.filter((s) => s.is_active)
  if (active.length === 0) return null
  return (
    <div className="rmn-ai-list">
      {active.map((s, i) => <AiSolutionBlock key={s.id} s={s} index={i} />)}
    </div>
  )
}
