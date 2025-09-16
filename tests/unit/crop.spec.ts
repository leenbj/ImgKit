import { describe, it, expect } from 'vitest'
import { computeCropRect, baseCoverScale } from '../../src/core/crop'

describe('crop', () => {
  it('居中裁剪：正方形目标', () => {
    const rect = computeCropRect(4000, 3000, 2000, 2000, { anchor: 'center', x: 0.5, y: 0.5, scale: 1 })
    expect(rect.width).toBe(3000)
    expect(rect.height).toBe(3000)
    expect(rect.x).toBe(500)
    expect(rect.y).toBe(0)
  })

  it('缩放放大（scale>1）时裁剪窗口变小', () => {
    const rect = computeCropRect(4000, 3000, 2000, 2000, { anchor: 'center', x: 0.5, y: 0.5, scale: 2 })
    expect(rect.width).toBeLessThan(3000)
    expect(rect.height).toBeLessThan(3000)
  })
})

