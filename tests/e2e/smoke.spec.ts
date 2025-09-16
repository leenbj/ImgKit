import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { useAppStore } from '../../src/state/store'
import type { WorkerInMessage, WorkerLike, WorkerOutMessage } from '../../src/worker/types'
import { processAllQueued } from '../../src/services/process'
import { addSources } from '../../src/services/source'
import { makeZip } from '../../src/services/zip'

class MockWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<WorkerOutMessage>) => void) | null = null
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  terminated = false

  postMessage(message: WorkerInMessage) {
    if (this.terminated) return
    if (message.type === 'process') {
      const { meta } = message
      // 模拟进度与完成
      setTimeout(() => this.onmessage?.({ data: { type: 'progress', id: meta.id, progress: 50 } } as any), 1)
      setTimeout(() => {
        const blob = new Blob([new Uint8Array([1, 2, 3])], { type: meta.type })
        this.onmessage?.({ data: { type: 'done', id: meta.id, result: { blob, blobSize: blob.size, name: meta.name } } } as any)
      }, 2)
    }
  }
  terminate() { this.terminated = true }
}

vi.mock('../../src/worker/factory', () => ({
  createWorker: () => new MockWorker(),
}))

describe('smoke: 上传→处理→打包', () => {
  const origCreateObjectURL = globalThis.URL.createObjectURL
  beforeAll(() => {
    // URL.createObjectURL stub，避免 Node 环境不支持
    // @ts-expect-error
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
  })
  afterAll(() => {
    // @ts-expect-error
    globalThis.URL.createObjectURL = origCreateObjectURL
  })

  it('处理队列后转为 done，并可打包 ZIP', async () => {
    // 清空状态
    useAppStore.setState({ queue: [], selectedIds: new Set() })
    // 注入 2 个文件元数据与源
    const items = [
      { id: 'f1', name: 'a.png', type: 'image/png', size: 1234, width: 100, height: 80 },
      { id: 'f2', name: 'b.png', type: 'image/png', size: 2345, width: 200, height: 150 },
    ]
    useAppStore.getState().addFiles(items as any)
    addSources(items.map((m) => ({ id: m.id, file: new File([new Uint8Array([9,8,7])], m.name, { type: m.type }) })))

    // 处理
    processAllQueued()
    await new Promise((r) => setTimeout(r, 10))

    const q = useAppStore.getState().queue
    expect(q.every((it) => it.status === 'done')).toBe(true)
    expect(q.every((it) => (it.result?.size ?? 0) > 0)).toBe(true)

    // 打包 ZIP（全部）
    const { blob } = await makeZip(q)
    expect(blob.size).toBeGreaterThan(0)
  })
})

