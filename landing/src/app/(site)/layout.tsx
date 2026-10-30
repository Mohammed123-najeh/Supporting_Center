// Public site layout. Loads the landing's own fonts (Reem Kufi + Tajawal) via
// next/font (self-hosted at build → no external CDN, CSP-safe) and exposes them
// as --font-kufi / --font-tajawal, which the scoped .rmn stylesheet uses. The
// ROOT layout still provides the theme + language providers and the <html>
// shell, so the dark-mode + AR/EN toggles work here too.
//
// Font budget: 8 files (2 subsets × Reem Kufi variable + Tajawal 400/500/700).
// Reem Kufi is a variable font, so one file per subset covers every weight;
// Tajawal's 800 was dropped (the styles use 700 at most).
//
// Not preloaded. Measured on a phone profile (Fast 4G, 4× CPU): with the files
// preloaded the landing's first layout already uses the web fonts, and that
// layout of the whole page is one long task that holds the first paint back to
// ~2.4 s; without the preload the page paints at ~0.9 s in the fallback fonts and
// swaps when they arrive (an Arabic first visit shifts by up to ~0.03 on the
// landing, ~0.07 on /ai-solutions — inside the 0.1 "good" line; cached visits
// don't swap). (Windows builds never emitted these preloads anyway: Next 15.5's
// font manifest only matches "/"-separated loader paths. Linux builds did.)
import { Reem_Kufi, Tajawal } from "next/font/google"
import { SITE_CSS, SITE_DOC_CSS } from "./landing/_sections/site-css"

const kufi = Reem_Kufi({
  subsets: ["arabic", "latin"],
  variable: "--font-kufi",
  display: "swap",
  preload: false,
})
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
  preload: false,
})

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // The site stylesheet is inlined HERE, by this server component, once for every
  // site page: rendered from a client component it was a ~55 KB string inside
  // each page's JavaScript. It still comes after the colocated .css <link>s in
  // <head>, so the cascade is unchanged.
  return (
    <div className={`rmn-site ${kufi.variable} ${tajawal.variable}`}>
      <style dangerouslySetInnerHTML={{ __html: SITE_CSS + SITE_DOC_CSS }} />
      {children}
    </div>
  )
}
