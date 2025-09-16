import { useMemo, useState } from 'react'
import AppShell from './app/AppShell'
import UploadZone from './features/upload/UploadZone'

export default function App() {
  const [intensity, setIntensity] = useState(60)
  const est = useMemo(() => ({ beforeKB: 1024, afterKB: Math.round(1024 * (0.4 + (100 - intensity) / 100 * 0.6)) }), [intensity])

  const headerRight = (
    <div className="flex items-center gap-3">
      <label className="text-sm">压缩强度 {intensity}%</label>
      <input
        aria-label="压缩强度"
        type="range"
        className="w-48"
        min={0}
        max={100}
        value={intensity}
        onChange={(e) => setIntensity(Number(e.target.value))}
      />
      <button className="btn">开始压缩</button>
    </div>
  )

  return (
    <AppShell headerRight={headerRight} footer={<span>© {new Date().getFullYear()} Image Compressor</span>}>
      <div className="space-y-6">
        <UploadZone />
        <div className="card p-6">
          <p className="text-sm opacity-80">示例占位：列表、并发压缩与下载将在后续任务实现。</p>
          <div className="mt-4 text-sm">压缩前：{est.beforeKB} KB ｜ 预计压缩后：{est.afterKB} KB</div>
        </div>
      </div>
    </AppShell>
  )
}
