/// <reference lib="webworker" />

import type { JobId, WorkerInMessage, WorkerOutMessage } from './types'
import { calcTargetSize } from '@/core/resize'
import { computeCropRect } from '@/core/crop'
import { drawWatermark } from '@/core/watermark'
import { encodeFromCanvas, pickMime } from '@/core/encode'

const ctx = self as unknown as DedicatedWorkerGlobalScope

interface TaskState {
  aborted: boolean
  timer?: number
  pendingResolve?: () => void
}

const tasks = new Map<JobId, TaskState>()

function post(message: WorkerOutMessage, transfer?: Transferable[]) {
  ctx.postMessage(message, transfer ?? [])
}

function cleanup(id: JobId) {
  const task = tasks.get(id)
  if (!task) return
  if (task.timer !== undefined) {
    clearTimeout(task.timer)
  }
  task.pendingResolve?.()
  tasks.delete(id)
}

async function pipeline(id: JobId, meta: { type: string; width: number; height: number; name: string }, data: ArrayBuffer, settings: any) {
  const task = tasks.get(id)
  if (!task || task.aborted) return

  // 1) 解码
  try {
    const blob = new Blob([data], { type: meta.type || 'image/jpeg' })
    // @ts-expect-error createImageBitmap 在 Worker 中可用
    const bitmap: ImageBitmap = await createImageBitmap(blob)
    post({ type: 'progress', id, progress: 10 })

    // 2) 尺寸/裁剪
    const sizeSettings = settings.size ?? { enabled: false, fit: 'contain', preventUpscale: true }
    const target = calcTargetSize(bitmap.width, bitmap.height, sizeSettings)
    const outW = target.width
    const outH = target.height

    const canvas = new OffscreenCanvas(outW, outH)
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    if (sizeSettings.enabled && sizeSettings.fit === 'cover') {
      const cropSettings = settings.crop ?? { x: 0.5, y: 0.5, scale: 1, anchor: 'center' }
      const rect = computeCropRect(bitmap.width, bitmap.height, outW, outH, cropSettings)
      // @ts-expect-error drawImage 支持 ImageBitmap
      ctx.drawImage(bitmap, rect.x, rect.y, rect.width, rect.height, 0, 0, outW, outH)
    } else {
      // contain 或未启用：等比缩放到目标尺寸
      // @ts-expect-error drawImage 支持 ImageBitmap
      ctx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, outW, outH)
    }
    post({ type: 'progress', id, progress: 55 })

    // 3) 水印（可选）
    const wm = settings.watermark
    if (wm && wm.mode && wm.mode !== 'off') {
      // @ts-expect-error 2D ctx 与 DOM 类型在 Worker 下兼容 OffscreenCanvas
      drawWatermark(ctx as any, outW, outH, wm)
    }
    post({ type: 'progress', id, progress: 80 })

    // 4) 编码
    const enc = settings.encode ?? { format: 'jpeg', quality: 90 }
    const blobOut = await encodeFromCanvas(canvas, enc.format, enc.quality)
    post({ type: 'progress', id, progress: 100 })

    // 5) 返回
    post({ type: 'done', id, result: { blob: blobOut, blobSize: blobOut.size, name: meta.name } })
    // 释放
    bitmap.close?.()
    cleanup(id)
  } catch (err) {
    post({ type: 'error', id, message: (err as Error).message, recoverable: false })
    cleanup(id)
  }
}

ctx.onmessage = (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data
  if (data.type === 'process') {
    const { meta } = data
    const state: TaskState = { aborted: false }
    tasks.set(meta.id, state)
    post({ type: 'progress', id: meta.id, progress: 0 })
    if (!data.data) {
      post({ type: 'error', id: meta.id, message: 'no-data', recoverable: false })
      cleanup(meta.id)
      return
    }
    pipeline(meta.id, { type: meta.type, width: meta.width, height: meta.height, name: meta.name }, data.data, data.settings)
    return
  }

  if (data.type === 'cancel') {
    const task = tasks.get(data.id)
    if (task) {
      task.aborted = true
      if (task.timer !== undefined) {
        clearTimeout(task.timer)
      }
      task.pendingResolve?.()
      task.pendingResolve = undefined
    }
  }
}

post({ type: 'ready' })

export {}
