// Language selection shared by the root layout (server), the Edge middleware and
// the client i18n provider, so it must stay free of "use client", React and Node
// APIs. The choice lives in the `mz_sa_lang` cookie, which lets the server render
// the right language from the first byte. Before the cookie, every page rendered
// Arabic and an English visitor's page swapped languages after hydration: a
// visible flash, a layout shift, and the late-mounted headline words animating
// out of step. localStorage (same key) stays as the fallback for visitors from
// before the cookie existed.
export type Lang = "ar" | "en"

/** Cookie AND localStorage key. */
export const LANG_KEY = "mz_sa_lang"

/** Set by the middleware on public-site page requests (and stripped from every
 *  other request), so the root layout knows to honour Accept-Language there. */
export const SITE_REQUEST_HEADER = "x-rmn-site"

export const isLang = (v: unknown): v is Lang => v === "ar" || v === "en"

/** The visitor's preferred language from an Accept-Language header: the highest
 *  q wins and ties keep header order. English → "en"; everything else (Arabic,
 *  any other language, a wildcard, no header) → "ar". */
export function langFromAcceptLanguage(header: string | null | undefined): Lang {
  let best = ""
  let bestQ = 0
  for (const part of (header ?? "").split(",")) {
    const [tag, ...params] = part.trim().split(";")
    if (!tag) continue
    const qParam = params.map((p) => p.trim()).find((p) => p.startsWith("q="))
    const q = qParam ? Number(qParam.slice(2)) : 1
    if (!(q > bestQ)) continue // also drops q=0 ("not acceptable") and NaN
    best = tag.toLowerCase()
    bestQ = q
  }
  return best === "en" || best.startsWith("en-") ? "en" : "ar"
}

/** Server-side choice: an explicit cookie always wins; without one, public-site
 *  pages follow the browser's language and the dashboard keeps Arabic. */
export function resolveRequestLang(cookie: string | undefined, acceptLanguage: string | null, isSite: boolean): Lang {
  if (isLang(cookie)) return cookie
  return isSite ? langFromAcceptLanguage(acceptLanguage) : "ar"
}

/** `document.cookie` assignment that persists a choice for a year. `Secure` only
 *  over HTTPS, so `next dev` on http://localhost can still set it. */
export function langCookie(lang: Lang, secure: boolean): string {
  return `${LANG_KEY}=${lang}; Path=/; Max-Age=31536000; SameSite=Lax${secure ? "; Secure" : ""}`
}
