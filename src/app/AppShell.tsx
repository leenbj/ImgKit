import { ReactNode, useEffect, useRef, useState } from 'react'
import { applyTheme, initTheme, Theme } from './theme'
import { animate } from './motion'

export default function AppShell({ headerRight, children, footer }: { headerRight?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (typeof window !== 'undefined' ? initTheme() : 'light'))
  const brandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (brandRef.current) {
      animate(
        brandRef.current,
        [{ transform: 'translateY(-6px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 450, easing: 'cubic-bezier(.22,.61,.36,1)' }
      )
    }
  }, [])

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-50">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/60 dark:bg-gray-800/60 border-b border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
          <div ref={brandRef} className="font-semibold select-none">Image Compressor</div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={toggleTheme} className="rounded-md px-2 py-1 text-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition">
              {theme === 'dark' ? '浅色' : '深色'}
            </button>
            {headerRight}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-6 opacity-70 text-sm">{footer}</footer>
    </div>
  )
}

