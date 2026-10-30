// The support-chat demo inside the always-open Duo: a store's AI assistant
// answering a customer. Client-only and lazy (this file and chat-island.css are an
// async chunk), mounted by chat-stage.tsx one viewport before it scrolls in.
//
// The scene: three exchanges, typed into the composer and answered with replies
// that stream in a few words at a time, while the order page beside the chat
// updates as the assistant acts. It starts once the visitor is looking at the
// device (demo-kit.ts usePlayGate) and stops (no timer, no animation) when they
// are not, the tab is hidden, or they pause it. Then a hint over the composer says
// it is theirs: anything they type gets a canned reply picked by a few keyword
// intents (intents.ts). Nothing here ever touches the network.
//
// Layout never moves while it plays: the message column is top-anchored and only
// ever grows at its end (a message is added when its step comes, a reply replaces
// its own typing indicator), so nothing already on screen moves, and the column
// follows the newest message by transform. The mount stays small: only what the
// scene has reached is in the DOM.
"use client"
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import type { SiteSettings } from "@/server/site/types"
import { useLang } from "../../../../_ui/lang-context"
import { BrandMark } from "../brand-mark"
import { whatsappHref } from "../offer-links"
import { SignalGlyph } from "../pay-duo/glyphs"
import { createTimeline, type Timeline } from "./timeline"
import { chunks, isolate } from "./words"
import { CHUNK_MS, SCENE_CHUNK_MS, useFollow, useGhostTyping, usePlayGate } from "./demo-kit"
import type { DemoStatus } from "./demo-controls"
import { detectScript, matchIntent } from "./intents"
import { APP, LINKS, REPLIES, RULES, SCENE, type Bi, type ReplyKey, type ReplyLink } from "./chat-script"
import "./chat-island.css"

export type ChatPhase = "idle" | "playing" | "done" | "live"
export type ChatIslandProps = {
  contact: SiteSettings["contact"]
  paused: boolean
  replay: number
  onStatus: (status: DemoStatus) => void
}

type Lang = "ar" | "en"
type LiveMsg =
  | { id: number; me: true; text: string }
  // n: how many chunks of the reply have streamed in (undefined once complete)
  | { id: number; me: false; key: ReplyKey; lang: Lang; shown: boolean; n?: number }

const LAST = 10 // the scene's final step: quick replies + the "try it" hint
const MAX_LIVE = 12
const tr = (b: Bi, l: Lang) => (l === "ar" ? b[0] : b[1])

// The scene: an empty chat for a beat, then three exchanges. Each is typed, sent,
// worked on (`think`), streamed in, and left on screen (`hold`) long enough to read
// before the next message starts.
const LEAD = 700
const BEFORE_SEND = 250
const SENT_TO_WORK = 380
const AFTER_REPLY = 250
const EXCHANGES = [
  { c: SCENE.c1, a: SCENE.a1, sent: 1, think: 900, hold: 1400 },
  { c: SCENE.c2, a: SCENE.a2, sent: 4, think: 1000, hold: 1600 },
  { c: SCENE.c3, a: SCENE.a3, sent: 7, think: 850, hold: 500 },
] as const

