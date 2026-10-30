// Shared content shapes for the public landing site + its CMS. These are the
// row shapes as the loaders return them (already parsed from JSONB). Kept free
// of server-only imports so the public (site) components AND the CMS preview can
// both import them.

export type Bilingual = { ar: string; en: string }

export type ServiceItem = {
  icon: string
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
}

export type FooterLink = { label_ar: string; label_en: string; url: string }

export type SiteSettings = {
  hero: {
    title_ar: string
    title_en: string
    subtitle_ar: string
    subtitle_en: string
    cta_label_ar: string
    cta_label_en: string
    cta_url: string
  }
  tagline: { ar: string; en: string }
  services: ServiceItem[]
  contact: {
    // Legacy single email — kept for back-compat (older CMS payloads + the fallback
    // used by offer/checkout CTAs). New surfaces prefer email_support / email_info.
    email: string
    // The two company inboxes surfaced on the Contact section/page + used to route
    // the contact-form notification (support topics → support, else → info).
    email_support: string
    email_info: string
    phone: string
    whatsapp: string
    address_ar: string
    address_en: string
  }
  footer: { note_ar: string; note_en: string; links: FooterLink[] }
  seo: {
    title_ar: string
    title_en: string
    description_ar: string
    description_en: string
    og_image: string
  }
  showcase: ShowcaseSettings
  layout: SiteLayout
  checkout: CheckoutSettings
  packages: PackagesHeading
}

export type TeamMember = {
  id: string
  name_ar: string
  name_en: string
  role_ar: string
  role_en: string
  bio_ar: string
  bio_en: string
  image_path: string | null
  // Founders spotlight: featured members render as large stitched-thread
  // entries with an optional pull-quote; the rest show in the compact strip.
  is_featured: boolean
  quote_ar: string
  quote_en: string
  sort_index: number
  is_active: boolean
}

export type PricingFeature = { ar: string; en: string }

export type BillingPeriod = "monthly" | "yearly" | "one_time"

export type PricingPackage = {
  id: string
  name_ar: string
  name_en: string
  price_amount: number | null
  price_currency: string
  billing_period: BillingPeriod
  features: PricingFeature[]
  highlighted: boolean
  cta_label_ar: string
  cta_label_en: string
  cta_url: string
  sort_index: number
  is_active: boolean
}

export type LogoShape = "circle" | "rounded" | "square" | "rectangle"
export type LogoFit = "contain" | "cover"

export type SiteClient = {
  id: string
  name_ar: string
  name_en: string
  logo_path: string | null
  logo_shape: LogoShape
  logo_fit: LogoFit
  // Legacy single screenshots — kept for back-compat; mirrored to array[0] on
  // write. New code reads the arrays below.
  desktop_image_path: string | null
  mobile_image_path: string | null
  // Multi-image device showcase: the landing cycles both arrays in sync.
  desktop_images: string[]
  mobile_images: string[]
  href: string
  sort_index: number
  is_active: boolean
}

// ── Showcase carousel config (site_settings.showcase) ──
export type ShowcaseAnimation = "fade" | "slide" | "pan"

export type ShowcaseSettings = {
  interval_ms: number
  animation: ShowcaseAnimation
}

export const SHOWCASE_LIMITS = { min: 2000, max: 20000 } as const
export const SHOWCASE_DEFAULTS: ShowcaseSettings = { interval_ms: 5200, animation: "fade" }

const SHOWCASE_ANIMATIONS: readonly ShowcaseAnimation[] = ["fade", "slide", "pan"]

// Defensive read-side coercion: any junk in the JSONB blob yields a complete,
// clamped config (strict write-side validation lives in validate.ts).
export function normalizeShowcase(v: unknown): ShowcaseSettings {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const rawMs = typeof o.interval_ms === "number" && Number.isFinite(o.interval_ms)
    ? Math.round(o.interval_ms)
    : SHOWCASE_DEFAULTS.interval_ms
  const interval_ms = Math.min(SHOWCASE_LIMITS.max, Math.max(SHOWCASE_LIMITS.min, rawMs))
  const animation = SHOWCASE_ANIMATIONS.includes(o.animation as ShowcaseAnimation)
    ? (o.animation as ShowcaseAnimation)
    : SHOWCASE_DEFAULTS.animation
  return { interval_ms, animation }
}

// ── Electronic-payment cinematic section (site_settings.checkout) ──
// The section is a fixed 6-scene scroll animation; only the copy on the rail
// beside each scene is operator-editable. The scene NUMBER is the array index
// (index + 1), so it is not stored. Exactly 6 stages — read-side coercion pads
// or truncates to CHECKOUT_STAGE_COUNT so the render never indexes out of range.
export const CHECKOUT_STAGE_COUNT = 6

export type CheckoutStage = {
  title_ar: string
  title_en: string
  desc_ar: string
  desc_en: string
}

export type CheckoutSettings = { stages: CheckoutStage[] }

const EMPTY_STAGE: CheckoutStage = { title_ar: "", title_en: "", desc_ar: "", desc_en: "" }

// Default rail copy — mirrors the six scenes of the cinematic (order → lift →
// auto-fill → phone → confirm → success), themed for Rummanah's payment service.
// Kept in sync with the one-time backfill in drizzle/0016_site_checkout.sql.
export const DEFAULT_CHECKOUT_STAGES: readonly CheckoutStage[] = [
  { title_ar: "طلبك جاهز", title_en: "Your order, ready", desc_ar: "منتجك على جهة، ولوحة دفع آمنة على الجهة الأخرى — كل شيء في مكانه.", desc_en: "Your product on one side, a secure payment panel on the other — everything in place." },
  { title_ar: "المنتج ينزوي", title_en: "Product steps aside", desc_ar: "يرتفع ملخّص الطلب بلطف لتتصدّر بطاقة الدفع المشهد.", desc_en: "The order summary lifts away so the payment card takes center stage." },
  { title_ar: "يملأ نفسه", title_en: "It fills itself", desc_ar: "تُكمَل بيانات الشحن والبطاقة لحظيًا — ويُكتشف نوع البطاقة أثناء الكتابة.", desc_en: "Shipping and card details complete in real time — the brand detected as you type." },
  { title_ar: "ننتقل إلى هاتفك", title_en: "Over to your phone", desc_ar: "تتراجع البطاقة ويصعد الـiPhone مطويًا، ثم ينفتح ليتولّى إتمام الدفع.", desc_en: "The form eases back as the iPhone rises, folded — then unfolds to take over the payment." },
  { title_ar: "تأكيد بلمسة", title_en: "Confirm with a touch", desc_ar: "يُصادَق على الدفع بلمسة Touch ID واحدة — دون نماذج ولا إعادة تحميل.", desc_en: "Touch ID authorizes the payment in one touch — no forms, no reload." },
  { title_ar: "تم الدفع بنجاح", title_en: "Payment successful", desc_ar: "يُطوى الجهاز وتعود الصفحة مكتملةً مع إيصال فوري لعميلك.", desc_en: "The phone folds shut and the checkout returns, complete, with an instant receipt." },
]

