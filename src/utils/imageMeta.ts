export interface Dim { width: number; height: number }

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp"])

export function isSupportedType(type: string): boolean {
  return SUPPORTED.has(type)
}

interface DecodeResult {
  width: number
  height: number
  source: CanvasImageSource
  cleanup: () => void
}

async function decodeImage(file: File): Promise<DecodeResult> {
  if ('createImageBitmap' in window) {
    const bitmap = await createImageBitmap(file)
    const cleanup = () => {
      if ('close' in bitmap) {
        try { (bitmap as ImageBitmap).close() } catch { /* noop */ }
      }
    }
    return { width: bitmap.width, height: bitmap.height, source: bitmap, cleanup }
  }

  const objectUrl = URL.createObjectURL(file)
  const img = new Image()
  img.decoding = 'async'
  img.src = objectUrl
  try {
    await img.decode()
    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
    }
    return { width: img.naturalWidth, height: img.naturalHeight, source: img, cleanup }
  } catch (err) {
    URL.revokeObjectURL(objectUrl)
    throw err
  }
}

interface ThumbnailOptions {
  maxEdge: number
  mime: string
  quality: number
}

function pickThumbnailMime(type: string): ThumbnailOptions['mime'] {
  if (type === 'image/png') return 'image/png'
  if (type === 'image/webp') return 'image/webp'
  return 'image/jpeg'
}

function renderThumbnail(
  source: CanvasImageSource,
  srcWidth: number,
  srcHeight: number,
  opts: ThumbnailOptions,
): string | null {
  const scale = Math.min(1, opts.maxEdge / Math.max(srcWidth, srcHeight))
  const width = Math.max(1, Math.round(srcWidth * scale))
  const height = Math.max(1, Math.round(srcHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(source, 0, 0, width, height)

  try {
    return canvas.toDataURL(opts.mime, opts.quality)
  } catch {
    try {
      return canvas.toDataURL()
    } catch {
      return null
    }
  }
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('无法生成数据 URL'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('读取文件失败'))
    reader.readAsDataURL(file)
  })
}

export interface ImageMetaWithPreview extends Dim {
  previewUrl: string
}

export async function extractImageMeta(
  file: File,
  options: { maxEdge?: number } = {},
): Promise<ImageMetaWithPreview> {
  const maxEdge = Math.max(1, options.maxEdge ?? 160)
  const { width, height, source, cleanup } = await decodeImage(file)
  try {
    const mime = pickThumbnailMime(file.type)
    let previewUrl = renderThumbnail(source, width, height, { maxEdge, mime, quality: 0.82 })
    if (!previewUrl) {
      previewUrl = await fileToDataURL(file)
    }
    return { width, height, previewUrl }
  } finally {
    cleanup()
  }
}

export async function getImageDimensions(file: File): Promise<Dim> {
  const { width, height, cleanup } = await decodeImage(file)
  cleanup()
  return { width, height }
}
