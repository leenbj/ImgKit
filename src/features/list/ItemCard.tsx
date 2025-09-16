import type { ImageItemState } from '@/state/types'
import { useAppStore } from '@/state/store'
import { cancelItem, processItem } from '@/services/process'
import { sliderAria } from '@/a11y/a11y'
import { downloadItem } from '@/services/download'

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
  const intensity = item.override?.encode?.intensity ?? useAppStore.getState().settings.encode.intensity

  return (
    <div className={`card p-4 flex gap-4 items-center ${selected ? 'ring-2 ring-emerald-400' : ''}`}>
      <input aria-label="选择" type="checkbox" checked={selected} onChange={() => toggleSelect(id)} />
      <div className="w-16 h-16 rounded bg-slate-200 flex items-center justify-center text-slate-600 text-sm">
        {item.meta.width}×{item.meta.height}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="truncate font-medium">{item.meta.name}</div>
          <div className="text-xs opacity-70">{item.status}</div>
        </div>
        <div className="text-xs opacity-80 mt-1">
          原始 {fmtBytes(item.meta.size)}
          {item.estimate?.outSize ? ` ｜ 预计 ${fmtBytes(item.estimate.outSize)} (${Math.round((item.estimate.ratio ?? 0)*100)}%)` : ''}
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
          <div className="flex-1 h-2 bg-slate-200 rounded overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${item.progress}%` }} />
          </div>
          <div className="w-10 text-right text-xs opacity-70">{Math.round(item.progress)}%</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn" disabled={!item.result?.size} onClick={() => { if (item.result?.url) window.open(item.result.url, '_blank') }}>预览</button>
        <button className="btn" disabled={!canDownload} onClick={() => downloadItem(item)}>下载</button>
        <button className="btn" onClick={() => removeById(id)}>删除</button>
        {canCancel && <button className="btn" onClick={() => cancelItem(id)}>取消</button>}
        {canRetry && <button className="btn" onClick={() => void processItem(item)}>重试</button>}
      </div>
    </div>
  )
}
