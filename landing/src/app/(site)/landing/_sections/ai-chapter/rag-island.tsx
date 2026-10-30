// The knowledge-workspace (RAG) demo: a company's files become a searchable,
// cited knowledge base. Client-only and lazy (this file and rag-island.css are an
// async chunk), mounted by rag-stage.tsx one viewport before it scrolls in.
//
// The scene (≈15 s): sample files drop in and index → a question is typed → the
// retrieval trace → the answer streams in with its figures, a chart and citations
// → the sources show the exact passage → the summary is exported. It plays only
// while the visitor is looking at it and the tab is visible; its control (pause /
// play / replay) lives on the stage. Then a hint over the composer says it is the
// visitor's: follow-up questions with their own answers, free typing, and an
// optional file of their own, read for its name and size only and never uploaded.
// Nothing here ever touches the network. On phones the files index inside the drop
// panel, and a source opens in a sheet over the thread.
//
// Layout never moves while it plays: lists and the thread are top-anchored and only
// grow at their end (a step adds its element; an answer's body follows its trace),
// the drop zone and the toast are overlays, and the thread follows the newest
// message by transform. Only what the scene has reached is in the DOM.
"use client"
import { Fragment, useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from "react"
import type { SiteSettings } from "@/server/site/types"
import { useLang } from "../../../../_ui/lang-context"
import { BrandMark } from "../brand-mark"
import { whatsappHref } from "../offer-links"
import { createTimeline, type Timeline } from "./timeline"
import { chunks, isolate } from "./words"
import { detectScript, matchIntent } from "./intents"
import { CHUNK_MS, SCENE_CHUNK_MS, useFollow, useGhostTyping, usePlayGate } from "./demo-kit"
import type { DemoStatus } from "./demo-controls"
import {
  ANSWER, COMPARE, EMAIL, FILES, FOLLOW, OVERDUE_ROWS, RAG_RULES, REPLY, SOURCES, SUMMARY, TABLE, UI,
  type Bi, type FollowKey, type Part, type RagKey,
} from "./rag-script"
import "./rag-island.css"

export type RagPhase = "idle" | "playing" | "done" | "live"
export type RagIslandProps = {
  contact: SiteSettings["contact"]
  paused: boolean
  replay: number
  onStatus: (status: DemoStatus) => void
}

type Lang = "ar" | "en"
type UserFile = { name: string; size: string; kind: "pdf" | "xlsx" | "docx" | "file"; ready: boolean }
type LiveItem =
  | { id: number; kind: "ask"; text: string }
  // n: how many units of the answer have streamed in (undefined once complete)
  | { id: number; kind: "answer"; key: RagKey | "userFile"; lang: Lang; shown: boolean; file?: string; n?: number }
  | { id: number; kind: "note"; lang: Lang; file: string }

// 1 drop · 2 uploading · 3 reading · 4 indexed · 5 asked · 6 searching · 7 answer
// · 8 a source opened · 9 summary exported · 10 the visitor's turn
const LAST = 10
const MAX_LIVE = 8
const tr = (b: Bi, l: Lang) => (l === "ar" ? b[0] : b[1])
const fill = (s: string, name: string) => s.replace("{name}", name)
const plain = (parts: Part[], l: Lang) =>
  parts.map((p) => ("cite" in p ? ` [${p.cite}]` : tr(p.t, l))).join(" ").replace(/\s+([,.:;،])/g, "$1").replace(/\s+/g, " ").trim()
// An answer streams in units: p1's parts, the chart, p2's parts, then the sources
// and actions. A visitor's answers come a unit every PART_MS; the scene's a little
// slower, so it can be followed.
const PART_MS = CHUNK_MS + 40
const SCENE_PART_MS = SCENE_CHUNK_MS + 45
const U1 = ANSWER.p1.length
const U2 = ANSWER.p2.length
const ANS_UNITS = U1 + 1 + U2 + 1

// The scene's beats (ms): the empty workspace, then the files dropping in, uploading,
// being read and indexed; a pause and the question; the search, the answer
// streaming in; a source opened, the summary exported, and a last look.
const B = { lead: 700, upload: 900, read: 1000, indexed: 900, think: 600, send: 250, search: 400, found: 1500, open: 1200, export: 1800, rest: 1400 }

function kindOf(name: string): UserFile["kind"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (ext === "pdf") return "pdf"
  if (["xls", "xlsx", "csv"].includes(ext)) return "xlsx"
  if (["doc", "docx", "txt", "md", "ppt", "pptx"].includes(ext)) return "docx"
  return "file"
}
function sizeOf(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function RagIsland({ contact, paused, replay, onStatus }: RagIslandProps) {
  const { lang } = useLang()
  const rtl = lang === "ar"
  const p = (b: Bi) => tr(b, lang)
  const [reduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches)

  const [step, setStep] = useState(reduced ? LAST : 0)
  const [phase, setPhase] = useState<RagPhase>(reduced ? "live" : "idle")
  const [live, setLive] = useState<LiveItem[]>([])
  const [focus, setFocus] = useState<1 | 2 | null>(null)
  const [ansN, setAnsN] = useState<number | null>(null) // the scene's answer: units in so far (null = all)
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null)
  const [userFile, setUserFile] = useState<UserFile | null>(null)
  const [playKey, setPlayKey] = useState(0)
  const [tried, setTried] = useState(false) // the visitor has taken over at least once

  const rootRef = useRef<HTMLDivElement>(null)
  const logRef = useRef<HTMLDivElement>(null)
  const colRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputId = useId()
  const fileId = useId()

  const running = usePlayGate(rootRef, paused)
  const runningRef = useRef(running)
  runningRef.current = running
  const phaseRef = useRef(phase)
  phaseRef.current = phase
  const langRef = useRef<Lang>(lang)
  const userFileRef = useRef(userFile)
  userFileRef.current = userFile

  // ── the scene ──
  const tlRef = useRef<Timeline | null>(null)
  const { type: typeGhost, clear: clearGhost } = useGhostTyping(ghostRef, fieldRef)
  const runScene = useCallback(async (tl: Timeline) => {
    const l = langRef.current
    const at = async (ms: number, s: number) => { if (!(await tl.wait(ms))) return false; setStep(s); return true }
    const streamAnswer = async () => {
      setAnsN(0)
      setStep(7)
      for (let n = 1; n <= ANS_UNITS; n++) {
        setAnsN(n)
        if (!(await tl.wait(SCENE_PART_MS))) return false
      }
      setAnsN(null)
      return true
    }
    return (await at(B.lead, 1)) && (await at(B.upload, 2)) && (await at(B.read, 3)) && (await at(B.indexed, 4))
      && (await tl.wait(B.think)) && (await typeGhost(tl, tr(UI.question, l)))
      && (await tl.wait(B.send)) && (clearGhost(), true) && (await at(0, 5))
      && (await at(B.search, 6)) && (await tl.wait(B.found)) && (await streamAnswer())
      && (await at(B.open, 8)) && (await at(B.export, 9)) && (await tl.wait(B.rest))
  }, [clearGhost, typeGhost])

  useEffect(() => { if (phase === "idle" && running) setPhase("playing") }, [phase, running])
  useEffect(() => {
    if (phase !== "playing") return
    setStep(0)
    setAnsN(null)
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
  useEffect(() => {
    if (langRef.current === lang) return
    langRef.current = lang
    if (phaseRef.current === "playing") setPlayKey((k) => k + 1)
  }, [lang])
  // the ring under the window: the files, the question, the answer, its sources
  const seg = step < 4 ? 0 : step < 5 ? 1 : step < 8 ? 2 : 3
  useEffect(() => { onStatus({ phase, seg, segs: 4 }) }, [phase, seg, onStatus])

  // ── the visitor takes over ──
  const skip = useCallback(() => {
    setTried(true)
    const ph = phaseRef.current
    if (ph === "live") return
    if (ph !== "done") {
      tlRef.current?.cancel()
      clearGhost()
      setAnsN(null)
      setStep(LAST)
    }
    setPhase("live")
  }, [clearGhost])

  const timers = useRef(new Set<number>())
  const later = useCallback((fn: () => void, ms: number) => {
    const t = window.setTimeout(() => { timers.current.delete(t); fn() }, reduced ? 0 : ms)
    timers.current.add(t)
  }, [reduced])
  useEffect(() => {
    const set = timers.current
    return () => { set.forEach((t) => window.clearTimeout(t)); set.clear() }
  }, [])

  const showToast = useCallback((text: string) => {
    const id = Date.now()
    setToast({ id, text })
    later(() => setToast((t) => (t?.id === id ? null : t)), 2400)
  }, [later])

  const seqRef = useRef(0)
  const busyRef = useRef(false)
  const ask = useCallback((text: string, forced?: FollowKey) => {
    const q = text.trim().slice(0, 200)
    if (!q || busyRef.current) return false
    skip()
    const replyLang: Lang = detectScript(q) ?? langRef.current
    // a question the sample files can't answer is about the visitor's own file, if any
    const intent: RagKey = forced ?? matchIntent(q, RAG_RULES, "fallback")
    const key: RagKey | "userFile" = intent === "fallback" && userFileRef.current?.ready ? "userFile" : intent
    const id = (seqRef.current += 2)
    busyRef.current = true
    setLive((l) => [
      ...l,
      { id, kind: "ask", text: q } as const,
      { id: id + 1, kind: "answer", key, lang: replyLang, shown: false, file: userFileRef.current?.name } as const,
    ].slice(-MAX_LIVE))
    // after the trace, the answer streams in unit by unit
    const total = answerUnits(key, replyLang, userFileRef.current?.name ?? "") + 1
    const reveal = (n: number) => {
      const done = reduced || n >= total
      setLive((l) => l.map((m) => (m.id === id + 1 && m.kind === "answer" ? { ...m, shown: true, n: done ? undefined : n } : m)))
      if (done) { busyRef.current = false; return }
      later(() => reveal(n + 1), PART_MS)
    }
    later(() => reveal(1), 1000 + Math.random() * 300)
    return true
  }, [later, skip])

  const submit = () => {
    const input = inputRef.current
    if (input && ask(input.value)) input.value = ""
  }
  const onSubmit = (e: FormEvent) => { e.preventDefault(); submit() }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() }
  }

  // The visitor's own file: its name, size and type, nothing else (no FileReader,
  // no upload). It fills the row reserved for it, "indexes", then a note says so.
  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    skip()
    const name = file.name.length > 60 ? `${file.name.slice(0, 40)}…${file.name.slice(-12)}` : file.name
    setUserFile({ name, size: sizeOf(file.size), kind: kindOf(file.name), ready: false })
    showToast(`${name} · ${p(UI.localIndexing)}`)
    later(() => {
      setUserFile((f) => (f ? { ...f, ready: true } : f))
      const id = (seqRef.current += 2)
      setLive((l) => [...l, { id, kind: "note", lang: langRef.current, file: name } as const].slice(-MAX_LIVE))
    }, 1400)
  }

  const exportSummary = () => {
    const blob = new Blob(["﻿", lang === "ar" ? SUMMARY.ar : SUMMARY.en], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = SUMMARY.file
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast(`${p(UI.exported)} · ${SUMMARY.file}`)
  }
  const copyText = (text: string) => {
    void navigator.clipboard?.writeText(text).then(() => showToast(p(UI.copied)), () => {})
  }
  const openSource = (n: 1 | 2) => { skip(); setFocus((f) => (f === n ? null : n)) }

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
    setAnsN(null)
    setFocus(null)
    setToast(null)
    setUserFile(null)
    setTried(false)
    setStep(reduced ? LAST : 0)
    setPhase(reduced ? "live" : "idle")
  }, [replay, reduced, clearGhost])

  // the hint over the composer: once the scene is over (or, with reduced motion, from
  // the start), until the visitor takes over
  const tryIt = !tried && (phase === "done" || phase === "live")
  useFollow(logRef, colRef, ":scope > :not(.rmn-rgw-live), :scope > .rmn-rgw-live > *", [step, live, lang, tryIt])

  const demoHref = whatsappHref(contact.whatsapp, p(REPLY.demoWa)) ?? "#contact-section"
  const fileState = step < 2 ? "off" : step < 3 ? "up" : step < 4 ? "read" : "done"
  const status = step >= 7 ? "answered" : step >= 5 ? "searching" : step >= 4 ? "indexed" : step >= 1 ? "indexing" : "ready"
  const shownFocus = focus ?? (step === 8 || step === 9 ? 1 : null)
  // phones: the source in the sheet (kept while it slides away)
  const sheetRef = useRef<1 | 2>(1)
  if (shownFocus) sheetRef.current = shownFocus
  const scriptToast = step === 9 ? `${p(UI.exported)} · ${SUMMARY.file}` : null
  const an = ansN ?? ANS_UNITS

  return (
    <div
      ref={rootRef}
      className="rmn-rgw-app"
      lang={lang}
      dir={rtl ? "rtl" : "ltr"}
      role="region"
      aria-label={p(UI.region)}
      data-fly={step === 1 || undefined}
      data-drop={(step >= 1 && step <= 3) || undefined}
      data-ready={step >= 4 || undefined}
      data-asked={step >= 5 || undefined}
      data-paused={!running && phase !== "live" ? "" : undefined}
      data-try={tryIt || undefined}
    >
      {/* ── sidebar: spaces + the files being indexed ── */}
      <aside className="rmn-rgw-side" aria-hidden="true">
        <div className="rmn-rgw-brand"><BrandMark className="rmn-rgw-mark" /><b>{p(UI.brand)}</b></div>
        <span className="rmn-rgw-new">{Plus}{p(UI.newChat)}</span>
        <p className="rmn-rgw-label">{p(UI.spaces)}</p>
        <ul className="rmn-rgw-spaces">
          <li className="is-on"><i />{p(UI.space1)}</li>
          <li><i />{p(UI.space2)}</li>
          <li><i />{p(UI.space3)}</li>
        </ul>
        <p className="rmn-rgw-label">{p(UI.files)}</p>
        <ul className="rmn-rgw-files">
          {step >= 2 && <FileRows state={fileState} p={p} />}
          {userFile && (
            <li className="rmn-rgw-frow" data-f={userFile.ready ? "done" : "mine"}>
              <FileTile kind={userFile.kind} />
              <span className="rmn-rgw-fname"><b><bdi>{userFile.name}</bdi></b>
                <span className="rmn-rgw-fst">
                  <span className="is-up">{p(UI.localIndexing)}</span>
                  <span className="is-done">{Check}{userFile.size} · {p(UI.localReady)}</span>
                </span>
              </span>
              <span className="rmn-rgw-bar"><i /></span>
            </li>
          )}
        </ul>
        <div className="rmn-rgw-private">{Shield}<span><b>{p(UI.privateT)}</b>{p(UI.privateS)}</span></div>
      </aside>

      {/* ── the conversation ── */}
      <section className="rmn-rgw-main">
        <header className="rmn-rgw-head">
          <span className="rmn-rgw-title"><b>{p(UI.space1)}</b><span>{p(UI.headSub)}</span></span>
          <span className="rmn-rgw-status" data-s={status} aria-hidden="true">
            <i />
            <span className="rmn-rgw-sts">
              <span className="is-ready">{p(UI.stReady)}</span>
              <span className="is-indexing">{p(UI.stIndexing)}</span>
              <span className="is-indexed">{p(UI.stIndexed)}</span>
              <span className="is-searching">{p(UI.stSearching)}</span>
              <span className="is-answered">{p(UI.stAnswered)}</span>
            </span>
          </span>
        </header>

        <div className="rmn-rgw-log" ref={logRef}>
          <div className="rmn-rgw-col" ref={colRef}>
            {step >= 5 && <div className="rmn-rgw-q"><p dir="auto">{p(UI.question)}</p></div>}
            {step >= 6 && (
            <article className="rmn-rgw-a" data-s={step >= 7 ? "reply" : "working"}>
              <span className="rmn-rgw-av" aria-hidden="true"><BrandMark className="rmn-rgw-mark" /></span>
              <Trace rows={[UI.trace1, UI.trace2, UI.trace3]} p={p} timing />
              {step >= 7 && (
              <div className="rmn-rgw-body">
                <p><Parts parts={ANSWER.p1} n={Math.min(an, U1)} lang={lang} onCite={openSource} pressed={step === 8 ? 1 : null} /></p>
                {an > U1 && (
                <div className="rmn-rgw-chart" aria-hidden="true">
                  <span className="rmn-rgw-stack">
                    <i className="is-a" style={{ flexGrow: 19 }} /><i className="is-c" style={{ flexGrow: 5 }} /><i className="is-o" style={{ flexGrow: 3 }} />
                  </span>
                  <span className="rmn-rgw-legend">
                    <span><i className="is-a" />{p(UI.active)} <b>19</b></span>
                    <span><i className="is-c" />{p(UI.closed)} <b>5</b></span>
                    <span><i className="is-o" />{p(UI.overdue)} <b>3</b></span>
                  </span>
                </div>
                )}
                {an > U1 + 1 && <p><Parts parts={ANSWER.p2} n={Math.min(an - U1 - 1, U2)} lang={lang} onCite={openSource} /></p>}
                {an >= ANS_UNITS && (<>
                <div className="rmn-rgw-inline">
                  <SourceCard n={1} lang={lang} focus={shownFocus === 1} onOpen={openSource} compact />
                  <SourceCard n={2} lang={lang} focus={shownFocus === 2} onOpen={openSource} compact />
                </div>
                {/* phones: the sources as two buttons; the one opened shows in the sheet */}
                <div className="rmn-rgw-pills">
                  {([1, 2] as const).map((n) => (
                    <button key={n} type="button" className="rmn-rgw-pill" data-focus={shownFocus === n || undefined}
                      aria-pressed={shownFocus === n} onClick={() => openSource(n)}>
                      <span className="rmn-rgw-num">{n}</span>
                      <FileTile kind={SOURCES[n].kind} />
                      <span className="rmn-rgw-card-f"><b><bdi>{SOURCES[n].file}</bdi></b><span>{tr(SOURCES[n].where, lang)}</span></span>
                    </button>
                  ))}
                </div>
                <div className="rmn-rgw-acts">
                  <button type="button" className="rmn-rgw-act" onClick={() => copyText(plain([...ANSWER.p1, ...ANSWER.p2], lang))}>{Copy}{p(UI.copy)}</button>
                  <button type="button" className="rmn-rgw-act" data-press={step === 9 || undefined} onClick={exportSummary}>{Download}{p(UI.export)}</button>
                  <span className="rmn-rgw-act is-quiet" aria-hidden="true">{Thumb}{p(UI.helpful)}</span>
                </div>
                </>)}
              </div>
              )}
            </article>
            )}
            {step >= LAST && (
              <div className="rmn-rgw-follow">
                {(Object.keys(FOLLOW) as FollowKey[]).map((k) => (
                  <button key={k} type="button" className="rmn-rgw-fbtn" onClick={() => ask(p(FOLLOW[k].ask), k)}>{p(FOLLOW[k].ask)}</button>
                ))}
              </div>
            )}
            <div className="rmn-rgw-live" role="log" aria-live="polite" aria-relevant="additions">
              {live.map((m) => {
                if (m.kind === "ask") return <div key={m.id} className="rmn-rgw-q"><p dir="auto">{m.text}</p></div>
                if (m.kind === "note") return <p key={m.id} className="rmn-rgw-note">{Shield}{fill(tr(REPLY.attached, m.lang), m.file)}</p>
                return (
                  <LiveAnswer key={m.id} item={m} demoHref={demoHref} onCite={openSource}
                    onCopy={copyText} onExport={exportSummary} />
                )
              })}
            </div>
          </div>
          {/* the empty workspace: an overlay, so it can leave without moving anything.
              Phones index the files right here (their room is kept from the start) */}
          <div className="rmn-rgw-drop" aria-hidden="true">
            <span className="rmn-rgw-drop-ic">{Upload}</span>
            <b className="rmn-rgw-drop-t"><span className="is-a">{p(UI.drop)}</span><span className="is-b">{p(UI.dropReady)}</span></b>
            <span className="rmn-rgw-drop-s">{p(UI.dropSub)}</span>
            <span className="rmn-rgw-fly">
              {FILES.map((f, i) => <span key={f.name} style={{ "--k": i } as CSSProperties}><FileTile kind={f.kind} /><b><bdi>{f.name}</bdi></b></span>)}
            </span>
            <ul className="rmn-rgw-drop-files">{step >= 2 && <FileRows state={fileState} p={p} />}</ul>
          </div>
          {/* phones: the opened source, in a sheet over the thread */}
          {step >= 7 && (
            <div className="rmn-rgw-sheet" data-on={shownFocus ? "" : undefined}>
              <span className="rmn-rgw-grab" aria-hidden="true" />
              <button type="button" className="rmn-rgw-sheet-x" onClick={() => setFocus(null)} aria-label={p(UI.close)}>{Close}</button>
              <SourceCard n={sheetRef.current} lang={lang} focus onOpen={openSource} paper={sheetRef.current === 1} />
            </div>
          )}
          <p className="rmn-rgw-toast" role="status" data-on={!!(toast || scriptToast) || undefined}>{Check}<span>{toast?.text ?? scriptToast ?? ""}</span></p>
        </div>

        <form className="rmn-rgw-composer" onSubmit={onSubmit}>
          {/* the "try it" hint: a tap focuses the composer (and raises the keyboard) */}
          <button type="button" className="rmn-rgw-coach" onClick={() => inputRef.current?.focus()}>
            {Sparkle}<span>{p(UI.tryIt)}</span>
          </button>
          <label className="rmn-rgw-attach" htmlFor={fileId} title={p(UI.attach)}>
            {Clip}<span className="rmn-rgw-vh">{p(UI.attach)}</span>
            <input id={fileId} ref={fileRef} type="file" className="rmn-rgw-file" onChange={onFile} onFocus={skip}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.md" />
          </label>
          <div className="rmn-rgw-field" ref={fieldRef}>
            <label className="rmn-rgw-vh" htmlFor={inputId}>{p(UI.inputLabel)}</label>
            <textarea id={inputId} ref={inputRef} className="rmn-rgw-input" rows={2} dir="auto" autoComplete="off"
              enterKeyHint="send" maxLength={200} placeholder={p(UI.placeholder)} onFocus={skip} onKeyDown={onKeyDown} />
            <span className="rmn-rgw-ghost" ref={ghostRef} aria-hidden="true" />
          </div>
          <button type="submit" className="rmn-rgw-send" aria-label={p(UI.send)}>{SendIcon}</button>
        </form>
      </section>

      {/* ── sources (wide screens; narrower ones show them under the answer) ── */}
      <aside className="rmn-rgw-src" aria-label={p(UI.sources)}>
        <p className="rmn-rgw-src-h"><b>{p(UI.sources)}</b>{step >= 7 && <em>2</em>}</p>
        <p className="rmn-rgw-src-empty" data-gone={step >= 7 || undefined}>{p(UI.sourcesEmpty)}</p>
        {step >= 7 && (
          <div className="rmn-rgw-src-list">
            <SourceCard n={1} lang={lang} focus={shownFocus === 1} onOpen={openSource} paper />
            <SourceCard n={2} lang={lang} focus={shownFocus === 2} onOpen={openSource} />
          </div>
        )}
      </aside>
    </div>
  )
}

