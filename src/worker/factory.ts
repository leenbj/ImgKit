import type { WorkerLike } from './types'

export function createWorker(): WorkerLike {
  // 运行时环境保护（如 SSR）
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    throw new Error('Worker 不可用：非浏览器环境')
  }
  // 通过 Vite 的 URL 方式创建 module worker
  const w = new Worker(new URL('./processor.worker.ts', import.meta.url), { type: 'module' }) as unknown as WorkerLike
  return w
}

