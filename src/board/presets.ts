import { autoFace, basePlayers, mustFind } from '../model/players'
import type { BoardState, PlayerId } from '../model/types'

type Spot = { x: number; y: number; h: number | null }

interface Preset {
  label: string
  puck: PlayerId
  players: Partial<Record<PlayerId, Spot>>
}

export const presets: Record<string, Preset> = {
  breakout: {
    label: 'Breakout',
    puck: 'rd',
    players: {
      rd: { x: 38, y: 8, h: 90 }, ld: { x: 20, y: 20, h: null }, rw: { x: 60, y: 40, h: 60 },
      lw: { x: 18, y: 48, h: null }, c: { x: 42, y: 35, h: 0 }, oc: { x: 40, y: 30, h: 180 },
      olw: { x: 68, y: 60, h: null }, orw: { x: 14, y: 60, h: null }, ord: { x: 22, y: 78, h: null },
      old: { x: 62, y: 78, h: null },
    },
  },
  corner: {
    label: 'D-zone corner',
    puck: 'olw',
    players: {
      olw: { x: 78, y: 14, h: null }, rd: { x: 72, y: 18, h: null }, ld: { x: 38, y: 12, h: null },
      c: { x: 50, y: 22, h: null }, rw: { x: 66, y: 45, h: null }, lw: { x: 22, y: 50, h: null },
      oc: { x: 40, y: 28, h: null }, orw: { x: 22, y: 22, h: null }, old: { x: 65, y: 62, h: null },
      ord: { x: 22, y: 62, h: null },
    },
  },
  forecheck: {
    label: 'Forecheck',
    puck: 'old',
    players: {
      old: { x: 60, y: 185, h: 200 }, ord: { x: 25, y: 178, h: null }, oc: { x: 42, y: 160, h: null },
      olw: { x: 70, y: 150, h: null }, orw: { x: 14, y: 150, h: null }, c: { x: 50, y: 165, h: 0 },
      rw: { x: 68, y: 140, h: 0 }, lw: { x: 18, y: 140, h: null }, rd: { x: 62, y: 118, h: null },
      ld: { x: 24, y: 118, h: null },
    },
  },
  ozone: {
    label: 'O-zone cycle',
    puck: 'c',
    players: {
      c: { x: 76, y: 170, h: 180 }, lw: { x: 46, y: 178, h: null }, rw: { x: 72, y: 145, h: null },
      rd: { x: 62, y: 125, h: null }, ld: { x: 24, y: 128, h: null }, old: { x: 68, y: 168, h: null },
      ord: { x: 38, y: 178, h: null }, oc: { x: 55, y: 160, h: null }, olw: { x: 64, y: 135, h: null },
      orw: { x: 26, y: 138, h: null },
    },
  },
}

/** Load a preset (or the default lineup when key is null) into the board in place. */
export function applyPreset(board: BoardState, key: string | null) {
  board.players = basePlayers()
  board.puck = 'oc'
  board.me = 'rw'
  board.loose = null
  const preset = key ? presets[key] : null
  if (preset) {
    for (const [id, spot] of Object.entries(preset.players)) Object.assign(mustFind(board, id as PlayerId), spot)
    board.puck = preset.puck
  }
  for (const p of board.players) if (p.h === null) p.fa = undefined
  autoFace(board)
}
