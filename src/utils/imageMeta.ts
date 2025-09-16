export interface Dim { width: number; height: number }

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp"])

export function isSupportedType(type: string): boolean {
  return SUPPORTED.has(type)
}

export async function getImageDimensions(file: File): Promise<Dim> {
  const url = URL.createObjectURL(file)
  try {
    if ('createImageBitmap' in window) {
      const bmp = await createImageBitmap(file)
      const dim = { width: bmp.width, height: bmp.height }
      bmp.close && bmp.close()
      return dim
    }
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { width: img.naturalWidth, height: img.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

