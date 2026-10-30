# Landing page

The public landing page, ported from the Rummanah site (repo `Mohammed123-najeh/MH_Ecommerces`, commit
`3f6ae5521`, `super-admin/app`). It is a standalone Next.js 15.5 App Router app (React 19.0). It has no
database, no CMS and no AI assistant. The brand is still Rummanah: nothing has been rebranded yet.

## Run

```bash
cd landing
npm install
npm run dev        # http://localhost:3100  (3000 is often taken by other local projects)
npm test           # the 8 ported unit-test files (Vitest)
npm run typecheck
npm run build && npm start   # production, http://localhost:3100
```

Set `SITE_URL` (see `.env.example`) for the canonical URL, Open Graph and JSON-LD.
The default is `https://rummanah.dev`.

On Windows under OneDrive, `npm run dev` first runs `scripts/ensure-next-dir.mjs`. That script turns `.next` into
a junction under `%LOCALAPPDATA%\next-build-cache\supporting-center-landing`, so OneDrive never locks build files.

## Routes

| URL | Page | Source of the content |
|---|---|---|
| `/` | landing home | `getPublicContent()` |
| `/ai-solutions` | AI solutions detail | `loadAiSolutionsFull()` |
| `/electronic-payment` | payment story + features | `loadPaymentFeatures()` |
| `/contact` | contact page + form | `getSettings()` |
| `/offers/<slug>` | offer detail (branded 404 for unknown slugs) | `loadOfferBySlug()` |
| `POST /api/public/contact` | contact-form **stub**: validates and returns 200, stores and sends nothing | |

The pages keep the source's file layout under `src/app/(site)/landing/`. The rewrites in `next.config.mjs` map the
public URLs onto that layout, which the source's middleware used to do.

## Where things live

- `src/content/site-content.ts` holds **all editable content** (settings, team, packages, clients, offers, payment
  features, AI solutions), typed as `SiteContent` from `src/server/site/types.ts`. A CMS or API can replace it
  later: swap the bodies of its async accessors.
- `src/app/(site)/landing/_sections/` holds the section components. `site-css.ts` is the scoped `.rmn` stylesheet,
  and the colocated `.css` files sit next to their sections.
- `src/app/(site)/layout.tsx` loads the Reem Kufi and Tajawal fonts and injects the site CSS.
- `src/app/layout.tsx` is the `<html>` shell with the pre-paint theme/language script and the scroll-restore script.
- `src/app/_ui/` holds the language (cookie `mz_sa_lang`) and theme (`mz_sa_theme`, dark by default) providers.
- `src/app/globals.css` holds the document base: Tailwind v3 preflight vendored as plain CSS, plus the page
  background. The landing was designed on top of that reset.

## Placeholder images (replace before launch)

All of these are under `public/media/` and labelled "PLACEHOLDER". Keep the file names, or change the paths in
`site-content.ts`.

- `team/heba-snuber.jpg`, `team/mohammed-zidan.jpg`, `team/sara-nassar.jpg` (square photos)
- `clients/<key>-logo.png`, for `lumora`, `anaqa`, `bait-al-bun` and `nuqta`
- `clients/<key>-desktop.jpg` (1440×900) and `clients/<key>-mobile.jpg` (390×844). These are the device
  screenshots that turn on the clients showcase.
- `og/og-image.jpg` (1200×630), the Open Graph image

Offers have no media, as in the source seed, so the services showcase draws its built-in CSS mockups.

## Rebrand checklist (brand values)

- **Content:** `src/content/site-content.ts` holds the emails (`hello@`, `support@`, `info@rummanah.dev`),
  WhatsApp `+972 594312411`, SEO titles and descriptions, team, packages (USD), client names and offers.
- **Company copy:** `_sections/site-copy.ts` holds the hero line, the Dubai location and address, the About story
  and founders, the facts and the CTA.
- **Inline copy:** these files still name Rummanah:
  - the `T` objects in `_sections/landing-page.tsx`: hero title, `RUMMANAH TECH`, intro word mark, footer rights;
  - `ai-chapter/chat-script.ts` and `rag-script.ts`;
  - `pay-duo/*`;
  - the sub-page section files.
  - `grep -ri "rummanah\|رمّانة"` lists every occurrence.
- **SEO:** `landing/page.tsx` (default title/description, Organization JSON-LD), the sub-page `page.tsx` titles,
  root `layout.tsx` metadata, and `SITE_URL` in `src/config/site.ts`.
- **Colors:** the CSS variables at the top of `_sections/site-css.ts`:
  - light: `--cream #FDF4ED`, `--red #A6222C`, `--red-deep #7E161F`, `--olive #4C4C29`,
    `--olive-soft #6E6E44`, `--pink #E98C98`, `--ink #3A2E24`;
  - the dark overrides below them;
  - `--bg`/`--fg` in `globals.css`;
  - `themeColor` in `layout.tsx` and `META_COLOR` in `_ui/theme.tsx`.
- **Logo:**
  - `public/Rummanh_logo.png` (hero medallion, JSON-LD logo);
  - the inline pomegranate SVG in `_sections/brand-mark.tsx` (nav, intro, footer);
  - `src/app/icon.svg` (favicon).
- **Payments:** the "Powered by Stripe" badges (`public/powered-by-stripe-*.svg`) and the Stripe naming in the
  payment copy are kept as in the source.
