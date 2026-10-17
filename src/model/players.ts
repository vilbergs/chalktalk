import { headingOf } from './geometry'
import type { BoardState, Player, PlayerId } from './types'

export function basePlayers(): Player[] {
  const list: Omit<Player, 'fa' | 'off'>[] = [
    { id: 'rw', team: 'us', label: 'RW', x: 70, y: 92, h: null },
    { id: 'c', team: 'us', label: 'C', x: 42, y: 95, h: null },
    { id: 'lw', team: 'us', label: 'LW', x: 15, y: 92, h: null },
    { id: 'rd', team: 'us', label: 'RD', x: 60, y: 70, h: null },
    { id: 'ld', team: 'us', label: 'LD', x: 25, y: 70, h: null },
    { id: 'g', team: 'us', label: 'G', x: 42.5, y: 13, h: null },
    { id: 'orw', team: 'them', label: 'W', x: 15, y: 108, h: null },
    { id: 'oc', team: 'them', label: 'C', x: 42, y: 105, h: null },
    { id: 'olw', team: 'them', label: 'W', x: 70, y: 108, h: null },
    { id: 'ord', team: 'them', label: 'D', x: 25, y: 130, h: null },
    { id: 'old', team: 'them', label: 'D', x: 60, y: 130, h: null },
    { id: 'og', team: 'them', label: 'G', x: 42.5, y: 187, h: null },
  ]
  return list.map((p) => ({ ...p, fa: p.team === 'us' ? 0 : 180, off: false }))
}

export function baseState(): BoardState {
  return { players: basePlayers(), puck: 'oc', loose: null, me: 'rw' }
}

export const isGoalie = (p: Player) => p.label === 'G'
export const isForward = (p: Player) => p.team === 'us' && (p.id === 'c' || p.id === 'lw' || p.id === 'rw')

export function faceOf(p: Pick<Player, 'h' | 'fa' | 'team'>): number {
  if (p.h !== null && p.h !== undefined) return p.h
  if (typeof p.fa === 'number') return p.fa
  return p.team === 'us' ? 0 : 180
}

export function findPlayer(state: BoardState, id: string | null | undefined): Player | undefined {
  return state.players.find((p) => p.id === id)
}

export function mustFind(state: BoardState, id: PlayerId): Player {
  const p = findPlayer(state, id)
  if (!p) throw new Error(`No player ${id}`)
  return p
}

/** Standing players face the puck; goalies face up ice for their team. */
export function autoFace(state: BoardState) {
  let target: { x: number; y: number } | null = null
  if (state.puck) {
    const q = findPlayer(state, state.puck)
    if (q) target = q
  } else if (state.loose) {
    target = state.loose
  }
  for (const p of state.players) {
    if (p.h !== null) continue
    if (isGoalie(p)) {
      p.fa = p.team === 'us' ? 0 : 180
      continue
    }
    if (!target || p.id === state.puck) continue
    p.fa = headingOf(target.x - p.x, target.y - p.y)
  }
}

export function nameOf(state: BoardState, id: PlayerId): string {
  const p = mustFind(state, id)
  return (p.team === 'us' ? 'your ' : 'their ') + p.label
}
