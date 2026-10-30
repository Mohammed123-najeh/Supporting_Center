// Words for the streamed replies. Each word becomes its own inline span (never
// inline-block: an inline-block is one neutral character to the bidi algorithm,
// so "AED 420" or "#RM-2048" inside an Arabic sentence would come out scrambled).
// In right-to-left text, a run of left-to-right words is kept as ONE token wrapped
// in first-strong isolates, so it reads in order and never splits across the fade.
export type Token = { text: string; space: boolean }

const FSI = "⁨"
const PDI = "⁩"
const ARABIC = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/
const LATIN_OR_DIGIT = /[A-Za-z0-9]/

const isLtr = (word: string) => LATIN_OR_DIGIT.test(word) && !ARABIC.test(word)

export function tokenize(text: string, rtl: boolean): Token[] {
  const words = text.split(/\s+/).filter(Boolean)
  const out: Token[] = []
  for (let i = 0; i < words.length; i++) {
    let word = words[i]
    if (rtl && isLtr(word)) {
      const run = [word]
      while (i + 1 < words.length && isLtr(words[i + 1])) run.push(words[++i])
      word = FSI + run.join(" ") + PDI
    }
    out.push({ text: word, space: i < words.length - 1 })
  }
  return out
}

// The same isolation for a plain string (status lines, labels): "RM-2048" or
// "10 AM" inside Arabic stays in order.
export function isolate(text: string, rtl: boolean): string {
  if (!rtl) return text
  return tokenize(text, true).map((t) => t.text + (t.space ? " " : "")).join("")
}

// The per-word delay that keeps a whole reply's fade-in under `total` ms.
export function wordStep(count: number, total = 700, max = 30): number {
  return count > 0 ? Math.min(max, Math.round(total / count)) : max
}

// A reply streams in bursts of a few words, the way a model's tokens arrive: the
// text only ever grows at its end, in ONE text node (no element per word, nothing
// to animate). Each chunk carries its own leading space, so joining any prefix of
// the chunks gives exactly that much of the sentence. LTR runs stay isolated.
export function chunks(text: string, rtl: boolean, size = 4): string[] {
  const tokens = tokenize(text, rtl)
  const out: string[] = []
  for (let i = 0; i < tokens.length; i += size) {
    out.push(tokens.slice(i, i + size).map((t, j) => (i + j > 0 ? " " : "") + t.text).join(""))
  }
  return out
}
