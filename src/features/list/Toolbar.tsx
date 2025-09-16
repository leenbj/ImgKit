import { useState } from 'react'
import { useAppStore } from '@/state/store'
import { makeZip } from '@/services/zip'

export default function Toolbar() {
  const queue = useAppStore((s) => s.queue)
  const [progress, setProgress] = useState(0)

  const selectedIds = useAppStore((s) => s.selectedIds)
  const done = queue.filter((i) => i.status === 'done')
  const anyDone = done.length > 0
  const selectedDone = done.filter((d) => selectedIds.has(d.meta.id))
  const anySelectedDone = selectedDone.length > 0
  const selectAll = useAppStore((s) => s.selectAll)
  const clearSelection = useAppStore((s) => s.clearSelection)

  const [zipping, setZipping] = useState(false)

  async function zipAll() {
    if (!anyDone || zipping) return
    setZipping(true)
    try {
      const { name, blob } = await makeZip(done, undefined, setProgress)
      const a = document.createElement('a')
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
      setProgress(0)
    }
  }

  async function zipSelected() {
    if (!anySelectedDone || zipping) return
    setZipping(true)
    try {
      const { name, blob } = await makeZip(selectedDone, undefined, setProgress)
      const a = document.createElement('a')
      const url = URL.createObjectURL(blob)
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
      setProgress(0)
    }
  }

  return (
    <div className="card p-3 flex items-center gap-3 justify-between">
      <div className="text-sm opacity-80">总计 {queue.length} 项 ｜ 已完成 {done.length} 项 ｜ 已选 {selectedIds.size} 项</div>
      <div className="flex items-center gap-2">
        <button className="btn" onClick={() => selectAll()}>全选</button>
        <button className="btn" onClick={() => clearSelection()}>清空选择</button>
        <button className="btn" disabled={!anySelectedDone || zipping} onClick={() => void zipSelected()}>
          {zipping ? `打包中 ${Math.round(progress)}%` : '下载所选 ZIP'}
        </button>
        <button className="btn" disabled={!anyDone || zipping} onClick={() => void zipAll()}>
          {zipping ? `打包中 ${Math.round(progress)}%` : '下载全部 ZIP'}
        </button>
      </div>
    </div>
  )
}