// The sample files as they upload, are read and indexed (the sidebar; on phones,
// the drop panel).
function FileRows({ state, p }: { state: string; p: (b: Bi) => string }) {
  return (
    <>
      {FILES.map((f, i) => (
        <li key={f.name} className="rmn-rgw-frow" data-f={state} style={{ "--k": i } as CSSProperties}>
          <FileTile kind={f.kind} />
          <span className="rmn-rgw-fname"><b><bdi>{f.name}</bdi></b>
            <span className="rmn-rgw-fst">
              <span className="is-up">{p(UI.uploading)}</span>
              <span className="is-read">{p(f.read)}</span>
              <span className="is-done">{Check}{p(f.done)}</span>
            </span>
          </span>
          <span className="rmn-rgw-bar"><i /></span>
        </li>
      ))}
    </>
  )
}

// The retrieval trace: what it searched and read, each row ticking off in turn.
function Trace({ rows, p, timing = false }: { rows: Bi[]; p: (b: Bi) => string; timing?: boolean }) {
  return (
    <ol className="rmn-rgw-trace" data-working="" aria-hidden="true">
      {rows.map((r, i) => (
        <li key={i} style={{ "--k": i } as CSSProperties}>
          <span className="rmn-rgw-tick"><i />{Check}</span>
          <span>{p(r)}</span>
          {timing && i === 0 && <em dir="ltr">0.18 s</em>}
        </li>
      ))}
    </ol>
  )
}

