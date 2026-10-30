"use client"
// The active UI language (AR/EN) and direction — the light half of i18n that
// every page needs. The public site uses only this; the dashboard's dictionaries
// (I18nProvider: t/fmt, ~34 KB gzipped) build on it and load with the dashboard.
//
// The choice persists in the mz_sa_lang cookie (+ localStorage). The root layout
// renders `initialLang` from that cookie (public-site pages without one follow
// Accept-Language — see ./lang.ts), so the server HTML is already in the right
// language. The pre-paint script in layout.tsx can still override it from
// localStorage for a visitor from before the cookie; this provider reconciles
// from the DOM on mount and drives subsequent changes.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { LANG_KEY, langCookie, type Lang } from "./lang"

export type { Lang }
export type Dir = "rtl" | "ltr"

type LangCtx = { lang: Lang; dir: Dir; setLang: (l: Lang) => void; toggle: () => void }

const Ctx = createContext<LangCtx | null>(null)

function applyLang(lang: Lang) {
  const el = document.documentElement
  el.lang = lang
  el.dir = lang === "ar" ? "rtl" : "ltr"
}

// Cookie first (the server renders from it), localStorage as the fallback.
// Idempotent, so it is safe inside a state updater.
function persistLang(lang: Lang) {
  if (!document.cookie.split("; ").includes(`${LANG_KEY}=${lang}`)) {
    document.cookie = langCookie(lang, location.protocol === "https:")
  }
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* private mode */
  }
}

export function LangProvider({ children, initialLang = "ar" }: { children: React.ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  // Adopt what the pre-paint script settled on (it only differs from
  // initialLang for a pre-cookie visitor) and persist it, so the next request
  // already renders it server-side.
  useEffect(() => {
    const current: Lang = document.documentElement.lang === "en" ? "en" : "ar"
    setLangState(current)
    persistLang(current)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    applyLang(l)
    persistLang(l)
  }, [])

  const toggle = useCallback(() => {
    setLangState((prev) => {
      const next: Lang = prev === "ar" ? "en" : "ar"
      applyLang(next)
      persistLang(next)
      return next
    })
  }, [])

  const value = useMemo<LangCtx>(
    () => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", setLang, toggle }),
    [lang, setLang, toggle]
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang(): LangCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error("useLang must be used within LangProvider")
  return c
}
