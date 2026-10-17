import { autoFace } from '../model/players'
import type { BoardState, PlayerId } from '../model/types'
import type { AuthoredPlan } from '../playback/plan'
import { Builder, type Rng } from './builder'
import type { Question } from '../quiz/model'
import type {
  Angle,
  Coord,
  Layout,
  PlanSpec,
  QuestionRecord,
  Ref,
  SideName,
  SituationRecord,
  When,
} from './schema'

export type Side = 1 | -1

export const sideName = (s: Side): SideName => (s > 0 ? 'right' : 'left')

/** x on the right is m; on the left it is reflected across the centre line. */
export const coord = (c: Coord, s: Side) => (typeof c === 'number' ? c : s > 0 ? c.m : 85 - c.m)
/** Angles reflect left-right: 90 (right boards) becomes 270. */
export const angle = (a: Angle, s: Side) => (typeof a === 'number' ? a : s > 0 ? a.m : (360 - a.m) % 360)

export const text = (t: string, s: Side) =>
  t.replaceAll('{side}', sideName(s)).replaceAll('{otherSide}', sideName((-s) as Side))

export const applies = (when: When | undefined, s: Side, variant: string | null) =>
  !when || ((!when.side || when.side === sideName(s)) && (!when.variant || when.variant === variant))

export function weightedPick<T extends { weight?: number }>(items: T[], rng: Rng): T {
  const total = items.reduce((n, i) => n + (i.weight ?? 1), 0)
  let r = rng() * total
  for (const i of items) {
    r -= i.weight ?? 1
    if (r < 0) return i
  }
  return items[items.length - 1]
}

/** Base layout with the variant's placements swapped in. */
export function layoutFor(sit: SituationRecord, variant: string | null): Layout {
  const v = sit.variants?.find((x) => x.id === variant)
  if (!v) return sit.layout
  const over = new Map(v.players.map((p) => [p.id, p]))
  const players = sit.layout.players.map((p) => over.get(p.id) ?? p)
  for (const p of v.players) if (!sit.layout.players.some((q) => q.id === p.id)) players.push(p)
  return { ...sit.layout, players }
}

export interface Resolved {
  board: BoardState
  bindings: Partial<Record<Ref, PlayerId>>
}

/** Place players (with jitter) for one side and variant. */
export function resolveBoard(sit: SituationRecord, s: Side, variant: string | null, rng: Rng): Resolved {
  const b = new Builder(rng)
  const layout = layoutFor(sit, variant)
  for (const id of layout.off ?? []) b.off(id)
  for (const p of layout.players) {
    b.set(p.id, coord(p.x, s), p.y, p.h === undefined ? null : angle(p.h, s), p.fa === undefined ? undefined : angle(p.fa, s))
  }
  if (layout.puck) b.puck(layout.puck)
  else if (layout.loose) b.loose(coord(layout.loose.x, s), layout.loose.y)
  const bindings: Resolved['bindings'] = {}
  if (sit.arrival) {
    const [f1, f2, f3] = b.fwdOrder(sit.arrival.to)
    Object.assign(bindings, { $F1: f1, $F2: f2, $F3: f3 })
  }
  return { board: b.state, bindings }
}

/** Turn a stored question into the runtime shape the quiz grades and draws. */
export function resolveQuestion(q: QuestionRecord, s: Side, bindings: Resolved['bindings']): Question {
  const ref = (r: Ref): PlayerId => {
    if (!r.startsWith('$')) return r as PlayerId
    const id = bindings[r]
    if (!id) throw new Error(`Question ${q.id}: ${r} is not bound (does the situation set "arrival"?)`)
    return id
  }
  const t = (x: string) => text(x, s)
  const plan = (p: PlanSpec | undefined): AuthoredPlan | null =>
    p
      ? {
          label: t(p.label),
          seconds: p.seconds,
          moves: p.moves.map(([id, x, y]) => [ref(id), coord(x, s), y]),
          puck: { to: p.puck.to === null ? null : ref(p.puck.to), at: p.puck.at },
        }
      : null
  const fb = <T extends Record<string, string>>(f: T) =>
    Object.fromEntries(Object.entries(f).map(([k, v]) => [k, t(v)])) as T

  switch (q.type) {
    case 'choice':
      return {
        type: 'choice',
        prompt: t(q.prompt),
        options: q.options.map((o) => ({ text: t(o.text), grade: o.grade, feedback: t(o.feedback), plan: plan(o.plan) })),
      }
    case 'spot':
      return {
        type: 'spot',
        prompt: t(q.prompt),
        target: { x: coord(q.target.x, s), y: q.target.y },
        label: t(q.label),
        fb: fb(q.fb),
        plan: plan(q.plan),
        r1: q.r1 ?? 9,
        r2: q.r2 ?? 18,
      }
    case 'order':
      return { type: 'order', prompt: t(q.prompt), ids: q.answer.map(ref), roles: ['F1', 'F2', 'F3'], fb: fb(q.fb), plan: plan(q.plan) }
    case 'pick':
      return { type: 'pick', prompt: t(q.prompt), answer: ref(q.answer), partial: (q.partial ?? []).map(ref), fb: fb(q.fb), plan: plan(q.plan) }
  }
}

export interface BuiltSituation {
  situationId: string
  questionId: string
  name: string
  caption: string
  q: Question
  board: BoardState
  side: Side
  variant: string | null
}

/**
 * Build one playable instance. side/variant/questionId are picked at random unless given
 * (tests pass them to cover every combination).
 */
export function buildInstance(
  sit: SituationRecord,
  questions: QuestionRecord[],
  opts: { side?: Side; variant?: string | null; questionId?: string; rng?: Rng } = {},
): BuiltSituation {
  const rng = opts.rng ?? Math.random
  const side: Side = opts.side ?? (rng() < 0.5 ? 1 : -1)
  const variant = opts.variant !== undefined ? opts.variant : sit.variants?.length ? weightedPick(sit.variants, rng).id : null
  const { board, bindings } = resolveBoard(sit, side, variant, rng)
  const candidates = questions.filter((q) => applies(q.when, side, variant))
  const spec = opts.questionId ? candidates.find((q) => q.id === opts.questionId) : weightedPick(candidates, rng)
  if (!spec) throw new Error(`No question for ${sit.id} (${sideName(side)}, ${variant ?? 'no variant'})`)
  autoFace(board)
  return {
    situationId: sit.id,
    questionId: spec.id,
    name: sit.name,
    caption: text(sit.caption, side),
    q: resolveQuestion(spec, side, bindings),
    board,
    side,
    variant,
  }
}
