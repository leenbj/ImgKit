import type { WatermarkSettings, WatermarkImage, WatermarkText } from '@/state/types'

export interface Placement { x: number; y: number }

export interface PlacementPlan {
  angleRad: number
  diagW: number
  diagH: number
  stepX: number
  stepY: number
  positions: Placement[]
}

export interface TileSize { width: number; height: number }

function toRad(deg: number): number { return (deg * Math.PI) / 180 }

export function computeTileSizeFromText(text: WatermarkText, scale: number, margin: number): TileSize {
  const fontSize = Math.max(8, Math.round((text.fontSize ?? 24) * scale))
  const charW = Math.max(1, Math.round(fontSize * 0.6))
  const textW = Math.max(1, Math.round((text.text?.length ?? 6) * charW))
  const textH = fontSize
  const width = textW + margin * 2
  const height = textH + margin * 2
  return { width, height }
}

export function computeTileSizeFromImage(img: WatermarkImage, scale: number, margin: number): TileSize {
  const baseW = img.width ?? 240
  const baseH = img.height ?? 120
  const width = Math.max(1, Math.round(baseW * scale + margin * 2))
  const height = Math.max(1, Math.round(baseH * scale + margin * 2))
  return { width, height }
}

export function computeDiagonal(outW: number, outH: number, angleRad: number): { diagW: number; diagH: number } {
  const c = Math.abs(Math.cos(angleRad))
  const s = Math.abs(Math.sin(angleRad))
  const diagW = outW * c + outH * s
  const diagH = outW * s + outH * c
  return { diagW, diagH }
}

export function computePlacements(
  outW: number,
  outH: number,
  tileW: number,
  tileH: number,
  angleDeg: number,
  spacing: number,
  margin: number,
): PlacementPlan {
  const angleRad = toRad(angleDeg % 360)
  const { diagW, diagH } = computeDiagonal(outW, outH, angleRad)
  const stepX = Math.max(4, tileW + spacing)
  const stepY = Math.max(4, tileH + spacing)

  const startX = -margin
  const startY = -margin
  const endX = Math.ceil(diagW + margin)
  const endY = Math.ceil(diagH + margin)

  const positions: Placement[] = []
  for (let y = startY; y < endY; y += stepY) {
    for (let x = startX; x < endX; x += stepX) {
      positions.push({ x, y })
    }
  }

  return { angleRad, diagW, diagH, stepX, stepY, positions }
}

// --- 运行时绘制 ---

function pickCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  const c = document.createElement('canvas')
  c.width = width; c.height = height
  return c
}

export interface DrawResources {
  imageBitmap?: ImageBitmap
  image?: HTMLImageElement
}

function makeTileCanvasForText(text: WatermarkText, scale: number, margin: number): HTMLCanvasElement | OffscreenCanvas {
  const tile = computeTileSizeFromText(text, scale, margin)
  const canvas = pickCanvas(tile.width, tile.height)
  // @ts-expect-error 统一获取 2D 上下文
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  const fontSize = Math.max(8, Math.round((text.fontSize ?? 24) * scale))
  ctx.clearRect(0, 0, tile.width, tile.height)
  ctx.fillStyle = text.color ?? '#000'
  ctx.font = `${text.fontWeight ?? 400} ${fontSize}px ${text.fontFamily ?? 'system-ui, sans-serif'}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text.text ?? 'WATERMARK', tile.width / 2, tile.height / 2)
  return canvas
}

function makeTileCanvasForImage(img: DrawResources, size: TileSize): HTMLCanvasElement | OffscreenCanvas | null {
  const src = img.imageBitmap ?? img.image
  if (!src) return null
  const canvas = pickCanvas(size.width, size.height)
  // @ts-expect-error 统一获取 2D 上下文
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
  ctx.clearRect(0, 0, size.width, size.height)
  const w = 'width' in src ? (src as any).width : (src as any).naturalWidth
  const h = 'height' in src ? (src as any).height : (src as any).naturalHeight
  const scaleX = (size.width) / Math.max(1, w)
  const scaleY = (size.height) / Math.max(1, h)
  const s = Math.min(scaleX, scaleY)
  const drawW = Math.round(w * s)
  const drawH = Math.round(h * s)
  const dx = Math.round((size.width - drawW) / 2)
  const dy = Math.round((size.height - drawH) / 2)
  // @ts-expect-error drawImage 兼容 ImageBitmap/HTMLImageElement
  ctx.drawImage(src, dx, dy, drawW, drawH)
  return canvas
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  outW: number,
  outH: number,
  settings: WatermarkSettings,
  res?: DrawResources,
) {
  if (!settings || settings.mode === 'off') return
  const angle = settings.angle ?? 30
  const spacing = Math.max(0, settings.spacing ?? 240)
  const scale = Math.max(0.1, settings.scale ?? 1)
  const margin = Math.max(0, settings.margin ?? 24)
  const opacity = Math.max(0, Math.min(1, settings.opacity ?? 0.14))

  let tileSize: TileSize | null = null
  let tileCanvas: HTMLCanvasElement | OffscreenCanvas | null = null
  if (settings.mode === 'text') {
    tileSize = computeTileSizeFromText(settings.text ?? { text: 'WATERMARK' }, scale, margin)
    tileCanvas = makeTileCanvasForText(settings.text ?? { text: 'WATERMARK' }, scale, margin)
  } else if (settings.mode === 'image') {
    tileSize = computeTileSizeFromImage(settings.image ?? { src: '', width: 240, height: 120 }, scale, margin)
    tileCanvas = makeTileCanvasForImage(res ?? {}, tileSize)
    if (!tileCanvas) return
  }

  const plan = computePlacements(outW, outH, tileSize.width, tileSize.height, angle, spacing, margin)

  ctx.save()
  ctx.globalAlpha = opacity
  // 将坐标原点移至中心，便于旋转
  ctx.translate(outW / 2, outH / 2)
  ctx.rotate(plan.angleRad)
  // 左上起点
  const originX = -plan.diagW / 2
  const originY = -plan.diagH / 2
  // @ts-expect-error 统一 2D ctx
  const tileCtx = (tileCanvas as any).getContext ? undefined : undefined
  for (const p of plan.positions) {
    // @ts-expect-error drawImage 支持 OffscreenCanvas/HTMLCanvas
    ctx.drawImage(tileCanvas, Math.round(originX + p.x), Math.round(originY + p.y))
  }
  ctx.restore()
}

