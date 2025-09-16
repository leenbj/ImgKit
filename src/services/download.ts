import type { ImageItemState } from '@/state/types'

function extForMimeOrFormat(fmt?: string): string {
  if (!fmt) return 'jpg'
  if (fmt.includes('jpeg') || fmt === 'jpeg') return 'jpg'
  if (fmt.includes('png') || fmt === 'png') return 'png'
  if (fmt.includes('webp') || fmt === 'webp') return 'webp'
  return 'jpg'
}

export function buildFileName(meta: ImageItemState['meta'], fmt?: string): string {
  const base = meta.name.replace(/\.[^.]+$/, '')
  const ext = extForMimeOrFormat(fmt || meta.type)
  return `${base}-compressed.${ext}`
}

export async function downloadBlob(name: string, blob: Blob) {
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  try {
    a.href = url
    a.download = name
    a.rel = 'noopener'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
  } finally {
    URL.revokeObjectURL(url)
    a.remove()
  }
}

export async function downloadItem(item: ImageItemState) {
  const name = buildFileName(item.meta, item.result?.name || item.meta.type)
  if (item.result?.blob) return downloadBlob(name, item.result.blob)
  if (item.result?.url) {
    const res = await fetch(item.result.url)
    const blob = await res.blob()
    return downloadBlob(name, blob)
  }
  throw new Error('该条目尚无可下载结果')
}

