import { describe, it, expect } from 'vitest'
import { computePlacements, computeTileSizeFromText, computeTileSizeFromImage } from '../../src/core/watermark'

describe('watermark compute', () => {
  it('tile 尺寸（文字）受 scale 与 margin 影响', () => {
    const a = computeTileSizeFromText({ text: 'WM', fontSize: 20 }, 1, 20)
    const b = computeTileSizeFromText({ text: 'WM', fontSize: 20 }, 2, 20)
    const c = computeTileSizeFromText({ text: 'WM', fontSize: 20 }, 1, 40)
    expect(b.width).toBeGreaterThan(a.width)
    expect(c.width).toBeGreaterThan(a.width)
  })

  it('tile 尺寸（图片）受 scale 与 margin 影响', () => {
    const a = computeTileSizeFromImage({ src: '', width: 200, height: 100 }, 1, 20)
    const b = computeTileSizeFromImage({ src: '', width: 200, height: 100 }, 2, 20)
    const c = computeTileSizeFromImage({ src: '', width: 200, height: 100 }, 1, 40)
    expect(b.height).toBeGreaterThan(a.height)
    expect(c.height).toBeGreaterThan(a.height)
  })

  it('角度/间距/尺度影响布点数量（更大间距、更大 tile 产生更少点）', () => {
    const outW = 4000, outH = 3000
    const tileA = { width: 200, height: 80 }
    const tileB = { width: 400, height: 160 }
    const planA = computePlacements(outW, outH, tileA.width, tileA.height, 30, 200, 24)
    const planB = computePlacements(outW, outH, tileB.width, tileB.height, 30, 200, 24)
    const planC = computePlacements(outW, outH, tileA.width, tileA.height, 30, 400, 24)
    expect(planA.positions.length).toBeGreaterThan(planB.positions.length)
    expect(planA.positions.length).toBeGreaterThan(planC.positions.length)
  })

  it('返回的步进和对角尺寸为正数', () => {
    const outW = 1000, outH = 800
    const plan = computePlacements(outW, outH, 240, 120, 45, 200, 24)
    expect(plan.diagW).toBeGreaterThan(outW)
    expect(plan.diagH).toBeGreaterThan(outH)
    expect(plan.stepX).toBeGreaterThan(0)
    expect(plan.stepY).toBeGreaterThan(0)
    expect(plan.positions.length).toBeGreaterThan(0)
  })
})