export const CHECKOUT_DEFAULTS: CheckoutSettings = {
  stages: DEFAULT_CHECKOUT_STAGES.map((s) => ({ ...s })),
}

// Defensive read-side coercion: any junk in the JSONB blob yields EXACTLY
// CHECKOUT_STAGE_COUNT complete stages. Empty/missing stages fall back to the
// matching default (never an all-blank rail); extras are dropped. Strict
// write-side validation lives in validate.ts.
export function normalizeCheckout(v: unknown): CheckoutSettings {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const raw = Array.isArray(o.stages) ? o.stages : []
  const str = (x: unknown): string => (typeof x === "string" ? x : "")
  const stages: CheckoutStage[] = []
  for (let i = 0; i < CHECKOUT_STAGE_COUNT; i++) {
    const src = raw[i]
    const s = src && typeof src === "object" && !Array.isArray(src) ? (src as Record<string, unknown>) : {}
    const def = DEFAULT_CHECKOUT_STAGES[i] ?? EMPTY_STAGE
    const stage: CheckoutStage = {
      title_ar: str(s.title_ar), title_en: str(s.title_en),
      desc_ar: str(s.desc_ar), desc_en: str(s.desc_en),
    }
    // A wholly-empty stage falls back to its default so the rail is never blank.
    const empty = !stage.title_ar && !stage.title_en && !stage.desc_ar && !stage.desc_en
    stages.push(empty ? { ...def } : stage)
  }
  return { stages }
}

// ── Packages section heading (site_settings.packages) ──
// The eyebrow / title / lead / bottom-note shown above the pricing cards, all
// bilingual and operator-editable from the CMS Packages tab. The pricing CARDS
// themselves live in the site_pricing_package table (edited in the same tab); this
// is ONLY the surrounding section copy. Empty fields fall back to the landing's
// built-in defaults at RENDER time (see packages.tsx `DEF`), so the stored blob may
// legitimately hold empty strings meaning "use the default".
export type PackagesHeading = {
  eyebrow_ar: string
  eyebrow_en: string
  title_ar: string
  title_en: string
  lead_ar: string
  lead_en: string
  note_ar: string
  note_en: string
}

// All-empty default: every field blank ⇒ the section renders its built-in copy.
export const PACKAGES_HEADING_DEFAULTS: PackagesHeading = {
  eyebrow_ar: "", eyebrow_en: "", title_ar: "", title_en: "",
  lead_ar: "", lead_en: "", note_ar: "", note_en: "",
}

// Defensive read-side coercion: any junk in the JSONB blob yields a complete,
// all-string heading (strict write-side validation lives in validate.ts).
export function normalizePackagesHeading(v: unknown): PackagesHeading {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const str = (x: unknown): string => (typeof x === "string" ? x : "")
  return {
    eyebrow_ar: str(o.eyebrow_ar), eyebrow_en: str(o.eyebrow_en),
    title_ar: str(o.title_ar), title_en: str(o.title_en),
    lead_ar: str(o.lead_ar), lead_en: str(o.lead_en),
    note_ar: str(o.note_ar), note_en: str(o.note_en),
  }
}

// ── "What we offer" (site_offer) ──
export type OfferMediaKind = "image" | "video"
export type OfferMedia = { path: string; kind: OfferMediaKind; poster?: string | null }
// A bilingual bullet point shown inside the offer's bento card (sub-features).
export type OfferPoint = { ar: string; en: string }

// A single RGB colour (0-255 ints) and the 3-colour palette that drives the
// morphing blob backdrop of the desktop scrollytelling variant. `null` ⇒ auto
// (derive a palette from the offer's `visual`).
export type RGB = [number, number, number]
export type OfferPalette = [RGB, RGB, RGB]

// The built-in CSS "mockup" shown on the scrolly stage when an offer has no
// uploaded media. "auto" derives one deterministically from the offer's order.
export const OFFER_VISUALS = [
  "auto", "dashboard", "store", "payments", "marketing", "speed", "security",
] as const
export type OfferVisual = (typeof OFFER_VISUALS)[number]

export type SiteOffer = {
  id: string
  slug: string
  name_ar: string
  name_en: string
  summary_ar: string
  summary_en: string
  body_ar: string
  body_en: string
  icon: string
  // Short category label above the title on the scrolly steps (e.g. الواجهة).
  eyebrow_ar: string
  eyebrow_en: string
  media: OfferMedia[]
  points: OfferPoint[]
  // Scrolly-only: the morphing-blob palette (null ⇒ auto) and the stage fallback
  // visual (used only when the offer has no media).
  palette: OfferPalette | null
  visual: OfferVisual
  sort_index: number
  is_active: boolean
}

// ── Electronic-payment FEATURES (site_payment_feature) ──
// The individual capabilities of the payment service (Stripe),
// shown as a scroll-thread timeline in the electronic-payment section and listed
// in the "Payments" nav mega-dropdown. Operator-managed like offers: add / edit /
// reorder / toggle. `icon_key` picks a curated inline SVG; `icon` is an optional
// free-text emoji fallback (renders when no key is set), mirroring the offers icon.
export const PAYMENT_FEATURE_ICONS = [
  "globe", "link", "repeat", "card", "cards", "currency",
  "plug", "device", "pos", "shield",
] as const
export type PaymentFeatureIcon = (typeof PAYMENT_FEATURE_ICONS)[number]

export type PaymentFeature = {
  id: string
  slug: string // deep-link anchor: #pay-feat-<slug>
  icon_key: PaymentFeatureIcon | "" // "" ⇒ use the emoji `icon` (or a default)
  icon: string // optional emoji fallback
  title_ar: string
  title_en: string
  summary_ar: string
  summary_en: string
  body_ar: string
  body_en: string
  sort_index: number
  is_active: boolean
}

// The 10 default payment features (AR authored by the operator, EN translated).
// Backfilled once by drizzle/0017; operators can then edit/reorder/remove them.
export const DEFAULT_PAYMENT_FEATURES: ReadonlyArray<
  Omit<PaymentFeature, "id" | "sort_index" | "is_active">
