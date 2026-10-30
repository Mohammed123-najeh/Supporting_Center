"use client"
// Light/dark ("morning"/"night") theme. The active theme is the `data-theme`
// attribute on <html>, set pre-paint by the inline script in layout.tsx and kept
// in sync here. Preference persists in localStorage. We never read localStorage
// during render (only in effects) to avoid hydration mismatches.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

export type Theme = "light" | "dark"
export const THEME_KEY = "mz_sa_theme"

type ThemeCtx = { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }
const Ctx = createContext<ThemeCtx | null>(null)

const META_COLOR: Record<Theme, string> = {
  light: "#FDF4ED", // warm cream — Rummanah light --bg
  dark: "#160D0C", // deep pomegranate-black — Rummanah dark --bg
}

function applyTheme(t: Theme) {
  const el = document.documentElement
  el.dataset.theme = t
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", META_COLOR[t])
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR + first client render use "dark" (the default); the pre-paint script
  // already set the real attribute, so there's no flash. We reconcile from the
  // DOM on mount, so a user who chose "light" keeps it.
  const [theme, setThemeState] = useState<Theme>("dark")

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as Theme | undefined) ?? "dark"
    setThemeState(current)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    applyTheme(t)
    try {
      localStorage.setItem(THEME_KEY, t)
    } catch {
      /* private mode */
    }
  }, [])

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light"
      applyTheme(next)
      try {
        localStorage.setItem(THEME_KEY, next)
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error("useTheme must be used within ThemeProvider")
  return c
}
