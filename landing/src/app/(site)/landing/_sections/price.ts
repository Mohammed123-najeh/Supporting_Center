// Package prices from the CMS amount + ISO code (`price_currency`). A fixed
// label table rather than Intl.NumberFormat: Node and the browser ship different
// ICU data, so Intl output can differ between the server render and hydration.
// Symbols lead the number in both languages ("$590"); letter labels lead in
// English ("AED 590") and follow in Arabic ("590 د.إ", read right to left).
// Render the result inside <bdi dir={price.dir}> so it never reorders the
// surrounding text. Unknown codes show as the code itself.

type Label = { ar: string; en: string; symbol?: true }

const LABELS: Record<string, Label> = {
  AED: { ar: "د.إ", en: "AED" },
  SAR: { ar: "ر.س", en: "SAR" },
  USD: { ar: "$", en: "$", symbol: true },
  EUR: { ar: "€", en: "€", symbol: true },
  GBP: { ar: "£", en: "£", symbol: true },
}

export type Price = { text: string; dir: "ltr" | "rtl" }

export function formatPrice(amount: number, currency: string, lang: "ar" | "en"): Price {
  const code = currency.trim().toUpperCase() || "USD"
  const label = LABELS[code]
  const n = String(amount)
  if (label?.symbol) return { text: `${label[lang]}${n}`, dir: "ltr" }
  if (lang === "ar" && label) return { text: `${n} ${label.ar}`, dir: "rtl" }
  return { text: `${label ? label.en : code} ${n}`, dir: "ltr" }
}