> = [
  {
    slug: "online-payment", icon_key: "globe", icon: "🌐",
    title_ar: "دفع إلكتروني متكامل", title_en: "Complete electronic payment",
    summary_ar: "استقبل مدفوعات عملائك بسهولة وأمان من موقعك أو تطبيقك.",
    summary_en: "Accept your customers' payments easily and securely from your website or app.",
    body_ar: "تمكّن التاجر من استقبال المدفوعات مباشرة من الموقع الإلكتروني أو تطبيق الموبايل، من خلال صفحة دفع آمنة أو نافذة دفع داخل الموقع. تدعم Stripe الدمج عبر صفحة الدفع الجاهزة ونماذج الدفع المضمّنة وحزم تطبيقات الموبايل.",
    body_en: "Receive payments directly from your website or mobile app through a secure payment page or an in-site checkout window. Stripe supports hosted Checkout, embedded payment forms, and mobile SDKs.",
  },
  {
    slug: "payment-links", icon_key: "link", icon: "🔗",
    title_ar: "روابط دفع جاهزة", title_en: "Ready-made payment links",
    summary_ar: "أنشئ رابط دفع وشاركه مع عملائك عبر واتساب أو منصات التواصل واستقبل أموالك بسهولة.",
    summary_en: "Create a payment link and share it via WhatsApp or social platforms — get paid with no website needed.",
    body_ar: "إنشاء رابط دفع جاهز وإرساله للعميل عبر واتساب، إنستغرام، البريد الإلكتروني أو الرسائل، دون الحاجة إلى امتلاك موقع إلكتروني.",
    body_en: "Generate a ready-made payment link and send it to the customer via WhatsApp, Instagram, email, or SMS — no website required.",
  },
  {
    slug: "subscriptions", icon_key: "repeat", icon: "🔁",
    title_ar: "اشتراكات ومدفوعات متكررة", title_en: "Subscriptions & recurring payments",
    summary_ar: "فعّل الاشتراكات الشهرية والسنوية وجدّد خدمات عملائك تلقائيًا.",
    summary_en: "Enable monthly and yearly subscriptions and auto-renew your customers' services.",
    body_ar: "تدعم Stripe الخصم المتكرر باستخدام تفويض البطاقة، ما يسمح ببناء اشتراكات شهرية أو سنوية وتجديد الخدمات تلقائيًا. يمكن كذلك إظهار البطاقة المحفوظة للعميل بطريقة مثل: «Visa تنتهي بـ1234».",
    body_en: "Stripe supports recurring charges via card authorization, so you can build monthly or yearly subscriptions and renew services automatically. Saved cards can be shown to the customer as, e.g., \"Visa ending 1234\".",
  },
  {
    slug: "save-card", icon_key: "card", icon: "💳",
    title_ar: "دفع أسرع للعملاء المتكررين", title_en: "Faster pay for returning customers",
    summary_ar: "اسمح لعملائك باستخدام بطاقاتهم السابقة وإتمام الدفع بخطوات أقل.",
    summary_en: "Let customers reuse their saved card and check out in fewer steps.",
    body_ar: "يمكن للعميل استخدام بطاقته السابقة في عمليات الدفع القادمة دون إعادة إدخال كامل معلوماتها، من خلال رمز تفويض آمن بدل تخزين بيانات البطاقة الحساسة داخل نظامك.",
    body_en: "Customers can reuse a previous card on future payments without re-entering its full details — via a secure authorization token instead of storing sensitive card data in your system.",
  },
  {
    slug: "local-global-cards", icon_key: "cards", icon: "🏳️",
    title_ar: "قبول البطاقات محليًا ودوليًا", title_en: "Accept cards locally & globally",
    summary_ar: "استقبل المدفوعات من بطاقات Visa وMastercard المحلية والعالمية.",
    summary_en: "Accept payments from local and international Visa & Mastercard.",
    body_ar: "تقبل Stripe بطاقات Visa وMastercard وAmerican Express المحلية والدولية، إلى جانب Apple Pay وGoogle Pay، ما يسمح لك باستقبال المدفوعات من العملاء داخل الإمارات وحول العالم.",
    body_en: "Stripe accepts local and international Visa, Mastercard and American Express — plus Apple Pay and Google Pay — so you can receive payments from customers across the UAE and worldwide.",
  },
  {
    slug: "multi-currency", icon_key: "currency", icon: "💱",
    title_ar: "دعم العملات المتعددة", title_en: "Multi-currency support",
    summary_ar: "وسّع نطاق أعمالك واستقبل مدفوعات عملائك بأكثر من عملة.",
    summary_en: "Grow your reach and accept payments in more than one currency.",
    body_ar: "تتيح البوابة استقبال المدفوعات بأكثر من عملة، وهي ميزة مهمة للشركات التي تتعامل مع عملاء داخل الإمارات وحول العالم.",
    body_en: "The gateway can receive payments in multiple currencies — important for businesses dealing with customers across the UAE and worldwide.",
  },
  {
    slug: "store-integration", icon_key: "plug", icon: "🧩",
    title_ar: "تكامل مع متجرك الإلكتروني", title_en: "Integrate with your online store",
    summary_ar: "اربط بوابة الدفع بسهولة مع متجرك أو نظامك الإلكتروني.",
    summary_en: "Connect the payment gateway to your store or system.",
    body_ar: "توفر Stripe إمكانية الربط مع منصات التجارة الإلكترونية المعروفة، ومنها WooCommerce وMagento وOpenCart، بالإضافة إلى الربط المخصص عبر الـAPI.",
    body_en: "Stripe supports integration with well-known e-commerce platforms — WooCommerce, Magento, OpenCart — plus custom integration via the API.",
  },
  {
    slug: "web-mobile", icon_key: "device", icon: "📱",
    title_ar: "متوافقة مع الويب والموبايل", title_en: "Web & mobile ready",
    summary_ar: "تجربة دفع سلسة على المواقع وتطبيقات Android وiOS.",
    summary_en: "A smooth payment experience on the web and on Android & iOS apps.",
    body_ar: "توفر Stripe طرق تكامل مخصصة لتطبيقات Android وiOS، إضافة إلى تطبيقات React وVue والـMobile WebView.",
    body_en: "Stripe provides dedicated integration paths for Android and iOS apps, as well as React, Vue, and Mobile WebView apps.",
  },
  {
    slug: "pos", icon_key: "pos", icon: "🏧",
    title_ar: "ربط مع نقاط البيع", title_en: "Connect with POS devices",
    summary_ar: "اربط نظام الكاشير أو التطبيق مع أجهزة الدفع لتوحيد تجربة الدفع داخل المتجر.",
    summary_en: "Link your cashier system or app to payment terminals for one unified in-store experience.",
    body_ar: "يوجد تكامل مع أجهزة نقاط البيع (POS)، بحيث تبدأ عملية الدفع من نظام الكاشير أو التطبيق، ثم يكمل العميل الدفع على جهاز الـPOS. ميزة قوية للمطاعم والمحلات ونقاط البيع الفعلية.",
    body_en: "Integrates with point-of-sale terminals: the payment starts from your cashier system or app, then the customer completes it on the POS device. A strong fit for restaurants, shops, and physical points of sale.",
  },
  {
    slug: "3d-secure", icon_key: "shield", icon: "🛡️",
    title_ar: "دفع آمن ومحمي", title_en: "Secure & protected payments",
    summary_ar: "معاملات محمية بتقنية 3D Secure ومعايير أمان موثوقة.",
    summary_en: "Transactions protected by 3D Secure and trusted security standards.",
    body_ar: "تستخدم Stripe تقنية 3D Secure لحماية عمليات Visa وMastercard وتقليل احتمالات استخدام البطاقة دون إذن صاحبها.",
    body_en: "Stripe uses 3D Secure to protect Visa and Mastercard transactions and reduce the risk of unauthorized card use.",
  },
]

