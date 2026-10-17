import { clamp, dist } from '../model/geometry'
import { baseState, mustFind } from '../model/players'
import type { BoardState, Player, PlayerId } from '../model/types'

export type Rng = () => number

/**
 * Board under construction for a situation instance. Positions get small random jitter so the
 * same situation never looks exactly the same twice.
 */
export class Builder {
  readonly state: BoardState

  constructor(readonly rng: Rng = Math.random) {
    this.state = baseState()
  }

  rnd(a: number, b: number) {
    return a + this.rng() * (b - a)
  }

  jx(v: number, a = 3) {
    return clamp(v + this.rnd(-a, a), 2, 83)
  }

  jy(v: number, a = 3) {
    return clamp(v + this.rnd(-a, a), 2, 198)
  }

  get(id: PlayerId): Player {
    return mustFind(this.state, id)
  }

  /** Place a player with jitter. h: skating heading (jittered ±15°) or standing; fa: explicit facing. */
  set(id: PlayerId, x: number, y: number, h?: number | null, fa?: number) {
    const p = this.get(id)
    p.x = this.jx(x)
    p.y = this.jy(y)
    p.h = h === undefined || h === null ? null : Math.round((h + this.rnd(-15, 15) + 360) % 360)
    p.fa = typeof fa === 'number' ? fa : p.h !== null ? p.h : undefined
  }

  puck(id: PlayerId | null) {
    this.state.puck = id
  }

  loose(x: number, y: number) {
    this.state.puck = null
    this.state.loose = { x: this.jx(x, 2), y: this.jy(y, 2) }
  }

  off(id: PlayerId) {
    this.get(id).off = true
  }

  /** Your three forwards sorted by distance to the target: F1, F2, F3 by arrival. */
  fwdOrder(targetId: PlayerId): PlayerId[] {
    const t = this.get(targetId)
    return (['c', 'lw', 'rw'] as const)
      .map((id) => this.get(id))
      .sort((a, b) => dist(a, t) - dist(b, t))
      .map((p) => p.id)
  }
}
