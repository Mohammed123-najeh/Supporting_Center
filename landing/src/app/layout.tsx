import type { Metadata, Viewport } from "next"
import { cookies, headers } from "next/headers"
import "./globals.css"
import { Providers } from "./_ui/providers"
import { LANG_KEY, resolveRequestLang } from "./_ui/lang"

// Fallback metadata (each page sets its own title/description and opts into
// indexing). The source's root layout belonged to its dashboard; the landing
// pages always overrode these.
export const metadata: Metadata = {
  title: "Rummanah Technology Solutions",
  description: "We design, build and run modern online stores, from Dubai, United Arab Emirates.",
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: "#160D0C", // deep maroon — matches the Rummanah dark --bg (default)
  width: "device-width",
  initialScale: 1,
}

// Runs before paint: applies the persisted theme + language so there's no flash
// of the wrong colors or direction on load. Defaults: dark (light is the
// alternate "morning" mode); users who already picked light keep it
// (localStorage). Language: the mz_sa_lang cookie (the server already rendered
// it), else localStorage (a visitor from before the cookie), else whatever the
// server rendered.
// Also stamps, FIRST and outside the try (storage can throw): data-js — CSS shows
// JS-driven layouts (the landing intro, scroll scenes) only when this script ran —
// and data-intro-seen, so a return visit never flashes the landing intro loader.
const FOUC_SCRIPT = `(function(){var e=document.documentElement;e.setAttribute('data-js','');try{
  if(sessionStorage.getItem('rmn-intro-seen')==='1') e.setAttribute('data-intro-seen','');
}catch(_){}try{
  var t=localStorage.getItem('mz_sa_theme'); if(t!=='light'&&t!=='dark') t='dark';
  var c=/(?:^|; )mz_sa_lang=(ar|en)(?:;|$)/.exec(document.cookie);
  var l=c?c[1]:localStorage.getItem('mz_sa_lang'); if(l!=='ar'&&l!=='en') l=e.getAttribute('lang')==='en'?'en':'ar';
  var n=localStorage.getItem('mz_sa_nav'); if(n!=='collapsed'&&n!=='expanded') n='expanded';
  e.setAttribute('data-theme',t);
  e.setAttribute('lang',l);
  e.setAttribute('dir', l==='ar'?'rtl':'ltr');
  e.setAttribute('data-nav',n);
}catch(_){}})();`

// Public site only: a reload starts at the top, like a first visit. A browser keeps
// a page's scroll position for a reload unless the page's history entry is already
// on manual restoration when it happens, so the entry stays on manual and turns to
// auto only around a navigation (a link, Back / Forward), so that leaving and coming
// back still returns to the same spot. A section anchor the nav left in the URL is
// dropped on a reload too.
const SITE_TOP_SCRIPT = `try{var h=history,t=0,
  m=function(){h.scrollRestoration='manual'},
  a=function(){h.scrollRestoration='auto';clearTimeout(t);t=setTimeout(m,1200)};
  m();
  addEventListener('click',function(e){var l=e.target&&e.target.closest&&e.target.closest('a[href]');if(l)a()},true);
  addEventListener('popstate',a);
  addEventListener('pageshow',function(e){if(e.persisted)a()});
  var v=performance.getEntriesByType('navigation')[0];
  if(v&&v.type==='reload'&&location.hash)h.replaceState(h.state,'',location.pathname+location.search);
}catch(_){}`

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // A per-request CSP nonce, if a Content-Security-Policy with `'nonce-…'` is set
  // on the request (the source minted one in its middleware; this app has none
  // yet, so `nonce` is undefined until one is added). Awaiting headers() also
  // makes this layout DYNAMIC, which Next.js needs to stamp the same nonce onto
  // its own inline scripts.
  const h = await headers()
  const csp = h.get("content-security-policy") ?? ""
  const nonce = /'nonce-([^']+)'/.exec(csp)?.[1]
  // Render the visitor's language from the first byte (see _ui/lang.ts). Every
  // route here is the public site, so a first visit follows Accept-Language.
  const lang = resolveRequestLang((await cookies()).get(LANG_KEY)?.value, h.get("accept-language"), true)

  return (
    // suppressHydrationWarning (both levels — it only reaches one deep):
    //  • <html>: the FOUC_SCRIPT below mutates data-theme (and, for a visitor
    //    from before the language cookie, lang/dir) at parse time from storage,
    //    so these attrs can differ from the SSR values — an expected, benign mismatch.
    //  • <script>: the browser STRIPS the CSP nonce off the DOM node before any
    //    JS runs (that's how nonces work), so the server's nonce="…" vs the
    //    hydrated nonce="" always differ. This is the documented React 19 nonce
    //    warning; suppressing it is the same pattern next-themes uses.
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} data-theme="dark" data-nav="expanded" suppressHydrationWarning>
      <head>
        <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: FOUC_SCRIPT + SITE_TOP_SCRIPT }} />
      </head>
      <body>
        <Providers initialLang={lang}>{children}</Providers>
      </body>
    </html>
  )
}
