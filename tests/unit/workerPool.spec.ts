import { describe, it, expect, vi } from 'vitest'
import { WorkerPool } from '../../src/worker/pool'
import type {
  WorkerInMessage,
  WorkerLike,
  WorkerOutMessage,
} from '../../src/worker/types'

class MockWorker implements WorkerLike {
  onmessage: ((event: MessageEvent<WorkerOutMessage>) => void) | null = null
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  private terminated = false
  private currentId: string | undefined
  private delay: number

  constructor(delay = 1) {
    this.delay = delay
    setTimeout(() => {
      if (!this.terminated) {
        this.onmessage?.({ data: { type: 'ready' } as WorkerOutMessage } as MessageEvent<WorkerOutMessage>)
      }
    }, 0)
  }

  postMessage(message: WorkerInMessage, _transfer?: Transferable[]) {
    if (this.terminated) return
    if (message.type === 'process') {
      const { meta } = message
      this.currentId = meta.id
      setTimeout(() => {
        if (this.terminated || this.currentId !== meta.id) return
        this.onmessage?.({ data: { type: 'progress', id: meta.id, progress: 50 } } as MessageEvent<WorkerOutMessage>)
        setTimeout(() => {
          if (this.terminated || this.currentId !== meta.id) return
          this.onmessage?.({
            data: { type: 'done', id: meta.id, result: { blobSize: 1, name: meta.name } },
          } as MessageEvent<WorkerOutMessage>)
          this.currentId = undefined
        }, this.delay)
      }, this.delay)
    } else if (message.type === 'cancel') {
      if (this.currentId === message.id) {
        this.currentId = undefined
        this.onmessage?.({ data: { type: 'error', id: message.id, message: 'cancelled', recoverable: true } } as MessageEvent<WorkerOutMessage>)
      }
    }
  }

  terminate() {
    this.terminated = true
  }
}

describe('WorkerPool', () => {
  it('按并发度处理队列并返回完成结果', async () => {
    const pool = new WorkerPool(() => new MockWorker(), { size: 2 })
    const completed: string[] = []

    const jobIds = ['a', 'b', 'c']
    const promises = jobIds.map((id) => new Promise<string>((resolve, reject) => {
      pool.enqueue({
        meta: { id, name: `${id}.png`, type: 'image/png', size: 1000, width: 100, height: 100 },
        settings: {},
        onProgress: () => void 0,
        onCompleted: (result) => {
          completed.push(id)
          resolve(result.name)
        },
        onError: (err) => reject(new Error(err.message)),
      })
    }))

    const results = await Promise.all(promises)
    expect(results).toHaveLength(3)
    expect(completed).toContain('a')
    expect(completed).toContain('b')
    expect(completed).toContain('c')
    // 等待事件队列完全冲刷
    await new Promise((r) => setTimeout(r, 5))
    pool.dispose()
  }, 10000)

  it('支持取消正在执行的任务', async () => {
    const pool = new WorkerPool(() => new MockWorker(10), { size: 1 })

    const cancelled = vi.fn()
    const completed = vi.fn()
    const errored = vi.fn()

    const handle = pool.enqueue({
      meta: { id: 'cancel-me', name: 'cancel.png', type: 'image/png', size: 1000, width: 100, height: 100 },
      settings: {},
      onCompleted: completed,
      onError: errored,
      onCancelled: cancelled,
    })

    // 略等一小段时间以确保任务已开始
    await new Promise((r) => setTimeout(r, 5))
    handle.cancel()
    // 再等待一小段时间让回调执行
    await new Promise((r) => setTimeout(r, 30))

    expect(cancelled).toHaveBeenCalledTimes(1)
    expect(completed).not.toHaveBeenCalled()
    expect(errored).not.toHaveBeenCalled()

    pool.dispose()
  }, 10000)
})
