// The support chat's final scene as plain markup, rendered on the SERVER (no
// "use client"): page.tsx passes it down, the stage puts it in <noscript> for
// visitors without JavaScript and shows it if the demo's chunk fails to load. As a
// server component it adds no JavaScript, and its styles travel inside it, so a
// visitor with JavaScript never even parses them. Only server files import this.
import { APP, SCENE, type Bi } from "./chat-script"

const CSS = `
.rmn .rmn-aic-static{position:absolute;inset:0;z-index:1;display:flex;flex-direction:column;justify-content:flex-end;gap:.45em;padding:1em 1.1em 1.2em;overflow:hidden;background:var(--aic-bg);color:var(--aic-ink);font:400 clamp(10.5px,1.95cqi,14px)/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;text-align:start}
.rmn .rmn-aic-static:lang(ar){font-family:var(--font-tajawal),'Tajawal',sans-serif;line-height:1.6}
.rmn .rmn-aic-static p{max-width:78%;padding:.5em .8em;border-radius:1.1em;font-size:.95em}
.rmn .rmn-aic-static .me{align-self:flex-end;background:var(--aic-me);color:#fff}
.rmn .rmn-aic-static .bot{align-self:flex-start;background:var(--aic-bot)}
.rmn .rmn-aic-static .note{max-width:94%;align-self:center;background:var(--aic-note);color:var(--aic-note-ink);font-size:.78em;text-align:center}
@media (max-width:760px){.rmn .rmn-aic-static{font-size:clamp(12.5px,3.9cqi,15px)}}
`

export function ChatStatic({ lang }: { lang: "ar" | "en" }) {
  const p = (b: Bi) => (lang === "ar" ? b[0] : b[1])
  return (
    <div className="rmn-aic-static" lang={lang}>
      <style>{CSS}</style>
      <p className="note">{p(APP.notice)}</p>
      <p className="me">{p(SCENE.c1)}</p>
      <p className="bot">{p(SCENE.a1)}</p>
      <p className="me">{p(SCENE.c2)}</p>
      <p className="bot">{p(SCENE.a2)}</p>
      <p className="me">{p(SCENE.c3)}</p>
      <p className="bot">{p(SCENE.a3)}</p>
    </div>
  )
}
