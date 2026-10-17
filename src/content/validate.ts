import { PLAYER_IDS, type PlayerId } from '../model/types'
import type { Coord, PlanSpec, QuestionSpec, Ref, SituationFile } from './schema'
import { SCHEMA_VERSION } from './schema'

const isPlayer = (v: unknown): v is PlayerId => typeof v === 'string' && (PLAYER_IDS as string[]).includes(v)
const BINDINGS = ['$F1', '$F2', '$F3']

/**
 * Structural checks that don't need a build: ids, references, conditions, ranges. Behavioural
 * checks (everyone inside the rink after jitter, etc.) live in the content tests.
 */
export function validateContent(files: SituationFile[]): string[] {
  const errors: string[] = []
  const situationIds = new Set<string>()
  const questionIds = new Set<string>()

  for (const f of files) {
    const at = (msg: string) => errors.push(`${f.id ?? '(no id)'}: ${msg}`)
    if (f.schema !== SCHEMA_VERSION) at(`schema must be ${SCHEMA_VERSION}`)
    if (!/^[a-z0-9-]+$/.test(f.id ?? '')) at('id must be kebab-case')
    if (situationIds.has(f.id)) at('duplicate situation id')
    situationIds.add(f.id)
    if (!f.name || !f.caption) at('name and caption are required')
    if (f.status !== 'draft' && f.status !== 'published') at('status must be draft or published')

    const coordOk = (c: Coord, max: number) => {
      const v = typeof c === 'number' ? c : c?.m
      return typeof v === 'number' && v >= 0 && v <= max
    }
    const variants = new Set((f.variants ?? []).map((v) => v.id))
    const bound = !!f.arrival
    const refOk = (r: Ref) => isPlayer(r) || (BINDINGS.includes(r) && bound)

    const placed = [...f.layout.players, ...(f.variants ?? []).flatMap((v) => v.players)]
    for (const p of placed) {
      if (!isPlayer(p.id)) at(`unknown player ${p.id}`)
      if (!coordOk(p.x, 85) || !(p.y >= 0 && p.y <= 200)) at(`${p.id} is off the rink`)
    }
    if (f.layout.puck === null) {
      if (!f.layout.loose) at('puck is null but there is no loose puck')
    } else if (!isPlayer(f.layout.puck)) at(`unknown puck holder ${f.layout.puck}`)
    if (f.layout.puck && f.layout.off?.includes(f.layout.puck)) at('puck holder is off the ice')
    if (f.arrival && !isPlayer(f.arrival.to)) at('arrival.to must be a player')

    const checkPlan = (q: string, p: PlanSpec | undefined) => {
      if (!p) return
      if (!(p.seconds > 0 && p.seconds <= 5)) at(`${q}: plan seconds out of range`)
      for (const [id, x, y] of p.moves) {
        if (!refOk(id)) at(`${q}: plan moves unknown player ${id}`)
        if (!coordOk(x, 85) || !(y >= 0 && y <= 200)) at(`${q}: plan move for ${id} is off the rink`)
      }
      if (p.puck.to !== null && !refOk(p.puck.to)) at(`${q}: plan gives the puck to unknown ${p.puck.to}`)
      if (!(p.puck.at >= 0 && p.puck.at <= 1)) at(`${q}: plan puck.at must be 0..1`)
    }

    const combos: [string, string | null][] = []
    for (const side of ['right', 'left']) for (const v of variants.size ? [...variants] : [null]) combos.push([side, v])
    const covered = new Set<string>()

    for (const q of f.questions as QuestionSpec[]) {
      if (!/^[a-z0-9-]+$/.test(q.id ?? '')) at(`question id ${q.id} must be kebab-case`)
      if (questionIds.has(q.id)) at(`duplicate question id ${q.id}`)
      questionIds.add(q.id)
      if (q.when?.variant && !variants.has(q.when.variant)) at(`${q.id}: unknown variant ${q.when.variant}`)
      if (q.when?.side && q.when.side !== 'right' && q.when.side !== 'left') at(`${q.id}: side must be right or left`)
      for (const [side, v] of combos)
        if ((!q.when?.side || q.when.side === side) && (!q.when?.variant || q.when.variant === v)) covered.add(`${side}/${v}`)

      switch (q.type) {
        case 'choice':
          if (q.options.filter((o) => o.grade === 2).length !== 1) at(`${q.id}: needs exactly one option graded 2`)
          for (const o of q.options) checkPlan(q.id, o.plan)
          break
        case 'spot':
          if (!coordOk(q.target.x, 85)) at(`${q.id}: target is off the rink`)
          if ((q.r1 ?? 9) > (q.r2 ?? 18)) at(`${q.id}: r1 must not exceed r2`)
          checkPlan(q.id, q.plan)
          break
        case 'order':
          if (new Set(q.answer).size !== 3 || !q.answer.every(refOk)) at(`${q.id}: answer needs three distinct forwards`)
          checkPlan(q.id, q.plan)
          break
        case 'pick':
          if (!refOk(q.answer) || !(q.partial ?? []).every(refOk)) at(`${q.id}: unknown player in answer`)
          checkPlan(q.id, q.plan)
          break
        default:
          at(`${(q as { id: string }).id}: unknown question type ${(q as { type: string }).type}`)
      }
    }
    for (const [side, v] of combos) if (!covered.has(`${side}/${v}`)) at(`no question applies on the ${side}${v ? ` in variant ${v}` : ''}`)
  }
  return errors
}

export function assertValidContent(files: SituationFile[]) {
  const errors = validateContent(files)
  if (errors.length) throw new Error('Invalid quiz content:\n' + errors.join('\n'))
}
