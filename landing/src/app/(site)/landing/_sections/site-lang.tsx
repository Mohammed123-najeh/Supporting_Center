// Language helper for the public site. The site is bilingual (AR/EN) + RTL. It
// reads the root LangProvider (mounted by the root layout's <Providers>), so
// useLang().lang gives the active language and dir flips automatically — without
// loading the dashboard's dictionaries.
//
// pick() chooses the right field with a graceful fallback to the other language
// (a blank AR field falls back to EN and vice-versa) so a half-filled CMS entry
// never renders an empty string. It is stable per language, so memoised children
// that take it as a prop don't re-render on unrelated state changes.
"use client"
import { useCallback } from "react"
import { useLang } from "../../../_ui/lang-context"

export function usePick() {
  const { lang } = useLang()
  return useCallback((ar: string, en: string): string => (lang === "ar" ? ar || en : en || ar), [lang])
}
