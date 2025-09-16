import { WorkerPool } from '@/worker/pool'
import { createWorker } from '@/worker/factory'
import type { ProcessMeta, ProcessSettings } from '@/worker/types'
import { useAppStore } from '@/state/store'
import type { ImageItemState } from '@/state/types'
import { getSource } from '@/services/source'

let pool: WorkerPool | null = null

function ensurePool(): WorkerPool {
  const s = useAppStore.getState()
  if (!pool) {
    pool = new WorkerPool(() => createWorker(), {
      size: Math.max(1, Math.min(4, s.settings.concurrency || 2)),
      retryLimit: 1,
    })
  }
  return pool
}

export function disposeProcessPool() {
  pool?.dispose()
  pool = null
}

function buildMeta(item: ImageItemState): ProcessMeta {
  const { id, name, type, size, width, height } = item.meta
  return { id, name, type, size, width, height }
}

function buildSettings(item: ImageItemState): ProcessSettings {
  const s = useAppStore.getState().settings
  // 合并全局与单项覆盖（占位；后续按 encode/size/crop/watermark 细化）
  return {
    encode: { ...s.encode, ...(item.override?.encode ?? {}) },
    size: { ...s.size, ...(item.override?.size ?? {}) },
    crop: { ...s.crop, ...(item.override?.crop ?? {}) },
    watermark: { ...s.watermark, ...(item.override?.watermark ?? {}) },
  }
}

export async function processItem(item: ImageItemState) {
  const p = ensurePool()
  const meta = buildMeta(item)
  const settings = buildSettings(item)
  const { markProgress, markDone, markError, markCanceled } = useAppStore.getState()

  const file = getSource(meta.id)
  if (!file) {
    markError(meta.id, '找不到源文件，无法处理')
    return { id: meta.id, cancel: () => {} }
  }
  const buf = await file.arrayBuffer()

  return p.enqueue({
    meta,
    settings,
    data: buf,
    transfer: [buf],
    onProgress: (progress) => markProgress(meta.id, progress),
    onCompleted: (result) => {
      const url = result.blob ? URL.createObjectURL(result.blob) : undefined
      markDone(meta.id, { name: result.name, size: result.blobSize, blob: result.blob, url })
    },
    onError: (err) => {
      markError(meta.id, err.message)
    },
    onCancelled: () => {
      markCanceled(meta.id)
    },
  })
}

export function cancelItem(id: string) {
  if (!pool) return
  pool.cancel(id)
}

export function processAllQueued() {
  const state = useAppStore.getState()
  const items = state.queue.filter((i) => i.status === 'queued')
  for (const it of items) {
    void processItem(it)
  }
}
