import { clamp, clampToRink, headingOf } from '../model/geometry'
import { faceOf, findPlayer } from '../model/players'
import type { BoardState, Plan, Player, PlayerId, Point, Reco } from '../model/types'

/** Plan as authored for a quiz question once resolved: [[id, x, y], ...] in absolute feet. */
export interface AuthoredPlan {
  label: string
  seconds: number
  moves: [PlayerId, number, number][]
  puck: { to: PlayerId | null; at: number }
}

/** Max skating speed used to cap any single move. */
export const MAX_FT_PER_S = 25

export const ease = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2)

export interface PlayerPose extends Point {
  h: number | null
  fa: number
}

/** Where a player is at time t into the plan. */
export function poseAt(p: Player, plan: Plan | null, t: number): PlayerPose {
  const still = { x: p.x, y: p.y, h: p.h, fa: faceOf(p) }
  if (!plan || t <= 0) return still
  const m = plan.moves[p.id]
  if (!m) return still
  const u = ease(Math.min(1, t / plan.seconds))
  const dx = m.x - p.x
  const dy = m.y - p.y
  const moving = Math.abs(dx) + Math.abs(dy) >= 1
  const h = moving ? headingOf(dx, dy) : p.h
  return {
    x: p.x + dx * u,
    y: p.y + dy * u,
    h: u >= 1 ? null : h,
    fa: moving ? (h as number) : faceOf(p),
  }
}

export function holderAt(state: BoardState, plan: Plan | null, t: number): PlayerId | null {
  if (!plan || t <= 0) return state.puck
  return t >= plan.puck.at * plan.seconds ? plan.puck.to : state.puck
}

/** Loosely-typed plan input. Everything is validated in sanitizePlan. */
export interface RawPlan {
  move?: { x?: unknown; y?: unknown; label?: unknown }
  seconds?: unknown
  moves?: unknown
  puck?: { to?: unknown; at?: unknown }
}

/**
 * Validate and clamp a plan: coordinates inside the rink, nobody moves more than seconds x 25 ft,
 * unknown ids dropped. "me" always ends on the target spot.
 */
export function sanitizePlan(state: BoardState, r: RawPlan): { plan: Plan; reco: Reco | null } {
  let reco: Reco | null = null
  const mx = Number(r.move?.x)
  const my = Number(r.move?.y)
  if (Number.isFinite(mx) && Number.isFinite(my)) {
    reco = { ...clampToRink({ x: mx, y: my }), label: String(r.move?.label ?? '') }
  }
  const seconds = clamp(Number(r.seconds) || 3, 1.5, 5)
  const moves: Plan['moves'] = {}
  if (Array.isArray(r.moves)) {
    for (const m of r.moves as { id?: unknown; x?: unknown; y?: unknown }[]) {
      const p = findPlayer(state, String(m?.id))
      const x = Number(m?.x)
      const y = Number(m?.y)
      if (!p || !Number.isFinite(x) || !Number.isFinite(y)) continue
      const dx = x - p.x
      const dy = y - p.y
      const d = Math.hypot(dx, dy)
      const max = seconds * MAX_FT_PER_S
      const k = d > max ? max / d : 1
      moves[p.id] = clampToRink({ x: p.x + dx * k, y: p.y + dy * k })
    }
  }
  if (reco) moves[state.me] = { x: reco.x, y: reco.y }
  const toRaw = r.puck?.to
  const to = toRaw != null && findPlayer(state, String(toRaw)) ? (String(toRaw) as PlayerId) : state.puck
  let at = Number(r.puck?.at)
  if (!Number.isFinite(at)) at = 1
  return { plan: { seconds, moves, puck: { to, at: clamp(at, 0, 1) } }, reco }
}

/** Turn an authored plan into the playback shape, clamped and validated. */
export function fromAuthored(state: BoardState, a: AuthoredPlan) {
  const moves = a.moves.map(([id, x, y]) => ({ id, x, y }))
  const me = moves.find((m) => m.id === state.me) ?? findPlayer(state, state.me)!
  return sanitizePlan(state, {
    move: { x: me.x, y: me.y, label: a.label },
    seconds: a.seconds,
    moves,
    puck: a.puck,
  })
}

/** "Keep end positions": move everyone to where the plan ends and hand over the puck. */
export function commitPlan(state: BoardState, plan: Plan) {
  for (const p of state.players) {
    const m = plan.moves[p.id]
    if (!m) continue
    const dx = m.x - p.x
    const dy = m.y - p.y
    if (Math.abs(dx) + Math.abs(dy) >= 1) p.fa = headingOf(dx, dy)
    p.x = m.x
    p.y = m.y
    p.h = null
  }
  state.puck = plan.puck.to
  if (state.puck) state.loose = null
}
