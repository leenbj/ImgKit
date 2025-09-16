import type {
  JobId,
  ProcessMeta,
  ProcessResult,
  ProcessSettings,
  WorkerCancelMessage,
  WorkerDoneMessage,
  WorkerErrorMessage,
  WorkerInMessage,
  WorkerOutMessage,
  WorkerProcessMessage,
  WorkerProgressMessage,
  WorkerLike,
} from './types'

export interface WorkerPoolOptions {
  size: number
  retryLimit?: number
}

export interface JobCallbacks {
  onProgress?: (progress: number) => void
  onCompleted: (result: ProcessResult) => void
  onError: (error: WorkerErrorMessage) => void
  onCancelled?: () => void
}

export interface EnqueueJob extends JobCallbacks {
  meta: ProcessMeta
  settings: ProcessSettings
  data?: ArrayBuffer
  transfer?: Transferable[]
  signal?: AbortSignal
}

interface InternalJob extends EnqueueJob {
  id: JobId
  transfer?: Transferable[]
  signal?: AbortSignal
  abortHandler?: () => void
}

interface WorkerSlot {
  worker: WorkerLike
  busy: boolean
  currentJobId?: JobId
}

export class WorkerPool {
  private readonly createWorker: () => WorkerLike
  private readonly options: WorkerPoolOptions
  private readonly queue: InternalJob[] = []
  private readonly workers: WorkerSlot[] = []
  private readonly jobMap = new Map<JobId, InternalJob>()
  private readonly retries = new Map<JobId, number>()
  private disposed = false

  constructor(createWorker: () => WorkerLike, options: WorkerPoolOptions) {
    this.createWorker = createWorker
    this.options = options
    const size = Math.max(1, Math.floor(options.size))
    for (let i = 0; i < size; i++) {
      this.workers.push(this.spawnWorker())
    }
  }

  enqueue(job: EnqueueJob): { id: JobId; cancel: () => void } {
    if (this.disposed) {
      throw new Error('WorkerPool 已销毁')
    }
    const id = job.meta.id
    if (job.signal?.aborted) {
      job.onCancelled?.()
      return { id, cancel: () => void 0 }
    }

    const internal: InternalJob = { ...job, id }
    if (job.signal) {
      const abortHandler = () => this.cancel(id)
      job.signal.addEventListener('abort', abortHandler)
      internal.abortHandler = abortHandler
    }

    this.queue.push(internal)
    this.jobMap.set(id, internal)
    this.drainQueue()

    return {
      id,
      cancel: () => this.cancel(id),
    }
  }

