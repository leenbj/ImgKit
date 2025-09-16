import { describe, it, expect } from 'vitest'
import { pickMime, normalizeToBlobQuality, selectEncoder, hasWebCodecs } from '../../src/core/encode'

describe('encode core', () => {
  it('mime 选择', () => {
    expect(pickMime('jpeg')).toBe('image/jpeg')
    expect(pickMime('png')).toBe('image/png')
    expect(pickMime('webp')).toBe('image/webp')
  })

  it('质量归一到 0.1-0.95', () => {
    expect(normalizeToBlobQuality(5)).toBe(0.1)
    expect(normalizeToBlobQuality(95)).toBe(0.95)
    expect(normalizeToBlobQuality(80)).toBeCloseTo(0.8)
  })

  it('编码器选择：存在 ImageEncoder 时为 webcodecs，否则为 canvas', () => {
    const original = (globalThis as any).ImageEncoder
    try {
      ;(globalThis as any).ImageEncoder = function () {}
      expect(hasWebCodecs()).toBe(true)
      expect(selectEncoder()).toBe('webcodecs')
      delete (globalThis as any).ImageEncoder
      expect(hasWebCodecs()).toBe(false)
      expect(selectEncoder()).toBe('canvas')
    } finally {
      if (original) (globalThis as any).ImageEncoder = original
    }
  })
})

