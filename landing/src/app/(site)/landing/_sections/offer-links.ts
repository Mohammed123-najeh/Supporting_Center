// Pure helpers for offer CTAs + body rendering (no React — unit-testable).
// This is where settings.contact.whatsapp finally gets used on the public site.

// mailto: with a prefilled subject ("contact us about <offer>").
export function mailtoHref(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`
}

// wa.me deep link from a free-form phone field. Digits only (drops +, spaces,
// dashes, parentheses); null when there's no usable number.
export function whatsappHref(rawNumber: string | null | undefined, text: string): string | null {
  const digits = (rawNumber ?? "").replace(/\D/g, "")
  if (digits.length < 6) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

// Plain-text body → paragraphs. Blank line(s) separate paragraphs; single
// newlines stay inside one paragraph (rendered with white-space handling).
export function bodyParagraphs(body: string): string[] {
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}
