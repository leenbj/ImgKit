import { useEffect } from 'react'
import AppShell from './app/AppShell'
import UploadZone from './features/upload/UploadZone'
import FileList from './features/list/FileList'
import { initSettingsPersistence } from './services/persist'
import { useAppStore } from './state/store'
import { processAllQueued } from './services/process'

export default function App() {
  const intensity = useAppStore((s) => s.settings.encode.intensity)
  const setIntensity = useAppStore((s) => s.setIntensity)
  const processingEnabled = useAppStore((s) => s.processingEnabled)
  const toggleProcessing = useAppStore((s) => s.toggleProcessing)

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
      <button
        className="btn"
        onClick={() => {
          const next = !processingEnabled
          toggleProcessing()
          if (next) {
            try { processAllQueued() } catch {}
          }
        }}
      >
        {processingEnabled ? '暂停压缩' : '开始压缩'}
      </button>
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
