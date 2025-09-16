// 强度（0-100）到质量（30-95）的映射
export function intensityToQuality(intensity: number): number {
  const q = Math.round(95 - 0.65 * intensity)
  return Math.max(30, Math.min(95, q))
}

export function normalizeIntensity(v: number): number {
  if (Number.isNaN(v)) return 60
  return Math.max(0, Math.min(100, Math.round(v)))
}

