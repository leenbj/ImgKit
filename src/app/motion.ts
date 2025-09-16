export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type AnimateOptions = KeyframeAnimationOptions & { enabled?: boolean }

export function animate(el: Element, keyframes: Keyframe[] | PropertyIndexedKeyframes, options: AnimateOptions) {
  if (!el) return null
  if (prefersReducedMotion() || options.enabled === false) return null
  try {
    const anim = (el as HTMLElement).animate(keyframes as Keyframe[], options)
    return anim
  } catch {
    return null
  }
}

