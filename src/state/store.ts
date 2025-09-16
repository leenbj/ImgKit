import { create } from 'zustand'
import type { CropSettings, EncodeSettings, GlobalSettings, ImageItemMeta, ImageItemState, SizeSettings, WatermarkSettings } from './types'

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

const defaultEncode: EncodeSettings = { format: 'jpeg', intensity: 60, quality: 95 }
const defaultSize: SizeSettings = { enabled: false, fit: 'contain', preventUpscale: true }
const defaultCrop: CropSettings = { anchor: 'center', x: 0.5, y: 0.5, scale: 1 }
const defaultWatermark: WatermarkSettings = { mode: 'off', angle: 30, spacing: 240, scale: 1, margin: 24, opacity: 0.14, applyScope: 'global' }

const defaultGlobal: GlobalSettings = {
  encode: defaultEncode,
  size: defaultSize,
  crop: defaultCrop,
  watermark: defaultWatermark,
  concurrency: clamp((navigator as any)?.hardwareConcurrency ? (navigator as any).hardwareConcurrency - 2 : 2, 2, 4),
}

export interface AppState {
  settings: GlobalSettings
  queue: ImageItemState[]
  selectedIds: Set<string>
  // actions
  setIntensity: (v: number) => void
  setQuality: (q: number) => void
  setGlobal: (patch: Partial<GlobalSettings>) => void
  addFiles: (items: ImageItemMeta[]) => void
  removeById: (id: string) => void
  clearQueue: () => void
  markProgress: (id: string, progress: number) => void
  markEstimate: (id: string, outSize?: number, ratio?: number) => void
  markDone: (id: string, result: NonNullable<ImageItemState['result']>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: defaultGlobal,
  queue: [],
  selectedIds: new Set<string>(),

  setIntensity: (v) => set((s) => ({ settings: { ...s.settings, encode: { ...s.settings.encode, intensity: clamp(v, 0, 100) } } })),
  setQuality: (q) => set((s) => ({ settings: { ...s.settings, encode: { ...s.settings.encode, quality: clamp(q, 10, 95) } } })),
  setGlobal: (patch) => set((s) => ({ settings: { ...s.settings, ...patch, encode: { ...s.settings.encode, ...patch.encode }, size: { ...s.settings.size, ...patch.size }, crop: { ...s.settings.crop, ...patch.crop }, watermark: { ...s.settings.watermark, ...patch.watermark } } })),

  addFiles: (items) => set((s) => ({
    queue: [
      ...s.queue,
      ...items.map<ImageItemState>((meta) => ({ meta, status: 'queued', progress: 0 })),
    ],
  })),

  removeById: (id) => set((s) => ({ queue: s.queue.filter((i) => i.meta.id !== id) })),
  clearQueue: () => set({ queue: [] }),

  markProgress: (id, progress) => set((s) => ({
    queue: s.queue.map((i) => (i.meta.id === id ? { ...i, progress: clamp(progress, 0, 100), status: progress >= 100 ? 'done' : (i.status === 'queued' ? 'processing' : i.status) } : i)),
  })),

  markEstimate: (id, outSize, ratio) => set((s) => ({
    queue: s.queue.map((i) => (i.meta.id === id ? { ...i, estimate: { outSize, ratio } } : i)),
  })),

  markDone: (id, result) => set((s) => ({
    queue: s.queue.map((i) => (i.meta.id === id ? { ...i, result, status: 'done', progress: 100 } : i)),
  })),
}))

