"use client"
// Client providers mounted once at the root, for EVERY page: theme + language.
// Kept deliberately light, because the public site renders under them too. The
// dashboard-only stack (motion config, i18n dictionaries, toasts) is
// AppProviders, mounted by the (dash) layout and the auth pages' layouts.
import { ThemeProvider } from "./theme"
import { LangProvider } from "./lang-context"
import type { Lang } from "./lang"

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang: Lang }) {
  return (
    <ThemeProvider>
      <LangProvider initialLang={initialLang}>{children}</LangProvider>
    </ThemeProvider>
  )
}
