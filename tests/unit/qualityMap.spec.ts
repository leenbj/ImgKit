import { describe, it, expect } from 'vitest'
import { intensityToQuality, normalizeIntensity } from '../../src/core/qualityMap'

describe('qualityMap', () => {
  it('maps intensity to bounded quality', () => {
    expect(intensityToQuality(0)).toBeGreaterThanOrEqual(30)
    expect(intensityToQuality(100)).toBe(30)
    expect(intensityToQuality(50)).toBeGreaterThan(30)
    expect(intensityToQuality(50)).toBeLessThanOrEqual(95)
  })

  it('normalizes intensity', () => {
    expect(normalizeIntensity(-10)).toBe(0)
    expect(normalizeIntensity(150)).toBe(100)
    expect(normalizeIntensity(59.6)).toBe(60)
  })
})

