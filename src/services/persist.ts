import type { GlobalSettings } from '@/state/types'
import { useAppStore } from '@/state/store'

const LS_KEY = 'imgkit:prefs:v1'

export function loadPrefs(): Partial<GlobalSettings> | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

export function savePrefs(prefs: Partial<GlobalSettings>) {
  if (typeof localStorage === 'undefined') return
  try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)) } catch {}
}

export function initSettingsPersistence() {
  const store = useAppStore.getState()
  const initial = loadPrefs()
  if (initial) {
    useAppStore.setState({ settings: { ...store.settings,
      encode: { ...store.settings.encode, ...initial.encode },
      size: { ...store.settings.size, ...initial.size },
      crop: { ...store.settings.crop, ...initial.crop },
      watermark: { ...store.settings.watermark, ...initial.watermark },
      concurrency: initial.concurrency ?? store.settings.concurrency,
    } })
  }

  let prev = useAppStore.getState().settings
  useAppStore.subscribe((s) => {
    if (s.settings !== prev) {
      prev = s.settings
      savePrefs({ ...s.settings })
    }
  })
}

