// User-perceived characters, so the typing effect never shows half a letter (an
// Arabic letter without its mark, half an emoji). Intl.Segmenter where the browser
// has it; otherwise each base character with its combining marks.
type Segmenter = { segment(input: string): Iterable<{ segment: string }> }
type SegmenterCtor = new (locale?: string, options?: { granularity: "grapheme" }) => Segmenter

export function graphemes(text: string): string[] {
  const Ctor = (Intl as unknown as { Segmenter?: SegmenterCtor }).Segmenter
  if (Ctor) return Array.from(new Ctor(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
  return text.match(/\P{M}\p{M}*/gu) ?? []
}
