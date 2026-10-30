// The landing's content, in ONE typed module. It replaces the source's Postgres CMS
// (getPublicContent() and the per-table loaders in src/server/site/content.ts) and
// keeps the exact SiteContent shape from @/server/site/types, so a CMS or an API can
// replace this file later without touching a component: swap the bodies of the
// async accessors at the bottom.
//
// Filled from the source's default content (MH_Ecommerces @ 3f6ae5521):
//   • settings, team, packages, clients, offers: scripts/seed-site.ts
//   • the two company inboxes + WhatsApp: drizzle/0025_site_contact_defaults.sql
//   • payment features: DEFAULT_PAYMENT_FEATURES (= drizzle/0017, with the 0027
//     Stripe/UAE copy), ids `pf_<slug>`, sort 0..9
//   • AI solutions: DEFAULT_AI_SOLUTIONS (= drizzle/0019), ids `ai_<slug>`, sort 0..11
//   • showcase / layout / checkout / packages heading: the defaults in types.ts
//
// Images: the source served CMS uploads from /media/<path>. Here they are static
// files under public/media/<path>. The ones referenced below are PLACEHOLDERS
// (team photos, client logos + device screenshots, the OG image): replace the
// files, keeping the names, or change the paths here. Offers ship with no media,
// as in the seed, so the services showcase draws its built-in CSS mockups; to give
// an offer a picture, add e.g. `media: [{ path: "offers/online-store.webp", kind: "image" }]`.
import {
  CHECKOUT_DEFAULTS,
  DEFAULT_AI_SOLUTIONS,
  DEFAULT_LAYOUT,
  DEFAULT_PAYMENT_FEATURES,
  PACKAGES_HEADING_DEFAULTS,
  SHOWCASE_DEFAULTS,
  type AiSolution,
  type AiSolutionFull,
  type PaymentFeature,
  type PricingPackage,
  type SiteClient,
  type SiteContent,
  type SiteOffer,
  type SiteSettings,
  type TeamMember,
} from "@/server/site/types"

// ── Settings ────────────────────────────────────────────────────────────────
const SETTINGS: SiteSettings = {
  hero: {
    title_ar: "رمّانة",
    title_en: "Rummanah",
    subtitle_ar: "نصمّم ونبني ونشغّل متاجر إلكترونية حديثة.",
    subtitle_en: "We design, build, and operate modern online stores.",
    cta_label_ar: "تواصل معنا",
    cta_label_en: "Get in touch",
    cta_url: "mailto:hello@rummanah.dev",
  },
  tagline: { ar: "منصّة تجارة إلكترونية", en: "A modern commerce platform" },
  services: [
    { icon: "store", title_ar: "بناء المتجر", title_en: "Store build", body_ar: "متجر كامل جاهز للبيع.", body_en: "A complete, ready-to-sell storefront." },
    { icon: "gauge", title_ar: "التشغيل والصيانة", title_en: "Operations", body_ar: "استضافة وأداء ومراقبة.", body_en: "Hosting, performance, and monitoring." },
    { icon: "sparkles", title_ar: "التصميم", title_en: "Design", body_ar: "هوية وتجربة استخدام مميّزة.", body_en: "Distinct identity and UX." },
  ],
  contact: {
    email: "hello@rummanah.dev",
    email_support: "support@rummanah.dev",
    email_info: "info@rummanah.dev",
    phone: "",
    whatsapp: "+972 594312411",
    // Blank on purpose (as in the seed): the site renders the Dubai fallback
    // (COMPANY_COPY.address in site-copy.ts).
    address_ar: "",
    address_en: "",
  },
  footer: { note_ar: "© رمّانة", note_en: "© Rummanah", links: [] },
  seo: {
    title_ar: "رمّانة — منصّة تجارة إلكترونية",
    title_en: "Rummanah — Commerce Platform",
    description_ar: "نصمّم ونبني ونشغّل متاجر إلكترونية حديثة.",
    description_en: "Rummanah designs, builds, and operates modern online stores.",
    og_image: "og/og-image.jpg", // placeholder
  },
  showcase: SHOWCASE_DEFAULTS,
  layout: DEFAULT_LAYOUT,
  checkout: CHECKOUT_DEFAULTS,
  packages: PACKAGES_HEADING_DEFAULTS,
}

