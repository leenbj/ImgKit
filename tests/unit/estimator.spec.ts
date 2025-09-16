import { describe, it, expect } from 'vitest'
import { estimateSize } from '../../src/core/estimator'

describe('estimator', () => {
  it('estimates with area scale and coeff', () => {
    const r = estimateSize({ format: 'jpeg', quality: 70, srcSize: 1_000_000, srcPixels: 4000*3000, targetPixels: 2000*1500 })
    expect(r.estimatedSize).toBeGreaterThan(0)
    expect(r.estimatedSize).toBeLessThan(1_000_000)
    expect(r.ratio).toBeGreaterThan(0)
  })

  it('handles invalid inputs gracefully', () => {
    const r = estimateSize({ format: 'png', quality: 80, srcSize: 0, srcPixels: 0, targetPixels: 0 })
    expect(r.estimatedSize).toBe(0)
    expect(r.ratio).toBe(0)
  })
})

