import type { Tone } from './theme'

const TONES: Tone[] = ['indigo', 'violet', 'blue', 'emerald', 'amber', 'rose']

/** Chữ viết tắt từ tên (2 ký tự). */
export function initialsOf(name?: string): string {
  return (
    (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

/** Tone ổn định theo seed (id/email) để màu avatar nhất quán. */
export function toneOf(seed?: string): Tone {
  const s = seed ?? ''
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return TONES[h % TONES.length]
}