// ── Team ────────────────────────────────────────────────────────────────────
// No member is featured in the seed, so the Team section spotlights the first.
const TEAM: TeamMember[] = [
  {
    id: "tm_heba-snuber",
    name_ar: "م. هبة سنوبر", name_en: "Eng. Heba Snuber",
    role_ar: "الشريكة المؤسِّسة — الرئيسة التنفيذية", role_en: "Co-founder — CEO",
    bio_ar: "مهندسة حاسوب متخصصة في أنظمة التجارة الإلكترونية والذكاء الاصطناعي، تقود الرؤية التقنية والمنتج.",
    bio_en: "Computer engineer specialized in e-commerce systems and AI; leads the technical vision and product.",
    image_path: "team/heba-snuber.jpg", // placeholder
    is_featured: false, quote_ar: "", quote_en: "",
    sort_index: 0, is_active: true,
  },
  {
    id: "tm_mohammed-zidan",
    name_ar: "م. محمد زيدان", name_en: "Eng. Mohammed Zidan",
    role_ar: "الشريك المؤسس — المدير التقني", role_en: "Co-founder — CTO",
    bio_ar: "مهندس برمجيات بخبرة في البنية التحتية السحابية وقابلية التوسّع، يشرف على هندسة المنصّة وتشغيلها.",
    bio_en: "Software engineer experienced in cloud infrastructure and scalability; owns platform engineering and operations.",
    image_path: "team/mohammed-zidan.jpg", // placeholder
    is_featured: false, quote_ar: "", quote_en: "",
    sort_index: 10, is_active: true,
  },
  {
    id: "tm_sara-nassar",
    name_ar: "م. سارة نصار", name_en: "Eng. Sara Nassar",
    role_ar: "مديرة المنتج وتجربة المستخدم", role_en: "Product & UX Lead",
    bio_ar: "تحوّل احتياجات التجّار إلى واجهات بسيطة وواضحة، وتقود أبحاث المستخدمين وتصميم التجربة.",
    bio_en: "Turns merchant needs into simple, clear interfaces; leads user research and experience design.",
    image_path: "team/sara-nassar.jpg", // placeholder
    is_featured: false, quote_ar: "", quote_en: "",
    sort_index: 20, is_active: true,
  },
]

// ── Packages ────────────────────────────────────────────────────────────────
// The design's Seed / Pomegranate / Orchard. price=null → the custom "on request" one.
const pkgFeatures = (ar: string[], en: string[]) => en.map((e, i) => ({ en: e, ar: ar[i] ?? e }))

