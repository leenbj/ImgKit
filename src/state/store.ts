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
  processingEnabled: boolean
  // actions
  setIntensity: (v: number) => void
  setQuality: (q: number) => void
  setGlobal: (patch: Partial<GlobalSettings>) => void
  setProcessingEnabled: (enabled: boolean) => void
  toggleProcessing: () => void
  addFiles: (items: ImageItemMeta[]) => void
  removeById: (id: string) => void
  clearQueue: () => void
  requeueItem: (id: string) => void
  markProgress: (id: string, progress: number) => void
  markEstimate: (id: string, outSize?: number, ratio?: number) => void
  markDone: (id: string, result: NonNullable<ImageItemState['result']>) => void
  markError: (id: string, message: string) => void
  setItemOverride: (
    id: string,
    patch: Partial<NonNullable<ImageItemState['override']>>,
  ) => void
  markCanceled: (id: string) => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  settings: defaultGlobal,
  queue: [],
  selectedIds: new Set<string>(),
  processingEnabled: true,

  setIntensity: (v) => set((s) => ({ settings: { ...s.settings, encode: { ...s.settings.encode, intensity: clamp(v, 0, 100) } } })),
  setQuality: (q) => set((s) => ({ settings: { ...s.settings, encode: { ...s.settings.encode, quality: clamp(q, 10, 95) } } })),
  setGlobal: (patch) => set((s) => ({ settings: { ...s.settings, ...patch, encode: { ...s.settings.encode, ...patch.encode }, size: { ...s.settings.size, ...patch.size }, crop: { ...s.settings.crop, ...patch.crop }, watermark: { ...s.settings.watermark, ...patch.watermark } } })),
  setProcessingEnabled: (enabled) => set({ processingEnabled: enabled }),
  toggleProcessing: () => set((s) => ({ processingEnabled: !s.processingEnabled })),

  addFiles: (items) => set((s) => ({
    queue: [
      ...s.queue,
      ...items.map<ImageItemState>((meta) => ({ meta, status: 'queued', progress: 0 })),
    ],
  })),

  requeueItem: (id) => set((s) => ({
    queue: s.queue.map((i) => (
      i.meta.id === id
        ? { ...i, status: 'queued', progress: 0, error: undefined, estimate: undefined, result: undefined }
        : i
    )),
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

  markError: (id, message) => set((s) => ({
    queue: s.queue.map((i) => (i.meta.id === id ? { ...i, status: 'error', error: message } : i)),
  })),

  setItemOverride: (id, patch) => set((s) => ({
    queue: s.queue.map((i) => {
      if (i.meta.id !== id) return i
      const nextOverride = {
        encode: { ...i.override?.encode, ...patch.encode },
        size: { ...i.override?.size, ...patch.size },
        crop: { ...i.override?.crop, ...patch.crop },
        watermark: { ...i.override?.watermark, ...patch.watermark },
      }
      return { ...i, override: nextOverride }
    }),
  })),

  markCanceled: (id) => set((s) => ({
    queue: s.queue.map((i) => (i.meta.id === id ? { ...i, status: 'canceled' } : i)),
  })),

  toggleSelect: (id) => set((s) => {
    const next = new Set(s.selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return { selectedIds: next }
  }),
  selectAll: () => set((s) => ({ selectedIds: new Set(s.queue.map((i) => i.meta.id)) })),
  clearSelection: () => set({ selectedIds: new Set() }),
}))
