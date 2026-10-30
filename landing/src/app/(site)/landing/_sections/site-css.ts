// Rummanah landing stylesheet — the user's Palestinian-embroidery (تطريز)
// design, ported verbatim and scoped under `.rmn`. Cream/pomegranate/olive
// palette, stitch motifs, hoop medallion. A DARK variant is layered on via
// `:root[data-theme="dark"] .rmn` token overrides (our theme engine stamps
// data-theme on <html>), keeping the same embroidery character in a warm-dark
// ground. Fonts (Reem Kufi + Tajawal) load from next/font in the site layout,
// exposed as --font-kufi / --font-tajawal (no external CDN → CSP-safe).
export const SITE_CSS = `
.rmn{
  --cream:#FDF4ED; --cream-2:#F6E9DC; --ivory:#EDE2CE;
  --red:#A6222C; --red-deep:#7E161F;
  --olive:#4C4C29; --olive-soft:#6E6E44;
  --pink:#E98C98; --ink:#3A2E24;
  --card:#FDF4ED; --page:#FDF4ED;
  --dot:rgba(76,76,41,.05); --hem:rgba(166,34,44,.35); --dash:rgba(166,34,44,.25);
  --radius:14px; --shadow:0 10px 30px rgba(126,22,31,.08);
  --ease:cubic-bezier(.22,.9,.3,1);
  /* +1 LTR / -1 RTL — for physical translateX nudges that must follow reading direction */
  --dir-sign:1;
  --ease-out:cubic-bezier(.22,1,.36,1);
  /* iPhone Duo frame (payment band + the AI chapter): Star White here, Night Sky
     in the dark theme */
  --duo-frame:#E9E4DC; --duo-frame-hi:#FFFFFF; --duo-frame-lo:#C9C1B5;
}
.rmn{
  color:var(--ink);
  background:var(--page);
  font-family:var(--font-tajawal),'Tajawal',sans-serif;
  /* overflow-x:clip (NOT hidden): clips horizontal overflow WITHOUT establishing a
     scroll container. overflow-x:hidden would make .rmn a scroll container, which
     breaks position:sticky (the package ScrollStack pins against the viewport). */
  line-height:1.8; overflow-x:clip; min-height:100dvh;
  /* stack tuning tokens (package ScrollStack). --stk-top clears the fixed nav so a
     pinned card doesn't hide under it; --stk-offset fans successive cards down. */
  --stk-top:6rem; --stk-offset:16px; --stk-gap:2.5rem;
  /* fixed-nav height — the mega-dropdown positions itself just below the bar. */
  --nav-h:72px;
  /* hero entrance offset while the desktop intro loader covers the page (below) */
  --intro:0s;
}
:root[dir="rtl"] .rmn{--dir-sign:-1}
/* The intro plays only on a desktop first visit with JS (FOUC script stamps
   data-js / data-intro-seen on <html> before paint) — delay the hero reveal under it. */
:root[data-js]:not([data-intro-seen]) .rmn{--intro:1.05s}
@media (max-width:760px),(prefers-reduced-motion:reduce){
  :root .rmn,:root[data-js]:not([data-intro-seen]) .rmn{--intro:0s}
}
@media (max-width:760px){
  .rmn{--stk-top:5rem; --stk-offset:11px; --stk-gap:1.6rem}
}
/* The public-site-only document rules live in SITE_DOC_CSS (end of this file). */
:root[data-theme="dark"] .rmn{
  --cream:#241a18; --cream-2:#2c201d; --ivory:#33262180; --page:#1c1310;
  --card:#271c19; --ink:#f2e6da; --olive:#c9c79a; --olive-soft:#a9a884;
  --red:#e0616a; --red-deep:#c9424c; --pink:#eea3ad;
  --dot:rgba(201,199,154,.05); --hem:rgba(224,97,106,.4); --dash:rgba(224,97,106,.28);
  --shadow:0 10px 30px rgba(0,0,0,.4);
  --duo-frame:#232C3A; --duo-frame-hi:#3C4859; --duo-frame-lo:#141A23;
}
/* :where() keeps the reset at zero specificity, so each section's colocated .css
   (single-class rules, loaded BEFORE this inline sheet) is no longer wiped by it.
   The browser defaults it exists to clear still lose to any author rule. */
:where(.rmn) *{margin:0;padding:0;box-sizing:border-box}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE-WIDE GRADIENT GROUND — one fixed, calm, warm field behind the entire
   landing. Every section is transparent (or fades into) this ground, so there are
   NO boxed colour bands and NO hard section-to-section seams: the whole page reads
   as one continuous, softly-drifting gradient. Built only from design tokens, so
   the dark theme adapts automatically. The offers section paints its own vivid
   per-offer colour wash ON TOP of this (services-showcase.css); the ground being warm
   everywhere is exactly what dissolves the old blob "box" edge.
   Fixed + inset:0 + z-index:0 → sits behind all in-flow content (which is >z0),
   pinned to the viewport (calm ground the page scrolls over). The .rmn root has no
   transform/filter, so a fixed child positions to the viewport as intended. */
.rmn-ground{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;background:var(--page)}
/* the embroidery dot pattern rides the ground now (moved off .rmn) */
.rmn-ground::after{content:'';position:absolute;inset:0;background-image:radial-gradient(var(--dot) 1px, transparent 1.4px);background-size:22px 22px;opacity:.9}
/* two big, soft warm lobes give the ground gentle depth + motion. Every colour stop
   fades to transparent, so the radial gradients are already soft-edged: NO filter
   (two full-viewport blur(80px) layers were the most expensive continuous paint on
   the page). The drift is transform-only → composited. */
.rmn-ground span{position:absolute;display:block;will-change:transform}
.rmn-ground span:nth-child(1){
  inset:-25% -15% auto -15%;height:85vh;
  background:
    radial-gradient(60% 55% at 72% 30%, color-mix(in srgb,var(--pink) 26%,transparent), transparent 70%),
    radial-gradient(55% 60% at 24% 20%, color-mix(in srgb,var(--cream-2) 90%,var(--pink)), transparent 72%);
  animation:rmnGround1 40s ease-in-out infinite alternate;
}
.rmn-ground span:nth-child(2){
  inset:auto -15% -25% -15%;height:90vh;
  background:
    radial-gradient(60% 55% at 30% 70%, color-mix(in srgb,var(--red) 12%,transparent), transparent 72%),
    radial-gradient(60% 60% at 78% 84%, color-mix(in srgb,var(--ivory) 85%,var(--olive)), transparent 74%);
  animation:rmnGround2 52s ease-in-out infinite alternate;
}
@keyframes rmnGround1{to{transform:translate(3%,2%) scale(1.08)}}
@keyframes rmnGround2{from{transform:translate(0,0) scale(1.05)}to{transform:translate(-3%,-2%) scale(.97)}}
:root[data-theme="dark"] .rmn-ground span{opacity:.55}
@media (prefers-reduced-motion:reduce){.rmn-ground span{animation:none}}
/* Mobile perf: the two full-width blur(80px) lobes animating infinitely are the
   single most expensive continuous GPU paint on a phone. Keep the static gradient
   wash (visual identity intact) but drop the animation + will-change and halve the
   blur radius on small screens. Desktop is untouched. */
@media (max-width:760px){.rmn-ground span{animation:none;transform:none;will-change:auto}}
/* keep the in-flow landing content above the ground. Scoped to the actual content
   elements — NOT the fixed-position chrome (nav/#progress/#rmn-intro/overlay keep
   their own position + higher z-index). */
.rmn > header,.rmn > section,.rmn > footer,.rmn > main{position:relative;z-index:1}
.rmn h1,.rmn h2,.rmn h3,.rmn .kufi{font-family:var(--font-kufi),'Reem Kufi',sans-serif;color:var(--olive);line-height:1.5}
.rmn img{max-width:100%;display:block}
.rmn a{text-decoration:none;color:inherit}
.rmn ul{list-style:none}
.rmn .container{width:min(1120px,92%);margin-inline:auto}
/* Nav is position:fixed, so in-page anchors must clear it — otherwise a jumped-to
   section heading hides under the bar. */
.rmn section[id],.rmn header[id]{scroll-margin-top:5.5rem}

/* ambient loops pause while their section is off screen (data-off, set by an
   observer in landing-page.tsx). !important: the animation shorthand on each
   element would otherwise reset play-state to running. */
.rmn [data-off] *,.rmn [data-off] *::before,.rmn [data-off] *::after{animation-play-state:paused!important}

/* reveal — content starts hidden only when JS runs (the FOUC script stamps
   data-js before paint), so with JS off it is simply there; :where() keeps the
   rule at its old specificity, so per-element rules (the team thread) still win.
   The CMS preview has no observer, so it always shows everything. */
.rmn .reveal{transition:opacity .8s var(--ease),transform .8s var(--ease);transition-delay:var(--d,0s)}
:where(:root[data-js]) .rmn .reveal{opacity:0;transform:translateY(28px)}
.rmn .reveal.in{opacity:1;transform:none}
.rmn-preview .rmn .reveal{opacity:1;transform:none;transition:none}

/* eyebrow / heads */
.rmn .eyebrow{display:inline-flex;align-items:center;gap:.6rem;font-size:.78rem;font-weight:700;letter-spacing:.35em;color:var(--red);text-transform:uppercase;font-family:var(--font-tajawal),'Tajawal',sans-serif}
.rmn .eyebrow::before,.rmn .eyebrow::after{content:'✕';font-size:.7rem;color:var(--pink);letter-spacing:0}
/* Letter-spacing pulls Arabic letters apart and breaks their joins, so tracked
   labels drop it on Arabic pages — except Latin text marked lang="en". */
:root[dir="rtl"] .rmn :is(.eyebrow,.rmn-offer-eyebrow,.ribbon,.rmn-mega-eyebrow,.rmn-svc-eyebrow,.rmn-ai-demo-eyebrow,.rmn-ai-ex-lab,.rmn-contact-methods-lab,.rmn-pay-cards-lab):not(:lang(en)){letter-spacing:0}
.rmn .section-head{text-align:center;max-width:640px;margin:0 auto 3.2rem}
.rmn .section-head h2{font-size:clamp(1.7rem,3.6vw,2.5rem);margin:.7rem 0 .6rem;font-weight:700}
.rmn .section-head p{color:var(--olive-soft)}

/* stitch divider */
.rmn .stitch-divider{display:flex;justify-content:center;gap:14px;padding:0 0 .4rem}
.rmn .stitch-divider span{color:var(--red);font-size:.85rem;line-height:1;transition:opacity .4s var(--ease),transform .5s var(--ease)}
/* unsewn only when JS runs (same rule as .reveal); CMS preview: always sewn */
:where(:root[data-js]) .rmn .stitch-divider span{opacity:0;transform:scale(.2) rotate(-90deg)}
.rmn .stitch-divider.in span,.rmn-preview .rmn .stitch-divider span{opacity:1;transform:scale(1) rotate(0)}
.rmn .stitch-divider span:nth-child(odd){color:var(--olive-soft)}

/* nav */
/* Fixed-height bar: no padding shrink. Slides up out of view on scroll-down,
   back in on scroll-up (transform only — cheap, no layout shift). */
/* The dashed hem only appears once scrolled: at the top it sat ~20px above the
   hero's dashed thread line and read as a doubled border. */
.rmn nav.rmn-nav{position:fixed;inset-inline:0;top:0;z-index:100;background:color-mix(in srgb,var(--cream) 88%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px dashed transparent;transition:transform .4s var(--ease),box-shadow .4s,border-color .4s;will-change:transform}
.rmn .nav-inner{display:flex;align-items:center;justify-content:space-between;padding:1.1rem 0;width:min(1120px,92%);margin-inline:auto}
.rmn nav.rmn-nav.scrolled{box-shadow:0 6px 24px rgba(126,22,31,.09);border-bottom-color:var(--dash)}
.rmn nav.rmn-nav.nav-hidden{transform:translateY(-100%)}
/* Phones: an opaque bar — re-blurring the page under a fixed bar on every scroll
   frame is the costliest thing a phone GPU does here, and it buys nothing visible. */
@media (max-width:760px){.rmn nav.rmn-nav{background:var(--cream);backdrop-filter:none;-webkit-backdrop-filter:none}}
.rmn .brand{display:flex;align-items:center;gap:.7rem}
/* Pomegranate mark (inline SVG, brand-mark.tsx) on a cream plate inside the dashed
   embroidery ring. The plate stays cream in dark mode, like the favicon. */
.rmn .brand-mark{flex:none;width:44px;height:44px;border-radius:50%;background:#FDF4ED;display:grid;place-items:center;outline:2px dashed var(--red);outline-offset:3px;transition:transform .5s var(--ease)}
.rmn .brand-mark svg{width:74%;height:74%;display:block}
.rmn .brand:hover .brand-mark{transform:rotate(calc(-12deg * var(--dir-sign)))}
.rmn .brand-name{font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-weight:700;color:var(--olive);font-size:1.25rem}
.rmn .brand-name small{display:block;font-family:var(--font-tajawal),'Tajawal',sans-serif;font-size:.58rem;letter-spacing:.32em;color:var(--red);font-weight:700}
.rmn .nav-links{display:flex;gap:2rem;font-weight:500}
.rmn .nav-links a{position:relative;padding:.2rem 0;color:var(--olive);transition:color .3s}
/* running-stitch underline that "sews" on — transform scaleX from the inline
   start (dir-aware via transform-origin), plus a dash sweep. Not width (layout). */
.rmn .nav-links a::after{content:'';position:absolute;bottom:-4px;inset-inline:0;height:2px;background:repeating-linear-gradient(90deg,var(--red) 0 6px,transparent 6px 10px);background-size:200% 100%;background-position-x:100%;transform:scaleX(0);transform-origin:left;transition:transform .32s var(--ease),background-position-x .5s var(--ease)}
:root[dir="rtl"] .rmn .nav-links a::after{transform-origin:right}
/* Arabic labels are much wider than the English ones; with 8 links the row
   overflowed the 1120px cap and broke to two rows. Tighten the gap + font for
   RTL only (English keeps gap:2rem / full size) and forbid wrap so all 8 fit a
   single row. Below 760px .nav-links is display:none (bubble menu), so this only
   affects desktop/tablet. */
:root[dir="rtl"] .rmn .nav-links{gap:1.15rem;font-size:.94rem;flex-wrap:nowrap}
:root[dir="rtl"] .rmn .nav-links a{white-space:nowrap;flex:0 1 auto}
/* The full row (brand + 8 links + tools + CTA) needs ~1080px. Below that it broke:
   Arabic pushed the tools and the CTA off the left edge, English wrapped the links
   onto two rows. So the bubble menu takes over from 1100px down (rules below), and
   the row tightens a little just above that. */
@media (min-width:1101px) and (max-width:1280px){
  .rmn .nav-links{gap:1.3rem}
  :root[dir="rtl"] .rmn .nav-links{gap:.9rem}
}
@media (max-width:1100px){.rmn .nav-links{display:none}}
.rmn .brand,.rmn .nav-tools{flex:none}
.rmn .brand-name{white-space:nowrap}
/* a nav item that owns a mega-dropdown (hover/tap target wraps the link) */
.rmn .nav-has-mega{position:relative;display:inline-flex}
.rmn .nav-has-mega>a{display:inline-block}
/* the mega-dropdown panels are a wide-screen affordance; hidden where the
   bubble menu takes over (matches .nav-links hiding ≤1100px). */
@media (max-width:1100px){.rmn .rmn-mega{display:none !important}}
.rmn .nav-links a:hover{color:var(--red)}
.rmn .nav-links a:hover::after{transform:scaleX(1);background-position-x:0%}
.rmn .nav-tools{display:flex;align-items:center;gap:.5rem}
.rmn .tool-btn{width:38px;height:38px;border-radius:50%;background:transparent;border:2px dashed var(--olive-soft);color:var(--olive);display:grid;place-items:center;cursor:pointer;font-family:var(--font-tajawal),'Tajawal',sans-serif;font-weight:700;font-size:.82rem;transition:transform .35s var(--ease),outline-offset .25s,color .3s,border-color .3s;outline:2px dashed transparent}
.rmn .tool-btn:hover{color:var(--red);border-color:var(--red);transform:translateY(-2px)}
.rmn .tool-btn svg{width:17px;height:17px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}

/* ── mobile bubble menu ── the hamburger toggle lives in .nav-tools but only
   shows ≤1100px (where .nav-links is hidden). It IS the close button when open.
   It's a real .tool-btn (framed 38px dashed circle like Lang/Theme) whose two
   lines are CENTERED inside it (not free-floating), so it reads as a button and
   keeps a proper touch target. */
.rmn .rmn-bubble-toggle{display:none;flex-direction:column;justify-content:center;align-items:center;gap:4px}
@media (max-width:1100px){.rmn .rmn-bubble-toggle{display:flex}}
.rmn .rmn-bubble-toggle .rmn-bubble-line{width:16px;height:2px;border-radius:2px;background:var(--olive);transition:transform .3s var(--ease),opacity .3s,background .3s}
.rmn .rmn-bubble-toggle:hover .rmn-bubble-line{background:var(--red)}
/* morph to ✕ — the rotate pivots around the button centre (the lines sit ±3px
   from centre), so translateY brings them together before rotating. */
.rmn .rmn-bubble-toggle.open .rmn-bubble-line:first-child{transform:translateY(3px) rotate(45deg)}
.rmn .rmn-bubble-toggle.open .rmn-bubble-line:last-child{transform:translateY(-3px) rotate(-45deg)}
/* full-screen overlay: cream embroidery ground, below the nav bar (z 100) so the
   toggle stays visible + clickable as the close control. Content is TOP-aligned
   below the fixed nav (never centered under it — that clipped the first pill) and
   scrolls if it's taller than the viewport. A large top padding reserves the nav
   height; the inner column is vertically centered ONLY within the leftover space
   via margin-block:auto, which collapses to 0 when content overflows. */
.rmn .rmn-bubble-overlay{position:fixed;inset:0;z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:1.2rem;background:color-mix(in srgb,var(--page) 97%,transparent);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);padding:calc(7rem + env(safe-area-inset-top,0px)) 1.5rem 2rem;overflow-y:auto;overscroll-behavior:contain;background-image:radial-gradient(var(--dot) 1px,transparent 1.4px);background-size:22px 22px}
/* top-aligned below the nav (padding-top clears it); NO auto-margin centering,
   which pulled the first pill up under the fixed bar. */
.rmn .rmn-bubble-list{display:flex;flex-direction:column;gap:.85rem;width:100%;max-width:340px;flex:0 0 auto}
.rmn .rmn-bubble-pill{display:block;text-align:center;padding:1rem 1.4rem;border-radius:40px;background:var(--card);border:2px dashed var(--dash);color:var(--olive);font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-size:1.3rem;font-weight:700;transform:rotate(var(--rot,0deg));transition:background .3s,color .3s,border-color .3s;animation:rmnPillIn .42s cubic-bezier(.34,1.56,.64,1) both;animation-delay:calc(var(--i,0) * 60ms)}
@keyframes rmnPillIn{from{opacity:0;transform:translateY(16px) scale(.6) rotate(var(--rot,0deg))}}
.rmn .rmn-bubble-pill:hover,.rmn .rmn-bubble-pill:focus-visible{background:var(--red);color:#FDF4ED;border-color:var(--red);outline:none}
.rmn .rmn-bubble-controls{display:flex;flex-wrap:wrap;justify-content:center;gap:.8rem;align-items:center;margin-top:.5rem}
.rmn .rmn-bubble-wa{min-height:44px;padding:.6rem 1.4rem}
@media (prefers-reduced-motion:reduce){.rmn .rmn-bubble-pill{transform:none}}

/* buttons */
.rmn .btn{display:inline-block;padding:.85rem 2.2rem;border-radius:50px;font-weight:700;font-size:1rem;font-family:var(--font-tajawal),'Tajawal',sans-serif;cursor:pointer;border:0;transition:transform .35s var(--ease),box-shadow .35s,outline-offset .25s,background .3s;outline:2px dashed transparent;outline-offset:0}
.rmn .btn-primary{background:var(--red);color:#FDF4ED}
.rmn .btn-primary:hover{background:var(--red-deep);transform:translateY(-3px);outline-color:var(--red);outline-offset:5px;box-shadow:0 14px 28px rgba(126,22,31,.25)}
.rmn .btn-ghost{background:transparent;color:var(--olive);outline:2px dashed var(--olive-soft);outline-offset:0}
.rmn .btn-ghost:hover{color:var(--red);outline-color:var(--red);outline-offset:5px;transform:translateY(-3px)}
.rmn .btn-light{background:var(--cream);color:var(--red)}
.rmn .btn-light:hover{transform:translateY(-3px);outline-color:var(--cream);outline-offset:5px;box-shadow:0 14px 28px rgba(0,0,0,.2)}
/* WhatsApp variant — same dashed embroidery shape, icon+text aligned, WhatsApp
   green accent. Layers onto .btn-ghost or .btn-primary. */
.rmn .btn-wa{display:inline-flex;align-items:center;gap:.6rem}
.rmn .btn-wa svg{width:1.15em;height:1.15em}
.rmn .btn-ghost.btn-wa{color:#1fa855}
.rmn .btn-ghost.btn-wa:hover{color:#128c7e;outline-color:#25d366;outline-offset:5px;transform:translateY(-3px)}
.rmn .btn-primary.btn-wa{background:#25d366;color:#0a3d2a}
.rmn .btn-primary.btn-wa:hover{background:#1fa855;outline-color:#25d366;outline-offset:5px;box-shadow:0 14px 28px rgba(37,211,102,.28)}
.rmn .nav-cta{margin-inline-start:.4rem;padding:.55rem 1.6rem;font-size:.9rem}
/* Magnetic follow: MagneticCTA writes --mx/--my (fine pointers only); the transform
   transition supplies the spring, :active the tap squash. Declared after the
   .btn-primary:hover lift (equal specificity) so the magnet owns the transform. */
.rmn .nav-cta,.rmn .nav-cta:hover{transform:translate(var(--mx,0px),var(--my,0px)) scale(var(--ms,1));transition:transform .3s var(--ease-out),box-shadow .35s,outline-offset .25s,background .3s}
.rmn .nav-cta:active{--ms:.96}
/* On phones the nav bar declutters: hide the redundant "start now" CTA pill (the
   hero + the menu overlay both carry a CTA) so AR/EN + theme + hamburger sit in a
   clean, uncrowded row and the hamburger is easy to hit. Placed AFTER .btn and the
   base .nav-cta rule (equal specificity → source order wins) and given the extra
   .rmn-nav qualifier so it reliably beats .rmn .btn{display:inline-block}. */
@media (max-width:760px){.rmn .rmn-nav .nav-cta{display:none}}

/* scroll progress — a CSS scroll-driven scaleX (compositor; no JS). Browsers without
   scroll timelines get a one-write-per-frame JS fallback (useLandingEffects). */
.rmn #progress{position:fixed;top:0;inset-inline-start:0;height:4px;width:100%;transform:scaleX(0);transform-origin:left;z-index:200;background:repeating-linear-gradient(90deg,var(--red) 0 8px,transparent 8px 13px);pointer-events:none}
:root[dir="rtl"] .rmn #progress{transform-origin:right}
@supports (animation-timeline:scroll()){
  .rmn #progress{animation:rmnProgress linear both;animation-timeline:scroll(root)}
}
@keyframes rmnProgress{to{transform:scaleX(1)}}

/* intro loader — pure CSS from the first paint (~1.3 s). Hidden unless the FOUC
   script stamped data-js and no data-intro-seen; never on phones / reduced motion.
   The exit is a composited fade + scale (the old full-screen clip-path animation
   repainted the whole viewport every frame, right when the hero was starting). */
.rmn #rmn-intro{position:fixed;inset:0;z-index:300;background:var(--page);display:none;place-items:center;cursor:pointer;background-image:radial-gradient(var(--dot) 1px,transparent 1.4px);background-size:22px 22px;will-change:opacity,transform;animation:rmnIntroOut .38s cubic-bezier(.4,0,.2,1) .95s forwards}
:root[data-js]:not([data-intro-seen]) .rmn #rmn-intro{display:grid}
.rmn #rmn-intro.skip{animation-delay:0s;animation-duration:.22s}
@media (max-width:760px),(prefers-reduced-motion:reduce){:root .rmn #rmn-intro{display:none!important}}
.rmn .rmn-intro-stage{position:relative;width:230px;height:230px;display:grid;place-items:center}
.rmn .rmn-intro-mark{width:120px;height:120px;border-radius:50%;background:#fff;display:grid;place-items:center;overflow:hidden;box-shadow:0 14px 34px rgba(126,22,31,.18);outline:2px dashed var(--red);outline-offset:6px;transform:scale(0);animation:rmnMarkIn .5s var(--ease) .05s forwards}
.rmn .rmn-intro-glyph{width:66%;height:66%;display:block}
.rmn .rmn-intro-glyph svg{width:100%;height:100%;display:block}
.rmn .rmn-intro-stage .x{position:absolute;top:50%;left:50%;color:var(--red);font-size:1rem;line-height:1;opacity:0;transform:translate(-50%,-50%) scale(.2);animation:rmnXIn .4s var(--ease) both;animation-delay:calc(.2s + var(--i,0) * 40ms)}
.rmn .rmn-intro-stage .x:nth-child(even){color:var(--olive-soft)}
.rmn .rmn-intro-word{position:absolute;bottom:-58px;inset-inline:0;text-align:center;font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-weight:700;font-size:1.5rem;color:var(--olive);opacity:0;animation:rmnFadeUp .45s var(--ease) .45s forwards}
@keyframes rmnMarkIn{60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes rmnXIn{to{opacity:1;transform:translate(-50%,-50%) translate(var(--tx),var(--ty)) scale(1)}}
@keyframes rmnFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes rmnIntroOut{to{opacity:0;transform:scale(1.04);visibility:hidden}}

/* hero */
.rmn .hero{padding:8.5rem 0 4.5rem;position:relative;overflow:hidden}
/* ambient drifting stitch particles (subtle, ≤.12 opacity) */
.rmn .rmn-particles{position:absolute;inset:0;pointer-events:none;z-index:0;overflow:hidden}
.rmn .rmn-particles i{position:absolute;bottom:-20px;color:var(--red);font-size:14px;opacity:0;font-style:normal;animation:rmnDrift linear infinite}
.rmn .rmn-particles i:nth-child(even){color:var(--olive-soft)}
@keyframes rmnDrift{0%{opacity:0;transform:translateY(20px) rotate(0)}10%{opacity:.12}90%{opacity:.12}100%{opacity:0;transform:translateY(-60px) rotate(45deg)}}
.rmn .hero-copy,.rmn .hero-art{position:relative;z-index:1}
.rmn .thread-line{position:absolute;top:96px;inset-inline:0;width:100%;height:14px;overflow:visible}
.rmn .hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:3rem;align-items:center}
.rmn .hero-copy p{color:var(--olive-soft);font-size:1.1rem;max-width:34rem}
.rmn .hero-copy h1{font-size:clamp(2.1rem,5vw,3.4rem);font-weight:700;margin:1.1rem 0 1.2rem}
.rmn .hero-copy h1 em{font-style:normal;color:var(--red)}
/* English reads better tighter; Arabic keeps the taller leading its marks need. */
:root[dir="ltr"] .rmn .hero-copy h1{line-height:1.15}
:root[dir="ltr"] .rmn .hero-copy p{line-height:1.65}
/* Hero entrances — CSS keyframes (compositor), so they play from the server HTML
   before hydration. --d = per-element stagger; --intro = offset while the desktop
   intro loader covers the page. fill:both keeps them hidden during the delay. */
.rmn .rmn-in{animation:rmnRise .7s cubic-bezier(.25,1,.5,1) both;animation-delay:calc(var(--intro) + var(--d,0s))}
@keyframes rmnRise{from{opacity:0;transform:translateY(22px)}}
/* word-reveal: each word rises out of its own mask. clip-path (not overflow) with
   NEGATIVE top/side insets clips only the bottom edge, so Arabic diacritics above
   the line and glyph side-bearings are never cut; the padding keeps descenders. */
.rmn .rmn-w{display:inline-block;vertical-align:bottom;padding-block:.12em .22em;margin-block:-.12em -.22em;clip-path:inset(-.7em -.35em 0 -.35em)}
.rmn .rmn-w i{display:inline-block;font-style:normal;animation:rmnWordUp .62s cubic-bezier(.23,1,.32,1) both;animation-delay:calc(var(--intro) + var(--b,.28s) + var(--i,0) * 75ms)}
@keyframes rmnWordUp{from{transform:translateY(125%)}}
/* the red phrase stays on one line, and ONE stitch is sewn across it from the
   inline start once its words are up (per-word lines read as broken dashes) */
.rmn .em-group{display:inline-block;position:relative;color:var(--red)}
.rmn .em-group::after{content:'';position:absolute;inset-inline:2px;bottom:4px;height:6px;background:repeating-linear-gradient(90deg,var(--pink) 0 8px,transparent 8px 13px);opacity:.6;border-radius:3px;transform-origin:left;animation:rmnStitchDraw .8s cubic-bezier(.65,0,.35,1) both;animation-delay:calc(var(--intro) + 1.05s)}
:root[dir="rtl"] .rmn .em-group::after{transform-origin:right}
@keyframes rmnStitchDraw{from{transform:scaleX(0)}}
/* the dashed thread under the nav "sews" across once (moved from WAAPI to CSS) */
.rmn #rmn-thread{animation:rmnThread 2.6s ease-out both;animation-delay:calc(var(--intro) + .3s)}
@keyframes rmnThread{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}
.rmn .hero-actions{display:flex;gap:1rem;flex-wrap:wrap;margin:2rem 0 1.1rem}
/* "Based in Dubai" chip under the CTAs */
.rmn .hero-loc{display:inline-flex;align-items:center;gap:.45rem;margin:0 0 1.8rem;padding:.35rem .9rem .35rem .75rem;border:1.5px dashed var(--dash);border-radius:30px;font-size:.88rem;font-weight:500;color:var(--olive)}
.rmn .hero-loc svg{width:1.05em;height:1.05em;flex:none;fill:none;stroke:var(--red);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.rmn .hero-stats{display:flex;gap:2.4rem;flex-wrap:wrap}
.rmn .stat b{font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-size:1.7rem;color:var(--red);display:block;line-height:1.2}
/* tabular digits + a reserved width: the count-up never changes the box width */
.rmn .stat .count{font-variant-numeric:tabular-nums;display:inline-block;min-width:2ch;text-align:end}
/* ONLY the label span — the old ".stat span" also hit the .count digits inside <b>,
   shrinking "40"/"99" to label size while "+"/".9%" stayed large. */
.rmn .stat > span{font-size:.85rem;color:var(--olive-soft)}

/* hoop medallion — one transform owner per wrapper:
   .hero-art (entrance) → .hero-par (scroll parallax) → .tilt (pointer, JS)
   → .hoop-float (idle float) → .hoop (scroll rotate). The entrance is transform-only:
   the logo is the desktop LCP element, so it must never start at opacity 0. */
.rmn .hero-art{position:relative;display:grid;place-items:center;animation:rmnArtIn .9s cubic-bezier(.22,1,.36,1) both;animation-delay:calc(var(--intro) + .3s)}
@keyframes rmnArtIn{from{transform:scale(.92)}}
.rmn .hero-par,.rmn .hoop-float{width:100%;display:grid;place-items:center}
.rmn .hero-par{justify-self:stretch}
.rmn .hoop-float{animation:rmnFloat 7s ease-in-out infinite;animation-delay:calc(var(--intro) + 1.6s)}
@supports (animation-timeline:scroll()){
  @media (prefers-reduced-motion:no-preference){
    .rmn .hero-par{animation:rmnHeroPar linear both;animation-timeline:scroll(root);animation-range:0 100vh}
    .rmn .hoop{animation:rmnHoopRot linear both;animation-timeline:scroll(root);animation-range:0 100vh}
  }
}
@keyframes rmnHeroPar{to{transform:translateY(-64px)}}
@keyframes rmnHoopRot{to{transform:rotate(3deg)}}
.rmn .tilt{position:relative;width:100%;display:grid;place-items:center;transition:transform .25s ease-out;will-change:transform}
.rmn .hoop{position:relative;width:min(360px,78%);aspect-ratio:1}
.rmn .hoop img{width:100%;height:100%;border-radius:50%;object-fit:cover;box-shadow:0 26px 54px rgba(126,22,31,.17);background:var(--cream)}
/* brand logo on a clean white disc — contain (not cover) so the whole mark shows, never cropped */
.rmn .hoop img.hoop-logo{object-fit:contain;background:#fff;padding:16%}
.rmn .hoop::after{content:'';position:absolute;inset:11px;border-radius:50%;border:2px dashed var(--hem);pointer-events:none}
.rmn .hoop-ring{position:absolute;inset:-4.5%;width:109%;height:109%;transform:rotate(-90deg);pointer-events:none}
/* ring "sewn" once: pathLength=1 on the circle → dash 1 / offset 1 → 0 */
.rmn .hoop-ring circle{fill:none;stroke:var(--olive);stroke-width:1.7;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:rmnRing 1.4s cubic-bezier(.23,1,.32,1) forwards;animation-delay:calc(var(--intro) + .4s)}
@keyframes rmnRing{to{stroke-dashoffset:0}}
@keyframes rmnFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}

/* card base (still used by the CMS preview + misc) */
.rmn .card{background:var(--card);border-radius:var(--radius);padding:2rem 1.6rem;box-shadow:var(--shadow);position:relative;transition:transform .45s var(--ease),box-shadow .45s}
.rmn .card::before,.rmn .card::after{content:'✕';position:absolute;font-size:.75rem;color:var(--red);opacity:0;transition:opacity .4s,transform .4s var(--ease)}
.rmn .card::before{top:10px;right:12px;transform:translate(6px,-6px)}
.rmn .card::after{bottom:8px;left:12px;transform:translate(-6px,6px)}
.rmn .card:hover{transform:translateY(-8px);box-shadow:0 20px 40px rgba(126,22,31,.14)}
.rmn .card:hover::before,.rmn .card:hover::after{opacity:1;transform:translate(0,0)}
.rmn .card h3{font-size:1.15rem;margin-bottom:.5rem}
.rmn .card p{font-size:.94rem;color:var(--olive-soft)}

/* offers — "What we offer" embroidery-skinned BENTO grid (replaces the old
   CardSwap stack). Structural grid rules (grid-template, cell layer stack) live
   in magic-bento.css; the brand look (cream cell, dashed stitch border, glow
   layers, typography) lives here under .rmn. */
.rmn .offers{padding:5.5rem 0;background:transparent}
/* Desktop scrollytelling mode: the section band goes transparent so the sticky
   morphing-blob layer (painted inside .rmn-scrolly, z:0) shows through, and the
   section header is elevated above it. Scoped to the mode class (added only when
   the scrolly gate passes) so tablet/preview/reduced-motion keep the --cream-2
   band untouched. */
.rmn .offers.offers-scrolly-mode{background:transparent}
.rmn .offers.offers-scrolly-mode .container{position:relative;z-index:1}
.rmn .offers.offers-scrolly-mode .section-head{position:relative;z-index:2}
/* Desktop with motion + JS, ≥2 offers (.has-svc): the scrollytelling showcase
   takes the bento's place. The space-holder is the showcase's own height (each
   step is min-height 78vh), so its arrival after hydration moves nothing. */
.rmn .rmn-svc-hold{display:none}
@media (min-width:981px) and (prefers-reduced-motion:no-preference){
  :where(:root[data-js]) .rmn .offers.has-svc .rmn-bento,:where(:root[data-js]) .rmn .offers.has-svc .rmn-swipe-dots{display:none}
  :where(:root[data-js]) .rmn .offers.has-svc .rmn-svc-hold{display:block;height:calc(var(--svc-n) * 78vh)}
}
/* small category label on the bento cell (preview/tablet parity with the scrolly eyebrow) */
.rmn .rmn-offer-eyebrow{display:block;font-weight:700;font-size:.72rem;letter-spacing:.1em;color:var(--olive-soft,var(--olive));margin-bottom:.3rem}

/* shared fallback hoop for media-less offers (kept from before) */
.rmn .rmn-offer-stage-empty{width:100%;height:100%;display:grid;place-items:center;background:radial-gradient(circle at 50% 42%,var(--cream) 0%,var(--cream-2) 100%)}
.rmn .rmn-offer-stage-empty span{font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-size:3.2rem;font-weight:700;color:var(--red);opacity:.8}
.rmn .rmn-offer-stage-empty-hoop{background:radial-gradient(circle at 50% 40%,var(--cream) 0%,var(--cream-2) 100%)}
.rmn .rmn-offer-stage-empty-hoop span{width:88px;height:88px;border-radius:50%;display:grid;place-items:center;background:var(--card);outline:2px dashed var(--red);outline-offset:6px;box-shadow:var(--shadow);font-size:2.2rem}
.rmn .rmn-offer-playbadge{position:absolute;inset-inline-end:.7rem;bottom:.7rem;width:34px;height:34px;border-radius:50%;background:var(--red);color:#FDF4ED;display:grid;place-items:center;font-size:.8rem;padding-inline-start:2px;z-index:4}

/* CTA row + monogram chip (kept, reused inside cells) */
.rmn .rmn-offer-ctas{display:flex;gap:.7rem;flex-wrap:wrap;margin-top:1rem}
.rmn .rmn-offer-chip{flex:0 0 auto;width:44px;height:44px;border-radius:14px;display:grid;place-items:center;background:color-mix(in srgb,var(--red) 9%,transparent);color:var(--red);font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-weight:700;font-size:1.2rem}
/* Inside a bento cell the two CTAs sit COMPACT + side-by-side, each sized to its
   own text (NOT full-width) — the global hero .btn (.85rem/2.2rem/50px pill) is far
   too big for a card and full-width buttons read "too long". Scoped to
   .rmn-bento-cell so the hero/section buttons keep their large pill. flex-wrap lets
   them drop to two rows only on the very narrowest cell, never overflow. */
.rmn .rmn-bento-cell .rmn-offer-ctas{flex-wrap:wrap;gap:.5rem;margin-top:.9rem}
.rmn .rmn-bento-cell .rmn-offer-ctas .btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;flex:0 1 auto;padding:.5rem 1.05rem;font-size:.82rem;border-radius:11px;line-height:1.2}
.rmn .rmn-bento-cell .rmn-offer-ctas .btn-wa svg{width:1em;height:1em}

/* bento cell brand skin — cream face, dashed stitch border, brand glow layers */
.rmn .rmn-bento-cell{background:var(--card);border:2px dashed var(--dash);border-radius:var(--radius);box-shadow:var(--shadow);transition:border-color .3s var(--ease),box-shadow .3s var(--ease);transform-style:preserve-3d}
.rmn .rmn-bento-cell:hover{border-color:var(--red)}
.rmn .rmn-bento-cell-media{background:var(--cream-2)}
/* head = chip at top; content flows top-down with an even gap (NO space-between
   stranding a lonely chip at the top and the copy at the bottom, which left a big
   dead gap in the middle of every tile). overflow-wrap:anywhere lets long Arabic
   words wrap instead of forcing the cell wider than its column. */
.rmn .rmn-bento-cell-content h3{font-family:var(--font-kufi),'Reem Kufi',sans-serif;color:var(--olive);font-size:1.15rem;margin:0;line-height:1.35;overflow-wrap:anywhere}
.rmn .rmn-bento-cell-content p{color:var(--olive-soft);font-size:.9rem;margin:0;line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
/* optional per-card bullet points (sub-features) — embroidered ✚ markers */
.rmn .rmn-bento-points{list-style:none;margin:0;padding:0;display:grid;gap:.35rem}
.rmn .rmn-bento-points li{display:flex;gap:.5rem;align-items:flex-start;font-size:.85rem;color:var(--olive-soft);line-height:1.5}
.rmn .rmn-bento-points li::before{content:'✚';color:var(--red);font-size:.72rem;margin-top:.15em;flex:0 0 auto}
/* over media, the points turn light like the rest of the copy */
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-bento-points li{color:rgba(253,244,237,.88)}
/* the two large flagship cells (reference nth-child 3 = 2x2, 4 = wide) get a
   bigger heading + fuller summary, matching the reference's emphasis. */
@media (min-width:1024px){
  .rmn .rmn-bento > :nth-child(3) .rmn-bento-cell-content h3,
  .rmn .rmn-bento > :nth-child(4) .rmn-bento-cell-content h3{font-size:1.5rem}
  .rmn .rmn-bento > :nth-child(3) .rmn-bento-cell-content p,
  .rmn .rmn-bento > :nth-child(4) .rmn-bento-cell-content p{-webkit-line-clamp:4;line-clamp:4}
  /* the two large flagship cells (2x2 + wide) have vertical slack — push their CTA
     block to the cell bottom so the tile reads as a full composition, not top-loaded
     copy with a void below. Regular cells pack tight (no dead gap) so they DON'T get
     this. */
  .rmn .rmn-bento > :nth-child(3) .rmn-offer-ctas,
  .rmn .rmn-bento > :nth-child(4) .rmn-offer-ctas{margin-top:auto}
}
/* MEDIA cells: when an offer has an uploaded image/video, it fills the cell; a
   bottom scrim keeps the copy readable and the text turns light. Cells without
   media keep the plain cream face + olive text above. */
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media)::after,
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-bento-cell-body{position:relative}
/* scrim reaches higher (to ~100%) so the taller stacked-CTA block — two buttons,
   not one — stays readable over an uploaded image/video, and darkens toward the
   bottom where the buttons sit. */
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-bento-cell-body::before{content:'';position:absolute;inset:-1.25em;z-index:-1;background:linear-gradient(to top,color-mix(in srgb,var(--ink) 88%,transparent) 0%,color-mix(in srgb,var(--ink) 66%,transparent) 48%,color-mix(in srgb,var(--ink) 22%,transparent) 80%,transparent 100%)}
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-bento-cell-content h3{color:#FDF4ED}
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-bento-cell-content p{color:rgba(253,244,237,.9)}
/* the header chip sits on a translucent scrim of its own so it reads over media */
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-offer-chip{background:color-mix(in srgb,#000 35%,transparent);color:#FDF4ED}
/* over media the ghost/WhatsApp CTA needs a light outline+text to read on the dark
   scrim (its olive outline vanishes against the image). Primary stays pomegranate. */
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-offer-ctas .btn-ghost{color:#FDF4ED;outline-color:rgba(253,244,237,.5)}
.rmn .rmn-bento-cell:has(.rmn-bento-cell-media) .rmn-offer-ctas .btn-ghost.btn-wa{color:#7ff0b0}
.rmn .rmn-offer-playbadge{position:absolute;inset-inline-end:.7rem;top:.7rem;bottom:auto}

/* CMS preview: force a single column so the bento fits the ~360px column */
.rmn-preview .rmn .rmn-bento{grid-template-columns:1fr!important;gap:1rem;font-size:1rem;padding:0}
.rmn-preview .rmn .rmn-bento > *{grid-column:auto!important;grid-row:auto!important;aspect-ratio:auto!important}
.rmn-preview .rmn .rmn-bento-cell{min-height:150px}

/* about */
.rmn .about{padding:6rem 0}
.rmn .about-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:3.5rem;align-items:center}
.rmn .about-copy h2{font-size:clamp(1.7rem,3.4vw,2.4rem);margin:.7rem 0 1.1rem}
.rmn .about-copy p{color:var(--olive-soft);margin-bottom:1rem;line-height:1.9}
/* Emphasis inside the About company copy (founder names, service pillars): a touch
   stronger weight + the deeper olive so the bold spans read against the muted body. */
.rmn .about-copy p strong{font-weight:700;color:var(--olive)}
.rmn .about-more{display:none}
.rmn .about-more summary{display:inline-flex;align-items:center;gap:.45rem;min-height:44px;cursor:pointer;color:var(--red);font-weight:700;list-style:none}
.rmn .about-more summary::-webkit-details-marker{display:none}
.rmn .about-more summary::after{content:'✚';font-size:.75rem;transition:transform .3s var(--ease)}
.rmn .about-more[open] summary::after{transform:rotate(45deg)}
.rmn .about-more[open] summary{margin-bottom:.6rem}
@media (max-width:760px){.rmn .about-rest{display:none}.rmn .about-more{display:block}}
.rmn .about-quote{border-inline-start:3px solid var(--red);padding:.4rem 1.2rem;margin:1.4rem 0;font-family:var(--font-kufi),'Reem Kufi',sans-serif;color:var(--olive);font-size:1.08rem;background:linear-gradient(to left,color-mix(in srgb,var(--pink) 10%,transparent),transparent);border-radius:6px}
.rmn .about-panel{background:var(--ivory);border-radius:var(--radius);padding:2.4rem;outline:2px dashed var(--olive-soft);outline-offset:-12px;display:grid;gap:1.5rem}
.rmn .fact{display:flex;align-items:center;gap:1.1rem}
.rmn .fact-x{color:var(--red);font-size:1.1rem}
.rmn .fact b{font-family:var(--font-kufi),'Reem Kufi',sans-serif;color:var(--olive);display:block;font-size:1.05rem}
.rmn .fact span{font-size:.88rem;color:var(--olive-soft)}

/* team — stitched-thread founders spotlight */
.rmn .team{padding:5.5rem 0;background:transparent}
/* legacy member card (kept for the CMS preview transition) */
.rmn .member{text-align:center;padding:2.6rem 1.6rem}
.rmn .avatar{width:104px;height:104px;border-radius:50%;margin:0 auto 1.3rem;background:var(--cream-2);display:grid;place-items:center;font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-size:2rem;font-weight:700;color:var(--red);outline:2px dashed var(--red);outline-offset:5px;padding-top:8px;overflow:hidden;transition:transform .5s var(--ease),outline-offset .4s}
.rmn .avatar img{width:100%;height:100%;object-fit:cover;border-radius:50%}
.rmn .member:hover .avatar{transform:rotate(calc(-6deg * var(--dir-sign))) scale(1.05);outline-offset:9px}
.rmn .member h3{font-size:1.2rem}
.rmn .role{color:var(--red);font-weight:700;font-size:.85rem;margin:.2rem 0 .8rem;display:block}
.rmn .member p{font-size:.9rem;color:var(--olive-soft)}
/* the thread: draws downward (scaleY) when revealed; overrides .reveal's
   translate/opacity (declared later at equal specificity → wins) */
.rmn .rmn-founders{position:relative;padding-block:1rem}
.rmn .rmn-thread-line{position:absolute;top:0;bottom:0;inset-inline-start:50%;width:0;border-inline-start:2.5px dashed var(--red);opacity:.4;transform:scaleY(0);transform-origin:top;transition:transform 1.6s var(--ease)}
.rmn .rmn-thread-line.in{transform:scaleY(1);opacity:.4}
:root:not([data-js]) .rmn .rmn-thread-line{transform:none}
.rmn .rmn-founder{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:clamp(1.6rem,4vw,3.2rem);align-items:center;padding-block:2.4rem}
.rmn .rmn-founder-knot{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:var(--red);background:var(--cream-2);padding:.15rem .3rem;font-size:1rem;z-index:1}
.rmn .rmn-founder-hoop{width:min(230px,60vw);aspect-ratio:1;border-radius:50%;overflow:hidden;background:#fff;border:6px solid var(--olive);outline:2px dashed var(--red);outline-offset:7px;box-shadow:var(--shadow);display:grid;place-items:center;justify-self:end;transition:transform .5s var(--ease)}
.rmn .rmn-founder:hover .rmn-founder-hoop{transform:rotate(calc(-3deg * var(--dir-sign))) scale(1.02)}
.rmn .rmn-founder.alt .rmn-founder-hoop{order:2;justify-self:start}
.rmn .rmn-founder.alt .rmn-founder-copy{order:1;justify-self:end;text-align:start}
.rmn .rmn-founder-hoop img{width:100%;height:100%;object-fit:cover}
.rmn .rmn-founder-initials{font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-size:3rem;font-weight:700;color:var(--red)}
.rmn .rmn-founder-copy{max-width:34rem}
.rmn .rmn-founder-copy h3{font-size:1.6rem}
.rmn .rmn-founder-role{display:inline-block;margin:.45rem 0 .7rem;padding:.3rem 1rem;border:2px dashed var(--dash);border-radius:30px;color:var(--red);font-weight:700;font-size:.85rem}
.rmn .rmn-founder-quote{border-inline-start:3px solid var(--red);padding:.4rem 1.2rem;margin:.9rem 0;font-family:var(--font-kufi),'Reem Kufi',sans-serif;color:var(--olive);font-size:1.02rem;background:linear-gradient(to left,color-mix(in srgb,var(--pink) 10%,transparent),transparent);border-radius:6px}
.rmn .rmn-founder-copy p{font-size:.95rem;color:var(--olive-soft)}
/* the rest of the team — compact hoops strip */
.rmn .rmn-team-strip{display:flex;flex-wrap:wrap;justify-content:center;gap:2.4rem;margin-top:2.4rem}
.rmn .rmn-team-mini{display:grid;justify-items:center;text-align:center}
.rmn .rmn-team-mini-hoop{width:84px;height:84px;border-radius:50%;overflow:hidden;background:var(--cream);display:grid;place-items:center;outline:2px dashed var(--red);outline-offset:4px;font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-weight:700;font-size:1.5rem;color:var(--red);margin-bottom:.6rem;transition:transform .4s var(--ease)}
.rmn .rmn-team-mini:hover .rmn-team-mini-hoop{transform:scale(1.07)}
.rmn .rmn-team-mini-hoop img{width:100%;height:100%;object-fit:cover}
.rmn .rmn-team-mini b{font-family:var(--font-kufi),'Reem Kufi',sans-serif;color:var(--olive);font-size:.98rem}
.rmn .rmn-team-mini small{color:var(--olive-soft);font-size:.8rem}

/* packages */
.rmn .packages{padding:6rem 0}
.rmn .pkg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1.6rem;align-items:stretch}
.rmn .pkg{background:var(--card);border-radius:var(--radius);padding:2.6rem 2rem;box-shadow:var(--shadow);position:relative;display:flex;flex-direction:column;transition:transform .45s var(--ease),box-shadow .45s;outline:2px dashed var(--dash);outline-offset:-10px}
.rmn .pkg:hover{transform:translateY(-10px);box-shadow:0 24px 48px rgba(126,22,31,.15)}
.rmn .pkg-name{font-size:1.35rem;color:var(--olive)}
.rmn .pkg-tag{font-size:.8rem;letter-spacing:.25em;color:var(--olive-soft);font-weight:700}
.rmn .pkg-price{font-family:var(--font-kufi),'Reem Kufi',sans-serif;font-size:2.6rem;color:var(--red);margin:1.2rem 0 .2rem;line-height:1.2}
.rmn .pkg-price small{font-size:.95rem;color:var(--olive-soft);font-family:var(--font-tajawal),'Tajawal',sans-serif;font-weight:500}
.rmn .pkg ul{margin:1.6rem 0 2rem;display:grid;gap:.75rem;flex:1}
.rmn .pkg li{display:flex;gap:.7rem;align-items:flex-start;font-size:.95rem;color:var(--ink)}
.rmn .pkg li::before{content:'✚';color:var(--red);font-size:.8rem;margin-top:3px}
.rmn .pkg .btn{width:100%;text-align:center}
.rmn .pkg.featured{background:var(--red);color:#FDF4ED;outline-color:rgba(253,244,237,.5);transform:scale(1.04)}
.rmn .pkg.featured:hover{transform:scale(1.04) translateY(-10px)}
.rmn .pkg.featured .pkg-name,.rmn .pkg.featured .pkg-price{color:#FDF4ED}
.rmn .pkg.featured .pkg-tag,.rmn .pkg.featured .pkg-price small,.rmn .pkg.featured li{color:rgba(253,244,237,.85)}
.rmn .pkg.featured li::before{color:var(--pink)}
.rmn .ribbon{position:absolute;top:-14px;right:50%;transform:translateX(50%);background:var(--olive);color:#FDF4ED;font-size:.75rem;font-weight:700;padding:.35rem 1.2rem;border-radius:30px;letter-spacing:.1em;white-space:nowrap;outline:2px dashed var(--cream);outline-offset:-5px}
.rmn .pkg-note{text-align:center;margin-top:2.2rem;color:var(--olive-soft);font-size:.9rem}

/* ── Clients section ── */
.rmn .rmn-clients{padding-bottom:2rem}
.rmn .rmn-clients-loop{margin:1rem 0 3rem;padding-block:.5rem}
.rmn-client-chip{transition:transform .3s var(--ease),border-color .3s}
.rmn-logoloop__item:hover .rmn-client-chip{border-color:var(--red)}
.rmn .rmn-showcase{display:flex;flex-direction:column;align-items:center;gap:1.4rem}
.rmn .rmn-showcase-devices{display:flex;align-items:flex-end;justify-content:center;gap:clamp(1rem,4vw,3rem)}
.rmn .rmn-showcase-dots{display:flex;gap:.6rem}
.rmn .rmn-dot{width:9px;height:9px;border-radius:50%;border:2px dashed var(--olive-soft);background:transparent;cursor:pointer;padding:0;transition:.3s var(--ease)}
.rmn .rmn-dot.on{background:var(--red);border-color:var(--red);transform:scale(1.15)}
/* laptop */
.rmn .rmn-laptop{width:clamp(260px,42vw,520px)}
.rmn .rmn-laptop-screen{position:relative;aspect-ratio:16/10;border-radius:14px 14px 4px 4px;overflow:hidden;background:var(--card);border:2px dashed var(--dash);box-shadow:var(--shadow)}
.rmn .rmn-laptop-base{height:14px;margin-top:-2px;border-radius:0 0 12px 12px;background:linear-gradient(var(--ivory),var(--cream-2));border:2px dashed var(--dash);border-top:none;width:112%;margin-inline-start:-6%}
/* phone */
.rmn .rmn-phone{position:relative;width:clamp(112px,17vw,200px);aspect-ratio:9/19;border-radius:26px;overflow:hidden;background:var(--card);border:2px dashed var(--dash);box-shadow:var(--shadow)}
.rmn .rmn-phone-notch{position:absolute;top:8px;inset-inline:0;margin-inline:auto;width:38%;height:6px;border-radius:6px;background:var(--dash);z-index:2}
.rmn .rmn-phone-screen{position:absolute;inset:8px;border-radius:18px;overflow:hidden}
/* Screenshots are stacked absolute layers that FILL the frame (object-fit:cover
   — any aspect ratio, no empty band). The visible layer carries .on; the one it
   replaced carries .prev during the cross-transition. Transform/opacity only. */
.rmn .rmn-shot{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;opacity:0;transition:opacity .55s var(--ease),transform .55s var(--ease)}
.rmn .rmn-shot.on{opacity:1}
/* Smart pan: an image genuinely TALLER than its frame anchors to the top at its
   natural height and slowly pans while displayed (rmnPan below). */
.rmn .rmn-shot.tall{height:auto;bottom:auto}
/* slide animation (RTL-aware via --rmn-dir) */
.rmn .rmn-anim-slide .rmn-shot{transform:translateX(calc(28px * var(--rmn-dir,1)))}
.rmn .rmn-anim-slide .rmn-shot.on{transform:none}
.rmn .rmn-anim-slide .rmn-shot.prev{transform:translateX(calc(-28px * var(--rmn-dir,1)));opacity:0}
[dir="rtl"] .rmn .rmn-anim-slide{--rmn-dir:-1}
/* pan animation mode renders a single remounted layer — soften with a fade-in */
@keyframes rmnShotIn{from{opacity:0}to{opacity:1}}
.rmn .rmn-anim-pan .rmn-shot.on{animation:rmnShotIn .35s var(--ease) both}
.rmn .rmn-anim-pan .rmn-shot.on.rmn-pan.run{animation:rmnShotIn .35s var(--ease) both,rmnPan 16s ease-in-out infinite alternate}
.rmn .rmn-pan{will-change:transform}
.rmn .rmn-pan.run{animation:rmnPan 16s ease-in-out infinite alternate}
.rmn .rmn-showcase:hover .rmn-pan.run{animation-play-state:paused}
@keyframes rmnPan{from{transform:translateY(0)}to{transform:translateY(calc(-100% + 100cqh))}}
.rmn .rmn-laptop-screen,.rmn .rmn-phone-screen{container-type:size}
.rmn .rmn-mock-empty{width:100%;height:100%;display:grid;place-items:center;color:var(--olive-soft)}
@media (max-width:560px){
  .rmn .rmn-showcase-devices{gap:1rem}
  /* the bigger phone must still fit beside the laptop on a 375px viewport */
  .rmn .rmn-laptop{width:clamp(210px,56vw,520px)}
  .rmn .rmn-phone{width:clamp(96px,24vw,200px)}
}
@media (prefers-reduced-motion:reduce){.rmn .rmn-pan.run{animation:none}.rmn .rmn-shot{transition:none}.rmn .rmn-anim-pan .rmn-shot.on{animation:none;opacity:1}}
/* CMS live-preview only: the showcase's device widths are viewport-relative
   (42vw laptop / 15vw phone) which overflow the narrow ~360px preview column and
   get clipped. Inside .rmn-preview (never present on the real landing page) make
   the panel an inline-size container and size the devices as a fraction of the
   panel width (cqw) so laptop + phone stay SIDE BY SIDE and always fit. */
.rmn-preview{container-type:inline-size}
.rmn-preview .rmn .rmn-showcase-devices{flex-wrap:nowrap;gap:4cqw}
.rmn-preview .rmn .rmn-laptop{width:58cqw;min-width:0}
.rmn-preview .rmn .rmn-phone{width:26cqw;min-width:0}

/* CTA band */
/* CTA band keeps its solid red identity (white text needs the contrast) but melts
   into the ground: a soft gradient top-edge fades the red up into transparent over
   the first ~130px so there's no hard seam with the section above. */
.rmn .cta-band{background:linear-gradient(to bottom, transparent 0, var(--red) 130px, var(--red) 100%);padding:5rem 0;position:relative;overflow:hidden}
.rmn .cta-band::before{content:'';position:absolute;inset:130px 0 0 0;opacity:.1;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Ctext x='8' y='28' font-size='16' fill='%23FDF4ED'%3E%E2%9C%95%3C/text%3E%3C/svg%3E")}
.rmn .cta-inner{position:relative;text-align:center;color:#FDF4ED}
.rmn .cta-inner h2{color:#FDF4ED;font-size:clamp(1.7rem,3.6vw,2.5rem);margin-bottom:.8rem}
.rmn .cta-inner p{color:rgba(253,244,237,.85);max-width:34rem;margin:0 auto 2rem}

/* footer */
/* Footer keeps its solid olive identity but melts into the ground with a soft
   gradient top-edge (fades olive up into transparent over the first ~110px). */
.rmn footer.rmn-foot{background:linear-gradient(to bottom, transparent 0, var(--olive) 110px, var(--olive) 100%);color:rgba(253,244,237,.85);padding:3.5rem 0 2rem}
:root[data-theme="dark"] .rmn footer.rmn-foot{background:linear-gradient(to bottom, transparent 0, #0f0c0a 110px, #0f0c0a 100%)}
.rmn .foot-grid{display:flex;justify-content:space-between;gap:2rem;flex-wrap:wrap;align-items:flex-start}
.rmn .foot-brand .brand-name{color:#FDF4ED}
.rmn .foot-brand-row{display:flex;align-items:center;gap:.8rem}
.rmn .foot-brand-row .brand-mark{outline-color:rgba(253,244,237,.55)}
.rmn .foot-addr{display:block;font-style:normal;font-size:.9rem;padding:.25rem 0;color:rgba(253,244,237,.7)}
.rmn .foot-brand p{font-size:.88rem;max-width:22rem;margin-top:.8rem;color:rgba(253,244,237,.65)}
.rmn .foot-links{display:flex;gap:3rem;flex-wrap:wrap}
.rmn .foot-links h4{font-family:var(--font-kufi),'Reem Kufi',sans-serif;color:#FDF4ED;margin-bottom:.9rem;font-size:1rem}
.rmn .foot-links a{display:block;font-size:.9rem;padding:.25rem 0;color:rgba(253,244,237,.7);transition:color .3s,transform .3s}
/* nudge toward the reading direction (was a physical -4px: backwards in English) */
.rmn .foot-links a:hover{color:var(--pink);transform:translateX(calc(4px * var(--dir-sign)))}
.rmn .foot-base{margin-top:2.6rem;padding-top:1.4rem;text-align:center;font-size:.82rem;border-top:1px dashed rgba(253,244,237,.3);color:rgba(253,244,237,.55)}

/* offer detail page */
.rmn .rmn-detail{padding:2.2rem 0 4.5rem}
.rmn .rmn-detail-top{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.2rem 0 2rem}
.rmn .rmn-detail h1{font-size:clamp(1.9rem,4vw,2.7rem)}
.rmn .rmn-detail-lead{color:var(--olive-soft);font-size:1.1rem;margin-top:.5rem;max-width:60ch}
/* The hero frame is 16:9 before its media arrives (media rows carry no size), so
   nothing below it moves when it loads; the whole picture shows inside it. */
.rmn .rmn-detail-hero{margin:1.8rem 0;border-radius:var(--radius);overflow:hidden;border:2px dashed var(--dash);box-shadow:var(--shadow);background:var(--card);aspect-ratio:16/9}
.rmn .rmn-detail-hero img,.rmn .rmn-detail-hero video{width:100%;height:100%;display:block;object-fit:contain}
.rmn .rmn-detail-body{margin-top:2rem;max-width:70ch}
.rmn .rmn-detail-body p{margin-bottom:1rem;color:var(--ink);line-height:1.9;white-space:pre-line}
.rmn .rmn-detail-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:1.2rem;margin-top:2rem}
.rmn .rmn-detail-gallery img,.rmn .rmn-detail-gallery video{width:100%;border-radius:14px;border:2px dashed var(--dash);display:block;background:var(--card)}
.rmn .rmn-detail-cta{margin-top:3rem;background:var(--cream-2);border-radius:var(--radius);padding:2.2rem;outline:2px dashed var(--dash);outline-offset:-10px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1.2rem}
.rmn .rmn-detail-cta h2{font-size:1.4rem}

/* responsive */
@media (max-width:980px){
  .rmn .hero-grid{grid-template-columns:1fr;text-align:center;gap:2rem}
  .rmn .hero-copy p{margin-inline:auto}
  .rmn .hero-actions,.rmn .hero-stats{justify-content:center}
  .rmn .hero-art{order:-1;margin-top:1rem}
  .rmn .hoop{width:min(300px,78%)}
  .rmn .about-grid{grid-template-columns:1fr}
  .rmn .pkg-grid{grid-template-columns:1fr;max-width:440px;margin-inline:auto}
  .rmn .pkg.featured{transform:none}
  .rmn .pkg.featured:hover{transform:translateY(-10px)}
  /* founders: thread moves to the inline-start edge, single column */
  .rmn .rmn-thread-line{inset-inline-start:16px}
  .rmn .rmn-founders{overflow-x:hidden;max-width:100%}
  .rmn .rmn-founder{grid-template-columns:1fr;gap:1.2rem;padding-inline-start:46px;padding-block:1.8rem;overflow-x:hidden;max-width:100%;box-sizing:border-box}
  .rmn .rmn-founder .rmn-founder-hoop,.rmn .rmn-founder.alt .rmn-founder-hoop{order:0;justify-self:start;width:min(180px,52vw);max-width:100%;outline-offset:2px}
  .rmn .rmn-founder.alt .rmn-founder-copy{order:0;justify-self:start}
  .rmn .rmn-founder-copy{max-width:100%}
  .rmn .rmn-founder-knot{display:none}
}
@media (max-width:760px){
  .rmn .hero{padding-top:7rem}
  /* at .35em tracking the 29-letter eyebrow broke onto two lines on a phone */
  .rmn .hero .eyebrow{letter-spacing:.2em}
  .rmn .hero-stats{gap:1.6rem}
  /* Phones: the headline + CTAs come FIRST (they are the message and the LCP — text,
     no image wait); the medallion follows the stats, smaller. */
  .rmn .hero-art{order:0;margin-top:2.4rem}
  /* smaller than the copy block, so the LCP stays text */
  .rmn .hoop{width:min(160px,44vw)}
  /* the subtitle is the phone's largest text block (its LCP): it enters by
     transform only, so it counts as painted with the first frame */
  .rmn .hero-copy > p.rmn-in{animation-name:rmnRiseT}
  .rmn .rmn-detail-gallery{grid-template-columns:1fr}
  /* Phone spacing polish for the sections that rely only on global breakpoints
     (About / CTA band / Team) — tighten the tall desktop paddings + wide gaps so
     they don't feel stretched on a small screen. Layout switches (single column)
     already happen at ≤980px. */
  .rmn .about{padding:3.5rem 0}
  .rmn .about-grid{gap:2rem}
  .rmn .about-panel{padding:1.6rem}
  .rmn .cta-band{padding:3.5rem 0}
  .rmn .team{padding:3.5rem 0}
  .rmn .rmn-team-strip{gap:1.4rem}

  /* ── swipe tracks (swipe.tsx): offers + packages become one snap-scrolling
     row — the next card peeks in at ~12% — instead of a tall pinned stack.
     The track bleeds to the screen edges (the container is 92vw) and keeps the
     first card aligned with the content. RTL scrolls natively. */
  .rmn .rmn-swipe.rmn-swipe{
    display:grid;grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:88%;gap:12px;
    width:auto;max-width:none;margin:0 -4vw;padding:6px 4vw 10px;font-size:1rem;
    overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scroll-padding-inline:4vw;
    scrollbar-width:none;align-items:stretch
  }
  .rmn .rmn-swipe::-webkit-scrollbar{display:none}
  .rmn .rmn-swipe.rmn-swipe > *{scroll-snap-align:start;min-width:0;width:auto;max-width:none;margin:0;grid-column:auto;grid-row:auto}
  .rmn .rmn-swipe-dots{display:flex;justify-content:center;margin-top:.2rem}
  .rmn .rmn-swipe-dot{width:44px;height:44px;display:grid;place-items:center;background:none;border:0;padding:0;cursor:pointer}
  .rmn .rmn-swipe-dot::before{content:'';width:9px;height:9px;border-radius:50%;border:2px dashed var(--olive-soft);transition:transform .3s var(--ease),background-color .3s,border-color .3s}
  .rmn .rmn-swipe-dot[aria-current]::before{background:var(--red);border-color:var(--red);transform:scale(1.2)}

  /* the full-screen menu over an opaque page: no blur re-rendering behind it */
  .rmn .rmn-bubble-overlay{backdrop-filter:none;-webkit-backdrop-filter:none;background-color:var(--page)}

  /* No content-visibility:auto on the sections: their heights depend on CMS
     content, so any placeholder size made a #packages deep link and a mid-page
     reload jump (CLS .06–.1) when the real sections rendered above the target. */
}
@media (min-width:761px){.rmn .rmn-swipe-dots{display:none}}
@keyframes rmnRiseT{from{transform:translateY(14px)}}

/* ── phone action bar: WhatsApp + "Get your store", pinned to the bottom once
   the hero has scrolled away; hidden over the footer and while the menu is open */
.rmn .rmn-actionbar{display:none}
@media (max-width:760px){
  .rmn .rmn-actionbar{position:fixed;inset-inline:0;bottom:0;z-index:95;display:flex;gap:.6rem;padding:.55rem 4vw calc(.55rem + env(safe-area-inset-bottom,0px));background:color-mix(in srgb,var(--page) 96%,transparent);border-top:1px dashed var(--dash);box-shadow:0 -8px 24px rgba(40,16,16,.08);transform:translateY(110%);transition:transform .35s var(--ease-out);will-change:transform}
  .rmn .rmn-actionbar.on{transform:none}
  .rmn #rmn-nav[data-menu-open] ~ .rmn-actionbar{transform:translateY(110%)} /* its sibling, not .rmn:has(): see SITE_DOC_CSS */
  .rmn .rmn-actionbar .btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:.45rem;min-height:48px;padding:0 .8rem;font-size:.95rem;white-space:nowrap}
}
/* the nav links + the tools: keep each link on one line and tighten the gap on laptops */
.rmn .nav-links a{white-space:nowrap}
/* (the bar sits in the fixed-width container, so wide screens are as tight as 1280 px;
   the RTL selector repeats because the RTL nav rule above is more specific) */
@media (min-width:1101px){.rmn .nav-links,:root[dir="rtl"] .rmn .nav-links{gap:1rem;font-size:.92rem}}
@media (min-width:1101px) and (max-width:1240px){.rmn .nav-links,:root[dir="rtl"] .rmn .nav-links{gap:.65rem;font-size:.85rem}}
@media (min-width:1101px) and (max-width:1150px){.rmn .nav-links,:root[dir="rtl"] .rmn .nav-links{gap:.5rem;font-size:.82rem}}

/* ── touch: real tap targets, and no hover state that sticks after a tap ── */
@media (pointer:coarse){
  .rmn .tool-btn{width:44px;height:44px}
  .rmn .foot-links a{padding:.55rem 0}
  .rmn .rmn-bento-cell .rmn-offer-ctas .btn,.rmn .rmn-offer-ctas .btn,.rmn .rmn-spay-cta .btn,.rmn .rmn-ais-chip{min-height:44px}
  .rmn .rmn-spay-stripe{padding-block:9px}
  /* the showcase dots stay 9px to the eye; the tap area grows around them */
  .rmn .rmn-dot{position:relative}
  .rmn .rmn-dot::after{content:'';position:absolute;inset:-18px}
}
@media (hover:none){
  .rmn .tool-btn:hover,.rmn .btn-primary:hover,.rmn .btn-ghost:hover,.rmn .btn-light:hover,.rmn .btn-ghost.btn-wa:hover,
  .rmn .card:hover,.rmn .pkg:hover,.rmn .foot-links a:hover,.rmn .brand:hover .brand-mark,.rmn .member:hover .avatar,
  .rmn .rmn-founder:hover .rmn-founder-hoop,.rmn .rmn-team-mini:hover .rmn-team-mini-hoop{transform:none}
  .rmn .pkg.featured:hover{transform:scale(1.04)}
}
@media (hover:none) and (max-width:980px){.rmn .pkg.featured:hover{transform:none}}
@media (prefers-reduced-motion:reduce){
  .rmn *,.rmn *::before,.rmn *::after{animation:none!important;transition:none!important}
  .rmn .reveal,.rmn .stitch-divider span{opacity:1;transform:none}
  .rmn .rmn-thread-line{opacity:.4}
  .rmn .hoop-ring circle{stroke-dashoffset:0}
  .rmn .rmn-particles{display:none}       /* no ambient drift */
  .rmn .rmn-w i{transform:none!important}
}
`

// Public-site-only document rules. The (site) layout injects these after SITE_CSS;
// the CMS live preview (which renders .rmn inside the dashboard) does not, so they
// need no .rmn-site test. Never key a rule on :has() at <html> or .rmn: Chrome then
// re-checks it on every DOM insertion anywhere on the page and restyles every
// element the page's :has() rules mention (all p, li, h3…) each time: about half
// the main thread while a demo streams text.
export const SITE_DOC_CSS = `
:root body::after{display:none} /* the dashboard's full-screen grain layer */
@media (prefers-reduced-motion:no-preference){:root{scroll-behavior:smooth}}
`
