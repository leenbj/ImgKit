type Format = 'jpeg' | 'png' | 'webp'

// 经验系数的简单初始化（可由会话内采样更新）
const defaultBase: Record<Format, number[]> = {
  jpeg: [1.0, 0.9, 0.8, 0.7],
  webp: [1.0, 0.85, 0.7, 0.6],
  png: [1.0, 1.0, 0.95, 0.9],
}

function baseCoeff(format: Format, quality: number): number {
  // 将质量分段映射到默认系数索引
  // 95~85 -> idx0, 84~70 -> idx1, 69~50 -> idx2, <=49 -> idx3
  const idx = quality >= 85 ? 0 : quality >= 70 ? 1 : quality >= 50 ? 2 : 3
  return defaultBase[format][idx]
}

export interface EstimateInput {
  format: Format
  quality: number
  srcSize: number // 原文件字节
  srcPixels: number // 原像素数（w*h）
  targetPixels: number // 目标像素数（可能等于原像素数）
}

export interface EstimateResult {
  estimatedSize: number // 估算后字节
  ratio: number // 节省比例（0-1）
}

export function estimateSize(input: EstimateInput): EstimateResult {
  const { format, quality, srcSize, srcPixels, targetPixels } = input
  if (!srcSize || !srcPixels || !targetPixels) return { estimatedSize: srcSize, ratio: 0 }
  const areaScale = Math.max(0.05, Math.min(5, targetPixels / srcPixels))
  const coeff = baseCoeff(format, quality)
  const est = Math.max(200, Math.round(srcSize * areaScale * coeff))
  const ratio = Math.max(0, Math.min(1, 1 - est / srcSize))
  return { estimatedSize: est, ratio }
}