// Defensive coercion for the media JSONB: keep only entries with a usable
// path; kind is "video" only when it says so; poster kept when non-empty.
export function normalizeOfferMedia(v: unknown): OfferMedia[] {
  if (!Array.isArray(v)) return []
  const out: OfferMedia[] = []
  for (const item of v.slice(0, 10)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    if (typeof o.path !== "string" || o.path.length === 0 || o.path.length > 200) continue
    out.push({
      path: o.path,
      kind: o.kind === "video" ? "video" : "image",
      poster: typeof o.poster === "string" && o.poster.length > 0 ? o.poster : null,
    })
  }
  return out
}

// Defensive coercion for the points JSONB: keep only entries with at least one
// non-empty side (ar or en); cap the list + each string length.
export function normalizeOfferPoints(v: unknown): OfferPoint[] {
  if (!Array.isArray(v)) return []
  const out: OfferPoint[] = []
  for (const item of v.slice(0, 8)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue
    const o = item as Record<string, unknown>
    const ar = typeof o.ar === "string" ? o.ar.slice(0, 160) : ""
    const en = typeof o.en === "string" ? o.en.slice(0, 160) : ""
    if (!ar && !en) continue
    out.push({ ar, en })
  }
  return out
}

// Defensive coercion for the palette JSONB: must be EXACTLY 3 RGB triplets or it
// degrades to null (auto). Each channel is coerced to an int clamped to 0-255;
// anything that isn't a finite number invalidates the whole palette (never
// interpolate a malformed colour).
export function normalizeOfferPalette(v: unknown): OfferPalette | null {
  if (!Array.isArray(v) || v.length !== 3) return null
  const out: RGB[] = []
  for (const triple of v) {
    if (!Array.isArray(triple) || triple.length !== 3) return null
    const rgb: number[] = []
    for (const ch of triple) {
      if (typeof ch !== "number" || !Number.isFinite(ch)) return null
      rgb.push(Math.min(255, Math.max(0, Math.round(ch))))
    }
    out.push(rgb as RGB)
  }
  return out as OfferPalette
}

// Defensive coercion for the visual column: whitelist or fall back to "auto".
export function normalizeOfferVisual(v: unknown): OfferVisual {
  return typeof v === "string" && (OFFER_VISUALS as readonly string[]).includes(v)
    ? (v as OfferVisual)
    : "auto"
}

// Defensive coercion for the payment-feature icon key: whitelist or "" (which
// tells the UI to fall back to the emoji `icon`, then a generic default).
export function normalizePaymentFeatureIcon(v: unknown): PaymentFeatureIcon | "" {
  return typeof v === "string" && (PAYMENT_FEATURE_ICONS as readonly string[]).includes(v)
    ? (v as PaymentFeatureIcon)
    : ""
}

// ── AI Solutions (site_ai_solution) ──
// The company's suite of AI/RAG solutions, shown as a compact teaser on the home
// page + a full scroll-thread on the standalone /ai-solutions page, and listed in
// the "AI Solutions" nav mega-dropdown. Operator-managed like payment features:
// add / edit / reorder / toggle. Each solution is RICHER than a payment feature —
// besides the shared body_* intro it carries two structured jsonb extras:
//   • `sections`: ordered capability lists (one or two groups, each an optional
//     bilingual heading + a list of bilingual bullets), and
//   • `example`: a nullable illustrative Q&A (kind:"qa") OR numbered workflow
//     (kind:"steps"), shown as a chat bubble / step list on the details page.
// `icon_key` picks a curated inline SVG; `icon` is an optional emoji fallback,
// exactly like the payment-feature icon.
export const AI_SOLUTION_ICONS = [
  "chat", "knowledge", "search", "document", "support", "sales",
  "recommend", "agent", "analytics", "platform", "shield", "integrate",
] as const
export type AiSolutionIcon = (typeof AI_SOLUTION_ICONS)[number]

// One capability group inside a solution: an optional bilingual heading followed
// by a list of bilingual bullets (e.g. "Use cases include" → 6 bullets).
export type AiSolutionSection = {
  heading_ar: string
  heading_en: string
  items: Bilingual[]
}

// An illustrative example on the details page. Two shapes:
//   • "qa"    → a single question + answer, rendered as a chat exchange.
//   • "steps" → an optional intro line + a numbered workflow (the AI-agents case).
export type AiSolutionExample =
  | { kind: "qa"; q_ar: string; q_en: string; a_ar: string; a_en: string }
  | { kind: "steps"; intro_ar: string; intro_en: string; steps: Bilingual[] }

// SLIM shape — what the dropdown/teaser/landing payload carries (no body/sections/
// example, so the public payload stays light). The details route loads the FULL
// shape below.
export type AiSolution = {
  id: string
  slug: string // deep-link anchor: #ai-<slug>
  icon_key: AiSolutionIcon | "" // "" ⇒ use the emoji `icon` (or a default)
  icon: string // optional emoji fallback
  title_ar: string
  title_en: string
  summary_ar: string
  summary_en: string
  sort_index: number
  is_active: boolean
}

// FULL shape — the details page adds the intro body + structured extras.
export type AiSolutionFull = AiSolution & {
  body_ar: string
  body_en: string
  sections: AiSolutionSection[]
  example: AiSolutionExample | null
}

// The 12 default solutions (AR authored by the operator, EN translated).
// Backfilled once by drizzle/0019; operators can then edit/reorder/remove them.
// Kept in sync with the in-migration seed AND AI-SOLUTIONS-CONTENT.md.
export const DEFAULT_AI_SOLUTIONS: ReadonlyArray<
  Omit<AiSolutionFull, "id" | "sort_index" | "is_active">