const PACKAGES: PricingPackage[] = [
  {
    id: "pkg_seed", name_ar: "البذرة", name_en: "Seed",
    price_amount: 290, price_currency: "USD", billing_period: "one_time",
    features: pkgFeatures(
      ["متجر إلكتروني بقوالب جاهزة", "حتى 100 منتج", "سلة شراء وطلب مضمّنة", "ربط واتساب للطلبات", "دعم عبر البريد الإلكتروني"],
      ["Store with ready themes", "Up to 100 products", "Built-in cart & checkout", "WhatsApp order link", "Email support"],
    ),
    highlighted: false,
    cta_label_ar: "ابدأ الآن", cta_label_en: "Get started", cta_url: "#contact",
    sort_index: 0, is_active: true,
  },
  {
    id: "pkg_pomegranate", name_ar: "الرمّانة", name_en: "Pomegranate",
    price_amount: 590, price_currency: "USD", billing_period: "monthly",
    features: pkgFeatures(
      ["كل ما في باقة البذرة", "منتجات غير محدودة", "لوحة تحكم كاملة وتقارير مبيعات", "بوابات دفع إلكتروني", "تكامل مع شركات الشحن", "تدريب الفريق + دعم بأولوية"],
      ["Everything in Seed", "Unlimited products", "Full dashboard & sales reports", "Online payment gateways", "Shipping-carrier integration", "Team training + priority support"],
    ),
    highlighted: true,
    cta_label_ar: "ابدأ الآن", cta_label_en: "Get started", cta_url: "#contact",
    sort_index: 10, is_active: true,
  },
  {
    id: "pkg_orchard", name_ar: "البستان", name_en: "Orchard",
    price_amount: null, price_currency: "USD", billing_period: "one_time",
    features: pkgFeatures(
      ["منصّة متعددة المتاجر (Multi-tenant)", "تصميم هوية مخصصة بالكامل", "تكاملات مخصصة (ERP / محاسبة)", "اتفاقية مستوى خدمة SLA", "مدير حساب مخصّص"],
      ["Multi-tenant platform", "Fully custom brand design", "Custom integrations (ERP / accounting)", "SLA service agreement", "Dedicated account manager"],
    ),
    highlighted: false,
    cta_label_ar: "ابدأ الآن", cta_label_en: "Get started", cta_url: "#contact",
    sort_index: 20, is_active: true,
  },
]

// ── Clients ─────────────────────────────────────────────────────────────────
// The seed's four sample stores. Logos and the device screenshots (which turn on
// the clients showcase) are placeholders.
const client = (
  key: string, name_ar: string, name_en: string, logo_shape: SiteClient["logo_shape"], sort_index: number,
): SiteClient => ({
  id: `cl_${key}`,
  name_ar, name_en,
  logo_path: `clients/${key}-logo.png`,
  logo_shape, logo_fit: "contain",
  desktop_image_path: `clients/${key}-desktop.jpg`,
  mobile_image_path: `clients/${key}-mobile.jpg`,
  desktop_images: [`clients/${key}-desktop.jpg`],
  mobile_images: [`clients/${key}-mobile.jpg`],
  href: "",
  sort_index, is_active: true,
})

const CLIENTS: SiteClient[] = [
  client("lumora", "لومورا ستور", "Lumora Store", "rounded", 0),
  client("anaqa", "متجر الأناقة", "Anaqa Shop", "circle", 10),
  client("bait-al-bun", "بيت البُن", "Bait Al-Bun", "rounded", 20),
  client("nuqta", "نقطة", "Nuqta", "square", 30),
]

