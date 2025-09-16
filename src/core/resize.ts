import type { FitMode, SizeSettings } from '@/state/types'

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export interface Box { width: number; height: number; scale: number }

export function resolveTargetBox(srcW: number, srcH: number, s: SizeSettings): { w: number; h: number } {
  let w = s.targetWidth
  let h = s.targetHeight
  const ratio = s.ratio ? (s.ratio.w / s.ratio.h) : undefined

  if (ratio && (w == null || h == null)) {
    if (w != null && h == null) h = Math.round(w / ratio)
    else if (h != null && w == null) w = Math.round(h * ratio)
    else if (w == null && h == null) {
      // 根据原图与 preventUpscale 选择最大不超原图的盒子
      const byW = { w: srcW, h: Math.round(srcW / ratio) }
      const byH = { w: Math.round(srcH * ratio), h: srcH }
      const fitByW = byW.h <= srcH
      const box = fitByW ? byW : byH
      w = box.w; h = box.h
    }
  }

  if (w == null && h == null) {
    w = srcW; h = srcH
  }
  if (w == null && h != null) {
    const k = h / srcH
    w = Math.round(srcW * k)
  }
  if (h == null && w != null) {
    const k = w / srcW
    h = Math.round(srcH * k)
  }
  return { w: Math.max(1, Math.round(w!)), h: Math.max(1, Math.round(h!)) }
}

export function contain(srcW: number, srcH: number, boxW: number, boxH: number, preventUpscale = true): Box {
  const scale = Math.min(boxW / srcW, boxH / srcH)
  const s = preventUpscale ? Math.min(1, scale) : scale
  const width = Math.max(1, Math.round(srcW * s))
  const height = Math.max(1, Math.round(srcH * s))
  return { width, height, scale: s }
}

export function cover(srcW: number, srcH: number, boxW: number, boxH: number, preventUpscale = true): Box {
  const scale = Math.max(boxW / srcW, boxH / srcH)
  const s = preventUpscale ? Math.min(1, scale) : scale
  const width = Math.max(1, Math.round(srcW * s))
  const height = Math.max(1, Math.round(srcH * s))
  return { width, height, scale: s }
}

export function calcTargetSize(srcW: number, srcH: number, s: SizeSettings): Box {
  if (!s.enabled) return { width: srcW, height: srcH, scale: 1 }
  const { w, h } = resolveTargetBox(srcW, srcH, s)
  return s.fit === 'cover' ? cover(srcW, srcH, w, h, s.preventUpscale) : contain(srcW, srcH, w, h, s.preventUpscale)
}

