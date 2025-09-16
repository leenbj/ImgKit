import { useRef, useState } from 'react'
import { useFilePicker } from './useFilePicker'

export default function UploadZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const { onInputChange, onDrop, onDragOver } = useFilePicker({ maxFiles: 200 })
  const [hover, setHover] = useState(false)

  return (
    <div
      onDrop={(e) => { setHover(false); onDrop(e) }}
      onDragOver={(e) => { setHover(true); onDragOver(e) }}
      onDragLeave={() => setHover(false)}
      className={`card p-8 text-center cursor-pointer ${hover ? 'ring-2 ring-emerald-400' : ''}`}
      onClick={() => inputRef.current?.click()}
      role="button"
      aria-label="上传图片"
      tabIndex={0}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onInputChange} />
      <div className="text-lg">拖拽图片到此处，或点击选择文件</div>
      <div className="text-sm opacity-70 mt-2">支持 JPEG / PNG / WebP，最多 200 张</div>
    </div>
  )
}