// ── Offers (the services showcase + /offers/<slug>) ────────────────────────
// Six, so the MagicBento layout (nth-child 3 = 2x2, 4 = wide, 6 = corner) fills.
const OFFERS: SiteOffer[] = [
  {
    id: "of_online-store", slug: "online-store", icon: "🛍️",
    name_ar: "متجر عربي أولًا", name_en: "Arabic-first store",
    eyebrow_ar: "الواجهة", eyebrow_en: "Storefront", visual: "store",
    palette: [[232, 180, 143], [223, 165, 122], [240, 205, 175]],
    summary_ar: "واجهة RTL كاملة، سريعة على الجوال، بتجربة تسوّق عربية سلسة.",
    summary_en: "Full RTL, fast on mobile, with a smooth Arabic shopping experience.",
    body_ar: "نبني متجرك بواجهة عربية أولًا بتصميم متجاوب على جميع الأجهزة.\n\nكل تفصيلة مصمّمة لتجربة تسوّق سلسة تناسب عملاءك.",
    body_en: "We build your store Arabic-first with a responsive design across every device.\n\nEvery detail is crafted for a smooth shopping experience that fits your customers.",
    media: [], points: [],
    sort_index: 0, is_active: true,
  },
  {
    id: "of_smart-dashboard", slug: "smart-dashboard", icon: "📊",
    name_ar: "لوحة تحكم ذكية", name_en: "Smart dashboard",
    eyebrow_ar: "الإدارة", eyebrow_en: "Management", visual: "dashboard",
    palette: [[224, 149, 154], [217, 128, 137], [238, 190, 193]],
    summary_ar: "إدارة المنتجات والطلبات والمخزون والعملاء في مكان واحد مع تقارير لحظية.",
    summary_en: "Manage products, orders, inventory and customers in one place with live reports.",
    body_ar: "لوحة تحكم واحدة تجمع كل ما تحتاجه لإدارة متجرك.\n\nتقارير مبيعات لحظية تساعدك على اتخاذ القرار الصحيح.",
    body_en: "One dashboard that brings together everything you need to run your store.\n\nLive sales reports help you make the right decisions.",
    media: [], points: [],
    sort_index: 10, is_active: true,
  },
  {
    id: "of_payments-shipping", slug: "payments-shipping", icon: "🚚",
    name_ar: "دفع وشحن جاهز", name_en: "Payments & shipping",
    eyebrow_ar: "المدفوعات", eyebrow_en: "Payments", visual: "payments",
    palette: [[232, 201, 138], [224, 185, 110], [242, 222, 180]],
    summary_ar: "تكامل مع بوابات الدفع المحلية وشركات التوصيل مع تتبّع الطلب.",
    summary_en: "Integrated with local payment gateways and couriers, with order tracking.",
    body_ar: "دمج جاهز مع بوابات الدفع وشركات الشحن المحلية.\n\nتتبّع حالة الطلب حتى باب العميل.",
    body_en: "Ready integration with local payment gateways and couriers.\n\nOrder tracking all the way to the customer's door.",
    media: [],
    points: [
      { ar: "بوابات دفع محلية وعالمية", en: "Local & global payment gateways" },
      { ar: "تتبّع الشحنة حتى باب العميل", en: "Track shipments to the door" },
      { ar: "دفع عند الاستلام", en: "Cash on delivery" },
    ],
    sort_index: 20, is_active: true,
  },
  {
    id: "of_fast-performance", slug: "fast-performance", icon: "⚡",
    name_ar: "أداء لا يتباطأ", name_en: "Never-slow performance",
    eyebrow_ar: "السرعة", eyebrow_en: "Performance", visual: "speed",
    palette: [[235, 169, 140], [232, 152, 122], [243, 205, 185]],
    summary_ar: "تطبيق ويب تقدّمي خفيف يفتح في أقل من ثانية ويعمل مع الإنترنت الضعيف.",
    summary_en: "A lightweight PWA that opens in under a second and works on weak connections.",
    body_ar: "متجرك يعمل كتطبيق ويب تقدّمي سريع.\n\nيفتح في أقل من ثانية ويعمل حتى مع الإنترنت الضعيف.",
    body_en: "Your store runs as a fast progressive web app.\n\nIt opens in under a second and works even on a weak connection.",
    media: [], points: [],
    sort_index: 30, is_active: true,
  },
  {
    id: "of_marketing-tools", slug: "marketing-tools", icon: "📣",
    name_ar: "أدوات تسويق مدمجة", name_en: "Built-in marketing",
    eyebrow_ar: "التسويق", eyebrow_en: "Marketing", visual: "marketing",
    palette: [[223, 160, 184], [212, 138, 166], [238, 200, 214]],
    summary_ar: "كوبونات، عروض، ربط واتساب وحملات إعلانية — كل ما يجذب عملاءك ويزيد مبيعاتك.",
    summary_en: "Coupons, offers, WhatsApp integration and ad campaigns — everything to attract customers and grow sales.",
    body_ar: "أدوات تسويق مدمجة تساعدك على الوصول لعملائك أينما كانوا.\n\nكوبونات وعروض وحملات، مع ربط مباشر بواتساب.",
    body_en: "Built-in marketing tools help you reach your customers wherever they are.\n\nCoupons, offers and campaigns, with direct WhatsApp integration.",
    media: [], points: [],
    sort_index: 40, is_active: true,
  },
  {
    id: "of_secure-hosting", slug: "secure-hosting", icon: "🔒",
    name_ar: "استضافة آمنة", name_en: "Secure hosting",
    eyebrow_ar: "الأمان", eyebrow_en: "Security", visual: "security",
    palette: [[201, 166, 196], [185, 143, 182], [223, 200, 220]],
    summary_ar: "استضافة سريعة، شهادة SSL، ونسخ احتياطية يومية — متجرك محمي على مدار الساعة.",
    summary_en: "Fast hosting, an SSL certificate and daily backups — your store protected around the clock.",
    body_ar: "بنية تحتية آمنة وسريعة لمتجرك.\n\nشهادة SSL ونسخ احتياطية يومية تحفظ بياناتك على مدار الساعة.",
    body_en: "Secure, fast infrastructure for your store.\n\nAn SSL certificate and daily backups keep your data safe around the clock.",
    media: [], points: [],
    sort_index: 50, is_active: true,
  },
]

