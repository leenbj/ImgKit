import { describe, it, expect } from 'vitest'
import { contain, cover, calcTargetSize, resolveTargetBox } from '../../src/core/resize'

describe('resize', () => {
  it('contain 方式按短边等比，不放大', () => {
    const r = contain(4000, 3000, 2000, 2000, true)
    expect(r.width).toBe(2000)
    expect(r.height).toBe(1500)
  })

  it('contain 在 preventUpscale 下不放大小图', () => {
    const r = contain(800, 600, 2000, 2000, true)
    expect(r.width).toBe(800)
    expect(r.height).toBe(600)
  })

  it('cover 方式按长边等比，获得覆盖盒子的缩放', () => {
    const r = cover(4000, 3000, 2000, 2000, true)
    expect(r.height).toBe(2000)
    expect(r.width).toBeGreaterThanOrEqual(2660)
  })

  it('根据 SizeSettings 计算目标盒子并输出', () => {
    const s = { enabled: true, fit: 'contain' as const, preventUpscale: true, targetWidth: 2000 }
    const box = resolveTargetBox(4000, 3000, s)
    expect(box.w).toBe(2000)
    const out = calcTargetSize(4000, 3000, s)
    expect(out.width).toBe(2000)
    expect(out.height).toBe(1500)
  })
})

