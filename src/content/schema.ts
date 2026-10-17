/*
  Stored content format. These records are what lives in content/situations/*.json today and
  what becomes rows in SQLite/PostgreSQL later (see docs/content-store.md).

  Everything that varies between plays of the same situation is declared, not coded:

  - Mirroring. Each play is shown with the puck side on the right or the left. A coordinate is
    either a plain number (same on both sides) or { "m": value } meaning "value when the play is
    on the right, mirrored when it is on the left" (x -> 85 - x, angle -> 360 - angle).
  - Variants. Alternative layouts of the same situation (who is closest, who is covered). A
    variant replaces the placements of the players it lists.
  - Bindings. "$F1", "$F2", "$F3" are your forwards in order of distance to `arrival.to`,
    worked out after jitter. Anywhere a player id is expected, a binding may be used.
  - Conditions. A question with `when` only applies on that side and/or variant.
  - Text. "{side}" and "{otherSide}" become "right"/"left" for the current mirror.
*/
import type { Grade, PlayerId } from '../model/types'

export const SCHEMA_VERSION = 1

export type Mirrored = { m: number }
export type Coord = number | Mirrored
export type Angle = number | Mirrored
export type Binding = '$F1' | '$F2' | '$F3'
export type Ref = PlayerId | Binding
export type SideName = 'right' | 'left'

export interface Placement {
  id: PlayerId
  x: Coord
  y: number
  /** Skating heading. Omit for standing still. */
  h?: Angle
  /** Explicit facing; otherwise standing players face the puck. */
  fa?: Angle
}

export interface Layout {
  players: Placement[]
  /** Carrier, or null for a loose puck (then `loose` is required). */
  puck: PlayerId | null
  loose?: { x: Coord; y: number }
  /** Players off the ice (penalty kill). */
  off?: PlayerId[]
}

export interface Variant {
  id: string
  weight?: number
  /** Placements that replace the base layout's for these players. */
  players: Placement[]
}

export interface When {
  side?: SideName
  variant?: string
}

export interface PlanSpec {
  label: string
  seconds: number
  moves: [Ref, Coord, number][]
  puck: { to: Ref | null; at: number }
}

interface QuestionBase {
  /** Stable id, unique across all content. Progress and stats will key on it. */
  id: string
  prompt: string
  /** Relative chance of being picked among the questions that apply. Default 1. */
  weight?: number
  when?: When
}

export interface ChoiceSpec extends QuestionBase {
  type: 'choice'
  options: { text: string; grade: Grade; feedback: string; plan?: PlanSpec }[]
}

export interface SpotSpec extends QuestionBase {
  type: 'spot'
  target: { x: Coord; y: number }
  label: string
  r1?: number
  r2?: number
  fb: { right: string; close: string; wrong: string }
  plan?: PlanSpec
}

export interface OrderSpec extends QuestionBase {
  type: 'order'
  answer: [Ref, Ref, Ref]
  fb: { right: string; f1: string; wrong: string }
  plan?: PlanSpec
}

export interface PickSpec extends QuestionBase {
  type: 'pick'
  answer: Ref
  partial?: Ref[]
  fb: { right: string; partial: string; wrong: string }
  plan?: PlanSpec
}

export type QuestionSpec = ChoiceSpec | SpotSpec | OrderSpec | PickSpec

/** One file in content/situations/. */
export interface SituationFile {
  schema: typeof SCHEMA_VERSION
  id: string
  name: string
  status: 'draft' | 'published'
  tags: string[]
  caption: string
  layout: Layout
  variants?: Variant[]
  arrival?: { to: PlayerId }
  questions: QuestionSpec[]
}

/** Normalised rows, the shape a database returns. */
export type SituationRecord = Omit<SituationFile, 'questions' | 'schema'>
export type QuestionRecord = QuestionSpec & { situationId: string }
