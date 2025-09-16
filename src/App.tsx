import { useEffect, useMemo, useState } from 'react'
import AppShell from './app/AppShell'
import UploadZone from './features/upload/UploadZone'
import FileList from './features/list/FileList'
import { initSettingsPersistence } from './services/persist'

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
      <InitOnce />
      <div className="space-y-6">
        <UploadZone />
        <FileList />
      </div>
    </AppShell>
  )
}

function InitOnce() {
  useEffect(() => {
    initSettingsPersistence()
  }, [])
  return null
}
