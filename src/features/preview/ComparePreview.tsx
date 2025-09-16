import { useMemo, useState } from 'react'

export default function ComparePreview({ orig, result, width = 480, height = 320, mode = 'split' as const }: {
  orig: string
  result: string
  width?: number
  height?: number
  mode?: 'split' | 'side-by-side'
}) {
  const [pos, setPos] = useState(50)

  const containerStyle: React.CSSProperties = useMemo(() => ({
    width, height, position: 'relative', overflow: 'hidden', borderRadius: 8,
  }), [width, height])

  if (mode === 'side-by-side') {
    return (
      <div className="flex gap-2">
        <img src={orig} alt="原图" width={width} height={height} className="rounded" />
        <img src={result} alt="结果" width={width} height={height} className="rounded" />
      </div>
    )
  }

  // split 模式
  return (
    <div>
      <div style={containerStyle}>
        <img src={orig} alt="原图" width={width} height={height} style={{ position: 'absolute', inset: 0, objectFit: 'contain', width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', inset: 0, width: `${pos}%`, overflow: 'hidden' }}>
          <img src={result} alt="结果" width={width} height={height} style={{ position: 'absolute', inset: 0, objectFit: 'contain', width: '100%', height: '100%' }} />
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs opacity-70">原图</span>
        <input type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))} />
        <span className="text-xs opacity-70">结果</span>
      </div>
    </div>
  )
}