> = [
  {
    slug: "chatbots", icon_key: "chat", icon: "💬",
    title_ar: "المساعدات الذكية وروبوتات المحادثة", title_en: "AI Chatbots & Virtual Assistants",
    summary_ar: "مساعدون أذكياء يجيبون عن أسئلة العملاء والموظفين اعتماداً على مصادر المعرفة المعتمدة داخل مؤسستك.",
    summary_en: "Intelligent assistants that answer customer and employee questions using your organization's approved knowledge sources.",
    body_ar: "نطوّر مساعدين ذكيين يفهمون طبيعة عمل الشركة ويجيبون عن أسئلة العملاء أو الموظفين بالاعتماد على مصادر المعرفة المعتمدة داخل المؤسسة.",
    body_en: "We build intelligent assistants that understand your business and respond to customers or employees using your organization's approved knowledge sources.",
    sections: [{
      heading_ar: "يمكن استخدامها في", heading_en: "Use cases include", items: [
        { ar: "خدمة العملاء على مدار الساعة", en: "24/7 customer assistance" },
        { ar: "الإجابة عن الأسئلة المتكررة", en: "Frequently asked questions" },
        { ar: "شرح المنتجات والخدمات", en: "Product and service guidance" },
        { ar: "مساعدة الموظفين في الوصول إلى المعلومات", en: "Internal employee support" },
        { ar: "توجيه المستخدم إلى الخطوة أو الإجراء المناسب", en: "User onboarding and navigation" },
        { ar: "تقديم الإجابات مع الإشارة إلى مصدر المعلومات", en: "Source-backed responses" },
      ],
    }],
    example: {
      kind: "qa",
      q_ar: "ما شروط الضمان الخاصة بهذا المنتج؟", q_en: "What are the warranty conditions for this product?",
      a_ar: "يقوم المساعد بالبحث داخل سياسات الشركة ومستنداتها، ثم يقدّم إجابة واضحة مبنية على المصدر المناسب.",
      a_en: "The assistant searches the company's approved documentation and returns a clear answer based on the relevant source.",
    },
  },
  {
    slug: "knowledge-systems", icon_key: "knowledge", icon: "📚",
    title_ar: "أنظمة المعرفة المؤسسية", title_en: "Enterprise Knowledge Systems",
    summary_ar: "حوّل مستندات وبيانات شركتك إلى قاعدة معرفة ذكية يتفاعل معها الموظفون بلغة طبيعية.",
    summary_en: "Turn your documents and data into an interactive AI knowledge system employees query in natural language.",
    body_ar: "نحوّل بيانات الشركة ومستنداتها إلى قاعدة معرفة ذكية يستطيع الموظفون التفاعل معها بلغة طبيعية. بدلاً من البحث لساعات داخل الملفات والمجلدات، يستطيع الموظف طرح سؤال مباشر ويحصل على الإجابة مع مصدرها.",
    body_en: "We transform company documents and data into an interactive AI knowledge system employees access in natural language. Instead of spending hours searching folders, an employee just asks a question and gets the answer with its source.",
    sections: [{
      heading_ar: "يمكن للنظام الاتصال مع", heading_en: "The system can connect to", items: [
        { ar: "ملفات PDF وWord", en: "PDF and Word documents" },
        { ar: "السياسات والإجراءات الداخلية", en: "Internal policies and procedures" },
        { ar: "قواعد البيانات", en: "Databases" },
        { ar: "صفحات المواقع", en: "Websites" },
        { ar: "أنظمة إدارة الشركات", en: "Business management systems" },
        { ar: "ملفات المشاريع والتقارير", en: "Project files and reports" },
        { ar: "الأدلة الفنية ومراكز المساعدة", en: "Technical documentation & help centers" },
      ],
    }],
    example: {
      kind: "qa",
      q_ar: "ما أحدث سياسة معتمدة للإجازات السنوية؟", q_en: "What is the latest approved annual leave policy?",
      a_ar: "يبحث النظام داخل الوثائق المعتمدة ويعيد المعلومة المناسبة مع الإشارة إلى مصدرها.",
      a_en: "The system retrieves the relevant information from approved documents and provides the answer with its source.",
    },
  },
  {
    slug: "enterprise-search", icon_key: "search", icon: "🔎",
    title_ar: "البحث المؤسسي الذكي", title_en: "Intelligent Enterprise Search",
    summary_ar: "محركات بحث تفهم معنى السؤال وسياقه، وليس الكلمات المكتوبة فقط.",
    summary_en: "Search engines that understand the meaning and context of a question, not just the keywords.",
    body_ar: "نبني محركات بحث تفهم معنى السؤال وسياقه، وليس الكلمات المكتوبة فقط. يمكن للمستخدم البحث بطريقة طبيعية، ويقوم النظام بالبحث داخل الوثائق والسياسات والأنظمة المختلفة للوصول إلى المعلومة الأكثر ارتباطاً بالسؤال.",
    body_en: "We build intelligent search engines that understand the meaning and context behind a question, not only the exact keywords. A user searches naturally and the system looks across documents, policies, and business tools for the most relevant information.",
    sections: [{
      heading_ar: "الفوائد", heading_en: "Capabilities include", items: [
        { ar: "نتائج أكثر دقة", en: "More accurate results" },
        { ar: "فهم المرادفات والسياق", en: "Synonym & context understanding" },
        { ar: "البحث داخل مصادر متعددة", en: "Multi-source search" },
        { ar: "ترتيب النتائج حسب الصلة", en: "Relevance ranking" },
        { ar: "دعم البحث الهجين والدلالي", en: "Hybrid & semantic search" },
        { ar: "الوصول السريع إلى مصدر الإجابة", en: "Direct access to supporting sources" },
      ],
    }],
    example: {
      kind: "qa",
      q_ar: "كيف تتعامل الشركة مع حالات تأخر الشحن؟", q_en: "How does the company handle delayed shipments?",
      a_ar: "يبحث النظام داخل الوثائق والسياسات والأنظمة المختلفة ليعيد الإجابة الأكثر ارتباطاً بالسؤال ومصدرها.",
      a_en: "The system searches across connected documents, policies, and tools to return the most relevant answer and its source.",
    },
  },
  {
    slug: "document-intelligence", icon_key: "document", icon: "📄",
    title_ar: "ذكاء المستندات", title_en: "AI Document Intelligence",
    summary_ar: "أنظمة تقرأ المستندات، تفهم محتواها وتستخرج المعلومات المهمة منها.",
    summary_en: "Systems that read, understand, classify, and extract valuable information from your documents.",
    body_ar: "نطوّر أنظمة تستطيع قراءة المستندات، فهم محتواها واستخراج المعلومات المهمة منها.",
    body_en: "We build systems that can read, understand, classify, and extract valuable information from business documents.",
    sections: [{
      heading_ar: "الاستخدامات", heading_en: "Use cases include", items: [
        { ar: "تحليل العقود", en: "Contract analysis" },
        { ar: "تلخيص الملفات الطويلة", en: "Long-document summarization" },
        { ar: "استخراج البيانات من الفواتير والنماذج", en: "Invoice & form data extraction" },
        { ar: "مقارنة نسخ المستندات", en: "Document comparison" },
        { ar: "مراجعة التقارير", en: "Report review" },
        { ar: "اكتشاف البنود المهمة أو غير المعتادة", en: "Key clause identification" },
        { ar: "تصنيف الملفات وتنظيمها", en: "Document classification" },
        { ar: "الإجابة عن الأسئلة المتعلقة بالمستند", en: "Question answering across files" },
      ],
    }],
    example: {
      kind: "qa",
      q_ar: "ما الالتزامات الرئيسية الواردة في هذا العقد؟", q_en: "What are the main obligations defined in this agreement?",
      a_ar: "يحلل النظام محتوى العقد ويقدّم ملخصاً منظماً مع الإشارة إلى الأقسام المرتبطة بالإجابة.",
      a_en: "The system analyzes the document and returns an organized response linked to the relevant sections.",
    },
  },
  {
    slug: "support-automation", icon_key: "support", icon: "🎧",
    title_ar: "أتمتة خدمة العملاء", title_en: "AI Customer Support Automation",
    summary_ar: "أنظمة ذكاء اصطناعي تفهم طلب العميل وتصل إلى المعلومات المناسبة لتقليل ضغط الدعم.",
    summary_en: "AI systems that understand customer requests and retrieve the right information to reduce support workload.",
    body_ar: "نساعد الشركات على تقليل ضغط الدعم وتحسين سرعة الاستجابة من خلال أنظمة ذكاء اصطناعي قادرة على فهم طلب العميل والوصول إلى المعلومات المناسبة.",
    body_en: "We help organizations reduce support workload and improve response times through AI that understands customer requests and retrieves the correct business information.",
    sections: [
      {
        heading_ar: "القدرات", heading_en: "Capabilities include", items: [
          { ar: "فهم استفسارات العملاء", en: "Understanding customer questions" },
          { ar: "الإجابة بناءً على سياسات الشركة", en: "Answering based on company policies" },
          { ar: "البحث في المنتجات والخدمات", en: "Searching products and services" },
          { ar: "متابعة الطلبات والحالات", en: "Checking order or case information" },
          { ar: "اقتراح خطوات الحل", en: "Suggesting resolution steps" },
          { ar: "جمع المعلومات قبل تحويل المحادثة", en: "Collecting information before escalation" },
          { ar: "تصعيد الحالات المعقدة إلى الموظف المختص", en: "Escalating complex cases to human agents" },
          { ar: "إنشاء ملخص للمحادثة والطلب", en: "Generating conversation & case summaries" },
        ],
      },
      {
        heading_ar: "يمكن دمج النظام مع", heading_en: "The solution can integrate with", items: [
          { ar: "المواقع والمتاجر الإلكترونية", en: "Websites & e-commerce platforms" },
          { ar: "WhatsApp", en: "WhatsApp" },
          { ar: "البريد الإلكتروني", en: "Email" },
          { ar: "أنظمة CRM", en: "CRM systems" },
          { ar: "أنظمة الطلبات والتذاكر", en: "Ticketing systems" },
          { ar: "تطبيقات الهاتف", en: "Mobile applications" },
        ],
      },
    ],
    example: null,
  },
  {
    slug: "sales-assistant", icon_key: "sales", icon: "🤝",
    title_ar: "مساعد المبيعات الذكي", title_en: "AI Sales Assistant",
    summary_ar: "مساعدون يدعمون فرق المبيعات بالمعلومات والتوصيات اللازمة خلال دورة البيع.",
    summary_en: "Intelligent assistants that support sales teams with the information and recommendations they need.",
    body_ar: "نطوّر مساعدين يدعمون فرق المبيعات بالمعلومات والتوصيات اللازمة خلال دورة البيع، ما يساعدهم على تقليل الوقت الضائع في البحث والتركيز على بناء العلاقة مع العميل وإتمام الصفقة.",
    body_en: "We build assistants that support sales teams throughout the customer journey, so they spend less time searching and more time building relationships and closing deals.",
    sections: [{
      heading_ar: "يمكن للمساعد", heading_en: "The assistant can", items: [
        { ar: "البحث داخل كتالوج المنتجات", en: "Search product catalogs" },
        { ar: "اقتراح المنتج أو الخدمة المناسبة", en: "Recommend the right product or service" },
        { ar: "تلخيص محادثات العملاء", en: "Summarize customer conversations" },
        { ar: "تجهيز مسودات عروض الأسعار", en: "Prepare quotation drafts" },
        { ar: "استخراج متطلبات العميل", en: "Identify customer requirements" },
        { ar: "متابعة العملاء المحتملين", en: "Follow up with potential customers" },
        { ar: "اقتراح الخطوة التالية", en: "Suggest the next best action" },
        { ar: "الوصول السريع إلى معلومات الأسعار والمواصفات", en: "Retrieve pricing & specification info" },
      ],
    }],
    example: null,
  },
  {
    slug: "recommendations", icon_key: "recommend", icon: "✨",
    title_ar: "تجارب توصية ذكية", title_en: "Intelligent Recommendation Experiences",
    summary_ar: "أنظمة تقدّم اقتراحات أكثر ملاءمة لكل مستخدم اعتماداً على البيانات والسلوك.",
    summary_en: "Systems that present more relevant products, services, or content to each user.",
    body_ar: "نطوّر أنظمة تساعد الشركات على تقديم اقتراحات أكثر ملاءمة لكل مستخدم، اعتماداً على طبيعة المنتجات والبيانات المتاحة وسلوك المستخدم. يمكن دمج البحث الدلالي مع بيانات المنتجات والتفاعلات السابقة لبناء تجربة توصية أكثر دقة ووضوحاً.",
    body_en: "We build recommendation experiences that present more relevant products, services, or content to each user. Semantic understanding can be combined with catalog data, past interactions, and business rules for more accurate, transparent recommendations.",
    sections: [{
      heading_ar: "الاستخدامات", heading_en: "Use cases include", items: [
        { ar: "اقتراح المنتجات ذات الصلة", en: "Related product suggestions" },
        { ar: "عرض منتجات مشابهة", en: "Similar item discovery" },
        { ar: "اقتراح محتوى مناسب", en: "Personalized content recommendations" },
        { ar: "مساعدة العميل في اختيار الخدمة", en: "Guided product selection" },
        { ar: "تقديم توصيات بناءً على احتياجات المستخدم", en: "Context-aware suggestions" },
        { ar: "شرح سبب اقتراح منتج أو خدمة معينة", en: "Explanations of why an item was recommended" },
      ],
    }],
    example: null,
  },
  {
    slug: "ai-agents", icon_key: "agent", icon: "🤖",
    title_ar: "وكلاء الذكاء الاصطناعي وأتمتة العمليات", title_en: "AI Agents & Workflow Automation",
    summary_ar: "وكلاء لا يكتفون بالإجابة، بل يستخدمون الأدوات والأنظمة لتنفيذ خطوات ضمن صلاحيات واضحة.",
    summary_en: "Agents that go beyond answers to use approved tools and systems to complete defined tasks.",
    body_ar: "نبني وكلاء ذكاء اصطناعي لا يكتفون بتقديم الإجابات، بل يستطيعون استخدام الأدوات والأنظمة لتنفيذ خطوات محددة ضمن صلاحيات وقواعد واضحة.",
    body_en: "We build AI agents that go beyond answering questions and use approved tools, APIs, and business systems to complete defined tasks within clear rules and permissions.",
    sections: [{
      heading_ar: "يمكن للوكيل الذكي", heading_en: "AI agents can", items: [
        { ar: "قراءة الطلبات وتصنيفها", en: "Read and classify requests" },
        { ar: "إنشاء التقارير", en: "Generate reports" },
        { ar: "تحديث بيانات الأنظمة", en: "Update business systems" },
        { ar: "التواصل مع APIs", en: "Communicate with APIs" },
        { ar: "إرسال الإشعارات", en: "Send notifications" },
        { ar: "إنشاء تذاكر الدعم", en: "Create support tickets" },
        { ar: "التحقق من شروط العمليات", en: "Validate business conditions" },
        { ar: "تنفيذ إجراءات متعددة ضمن Workflow منظم", en: "Execute structured, multi-step workflows" },
        { ar: "تحويل العملية للموظف عند الحاجة إلى مراجعة بشرية", en: "Escalate cases for human review" },
      ],
    }],
    example: {
      kind: "steps",
      intro_ar: "عندما يطلب العميل إلغاء طلب، يستطيع الوكيل:", intro_en: "When a customer requests an order cancellation, the agent can:",
      steps: [
        { ar: "التحقق من رقم الطلب.", en: "Verify the order." },
        { ar: "قراءة سياسة الإلغاء.", en: "Retrieve the cancellation policy." },
        { ar: "التأكد من أهلية الطلب.", en: "Check whether the order is eligible." },
        { ar: "إرسال الإجراء إلى نظام المتجر.", en: "Send the action to the commerce system." },
        { ar: "تحديث حالة الطلب.", en: "Update the order status." },
        { ar: "إرسال تأكيد للعميل.", en: "Notify the customer." },
        { ar: "تحويل الحالة للموظف إذا كانت خارج الشروط المحددة.", en: "Escalate when it falls outside approved rules." },
      ],
    },
  },
  {
    slug: "data-analysis", icon_key: "analytics", icon: "📊",
    title_ar: "محلل البيانات الذكي", title_en: "AI Data Analysis Assistant",
    summary_ar: "نربط الذكاء الاصطناعي ببيانات وتقارير الشركة لفهم الأداء واتخاذ قرارات أفضل.",
    summary_en: "We connect AI with your data and reports to understand performance and make better decisions.",
    body_ar: "نربط الذكاء الاصطناعي ببيانات وتقارير الشركة لمساعدة الإدارة والموظفين على فهم الأداء واتخاذ قرارات أفضل. يقوم النظام بتحليل البيانات المتاحة، تلخيص النتائج وتقديم مؤشرات وتفسيرات قابلة للفهم.",
    body_en: "We connect AI with company data and reports to help teams understand performance and make better decisions. The system analyzes available data and presents understandable summaries, indicators, and explanations.",
    sections: [{
      heading_ar: "يمكن للمستخدم طرح أسئلة مثل", heading_en: "Users can ask questions such as", items: [
        { ar: "لماذا انخفضت المبيعات هذا الشهر؟", en: "Why did sales decrease this month?" },
        { ar: "ما المنتجات الأعلى نمواً؟", en: "Which products are growing the fastest?" },
        { ar: "ما أكثر المشكلات تكراراً في طلبات الدعم؟", en: "What are the most common support issues?" },
        { ar: "ما الفرق بين أداء الفروع؟", en: "How do our branches compare?" },
        { ar: "ما الاتجاهات التي يجب متابعتها؟", en: "Which trends require management attention?" },
      ],
    }],
    example: null,
  },
  {
    slug: "knowledge-platform", icon_key: "platform", icon: "🧠",
    title_ar: "منصة قاعدة معرفة كخدمة", title_en: "AI Knowledge Platform",
    summary_ar: "منصات تتيح للشركات إنشاء وإدارة مساعد الذكاء الاصطناعي الخاص بها من لوحة تحكم مركزية.",
    summary_en: "Platforms that let organizations create, manage, and deploy their own AI assistants from one dashboard.",
    body_ar: "نطوّر منصات تسمح للشركات بإنشاء وإدارة مساعد الذكاء الاصطناعي الخاص بها من خلال لوحة تحكم مركزية.",
    body_en: "We build platforms that allow organizations to create, manage, and deploy their own AI assistants from a centralized dashboard.",
    sections: [{
      heading_ar: "المميزات الممكنة", heading_en: "Potential platform capabilities include", items: [
        { ar: "رفع وإدارة الملفات", en: "File upload & management" },
        { ar: "إنشاء أكثر من قاعدة معرفة", en: "Multiple knowledge bases" },
        { ar: "مزامنة مصادر البيانات", en: "Data source synchronization" },
        { ar: "إدارة المستخدمين والفرق", en: "User & team management" },
        { ar: "التحكم بالصلاحيات", en: "Role-based access control" },
        { ar: "تخصيص هوية المساعد", en: "Assistant branding & customization" },
        { ar: "مراجعة المحادثات والمصادر", en: "Conversation & source review" },
        { ar: "تحليلات الاستخدام", en: "Usage analytics" },
        { ar: "التكامل عبر API", en: "API integration" },
        { ar: "دمج المساعد داخل الموقع أو التطبيق", en: "Website & application embedding" },
        { ar: "تحديث المعرفة وإعادة فهرستها", en: "Knowledge updates & re-indexing" },
      ],
    }],
    example: null,
  },
  {
    slug: "private-ai", icon_key: "shield", icon: "🔒",
    title_ar: "حلول ذكاء اصطناعي خاصة وآمنة", title_en: "Private & Secure AI Solutions",
    summary_ar: "حلول للشركات التي تحتاج مستوى أعلى من الخصوصية والتحكم بالبيانات.",
    summary_en: "Deployment options for organizations that require stronger data privacy, security, and control.",
    body_ar: "نقدّم حلولاً للشركات التي تحتاج إلى مستوى أعلى من الخصوصية والتحكم بالبيانات، مناسبة للمؤسسات والشركات الكبيرة والقطاعات التي تتعامل مع معلومات داخلية أو حساسة.",
    body_en: "We provide deployment options for organizations that require stronger data privacy, security, and control — suitable for enterprises and sectors that handle confidential or sensitive information.",
    sections: [{
      heading_ar: "تشمل الخيارات", heading_en: "Available capabilities can include", items: [
        { ar: "استضافة خاصة أو مخصصة", en: "Private or dedicated deployment" },
        { ar: "التحكم في مصادر البيانات", en: "Controlled data sources" },
        { ar: "فصل بيانات العملاء والمؤسسات", en: "Customer & tenant data isolation" },
        { ar: "صلاحيات حسب المستخدم أو القسم", en: "User- & department-level permissions" },
        { ar: "سجل للعمليات والاستخدام", en: "Audit & activity logs" },
        { ar: "التحكم في المستندات التي يستطيع كل مستخدم الوصول إليها", en: "Document-level access controls" },
        { ar: "سياسات للاحتفاظ بالبيانات", en: "Data retention policies" },
        { ar: "دمج النظام مع البنية الداخلية للشركة", en: "Integration with internal infrastructure" },
      ],
    }],
    example: null,
  },
  {
    slug: "integrations", icon_key: "integrate", icon: "🔌",
    title_ar: "دمج الذكاء الاصطناعي مع أنظمتك الحالية", title_en: "Custom AI Integrations",
    summary_ar: "نضيف طبقة ذكاء فوق أنظمتك الحالية دون إعادة بنائها.",
    summary_en: "We add an intelligent layer over your existing systems — no rebuild required.",
    body_ar: "ليس من الضروري إعادة بناء أنظمة شركتك لإضافة الذكاء الاصطناعي. نضيف طبقة ذكاء فوق الأنظمة الحالية لتصبح بيانات الشركة قابلة للبحث والفهم والاستخدام في تنفيذ العمليات.",
    body_en: "You don't need to rebuild your systems to introduce AI. We add an intelligent layer on top of your existing infrastructure, making company information searchable, understandable, and actionable.",
    sections: [{
      heading_ar: "نقوم بالدمج مع", heading_en: "We integrate our AI solutions with", items: [
        { ar: "أنظمة التجارة الإلكترونية", en: "E-commerce systems" },
        { ar: "CRM", en: "CRM platforms" },
        { ar: "ERP", en: "ERP systems" },
        { ar: "قواعد البيانات", en: "Databases" },
        { ar: "أنظمة إدارة المحتوى", en: "Content management systems" },
        { ar: "أنظمة الطلبات والدعم", en: "Order & support platforms" },
        { ar: "الأدوات الداخلية", en: "Internal business tools" },
        { ar: "الخدمات الخارجية وواجهات APIs", en: "External services & APIs" },
      ],
    }],
    example: null,
  },
]

