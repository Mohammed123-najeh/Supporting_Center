// What both demo islands share (chat-island.tsx, rag-island.tsx): when a scene may
// play, the ghost typing in a composer, the message column that follows the newest
// message by transform, and the pace replies stream in at.
"use client"
import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react"
import type { Timeline } from "./timeline"
import { graphemes } from "./graphemes"

// A scene starts once the visitor is looking at it: SEEN of it on screen (or of the
// screen, for a demo taller than what is left of it), held for DWELL ms so a fast
// scroll past never starts it. It stops once less than GONE is left.
const SEEN = 0.82
const GONE = 0.35
const DWELL = 350
const THRESHOLDS = [0, 0.1, 0.2, 0.3, 0.35, 0.4, 0.5, 0.6, 0.7, 0.75, 0.8, 0.82, 0.85, 0.9, 0.95, 1]

/** True while the demo may run: the visitor is looking at it (the fixed nav and, on
 *  phones, the bottom action bar don't count as screen), the tab is visible, and
 *  the visitor hasn't paused it. When it turns false, a paused CSS animation must
 *  hold its frame even if the tab is hidden next: reading getAnimations() flushes
 *  the paused play-state at once. */
export function usePlayGate(rootRef: RefObject<HTMLElement | null>, paused: boolean): boolean {
  const [onScreen, setOnScreen] = useState(false)
  const [visible, setVisible] = useState(() => document.visibilityState === "visible")
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const phone = window.matchMedia("(max-width: 760px)").matches
    let on = false
    let timer = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e) return
      const room = e.rootBounds?.height || window.innerHeight
      const seen = e.isIntersecting ? e.intersectionRect.height / Math.min(e.boundingClientRect.height, room) : 0
      if (seen >= SEEN) {
        if (!on && !timer) timer = window.setTimeout(() => { timer = 0; on = true; setOnScreen(true) }, DWELL)
        return
      }
      if (timer) { window.clearTimeout(timer); timer = 0 }
      if (on && seen < GONE) { on = false; setOnScreen(false) }
    }, { threshold: THRESHOLDS, rootMargin: phone ? "-56px 0px -84px 0px" : "-72px 0px 0px 0px" })
    io.observe(el)
    const onVis = () => setVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVis)
    return () => { io.disconnect(); window.clearTimeout(timer); document.removeEventListener("visibilitychange", onVis) }
  }, [rootRef])
  const running = onScreen && visible && !paused
  useLayoutEffect(() => {
    if (!running) rootRef.current?.getAnimations?.({ subtree: true })
  }, [running, rootRef])
  return running
}

const CARET = " │" // a hair space + a thin vertical bar

/** The scripted typist's beat: two graphemes at a time, every 74 to 97 ms in a fixed
 *  scatter (the same scene every time), longer after punctuation. */
const beat = (i: number, pair: string) => 74 + ((((i + 1) * 2654435761) >>> 0) % 24) + (/[؟?!.,،]/.test(pair) ? 140 : 0)

/** Types into an aria-hidden overlay above a real (always enabled) composer; the
 *  overlay's text is the only text React never owns. Every keystroke puts in a NEW
 *  text node, caret included: a node that grows moves its box (leftwards in
 *  Arabic), a caret box moves with the text, and either counts as a layout shift; a
 *  node that is new has nothing to shift from. */
export function useGhostTyping(ghostRef: RefObject<HTMLElement | null>, fieldRef: RefObject<HTMLElement | null>) {
  const clear = useCallback(() => {
    ghostRef.current?.replaceChildren()
    fieldRef.current?.removeAttribute("data-typing")
  }, [ghostRef, fieldRef])
  const type = useCallback(async (tl: Timeline, text: string) => {
    const ghost = ghostRef.current
    const field = fieldRef.current
    if (!ghost || !field) return !tl.cancelled
    ghost.replaceChildren(document.createTextNode(CARET))
    field.setAttribute("data-typing", "")
    // two graphemes a beat: half the frames to draw for the same pace
    const gs = graphemes(text)
    for (let i = 0; i < gs.length; i += 2) {
      ghost.replaceChildren(document.createTextNode(gs.slice(0, i + 2).join("") + CARET))
      if (!(await tl.wait(beat(i, gs.slice(i, i + 2).join(""))))) return false
    }
    return true
  }, [ghostRef, fieldRef])
  return { type, clear }
}

/** Keeps the newest shown message in view: the log clips (it is never a scroll
 *  container, so it can't trap page scrolling on phones) and the column moves by
 *  transform, which is never a layout shift. The column's bottom padding is the
 *  room kept under the newest message (it grows while the "try it" hint shows).
 *  While an answer is still being worked on ([data-s="working"]), it frames the
 *  working indicator, not the answer's space. */
export function useFollow(logRef: RefObject<HTMLElement | null>, colRef: RefObject<HTMLElement | null>, shownSelector: string, deps: readonly unknown[]) {
  const place = useCallback(() => {
    const log = logRef.current
    const col = colRef.current
    if (!log || !col) return
    const shown = col.querySelectorAll<HTMLElement>(shownSelector)
    const last = shown[shown.length - 1]
    let bottom = 0
    if (last) {
      const working = last.dataset.s === "working" ? last.querySelector<HTMLElement>("[data-working]") : null
      bottom = last.offsetTop + (working ? working.offsetTop + working.offsetHeight : last.offsetHeight)
    }
    const room = parseFloat(getComputedStyle(col).paddingBottom) || 12
    const y = Math.max(0, Math.ceil(bottom + room - log.clientHeight))
    col.style.transform = y ? `translate3d(0,${-y}px,0)` : ""
  }, [logRef, colRef, shownSelector])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(place, [place, ...deps])
  useEffect(() => {
    const log = logRef.current
    if (!log) return
    const ro = new ResizeObserver(() => place())
    ro.observe(log)
    void document.fonts?.ready.then(place)
    return () => ro.disconnect()
  }, [logRef, place])
  return place
}

/** A live reply streams in bursts (words.ts chunks), one every CHUNK_MS: a visitor's
 *  answer comes at once. The scripted scene streams a little slower, so it can be
 *  followed while it plays. */
export const CHUNK_MS = 70
export const SCENE_CHUNK_MS = 95
