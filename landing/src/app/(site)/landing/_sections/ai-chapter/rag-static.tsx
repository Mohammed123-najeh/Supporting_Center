// The knowledge workspace's answer as plain markup, rendered on the SERVER (no
// "use client"): page.tsx passes it down, the stage puts it in <noscript> for
// visitors without JavaScript and shows it if the demo's chunk fails to load. As a
// server component it adds no JavaScript, and its styles travel inside it, so a
// visitor with JavaScript never even parses them. Only server files import this.
import { ANSWER, SOURCES, UI, type Bi, type Part } from "./rag-script"

const CSS = `
.rmn .rmn-rgw-static{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;gap:.75em;padding:1.4em;overflow:hidden;background:var(--aic-bg);color:var(--aic-ink);font:400 14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;text-align:start}
.rmn .rmn-rgw-static:lang(ar){font-family:var(--font-tajawal),'Tajawal',sans-serif}
.rmn .rmn-rgw-static .q{align-self:flex-end;max-width:80%;padding:.6em .95em;border-radius:1.1em;background:var(--aic-me);color:#fff}
.rmn .rmn-rgw-static .a{max-width:46em}
.rmn .rmn-rgw-static .s{font-size:.85em;color:var(--aic-muted)}
`

export function RagStatic({ lang }: { lang: "ar" | "en" }) {
  const p = (b: Bi) => (lang === "ar" ? b[0] : b[1])
  const text = (parts: Part[]) =>
    parts.map((x) => ("cite" in x ? `[${x.cite}]` : p(x.t))).join(" ").replace(/\s+([,.:;،])/g, "$1")
  return (
    <div className="rmn-rgw-static" lang={lang}>
      <style>{CSS}</style>
      <p className="q">{p(UI.question)}</p>
      <p className="a">{text(ANSWER.p1)} {text(ANSWER.p2)}</p>
      <p className="s"><b>[1]</b> <bdi>{SOURCES[1].file}</bdi> · {p(SOURCES[1].where)}</p>
      <p className="s"><b>[2]</b> <bdi>{SOURCES[2].file}</bdi> · {p(SOURCES[2].where)}</p>
    </div>
  )
}
