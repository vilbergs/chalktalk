export type Team = 'us' | 'them'

export type PlayerId =
  | 'rw' | 'c' | 'lw' | 'rd' | 'ld' | 'g'
  | 'orw' | 'oc' | 'olw' | 'ord' | 'old' | 'og'

export const PLAYER_IDS: PlayerId[] = ['rw', 'c', 'lw', 'rd', 'ld', 'g', 'orw', 'oc', 'olw', 'ord', 'old', 'og']

export interface Point {
  x: number
  y: number
}

export interface Player extends Point {
  id: PlayerId
  team: Team
  label: string
  /** Skating heading in degrees, or null when standing still. */
  h: number | null
  /** Facing in degrees, used when standing still. Undefined means "work it out" (see autoFace). */
  fa?: number
  /** Off the ice (penalty kill). */
  off: boolean
}

export interface BoardState {
  players: Player[]
  /** Id of the carrier, or null when the puck is loose. */
  puck: PlayerId | null
  loose: Point | null
  me: PlayerId
}

/** A sequence of a few seconds: where everyone who moves ends up, and who has the puck at the end. */
export interface Plan {
  seconds: number
  moves: Partial<Record<PlayerId, Point>>
  puck: { to: PlayerId | null; at: number }
}

/** The recommended spot for "me", drawn as a target on the rink. */
export interface Reco extends Point {
  label: string
}

/** Quiz overlays drawn on the rink. ok: 2 right, 1 close, 0 wrong, null neutral. */
export type Grade = 0 | 1 | 2
export type Mark =
  | { k: 'target'; x: number; y: number; r1: number; r2: number }
  | { k: 'dot'; x: number; y: number; ok: Grade }
  | { k: 'ring'; id: PlayerId; ok: Grade }
  | { k: 'tag'; id: PlayerId; text: string; ok: Grade | null }