export default function ChatIsland({ contact, paused, replay, onStatus }: ChatIslandProps) {
  const { lang } = useLang()
  const rtl = lang === "ar"
  const p = (b: Bi) => tr(b, lang)
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)

  const [step, setStep] = useState(reduced ? LAST : 0)
  const [phase, setPhase] = useState<ChatPhase>(reduced ? "live" : "idle")
  const [live, setLive] = useState<LiveMsg[]>([])
  // the scripted reply streaming right now: its step, and how many chunks are in
  const [stream, setStream] = useState<{ step: number; n: number } | null>(null)
  const [playKey, setPlayKey] = useState(0)
  const [tried, setTried] = useState(false) // the visitor has taken over at least once

  const rootRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const colRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const inputId = useId()

  // ── when it may play: the visitor is looking, the tab is visible, not paused ──
  const running = usePlayGate(rootRef, paused)
  const runningRef = useRef(running)
  runningRef.current = running
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const langRef = useRef<Lang>(lang)

  // ── the scene ──
  const tlRef = useRef<Timeline | null>(null)
  const { type: typeGhost, clear: clearGhost } = useGhostTyping(ghostRef, fieldRef)
  const runScene = useCallback(async (tl: Timeline) => {
    const l = langRef.current
    const t = (b: Bi) => tr(b, l)
    // one exchange: type → send → the assistant works → its reply streams in
    const exchange = async (x: (typeof EXCHANGES)[number]) => {
      if (!(await typeGhost(tl, t(x.c)))) return false
      if (!(await tl.wait(BEFORE_SEND))) return false
      clearGhost()
      setStep(x.sent)
      if (!(await tl.wait(SENT_TO_WORK))) return false
      setStep(x.sent + 1)
      if (!(await tl.wait(x.think))) return false
      const total = chunks(t(x.a), l === "ar").length
      for (let n = 1; n <= total; n++) {
        if (n === 1) setStep(x.sent + 2)
        setStream({ step: x.sent + 2, n })
        if (!(await tl.wait(SCENE_CHUNK_MS))) return false
      }
      setStream(null)
      return tl.wait(x.hold + AFTER_REPLY)
    }
    let ok = await tl.wait(LEAD)
    for (const x of EXCHANGES) ok = ok && (await exchange(x))
    return ok
  }, [clearGhost, typeGhost])

  useEffect(() => { if (phase === "idle" && running) setPhase("playing") }, [phase, running])
  useEffect(() => {
    if (phase !== "playing") return
    setStep(0)
    setStream(null)
    clearGhost()
    const tl = createTimeline(undefined, !runningRef.current)
    tlRef.current = tl
    void runScene(tl).then((finished) => {
      if (!finished) return
      setStep(LAST)
      setPhase("done")
    })
    return () => {
      tl.cancel()
      if (tlRef.current === tl) tlRef.current = null
    }
  }, [phase, playKey, runScene, clearGhost])
  useEffect(() => {
    const tl = tlRef.current
    if (!tl) return
    if (running) tl.resume()
    else tl.pause()
  }, [running])
  // Language toggle: a scene in progress restarts in the new language; a finished
  // or live conversation keeps its messages.
  useEffect(() => {
    if (langRef.current === lang) return
    langRef.current = lang
    if (phaseRef.current === "playing") setPlayKey((k) => k + 1)
  }, [lang])

  // the ring under the device: one part per exchange
  const seg = step < 4 ? 0 : step < 7 ? 1 : 2
  useEffect(() => { onStatus({ phase, seg, segs: EXCHANGES.length }) }, [phase, seg, onStatus])

  // ── the visitor takes over ──
  const skip = useCallback(() => {
    setTried(true)
    const ph = phaseRef.current
    if (ph === "live") return
    if (ph !== "done") {
      tlRef.current?.cancel()
      clearGhost()
      setStream(null)
      setStep(LAST)
    }
    setPhase("live")
  }, [clearGhost])

  const seqRef = useRef(0)
  const busyRef = useRef(false)
  const timers = useRef(new Set<number>())
  useEffect(() => {
    const set = timers.current
    return () => { set.forEach((t) => window.clearTimeout(t)); set.clear() }
  }, [])

  const send = useCallback((raw: string) => {
    const text = raw.trim().slice(0, 200)
    if (!text || busyRef.current) return false
    skip()
    const key = matchIntent(text, RULES, "fallback")
    const replyLang: Lang = detectScript(text) ?? langRef.current
    const id = (seqRef.current += 2)
    busyRef.current = true
    setLive((l) => [
      ...l,
      { id, me: true, text } as const,
      { id: id + 1, me: false, key, lang: replyLang, shown: false } as const,
    ].slice(-MAX_LIVE))
    // the reply streams in chunk by chunk once the assistant has "worked" a moment
    const total = chunks(tr(REPLIES[key].text, replyLang), replyLang === "ar").length
    const reveal = (n: number) => {
      const done = reduced || n >= total
      setLive((l) => l.map((m) => (m.id === id + 1 && !m.me ? { ...m, shown: true, n: done ? undefined : n } : m)))
      if (done) { busyRef.current = false; return }
      const t = window.setTimeout(() => { timers.current.delete(t); reveal(n + 1) }, CHUNK_MS)
      timers.current.add(t)
    }
    const wait = reduced ? 0 : (REPLIES[key].status ? 950 : 600) + Math.random() * 350
    const timer = window.setTimeout(() => { timers.current.delete(timer); reveal(1) }, wait)
    timers.current.add(timer)
    return true
  }, [reduced, skip])

  // Replay (from the stage's button): back to an empty chat, played again on screen.
  const replayRef = useRef(replay)
  useEffect(() => {
    if (replayRef.current === replay) return
    replayRef.current = replay
    tlRef.current?.cancel()
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current.clear()
    busyRef.current = false
    clearGhost()
    setLive([])
    setStream(null)
    setTried(false)
    setStep(reduced ? LAST : 0)
    setPhase(reduced ? "live" : "idle")
  }, [replay, reduced, clearGhost])

  const submit = () => {
    const input = inputRef.current
    if (input && send(input.value)) input.value = ""
  }
  const onSubmit = (e: FormEvent) => { e.preventDefault(); submit() }
  // Enter sends (Shift+Enter is a new line); never while an IME is composing.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() }
  }

  // ── keep the newest message in view: move the column, never scroll ──
  // the hint over the composer: once the scene is over (or, with reduced motion, from
  // the start), until the visitor takes over
  const tryIt = !tried && (phase === "done" || phase === "live")
  useFollow(logRef, colRef, ":scope > :not(.rmn-aic-live), :scope > .rmn-aic-live > *", [step, live, lang, tryIt])

  const linkHref = (link: ReplyLink, l: Lang) => {
    if (link === "packages") return "#packages"
    const wa = whatsappHref(contact.whatsapp, tr(link === "demo" ? LINKS.demo : LINKS.whatsapp, l))
    return wa ?? "#contact-section"
  }

  return (
    <div
      ref={rootRef}
      className="rmn-aic-app"
      lang={lang}
      dir={rtl ? "rtl" : "ltr"}
      role="region"
      aria-label={p(APP.region)}
      data-paused={!running && phase !== "live" ? "" : undefined}
      data-out={step >= 3 ? "" : undefined}
      data-eta={step >= 6 ? "tmr" : undefined}
      data-ret={step >= 9 ? "" : undefined}
      data-try={tryIt || undefined}
    >
      <div className="rmn-aic-sbar" aria-hidden="true"><span dir="ltr">9:41</span>{SignalGlyph}</div>
      <div className="rmn-aic-panes">
        <OrderPane p={p} />
        <section className="rmn-aic-chat">
          <header className="rmn-aic-head">
            <span className="rmn-aic-back" aria-hidden="true">{Chevron}</span>
            <span className="rmn-aic-av" aria-hidden="true"><BrandMark className="rmn-aic-mark" /><i /></span>
            <span className="rmn-aic-who"><b>{p(APP.agent)}</b><span>{p(APP.agentSub)}</span></span>
            <span className="rmn-aic-lock" aria-hidden="true">{Lock}</span>
          </header>
          <div className="rmn-aic-banner" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/product-thumb.webp" alt="" width={520} height={390} loading="lazy" decoding="async" />
            <span className="rmn-aic-bn"><b><bdi>RM-2048</bdi> · {p(APP.out)}</b><Eta p={p} /></span>
            <em className="rmn-aic-upd">{p(APP.updated)}</em>
          </div>
          <div className="rmn-aic-log" ref={logRef}>
            <div className="rmn-aic-col" ref={colRef}>
              <p className="rmn-aic-notice">{Lock}<span>{p(APP.notice)}</span></p>
              <p className="rmn-aic-day"><span>{p(APP.today)}</span></p>
              {step >= 1 && <Me read={step >= 2} text={p(SCENE.c1)} time="9:41" />}
              {step >= 2 && <Bot s={step >= 3 ? "reply" : "working"} n={stream?.step === 3 ? stream.n : undefined} status={p(SCENE.s1)} text={p(SCENE.a1)} rtl={rtl} time="9:41" />}
              {step >= 4 && <Me read={step >= 5} text={p(SCENE.c2)} time="9:42" />}
              {step >= 5 && (
                <Bot s={step >= 6 ? "reply" : "working"} n={stream?.step === 6 ? stream.n : undefined} status={p(SCENE.s2)} text={p(SCENE.a2)} rtl={rtl} time="9:42">
                  <span className="rmn-aic-act">{Check}<span>{p(SCENE.act2)} · {isolate(p(APP.etaTomorrow), rtl)}</span></span>
                </Bot>
              )}
              {step >= 7 && <Me read={step >= 8} text={p(SCENE.c3)} time="9:42" />}
              {step >= 8 && (
                <Bot s={step >= 9 ? "reply" : "working"} n={stream?.step === 9 ? stream.n : undefined} status={p(SCENE.s3)} text={p(SCENE.a3)} rtl={rtl} time="9:43">
                  <span className="rmn-aic-src">{Doc}<span>{p(SCENE.src3)}</span></span>
                </Bot>
              )}
              {step >= LAST && (
                <div className="rmn-aic-quick">
                  <button type="button" className="rmn-aic-qbtn" onClick={() => send(p(SCENE.quickPickup))}>{p(SCENE.quickPickup)}</button>
                  <button type="button" className="rmn-aic-qbtn" onClick={() => send(p(SCENE.quickHuman))}>{p(SCENE.quickHuman)}</button>
                </div>
              )}
              <div className="rmn-aic-live" role="log" aria-live="polite" aria-relevant="additions">
                {live.map((m) => m.me
                  ? <Me key={m.id} read text={m.text} time="9:44" />
                  : (
                    <Bot key={m.id} live s={m.shown ? "reply" : "working"} n={m.n} lang={m.lang} rtl={m.lang === "ar"} time="9:44"
                      status={REPLIES[m.key].status ? tr(REPLIES[m.key].status!, m.lang) : undefined}
                      text={tr(REPLIES[m.key].text, m.lang)}
                    >
                      {REPLIES[m.key].link && (
                        <a className="rmn-aic-link" href={linkHref(REPLIES[m.key].link!, m.lang)}
                          {...(REPLIES[m.key].link === "packages" ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
                          {tr(LINKS[REPLIES[m.key].link!], m.lang)}
                        </a>
                      )}
                    </Bot>
                  ))}
              </div>
            </div>
          </div>
          <form className="rmn-aic-composer" onSubmit={onSubmit}>
            {/* the "try it" hint: a tap focuses the composer (and raises the keyboard) */}
            <button type="button" className="rmn-aic-coach" onClick={() => inputRef.current?.focus()}>
              {Sparkle}<span>{p(APP.tryIt)}</span>
            </button>
            <span className="rmn-aic-plus" aria-hidden="true">{Plus}</span>
            <div className="rmn-aic-field" ref={fieldRef}>
              <label className="rmn-aic-vh" htmlFor={inputId}>{p(APP.inputLabel)}</label>
              {/* a fixed two-line box: long text wraps inside it, nothing around it moves */}
              <textarea id={inputId} ref={inputRef} className="rmn-aic-input" rows={2} dir="auto" autoComplete="off"
                enterKeyHint="send" maxLength={200} placeholder={p(APP.placeholder)} onFocus={skip} onKeyDown={onKeyDown} />
              <span className="rmn-aic-ghost" ref={ghostRef} aria-hidden="true" />
            </div>
            <button type="submit" className="rmn-aic-send" aria-label={p(APP.send)}>{Send}</button>
          </form>
        </section>
      </div>
    </div>
  )
}

// A customer bubble (end side), with read receipts.
function Me({ read, text, time }: { read: boolean; text: string; time: string }) {
  return (
    <div className="rmn-aic-m">
      <p className="rmn-aic-bub">
        <span dir="auto">{text}</span>
        <span className="rmn-aic-meta" aria-hidden="true">{time}<span className="rmn-aic-ticks" data-read={read || undefined}>{Ticks}</span></span>
      </p>
    </div>
  )
}

// An assistant message (start side): a typing indicator with what it is doing,
// replaced in place by the reply, which streams in chunk by chunk (n of them so
// far; all once n is undefined). Its extras follow when it is complete. A live
// reply is read out once, whole, from a hidden copy.
function Bot({ s, status, text, rtl, time, live = false, lang, n, children }: {
  s: "working" | "reply"; status?: string; text: string; rtl: boolean; time: string
  live?: boolean; lang?: Lang; n?: number; children?: ReactNode
}) {
  const cs = chunks(text, rtl)
  const complete = n == null || n >= cs.length
  return (
    <div className="rmn-aic-a" data-s={s} lang={lang} dir={lang ? (rtl ? "rtl" : "ltr") : undefined}>
      {s === "working" ? (
        <div className="rmn-aic-typing" aria-hidden="true">
          <span className="rmn-aic-dots"><i /><i /><i /></span>
          {status && <span className="rmn-aic-status">{isolate(status, rtl)}</span>}
        </div>
      ) : (
        <div className="rmn-aic-bub" data-streaming={complete ? undefined : ""}>
          {live && complete && <span className="rmn-aic-vh">{text}</span>}
          {/* each chunk is its own bidi isolate: earlier text never moves as more
              arrives (a growing node, or a space resolved by what follows it, would
              nudge it in Arabic); nothing sits below the text until it is complete */}
          <span className="rmn-aic-txt" aria-hidden={live || undefined}>
            {cs.slice(0, n ?? cs.length).map((c, i) => <span key={i} className="rmn-aic-c">{c}</span>)}
          </span>
          {/* holds the bubble at its final width while it streams: a reply in the
              other script (English in the Arabic chat) is pinned to the far side,
              so a widening bubble would drag its text along */}
          {!complete && <span className="rmn-aic-size" aria-hidden="true">{cs.join("")}</span>}
          {complete && children}
          {complete && <span className="rmn-aic-meta" aria-hidden="true">{time}</span>}
        </div>
      )}
    </div>
  )
}

// The store app's order page beside the chat (the left pane on desktop). It is
// context, not content: the assistant's actions show up here (the delivery slot
// moves, the returns row lights), driven by data-* on the island root.
function OrderPane({ p }: { p: (b: Bi) => string }) {
  return (
    <section className="rmn-aic-order" aria-hidden="true">
      <div className="rmn-aic-ohead"><BrandMark className="rmn-aic-omark" /><b>{p(APP.store)}</b><span>{p(APP.myOrders)}</span></div>
      <div className="rmn-aic-oprod">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/product-thumb.webp" alt="" width={520} height={390} loading="lazy" decoding="async" />
        <span><b>{p(APP.product)}</b><span>{p(APP.productSub)}</span><em dir="ltr">AED 420</em></span>
      </div>
      <p className="rmn-aic-ono"><span>{p(APP.order)}</span><b dir="ltr">RM-2048</b></p>
      <ol className="rmn-aic-track">
        <li className="is-done"><i /><b>{p(APP.ordered)}</b><span>{p(APP.orderedAt)}</span></li>
        <li className="is-done"><i /><b>{p(APP.shipped)}</b><span>{p(APP.shippedAt)}</span></li>
        <li className="is-now"><i /><b>{p(APP.out)}</b><span>{p(APP.outAt)}</span></li>
        <li><i /><b>{p(APP.delivered)}</b><Eta p={p} /></li>
      </ol>
      <div className="rmn-aic-ocard">
        <p className="rmn-aic-orow rmn-aic-odel"><span>{p(APP.delivery)}</span><Eta p={p} /><em className="rmn-aic-upd">{p(APP.updated)}</em></p>
        <p className="rmn-aic-orow"><span>{p(APP.address)}</span><b>{p(APP.addressVal)}</b></p>
        <p className="rmn-aic-orow rmn-aic-oret"><span>{p(APP.returns)}</span><b>{p(APP.returnsVal)}</b></p>
      </div>
    </section>
  )
}

// Today's slot and tomorrow's, stacked in one cell; data-eta cross-fades them.
function Eta({ p }: { p: (b: Bi) => string }) {
  return (
    <span className="rmn-aic-eta">
      <span className="is-a">{p(APP.etaToday)}</span>
      <span className="is-b">{p(APP.etaTomorrow)}</span>
    </span>
  )
}

const Chevron = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-7 7 7 7" /></svg>
)
const Lock = (
  <svg className="rmn-aic-lockic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2.2" fill="currentColor" /><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" /></svg>
)
const Check = (
  <svg className="rmn-aic-checkic" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} /></svg>
)
const Doc = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" strokeLinecap="round" /></svg>
)
const Ticks = (
  <svg viewBox="0 0 26 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 9l4 4 8-9M11 12l1 1 8-9" /></svg>
)
const Plus = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
)
const Send = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg>
)
const Sparkle = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 3.5l1.7 4.8 4.8 1.7-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7zM18 13l.9 2.1 2.1.9-2.1.9L18 19l-.9-2.1L15 16l2.1-.9z" /></svg>
)
