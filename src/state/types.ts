export type ImageId = string

export interface RatioPreset { label: string; w: number; h: number }

export type FitMode = 'contain' | 'cover'

export interface SizeSettings {
  enabled: boolean
  targetWidth?: number
  targetHeight?: number
  ratio?: { w: number; h: number }
  fit: FitMode
  preventUpscale: boolean
}

export interface CropSettings {
  anchor: 'center'|'top'|'bottom'|'left'|'right'|'tl'|'tr'|'bl'|'br'
  x: number
  y: number
  scale: number
}

export interface WatermarkImage { src: string; width?: number; height?: number }
export interface WatermarkText { text: string; fontFamily?: string; fontWeight?: number; fontSize?: number; color?: string }
export type WatermarkMode = 'off' | 'image' | 'text'

export interface WatermarkSettings {
  mode: WatermarkMode
  image?: WatermarkImage
  text?: WatermarkText
  angle: number
  spacing: number
  scale: number
  margin: number
  opacity: number
  applyScope: 'global' | 'override'
}

export interface EncodeSettings {
  format: 'jpeg' | 'png' | 'webp'
  intensity: number // 0-100 用户视角：越大压缩越狠
  quality: number // 10-95 由 intensity 映射
}

export interface ImageItemMeta {
  id: ImageId
  name: string
  type: string
  size: number
  width: number
  height: number
}

export type ItemStatus = 'queued'|'processing'|'done'|'error'|'canceled'

export interface ImageItemState {
  meta: ImageItemMeta
  status: ItemStatus
  progress: number // 0-100
  error?: string
  estimate?: { outSize?: number; ratio?: number }
  result?: { blob?: Blob; size?: number; url?: string; name?: string }
  override?: {
    encode?: Partial<EncodeSettings>
    size?: Partial<SizeSettings>
    crop?: Partial<CropSettings>
    watermark?: Partial<WatermarkSettings>
  }
}

export interface GlobalSettings {
  encode: EncodeSettings
  size: SizeSettings
  crop: CropSettings
  watermark: WatermarkSettings
  concurrency: number
}

