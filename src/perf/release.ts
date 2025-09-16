export function safeRevoke(url?: string) {
  try { if (url) URL.revokeObjectURL(url) } catch {}
}

export function disposeBitmap(bmp: any) {
  try { bmp?.close?.() } catch {}
}

export function dropCanvas(ref: { current?: any }) {
  if (!ref) return
  // 释放引用以便 GC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(ref as any).current = null
}

