import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ImageItemState } from '@/state/types'
import { useAppStore } from '@/state/store'
import { cancelItem, processItem } from '@/services/process'
import { sliderAria } from '@/a11y/a11y'
import { downloadItem } from '@/services/download'
import ComparePreview from '@/features/preview/ComparePreview'
import { getSource } from '@/services/source'

function fmtBytes(n?: number) {
  if (!n && n !== 0) return '-'
  const units = ['B','KB','MB','GB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${i===0? v : v.toFixed(1)} ${units[i]}`
}

export default function ItemCard({ item }: { item: ImageItemState }) {
  const removeById = useAppStore((s) => s.removeById)
  const setItemOverride = useAppStore((s) => s.setItemOverride)
  const selected = useAppStore((s) => s.selectedIds.has(item.meta.id))
  const toggleSelect = useAppStore((s) => s.toggleSelect)

  const id = item.meta.id
  const inProgress = item.status === 'processing'
  const canCancel = item.status === 'queued' || inProgress
  const canRetry = item.status === 'error'
  const canDownload = item.status === 'done' && !!(item.result?.blob || item.result?.url)
  const canPreview = !!item.result?.url
  const intensity = item.override?.encode?.intensity ?? useAppStore.getState().settings.encode.intensity
  const dimensionLabel = `${item.meta.width}×${item.meta.height}`

  const [previewOpen, setPreviewOpen] = useState(false)
  const [origPreviewUrl, setOrigPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!previewOpen) return
    const file = getSource(id)
    if (!file) {
      setOrigPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setOrigPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
      setOrigPreviewUrl(null)
    }
  }, [previewOpen, id])

  useEffect(() => {
    if (!previewOpen) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [previewOpen])

  useEffect(() => {
    if (previewOpen && !canPreview) {
      setPreviewOpen(false)
    }
  }, [previewOpen, canPreview])

  const compareSize = useMemo(() => {
    const maxWidth = 720
    const maxHeight = 480
    const srcWidth = Math.max(1, item.meta.width || 1)
    const srcHeight = Math.max(1, item.meta.height || 1)
    const scale = Math.min(1, maxWidth / srcWidth, maxHeight / srcHeight)
    return {
      width: Math.round(srcWidth * scale),
      height: Math.round(srcHeight * scale),
    }
  }, [item.meta.width, item.meta.height])

  const previewPortal = previewOpen && typeof document !== 'undefined'
    ? createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
          onClick={() => setPreviewOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-lg bg-white p-4 shadow-xl dark:bg-gray-900 dark:text-gray-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-2 dark:border-white/10">
              <div>
                <div className="text-base font-semibold">对比预览</div>
                <div className="mt-1 truncate text-xs opacity-70">{item.meta.name}</div>
              </div>
              <button className="btn" onClick={() => setPreviewOpen(false)}>
                关闭
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {origPreviewUrl && item.result?.url ? (
                <ComparePreview
                  orig={origPreviewUrl}
                  result={item.result.url}
                  width={compareSize.width}
                  height={compareSize.height}
                />
              ) : (
                <div className="py-16 text-center text-sm opacity-80">无法加载对比内容</div>
              )}
              <div className="text-xs opacity-80">
                原始 {fmtBytes(item.meta.size)}
                {item.result?.size ? ` ｜ 结果 ${fmtBytes(item.result.size)}` : ''}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <div className={`card p-4 flex gap-4 items-center ${selected ? 'ring-2 ring-emerald-400' : ''}`}>
        <input aria-label="选择" type="checkbox" checked={selected} onChange={() => toggleSelect(id)} />
        <div className="relative w-16 h-16 overflow-hidden rounded bg-slate-200 text-xs text-slate-100">
          {item.meta.previewUrl ? (
            <img src={item.meta.previewUrl} alt={`${item.meta.name} 缩略图`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-600">{dimensionLabel}</div>
          )}
          <div className="absolute bottom-0 right-0 bg-black/60 px-1 text-[10px] leading-tight text-white">
            {dimensionLabel}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="truncate font-medium">{item.meta.name}</div>
            <div className="text-xs opacity-70">{item.status}</div>
          </div>
          <div className="mt-1 text-xs opacity-80">
            原始 {fmtBytes(item.meta.size)}
            {item.estimate?.outSize ? ` ｜ 预计 ${fmtBytes(item.estimate.outSize)} (${Math.round((item.estimate.ratio ?? 0) * 100)}%)` : ''}
            {item.result?.size ? ` ｜ 实际 ${fmtBytes(item.result.size)}` : ''}
          </div>
          <div className="mt-2 flex items-center gap-3">
            <label className="text-xs opacity-80">强度 {intensity}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={intensity}
              className="w-48"
              {...sliderAria(intensity, '单项压缩强度')}
              onChange={(e) => setItemOverride(id, { encode: { intensity: Number(e.target.value) } })}
            />
            <div className="flex-1 h-2 rounded bg-slate-200 overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${item.progress}%` }} />
            </div>
            <div className="w-10 text-right text-xs opacity-70">{Math.round(item.progress)}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" disabled={!canPreview} onClick={() => setPreviewOpen(true)}>
            预览
          </button>
          <button className="btn" disabled={!canDownload} onClick={() => downloadItem(item)}>
            下载
          </button>
          <button className="btn" onClick={() => removeById(id)}>
            删除
          </button>
          {canCancel && (
            <button className="btn" onClick={() => cancelItem(id)}>
              取消
            </button>
          )}
          {canRetry && (
            <button className="btn" onClick={() => void processItem(item)}>
              重试
            </button>
          )}
        </div>
      </div>
      {previewPortal}
    </>
  )
}
