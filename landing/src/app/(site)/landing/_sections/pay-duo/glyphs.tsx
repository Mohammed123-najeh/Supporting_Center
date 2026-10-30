// Small inline glyphs for the pay-duo mockups. Inline SVG (currentColor unless
// the mark has fixed brand colours): no requests, crisp at any size. The Apple
// mark is drawn, because the "" character only renders on Apple platforms.

export const AppleGlyph = (
  <svg className="g-apple" viewBox="0 0 17 20" aria-hidden="true">
    <path fill="currentColor" d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.6 4.8 1.9 5.8 1 7.4c-1.9 3.3-.5 8.1 1.3 10.8.9 1.3 2 2.7 3.3 2.7 1.3-.1 1.8-.9 3.4-.9 1.6 0 2 .9 3.4.8 1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.9-1.1-2.9-4.6zM11.5 2.9c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" />
  </svg>
)

export const LockGlyph = (
  <svg className="g-lock" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="2" />
  </svg>
)

export const CheckGlyph = (
  <svg className="g-check" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const FingerprintGlyph = (
  <svg className="g-touch" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6.2 5.3A8.5 8.5 0 0 1 20.4 12" />
    <path d="M3.6 9.6A8.5 8.5 0 0 1 4.6 7.4" />
    <path d="M3.5 13.5c.2 2 .9 3.7 1.9 5.2" />
    <path d="M7.6 20.4A12 12 0 0 1 6 12a6 6 0 0 1 11.9-1" />
    <path d="M18 13.5c0 2-.3 3.9-1 5.6" />
    <path d="M12 9a3 3 0 0 0-3 3c0 3.2.8 6 2.2 8.4" />
    <path d="M15 12c0 2.6-.4 5-1.2 7.1" />
    <path d="M12 12v2c0 1.8.3 3.5.8 5" />
  </svg>
)

// Mastercard's interlocking circles (red, yellow, the orange overlap).
export const MastercardMark = (
  <svg className="g-mc" viewBox="0 0 32 20" aria-hidden="true">
    <circle cx="12.5" cy="10" r="7" fill="#EB001B" />
    <circle cx="19.5" cy="10" r="7" fill="#F79E1B" />
    <path d="M16 3.94a7 7 0 0 1 0 12.12a7 7 0 0 1 0-12.12z" fill="#FF5F00" />
  </svg>
)

export const SignalGlyph = (
  <svg className="g-status" viewBox="0 0 60 13" aria-hidden="true">
    <g fill="currentColor">
      <rect x="0" y="7" width="3" height="4" rx="1" /><rect x="5" y="5" width="3" height="6" rx="1" />
      <rect x="10" y="3" width="3" height="8" rx="1" /><rect x="15" y="1" width="3" height="10" rx="1" />
      <path d="M23 4.4c3-2.7 8-2.7 11 0l-1.4 1.5c-2.2-2-6-2-8.2 0L23 4.4z" />
      <path d="M25.6 7c1.6-1.4 4.2-1.4 5.8 0l-1.4 1.4c-.9-.7-2.1-.7-3 0L25.6 7z" />
      <circle cx="28.5" cy="9.9" r="1.1" />
      <rect x="40" y="2.5" width="18" height="9" rx="2.6" fill="none" stroke="currentColor" strokeWidth="1" opacity=".45" />
      <rect x="41.4" y="4" width="12.5" height="6" rx="1.3" />
    </g>
  </svg>
)
