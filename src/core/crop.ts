import type { CropSettings } from '@/state/types'

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export interface Rect { x: number; y: number; width: number; height: number }

export function baseCoverScale(srcW: number, srcH: number, outW: number, outH: number): number {
  return Math.max(outW / srcW, outH / srcH)
}

export function computeCropRect(srcW: number, srcH: number, outW: number, outH: number, crop: CropSettings): Rect {
  const k = baseCoverScale(srcW, srcH, outW, outH)
  const scale = Math.max(0.1, crop.scale || 1)
  const cropW = Math.min(srcW, Math.round(outW / (k * scale)))
  const cropH = Math.min(srcH, Math.round(outH / (k * scale)))

  // 归一化中心点（0-1）
  let cx = crop.x
  let cy = crop.y
  // 容错
  if (Number.isNaN(cx)) cx = 0.5
  if (Number.isNaN(cy)) cy = 0.5
  cx = clamp(cx, 0, 1)
  cy = clamp(cy, 0, 1)

  // 将中心点转换为左上角，保证在边界内
  let x = Math.round(cx * srcW - cropW / 2)
  let y = Math.round(cy * srcH - cropH / 2)
  x = clamp(x, 0, srcW - cropW)
  y = clamp(y, 0, srcH - cropH)

  return { x, y, width: cropW, height: cropH }
}

