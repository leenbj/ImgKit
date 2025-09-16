export function sliderAria(value: number, label: string, min = 0, max = 100) {
  return {
    role: 'slider',
    'aria-label': label,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-valuenow': value,
    'aria-valuetext': `${value}%`,
  }
}

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

