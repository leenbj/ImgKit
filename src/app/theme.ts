export type Theme = 'light' | 'dark'

const THEME_KEY = 'icw-theme'

export function getSystemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  try { localStorage.setItem(THEME_KEY, theme) } catch {}
}

export function initTheme(): Theme {
  const stored = getStoredTheme()
  const theme: Theme = stored ?? (getSystemPrefersDark() ? 'dark' : 'light')
  applyTheme(theme)
  return theme
}

