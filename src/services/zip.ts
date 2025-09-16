import JSZip from 'jszip'
import type { ImageItemState } from '@/state/types'
import { buildFileName } from './download'

export async function makeZip(items: ImageItemState[], zipName?: string, onProgress?: (percent: number) => void): Promise<{ name: string; blob: Blob }> {
  const zip = new JSZip()
  const doneItems = items.filter((i) => i.status === 'done' && (i.result?.blob || i.result?.url))
  for (const it of doneItems) {
    let blob: Blob
    if (it.result?.blob) blob = it.result.blob
    else {
      const res = await fetch(it.result!.url!)
      blob = await res.blob()
    }
    const name = buildFileName(it.meta, it.result?.name || it.meta.type)
    zip.file(name, blob)
  }

  const name = zipName || `compressed-${new Date().toISOString().slice(0,16).replace(/[:T]/g,'')}.zip`
  const blob = await zip.generateAsync({ type: 'blob' }, (meta) => {
    if (onProgress) onProgress(meta.percent)
  })
  return { name, blob }
}

