// The demos' canned replies: which script a visitor wrote in, and which reply
// their message maps to. Pure and tiny, no network. Arabic is normalised first
// (marks, tatweel, alef/ya/ta-marbuta variants) so "إرجاع" and "ارجاع" match alike.
export type Rule<K extends string> = { key: K; words: readonly string[] }

const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(MARKS, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
}

/** "ar" or "en" by the letters used; null when there are no letters at all. */
export function detectScript(text: string): "ar" | "en" | null {
  const ar = (text.match(/[؀-ۿ]/g) ?? []).length
  const en = (text.match(/[A-Za-z]/g) ?? []).length
  if (!ar && !en) return null
  return ar >= en ? "ar" : "en"
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

/** The first rule with a matching word. Latin words match at a word start
 *  ("track" matches "tracking", not "racetrack"); Arabic words match anywhere,
 *  since Arabic attaches prefixes such as و / ال / ب. A word written "=word"
 *  must stand alone (so "=كم" is not found inside "لكم", nor "=hi" in "his"). */
export function matchIntent<K extends string>(text: string, rules: readonly Rule<K>[], fallback: K): K {
  const n = normalize(text)
  for (const rule of rules) {
    for (const word of rule.words) {
      const whole = word.startsWith("=")
      const w = normalize(whole ? word.slice(1) : word)
      const hit = whole
        ? new RegExp(`(^|[^\\p{L}\\p{N}])${escape(w)}($|[^\\p{L}\\p{N}])`, "u").test(n)
        : /^[a-z0-9]/.test(w)
          ? new RegExp(`(^|[^a-z0-9])${escape(w)}`).test(n)
          : n.includes(w)
      if (hit) return rule.key
    }
  }
  return fallback
}
