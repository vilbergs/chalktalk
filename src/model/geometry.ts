import type { Point } from './types'

/** Rink is 85 x 200 ft. SVG uses 10 units per foot with y flipped. */
export const RINK_W = 85
export const RINK_L = 200
export const S = 10

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
export const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)

export const toSvg = (p: Point) => ({ cx: p.x * S, cy: (RINK_L - p.y) * S })
export const fromSvg = (sx: number, sy: number): Point => ({ x: sx / S, y: RINK_L - sy / S })

/** Degrees, 0 = up ice, 90 = toward the right boards. */
export const headingOf = (dx: number, dy: number) =>
  Math.round(((Math.atan2(dx, dy) * 180) / Math.PI + 360) % 360)

/** Clamp a point to the playable rink with a margin in feet. */
export const clampToRink = (p: Point, margin = 1): Point => ({
  x: clamp(p.x, margin, RINK_W - margin),
  y: clamp(p.y, margin, RINK_L - margin),
})
