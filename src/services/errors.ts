export type ErrorCategory = 'unsupported' | 'decode' | 'encode' | 'oom' | 'cancelled' | 'unknown'

export function categorize(message: string): ErrorCategory {
  const m = message.toLowerCase()
  if (m.includes('unsupported') || m.includes('not supported')) return 'unsupported'
  if (m.includes('decode')) return 'decode'
  if (m.includes('encode')) return 'encode'
  if (m.includes('memory') || m.includes('oom')) return 'oom'
  if (m.includes('cancelled') || m.includes('canceled')) return 'cancelled'
  return 'unknown'
}

export function userFriendly(message: string): string {
  const cat = categorize(message)
  switch (cat) {
    case 'unsupported': return '格式不受支持，请更换为 JPEG/PNG/WebP'
    case 'decode': return '图片解码失败，请重试或更换文件'
    case 'encode': return '编码失败，可尝试降低强度或调整格式'
    case 'oom': return '内存不足，建议降低尺寸或分批处理'
    case 'cancelled': return '已取消'
    default: return message || '发生未知错误'
  }
}