// Defensive coercion for the AI-solution icon key: whitelist or "" (fall back to
// the emoji `icon`, then a generic default). Mirrors normalizePaymentFeatureIcon.
export function normalizeAiSolutionIcon(v: unknown): AiSolutionIcon | "" {
  return typeof v === "string" && (AI_SOLUTION_ICONS as readonly string[]).includes(v)
    ? (v as AiSolutionIcon)
    : ""
}

// Defensive coercion for the `sections` JSONB: keep at most 4 groups; per group
// keep an optional heading + up to 12 bilingual items (drop items empty on BOTH
// sides). A group with no usable items is dropped entirely. Mirrors the
// normalizeOfferPoints idiom (guard array → cap → per-field string coerce).
export function normalizeAiSections(v: unknown): AiSolutionSection[] {
  if (!Array.isArray(v)) return []
  const str = (x: unknown): string => (typeof x === "string" ? x : "")
  const out: AiSolutionSection[] = []
  for (const group of v.slice(0, 4)) {
    if (!group || typeof group !== "object" || Array.isArray(group)) continue
    const g = group as Record<string, unknown>
    const items: Bilingual[] = []
    const rawItems = Array.isArray(g.items) ? g.items : []
    for (const item of rawItems.slice(0, 12)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue
      const o = item as Record<string, unknown>
      const ar = str(o.ar).slice(0, 200)
      const en = str(o.en).slice(0, 200)
      if (!ar && !en) continue
      items.push({ ar, en })
    }
    if (items.length === 0) continue
    out.push({ heading_ar: str(g.heading_ar).slice(0, 200), heading_en: str(g.heading_en).slice(0, 200), items })
  }
  return out
}

