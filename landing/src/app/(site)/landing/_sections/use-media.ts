// Shared media-query hooks for the landing sections. Returns `undefined` until
// hydration so the server/first paint renders the mobile/fallback variant and
// only one variant ever owns heavy interactive DOM.
"use client"
import { useEffect, useRef, useState } from "react"

// Desktop ≥981px? undefined until hydration (SSR-safe).
export function useIsDesktop(): boolean | undefined {
  const [v, setV] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 981px)")
    const on = () => setV(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return v
}

// Is this subtree rendered inside the CMS live-preview (.rmn-preview)? Attach the
// returned ref to a rendered element; after mount the flag reports whether an
// ancestor is `.rmn-preview`. Used to keep interactive/scroll-driven variants
// (e.g. the offers ScrollStack, which pins against the viewport and is tuned for
// the landing's fixed nav) OUT of the boxed, non-scrolling CMS preview — the
// preview must mirror the flat bento, matching the MagicBento effect gate which
// also bails on `.closest(".rmn-preview")`. Returns false until hydration (SSR).
export function useInPreview(): { ref: React.RefObject<HTMLDivElement | null>; inPreview: boolean } {
  const ref = useRef<HTMLDivElement>(null)
  const [inPreview, setInPreview] = useState(false)
  useEffect(() => {
    setInPreview(!!ref.current?.closest(".rmn-preview"))
  }, [])
  return { ref, inPreview }
}

// Live prefers-reduced-motion flag. undefined until hydration.
export function usePrefersReducedMotion(): boolean | undefined {
  const [v, setV] = useState<boolean | undefined>(undefined)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const on = () => setV(mq.matches)
    on()
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  return v
}