// A streamed paragraph: its first n parts (text, bold figures, citation buttons),
// so it only ever grows at its end. LTR runs inside Arabic stay isolated (words.ts).
function Parts({ parts, lang, onCite, pressed = null, n, focusable = true }: {
  parts: Part[]; lang: Lang; onCite: (n: 1 | 2) => void; pressed?: 1 | 2 | null; n?: number; focusable?: boolean
}) {
  const rtl = lang === "ar"
  return (
    <>
      {parts.slice(0, n ?? parts.length).map((part, k) => {
        if ("cite" in part) {
          return (
            <Fragment key={k}>
              {" "}
              <button type="button" className="rmn-rgw-cite" data-press={pressed === part.cite || undefined}
                onClick={() => onCite(part.cite)} tabIndex={focusable ? undefined : -1}
                aria-label={`${lang === "ar" ? "المصدر" : "Source"} ${part.cite}`}>{part.cite}</button>
            </Fragment>
          )
        }
        const text = isolate(tr(part.t, lang), rtl)
        return (
          <Fragment key={k}>
            {k > 0 && !/^[,.:;،؛]/.test(text) ? " " : null}
            {part.b ? <strong>{text}</strong> : text}
          </Fragment>
        )
      })}
    </>
  )
}

function SourceCard({ n, lang, focus, onOpen, paper = false, compact = false }: {
  n: 1 | 2; lang: Lang; focus: boolean; onOpen: (n: 1 | 2) => void; paper?: boolean; compact?: boolean
}) {
  const s = SOURCES[n]
  return (
    <button type="button" className={`rmn-rgw-card${compact ? " is-compact" : ""}`} data-focus={focus || undefined}
      aria-pressed={focus} onClick={() => onOpen(n)}>
      <span className="rmn-rgw-card-h">
        <span className="rmn-rgw-num">{n}</span>
        <FileTile kind={s.kind} />
        <span className="rmn-rgw-card-f"><b><bdi>{s.file}</bdi></b><span>{tr(s.where, lang)}</span></span>
      </span>
      <span className="rmn-rgw-quote">
        {s.quote.map((q, k) => ("cite" in q ? null : (
          <Fragment key={k}>{k > 0 && !/^[,.:;،؛]/.test(tr(q.t, lang)) ? " " : null}{q.b ? <mark>{tr(q.t, lang)}</mark> : tr(q.t, lang)}</Fragment>
        )))}
      </span>
      {paper && (
        <span className="rmn-rgw-paper" aria-hidden="true">
          <b>{tr(UI.paperTitle, lang)}</b>
          <i /><i /><i className="is-hit" /><i /><i className="is-short" />
        </span>
      )}
    </button>
  )
}

