import { clampToRink } from './geometry'
import { basePlayers } from './players'
import { PLAYER_IDS, type BoardState, type PlayerId } from './types'

const isId = (v: unknown): v is PlayerId => typeof v === 'string' && (PLAYER_IDS as string[]).includes(v)
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/**
 * Rebuild a board from untrusted JSON (localStorage). Anything malformed falls
 * back to the default for that player; returns null if the shape is unusable.
 */
export function parseBoard(raw: unknown): BoardState | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.players)) return null
  const byId = new Map<string, Record<string, unknown>>()
  for (const p of r.players) if (p && typeof p === 'object' && isId((p as { id?: unknown }).id)) byId.set((p as { id: string }).id, p)
  if (byId.size === 0) return null

  const players = basePlayers().map((base) => {
    const p = byId.get(base.id)
    if (!p) return base
    const x = num(p.x)
    const y = num(p.y)
    const pos = x !== null && y !== null ? clampToRink({ x, y }, 0) : base
    const h = num(p.h)
    const fa = num(p.fa)
    return {
      ...base,
      x: pos.x,
      y: pos.y,
      h: h === null ? null : ((h % 360) + 360) % 360,
      fa: fa === null ? undefined : ((fa % 360) + 360) % 360,
      off: p.off === true,
    }
  })

  const puck = isId(r.puck) ? r.puck : null
  const lx = num((r.loose as { x?: unknown } | null)?.x)
  const ly = num((r.loose as { y?: unknown } | null)?.y)
  const loose = !puck && lx !== null && ly !== null ? clampToRink({ x: lx, y: ly }, 0) : null
  const me = isId(r.me) && players.find((p) => p.id === r.me)?.team === 'us' ? r.me : 'rw'
  return { players, puck, loose, me }
}
