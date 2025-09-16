export type EncodeFormat = 'jpeg' | 'png' | 'webp'

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)) }

export function pickMime(format: EncodeFormat): string {
  switch (format) {
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'webp': return 'image/webp'
    default: return 'image/jpeg'
  }
}

export function normalizeToBlobQuality(quality: number): number {
  // 输入是 10-95 区间，转换为 0-1；限制 0.1-0.95，避免极端
  const q01 = quality / 100
  return Number(clamp(q01, 0.1, 0.95).toFixed(3))
}

export function hasWebCodecs(): boolean {
  try {
    return typeof (globalThis as any).ImageEncoder === 'function'
  } catch {
    return false
  }
}

export type EncoderKind = 'webcodecs' | 'canvas'

export function selectEncoder(): EncoderKind {
  return hasWebCodecs() ? 'webcodecs' : 'canvas'
}

// 注意：以下运行期方法依赖浏览器 API，不在 Node 测试环境执行

export async function encodeFromCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  format: EncodeFormat,
  quality: number,
): Promise<Blob> {
  const mime = pickMime(format)
  const q = normalizeToBlobQuality(quality)

  // 优先 WebCodecs（可用时）
  if (hasWebCodecs()) {
    try {
      // WebCodecs 的 ImageEncoder 接口在不同浏览器实现细节存在差异；
      // 这里采用安全回退：如抛错则降级到 toBlob。
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ImageEncoderCtor: any = (globalThis as any).ImageEncoder
      if (ImageEncoderCtor) {
        const width = (canvas as any).width
        const height = (canvas as any).height
        const encoder = new ImageEncoderCtor({ type: mime, quality: q, width, height })
        // 将画布转为 ImageBitmap 作为源
        const bitmap = await (globalThis as any).createImageBitmap?.(canvas)
        if (bitmap) {
          const result = await encoder.encode(bitmap)
          const blob = new Blob([result.data], { type: mime })
          bitmap.close?.()
          return blob
        }
      }
    } catch {
      // ignore; fallback below
    }
  }

  // Canvas 回退
  return new Promise<Blob>((resolve, reject) => {
    try {
      // @ts-expect-error toBlob 存在于 HTMLCanvasElement；OffscreenCanvas 通过 convertToBlob
      if (typeof (canvas as HTMLCanvasElement).toBlob === 'function') {
        (canvas as HTMLCanvasElement).toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('toBlob 返回空'))
        }, mime, q)
        return
      }
      if (typeof (canvas as OffscreenCanvas).convertToBlob === 'function') {
        (canvas as OffscreenCanvas).convertToBlob({ type: mime, quality: q }).then(resolve, reject)
        return
      }
    } catch (err) {
      reject(err as Error)
      return
    }
    reject(new Error('不支持的画布编码方式'))
  })
}

