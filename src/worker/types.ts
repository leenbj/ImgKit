export type JobId = string

export interface ProcessSettings {
  // 占位：后续填入 encode/size/crop/watermark 等
  [key: string]: unknown
}

export interface ProcessMeta {
  id: JobId
  name: string
  type: string
  size: number
  width: number
  height: number
}

export type WorkerInMessage =
  | { type: 'process'; meta: ProcessMeta; settings: ProcessSettings }
  | { type: 'cancel'; id: JobId }

export type WorkerOutMessage =
  | { type: 'progress'; id: JobId; progress: number }
  | { type: 'done'; id: JobId; result: { blobSize: number; name: string } }
  | { type: 'error'; id: JobId; message: string }

