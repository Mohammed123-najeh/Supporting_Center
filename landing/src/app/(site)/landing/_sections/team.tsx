// Founders/Team — "stitched-thread spotlight". A vertical embroidery thread
// (the site's signature dashed red line) sews down the section; FEATURED
// members (CEO/co-founders) attach to it alternately left/right as large
// spotlight entries: hoop-framed portrait + stitch knot + kufi name + role
// chip + optional pull-quote + bio. Remaining members follow in a compact
// strip. Same identity as everything else (.rmn tokens, stitch motifs).
// Exported pieces are reused by the CMS live preview.
"use client"
import type { TeamMember } from "@/server/site/types"
import { usePick } from "./site-lang"
import { StitchDivider } from "./stitch-divider"

const T = {
  eyebrow: ["قيادة رمّانة", "Rummanah leadership"],
  title: ["الفريق المؤسِّس", "The founding team"],
  lead: ["مهندسون يجمعون بين الخبرة التقنية وفهم السوق المحلي.", "Engineers who combine technical expertise with local-market understanding."],
} as const

function mediaUrl(rel: string | null): string | null {
  return rel ? `/media/${rel}` : null
}

function initials(name: string): string {
  const parts = name.trim().replace(/^(م\.|د\.|Eng\.|Dr\.)\s*/i, "").split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")) || "ر"
}

// One spotlight entry on the thread. `side` alternates the layout (a = hoop
// inline-start, b = hoop inline-end); collapses to one column on mobile.
export function FounderEntry({ member, side = "a", delay = "0s" }: {
  member: TeamMember
  side?: "a" | "b"
  delay?: string
}) {
  const pick = usePick()
  const name = pick(member.name_ar, member.name_en)
  const role = pick(member.role_ar, member.role_en)
  const bio = pick(member.bio_ar, member.bio_en)
  const quote = pick(member.quote_ar, member.quote_en)
  const img = mediaUrl(member.image_path)
  return (
    <div className={`rmn-founder reveal${side === "b" ? " alt" : ""}`} style={{ ["--d" as string]: delay }}>
      <span className="rmn-founder-knot" aria-hidden>✕</span>
      <div className="rmn-founder-hoop">
        {img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={img} alt={name} loading="lazy" />
          : <span className="rmn-founder-initials">{initials(name || "ر")}</span>}
      </div>
      <div className="rmn-founder-copy">
        <h3>{name || "—"}</h3>
        {role && <span className="rmn-founder-role">{role}</span>}
        {quote && <div className="rmn-founder-quote">{quote}</div>}
        {bio && <p>{bio}</p>}
      </div>
    </div>
  )
}

// Compact strip entry for the rest of the team.
export function TeamMini({ member, delay = "0s" }: { member: TeamMember; delay?: string }) {
  const pick = usePick()
  const name = pick(member.name_ar, member.name_en)
  const role = pick(member.role_ar, member.role_en)
  const img = mediaUrl(member.image_path)
  return (
    <div className="rmn-team-mini reveal" style={{ ["--d" as string]: delay }}>
      <span className="rmn-team-mini-hoop">
        {img
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={img} alt={name} loading="lazy" />
          : initials(name || "ر")}
      </span>
      <b>{name || "—"}</b>
      {role && <small>{role}</small>}
    </div>
  )
}

export function TeamSection({ team }: { team: TeamMember[] }) {
  const pick = usePick()
  const p = (pair: readonly [string, string]) => pick(pair[0], pair[1])
  if (team.length === 0) return null

  // Featured members lead the thread; with none flagged, the first member is
  // spotlighted so the section never regresses to an empty thread.
  let featured = team.filter((m) => m.is_featured)
  let rest = team.filter((m) => !m.is_featured)
  if (featured.length === 0) {
    featured = team.slice(0, 1)
    rest = team.slice(1)
  }

  return (
    <section className="team" id="team">
      <div className="container">
        <div className="section-head reveal">
          <StitchDivider crosses={7} />
          <span className="eyebrow">{p(T.eyebrow)}</span>
          <h2>{p(T.title)}</h2>
          <p>{p(T.lead)}</p>
        </div>

        <div className="rmn-founders">
          <div className="rmn-thread-line reveal" aria-hidden />
          {featured.map((m, i) => (
            <FounderEntry key={m.id} member={m} side={i % 2 ? "b" : "a"} delay={`${0.08 + i * 0.14}s`} />
          ))}
        </div>

        {rest.length > 0 && (
          <>
            <StitchDivider crosses={5} />
            <div className="rmn-team-strip">
              {rest.map((m, i) => (
                <TeamMini key={m.id} member={m} delay={`${0.05 + i * 0.1}s`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