  cancel(id: JobId): void {
    const queuedIndex = this.queue.findIndex((j) => j.id === id)
    if (queuedIndex >= 0) {
      const [job] = this.queue.splice(queuedIndex, 1)
      this.cleanupJob(job)
      job.onCancelled?.()
      this.jobMap.delete(id)
      return
    }

    const slotIndex = this.workers.findIndex((slot) => slot.currentJobId === id)
    if (slotIndex >= 0) {
      const slot = this.workers[slotIndex]
      try {
        const message: WorkerCancelMessage = { type: 'cancel', id }
        slot.worker.postMessage(message)
      } catch (err) {
        // 如果取消消息失败，直接回调错误
        const job = this.jobMap.get(id)
        if (job) {
          this.cleanupJob(job)
          job.onError({ type: 'error', id, message: (err as Error).message, recoverable: true })
          this.jobMap.delete(id)
        }
      }
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    // 先取消所有队列中的任务
    while (this.queue.length) {
      const job = this.queue.shift()!
      this.cleanupJob(job)
      job.onCancelled?.()
    }

    // 通知正在执行的任务
    for (const slot of this.workers) {
      if (slot.currentJobId) {
        const job = this.jobMap.get(slot.currentJobId)
        if (job) {
          this.cleanupJob(job)
          job.onCancelled?.()
        }
      }
      slot.worker.terminate()
    }

    this.jobMap.clear()
    this.retries.clear()
  }

  private spawnWorker(): WorkerSlot {
    const worker = this.createWorker()
    const slot: WorkerSlot = { worker, busy: false }

    worker.onmessage = (event) => {
      const data = event.data as WorkerOutMessage
      this.handleMessage(slot, data)
    }
    worker.onmessageerror = () => {
      if (!slot.currentJobId) return
      const job = this.jobMap.get(slot.currentJobId)
      if (!job) return
      this.handleJobError(slot, job, {
        type: 'error',
        id: job.id,
        message: '无法解析来自 Worker 的消息',
        recoverable: false,
      })
    }
    worker.onerror = (event) => {
      if (!slot.currentJobId) return
      const job = this.jobMap.get(slot.currentJobId)
      if (!job) return
      this.handleJobError(slot, job, {
        type: 'error',
        id: job.id,
        message: event.message || 'Worker 执行失败',
        recoverable: false,
      })
    }

    // worker 初始化即视为可用
    return slot
  }

  private drainQueue(): void {
    if (this.disposed) return
    for (const slot of this.workers) {
      if (slot.busy) continue
      const job = this.queue.shift()
      if (!job) break
      this.runJob(slot, job)
    }
  }

  private runJob(slot: WorkerSlot, job: InternalJob): void {
    slot.busy = true
    slot.currentJobId = job.id
    this.jobMap.set(job.id, job)

    try {
      const message: WorkerProcessMessage = {
        type: 'process',
        meta: job.meta,
        settings: job.settings,
        data: job.data,
      }
      slot.worker.postMessage(message, job.transfer ?? [])
    } catch (err) {
      this.handleJobError(slot, job, {
        type: 'error',
        id: job.id,
        message: (err as Error).message,
        recoverable: true,
      })
    }
  }

  private handleMessage(slot: WorkerSlot, data: WorkerOutMessage): void {
    if (data.type === 'ready') {
      // Worker 准备就绪，不影响调度
      return
    }

    const job = data.type === 'progress' || data.type === 'done' || data.type === 'error'
      ? this.jobMap.get(data.id)
      : undefined

    if (!job) return

    switch (data.type) {
      case 'progress':
        this.handleProgress(job, data)
        break
      case 'done':
        this.handleDone(slot, job, data)
        break
      case 'error':
        this.handleJobError(slot, job, data)
        break
      default:
        break
    }
  }

  private handleProgress(job: InternalJob, message: WorkerProgressMessage): void {
    job.onProgress?.(Math.min(100, Math.max(0, message.progress)))
  }

  private handleDone(slot: WorkerSlot, job: InternalJob, message: WorkerDoneMessage): void {
    this.cleanupJob(job)
    this.releaseSlot(slot)
    job.onCompleted(message.result)
    this.drainQueue()
  }

  private handleJobError(slot: WorkerSlot, job: InternalJob, message: WorkerErrorMessage): void {
    const retryLimit = this.options.retryLimit ?? 0
    const attempt = this.retries.get(job.id) ?? 0

    if (message.message === 'cancelled') {
      this.cleanupJob(job)
      this.releaseSlot(slot)
      job.onCancelled?.()
      this.drainQueue()
      return
    }

    if (retryLimit > attempt) {
      this.retries.set(job.id, attempt + 1)
      // 重新排队
      this.releaseSlot(slot)
      this.queue.unshift(job)
      this.drainQueue()
      return
    }

    this.cleanupJob(job)
    this.releaseSlot(slot)
    job.onError(message)
    this.drainQueue()
  }

  private releaseSlot(slot: WorkerSlot): void {
    slot.busy = false
    slot.currentJobId = undefined
  }

  private cleanupJob(job: InternalJob): void {
    if (job.abortHandler && job.signal) {
      job.signal.removeEventListener('abort', job.abortHandler)
    }
    this.jobMap.delete(job.id)
    this.retries.delete(job.id)
  }
}

export type { WorkerOutMessage } from './types'