function LiveAnswer({ item, demoHref, onCite, onCopy, onExport }: {
  item: Extract<LiveItem, { kind: "answer" }>; demoHref: string
  onCite: (n: 1 | 2) => void; onCopy: (text: string) => void; onExport: () => void
}) {
  const l = item.lang
  const t = (b: Bi) => tr(b, l)
  const follow = item.key === "overdue" || item.key === "email" || item.key === "compare" ? FOLLOW[item.key] : null
  const text = follow ? null
    : item.key === "export" ? t(REPLY.export)
    : item.key === "userFile" ? fill(t(REPLY.userFile), item.file ?? "")
    : t(REPLY.fallback)
  const words = follow ? plain(follow.lead, l) : (text ?? "")
  const cs = follow ? [] : chunks(text ?? "", l === "ar")
  const units = follow ? follow.lead.length : cs.length
  const vis = item.n ?? units + 1
  let extra: ReactNode = null
  if (item.key === "overdue") {
    extra = (
      <table className="rmn-rgw-table">
        <thead><tr><th>{t(TABLE.loan)}</th><th>{t(TABLE.client)}</th><th>{t(TABLE.amount)}</th><th>{t(TABLE.days)}</th></tr></thead>
        <tbody>{OVERDUE_ROWS.map((r) => (
          <tr key={r.id}><td dir="ltr">{r.id}</td><td>{t(r.client)}</td><td dir="ltr">{r.amount}</td><td dir="ltr">{r.days}</td></tr>
        ))}</tbody>
      </table>
    )
  } else if (item.key === "email") {
    extra = (
      <div className="rmn-rgw-mail">
        <p><span>{t(EMAIL.subjectLabel)}</span> <b>{t(EMAIL.subject)}</b></p>
        <p>{t(EMAIL.body)}</p>
        <button type="button" className="rmn-rgw-act" onClick={() => onCopy(`${t(EMAIL.subject)}\n\n${t(EMAIL.body)}`)}>{Copy}{t(UI.copy)}</button>
      </div>
    )
  } else if (item.key === "compare") {
    const v = COMPARE.values
    const max = v.q2.loans
    extra = (
      <div className="rmn-rgw-cmp" aria-hidden="true">
        {(["loans", "late"] as const).map((m) => (
          <span key={m} className="rmn-rgw-cmp-row">
            <span>{t(m === "loans" ? COMPARE.loans : COMPARE.late)}</span>
            <span className="rmn-rgw-cmp-bars">
              <i className="is-q1" style={{ "--v": v.q1[m] / max } as CSSProperties}><b>{v.q1[m]}</b></i>
              <i className="is-q2" style={{ "--v": v.q2[m] / max } as CSSProperties}><b>{v.q2[m]}</b></i>
            </span>
          </span>
        ))}
        <span className="rmn-rgw-cmp-key"><span><i className="is-q1" />{t(COMPARE.q1)}</span><span><i className="is-q2" />{t(COMPARE.q2)}</span></span>
      </div>
    )
  } else if (item.key === "export") {
    extra = <button type="button" className="rmn-rgw-link" onClick={onExport}>{Download}{t(UI.export)}</button>
  } else {
    extra = <a className="rmn-rgw-link" href={demoHref} {...(demoHref.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{t(REPLY.demo)}</a>
  }
  return (
    <article className="rmn-rgw-a" data-s={item.shown ? "reply" : "working"} lang={l} dir={l === "ar" ? "rtl" : "ltr"}>
      <span className="rmn-rgw-av" aria-hidden="true"><BrandMark className="rmn-rgw-mark" /></span>
      <Trace rows={[follow ? follow.trace : UI.trace1]} p={t} />
      {item.shown && (
      <div className="rmn-rgw-body">
        {item.n == null && <span className="rmn-rgw-vh">{words}</span>}
        <p aria-hidden="true">
          {follow
            ? <Parts parts={follow.lead} n={Math.min(vis, units)} lang={l} onCite={onCite} focusable={false} />
            : cs.slice(0, Math.min(vis, units)).map((c, i) => <span key={i} className="rmn-rgw-c">{c}</span>)}
        </p>
        {vis > units && extra}
      </div>
      )}
    </article>
  )
}

function answerUnits(key: RagKey | "userFile", l: Lang, file: string) {
  if (key === "overdue" || key === "email" || key === "compare") return FOLLOW[key].lead.length
  const text = key === "export" ? tr(REPLY.export, l) : key === "userFile" ? fill(tr(REPLY.userFile, l), file) : tr(REPLY.fallback, l)
  return chunks(text, l === "ar").length
}

function FileTile({ kind }: { kind: "pdf" | "xlsx" | "docx" | "file" }) {
  return <span className={`rmn-rgw-tile is-${kind}`} aria-hidden="true">{kind === "file" ? "FILE" : kind.toUpperCase()}</span>
}

const Plus = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
const Check = <svg className="rmn-rgw-check" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
const Shield = <svg className="rmn-rgw-shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5.5c0 4.2-2.9 7.9-7 9.5-4.1-1.6-7-5.3-7-9.5V6z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg>
const Upload = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" /></svg>
const Copy = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden="true"><rect x="8.5" y="8.5" width="11" height="11" rx="2" /><path d="M15.5 5.5V5A1.5 1.5 0 0 0 14 3.5H6A1.5 1.5 0 0 0 4.5 5v8A1.5 1.5 0 0 0 6 14.5h.5" /></svg>
const Download = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" /></svg>
const Thumb = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M7 10.5V20H4.5v-9.5zM7 10.5l4-7c1.4 0 2.2 1 2 2.3l-.6 3.7h5.3c1.2 0 2 1.1 1.8 2.2l-1.3 6.6c-.2.9-1 1.7-2 1.7H7" /></svg>
const Clip = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.2-8.2a3.3 3.3 0 0 1 4.7 4.7l-8.2 8.2a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4" /></svg>
const SendIcon = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg>
const Close = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
const Sparkle = <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 3.5l1.7 4.8 4.8 1.7-4.8 1.7L10 16.5l-1.7-4.8L3.5 10l4.8-1.7zM18 13l.9 2.1 2.1.9-2.1.9L18 19l-.9-2.1L15 16l2.1-.9z" /></svg>