// Defensive coercion for the `example` JSONB: null unless it's a well-formed "qa"
// or "steps" object. A "steps" example with no usable steps degrades to null (an
// empty step list would render a blank "How it works").
export function normalizeAiExample(v: unknown): AiSolutionExample | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null
  const o = v as Record<string, unknown>
  const str = (x: unknown): string => (typeof x === "string" ? x : "")
  if (o.kind === "qa") {
    // Caps MUST match the write-side validator (validate.ts: q_* = short-ish 400,
    // a_* = `long` = 4000). A smaller read cap would silently truncate a stored
    // answer on the CMS round-trip (edit → reopen → resave persists the truncation).
    return {
      kind: "qa",
      q_ar: str(o.q_ar).slice(0, 400), q_en: str(o.q_en).slice(0, 400),
      a_ar: str(o.a_ar).slice(0, 4000), a_en: str(o.a_en).slice(0, 4000),
    }
  }
  if (o.kind === "steps") {
    const steps: Bilingual[] = []
    const raw = Array.isArray(o.steps) ? o.steps : []
    for (const item of raw.slice(0, 12)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue
      const s = item as Record<string, unknown>
      const ar = str(s.ar).slice(0, 300)
      const en = str(s.en).slice(0, 300)
      if (!ar && !en) continue
      steps.push({ ar, en })
    }
    if (steps.length === 0) return null
    return { kind: "steps", intro_ar: str(o.intro_ar).slice(0, 400), intro_en: str(o.intro_en).slice(0, 400), steps }
  }
  return null
}