// ── Payment features (/electronic-payment + the Payments mega-dropdown) ─────
const PAYMENT_FEATURES: PaymentFeature[] = DEFAULT_PAYMENT_FEATURES.map((f, i) => ({
  id: `pf_${f.slug}`,
  ...f,
  sort_index: i,
  is_active: true,
}))

// ── AI solutions (the AI chapter chips, the AI mega-dropdown, /ai-solutions) ──
// FULL rows feed /ai-solutions; the landing carries the SLIM shape.
const AI_SOLUTIONS_FULL: AiSolutionFull[] = DEFAULT_AI_SOLUTIONS.map((s, i) => ({
  id: `ai_${s.slug}`,
  ...s,
  sort_index: i,
  is_active: true,
}))

const AI_SOLUTIONS: AiSolution[] = AI_SOLUTIONS_FULL.map((s) => ({
  id: s.id, slug: s.slug, icon_key: s.icon_key, icon: s.icon,
  title_ar: s.title_ar, title_en: s.title_en,
  summary_ar: s.summary_ar, summary_en: s.summary_en,
  sort_index: s.sort_index, is_active: s.is_active,
}))

// ── The full payload ───────────────────────────────────────────────────────
export const SITE_CONTENT: SiteContent = {
  settings: SETTINGS,
  team: TEAM,
  packages: PACKAGES,
  clients: CLIENTS,
  offers: OFFERS,
  paymentFeatures: PAYMENT_FEATURES,
  aiSolutions: AI_SOLUTIONS,
}

// ── Accessors (the seam a CMS or API replaces) ──────────────────────────────
// Same contracts as the source's loaders: active rows only, in sort order.
const active = <T extends { is_active: boolean; sort_index: number }>(rows: readonly T[]): T[] =>
  rows.filter((r) => r.is_active).sort((a, b) => a.sort_index - b.sort_index)

/** The public payload the landing renders (was getPublicContent()). */
export async function getPublicContent(): Promise<SiteContent> {
  const c = SITE_CONTENT
  return {
    settings: c.settings,
    team: active(c.team),
    packages: active(c.packages),
    clients: active(c.clients),
    offers: active(c.offers),
    paymentFeatures: active(c.paymentFeatures),
    aiSolutions: active(c.aiSolutions),
  }
}

/** The site settings alone (was getSettings()). */
export async function getSettings(): Promise<SiteSettings> {
  return SITE_CONTENT.settings
}

/** One active offer by slug, or null (was loadOfferBySlug()). */
export async function loadOfferBySlug(slug: string): Promise<SiteOffer | null> {
  return SITE_CONTENT.offers.find((o) => o.slug === slug && o.is_active) ?? null
}

/** Active payment features (was loadPaymentFeatures()). */
export async function loadPaymentFeatures(): Promise<PaymentFeature[]> {
  return active(SITE_CONTENT.paymentFeatures)
}

/** Active AI solutions, FULL shape (was loadAiSolutionsFull()). */
export async function loadAiSolutionsFull(): Promise<AiSolutionFull[]> {
  return active(AI_SOLUTIONS_FULL)
}
