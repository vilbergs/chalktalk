/** Plain-language names for places on the rink, used in quiz feedback. */

export function lateral(x: number) {
  return x < 28 ? 'left side' : x <= 57 ? 'middle' : 'right side'
}

export function depth(y: number) {
  if (y < 11) return 'behind own net'
  if (y < 25) return 'low, near own net'
  if (y < 50) return 'half-wall area of own zone'
  if (y < 75) return 'high in own zone, near own blue line'
  if (y < 100) return 'neutral zone, own half'
  if (y < 125) return 'neutral zone, their half'
  if (y < 150) return 'just inside their blue line'
  if (y < 175) return 'half-wall area of their zone'
  if (y < 189) return 'low, near their net'
  return 'behind their net'
}

export const spotText = (p: { x: number; y: number }) => lateral(p.x) + ', ' + depth(p.y)