// ── Landing section layout (site_settings.layout) ──
// The reorderable middle sections; NAV+HERO are always first, FOOTER last.
export const SECTION_KEYS = ["offers", "checkout", "ai", "about", "team", "packages", "clients", "contact", "cta"] as const
export type SectionKey = (typeof SECTION_KEYS)[number]

export type SiteLayout = { order: SectionKey[]; hidden: SectionKey[] }

// The AI chapter (live support-chat + RAG demos) follows Services, ahead of the
// payment band. Layouts stored before this order were moved once by
// drizzle/0029_site_layout_ai_after_offers.sql.
export const DEFAULT_LAYOUT: SiteLayout = {
  order: ["offers", "ai", "checkout", "about", "team", "packages", "clients", "contact", "cta"],
  hidden: [],
}

const isSectionKey = (v: unknown): v is SectionKey =>
  typeof v === "string" && (SECTION_KEYS as readonly string[]).includes(v)

// Defensive: unknown keys dropped, dupes deduped, and keys missing from a stored
// layout appended AFTER the stored ones, in default order. So a section added later
// shows up at the end of a layout saved before it existed, not at its default slot;
// moving it there for existing data takes a migration.
export function normalizeLayout(v: unknown): SiteLayout {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {}
  const rawOrder = Array.isArray(o.order) ? o.order : []
  const order: SectionKey[] = []
  for (const k of rawOrder) {
    if (isSectionKey(k) && !order.includes(k)) order.push(k)
  }
  for (const k of DEFAULT_LAYOUT.order) {
    if (!order.includes(k)) order.push(k)
  }
  const rawHidden = Array.isArray(o.hidden) ? o.hidden : []
  const hidden: SectionKey[] = []
  for (const k of rawHidden) {
    if (isSectionKey(k) && !hidden.includes(k)) hidden.push(k)
  }
  return { order, hidden }
}

// The full public payload the landing renders + the public API returns.
export type SiteContent = {
  settings: SiteSettings
  team: TeamMember[]
  packages: PricingPackage[]
  clients: SiteClient[]
  offers: SiteOffer[]
  paymentFeatures: PaymentFeature[]
  // SLIM AI-solution rows (dropdown + teaser); the details page loads the FULL
  // shape (body/sections/example) separately via loadAiSolutionsFull().
  aiSolutions: AiSolution[]
}

// Sensible empty defaults so the UI never has to null-guard every field.
export const EMPTY_SETTINGS: SiteSettings = {
  hero: {
    title_ar: "", title_en: "", subtitle_ar: "", subtitle_en: "",
    cta_label_ar: "", cta_label_en: "", cta_url: "",
  },
  tagline: { ar: "", en: "" },
  services: [],
  contact: { email: "", email_support: "", email_info: "", phone: "", whatsapp: "", address_ar: "", address_en: "" },
  footer: { note_ar: "", note_en: "", links: [] },
  seo: { title_ar: "", title_en: "", description_ar: "", description_en: "", og_image: "" },
  showcase: SHOWCASE_DEFAULTS,
  layout: DEFAULT_LAYOUT,
  checkout: CHECKOUT_DEFAULTS,
  packages: PACKAGES_HEADING_DEFAULTS,
}
