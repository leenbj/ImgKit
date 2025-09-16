export function canUseWebCodecs(): boolean {
  return typeof (globalThis as any).ImageEncoder === 'function'
}

export function canUseOffscreenCanvas(): boolean {
  return typeof (globalThis as any).OffscreenCanvas !== 'undefined'
}

export function hardwareConcurrency(): number {
  // @ts-expect-error navigator may not exist in SSR
  const hc = (typeof navigator !== 'undefined' && (navigator as any).hardwareConcurrency) || 2
  return Math.max(1, Math.min(8, hc))
}

