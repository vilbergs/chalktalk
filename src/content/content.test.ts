import { describe, expect, it } from 'vitest'
import { RINK_L, RINK_W } from '../model/geometry'
import { findPlayer, isForward } from '../model/players'
import { fromAuthored } from '../playback/plan'
import { gradeAnswer } from '../quiz/types'
import { loadFileRepository } from './files'
import { applies, buildInstance, type Side } from './resolve'
import type { SituationFile } from './schema'
import { validateContent } from './validate'

const RUNS = 50
const repo = loadFileRepository()
const situations = await repo.listSituations()

describe('content', () => {
  it('loads every situation file', () => {
    expect(situations.length).toBeGreaterThanOrEqual(15)
  })

  describe.each(situations.map((s) => [s.id, s] as const))('%s', (_id, sit) => {
    it('builds every side, variant and question cleanly', async () => {
      const questions = await repo.listQuestions(sit.id)
      const variants = sit.variants?.length ? sit.variants.map((v) => v.id) : [null]
      for (const side of [1, -1] as Side[])
        for (const variant of variants)
          for (const spec of questions.filter((q) => applies(q.when, side, variant)))
            for (let run = 0; run < RUNS; run++) {
              const { board, q, caption } = buildInstance(sit, questions, { side, variant, questionId: spec.id })
              const where = `${spec.id} (${side > 0 ? 'right' : 'left'}, ${variant})`
              expect(caption, where).not.toMatch(/[{}]/)

              for (const p of board.players) {
                expect(p.x, `${where} ${p.id}.x`).toBeGreaterThanOrEqual(0)
                expect(p.x, `${where} ${p.id}.x`).toBeLessThanOrEqual(RINK_W)
                expect(p.y, `${where} ${p.id}.y`).toBeGreaterThanOrEqual(0)
                expect(p.y, `${where} ${p.id}.y`).toBeLessThanOrEqual(RINK_L)
              }
              if (board.puck) expect(findPlayer(board, board.puck)?.off, `${where} puck holder on the ice`).toBe(false)
              else expect(board.loose, `${where} loose puck`).not.toBeNull()

              if (q.type === 'order') {
                expect(new Set(q.ids).size).toBe(3)
                for (const id of q.ids) expect(isForward(findPlayer(board, id)!)).toBe(true)
                // The order answer follows real distances, so it must be gradeable as right.
                expect(gradeAnswer(q, q.ids, board).grade).toBe(2)
              }
              if (q.type === 'choice') expect(q.options.filter((o) => o.grade === 2)).toHaveLength(1)

              const plans = q.type === 'choice' ? q.options.map((o) => o.plan) : [q.plan]
              for (const plan of plans) {
                if (!plan) continue
                const { plan: p } = fromAuthored(board, plan)
                for (const m of Object.values(p.moves)) {
                  expect(m!.x).toBeGreaterThanOrEqual(1)
                  expect(m!.x).toBeLessThanOrEqual(84)
                }
              }
            }
    })
  })
})

describe('validateContent', () => {
  const base = (): SituationFile => ({
    schema: 1,
    id: 'sample',
    name: 'Sample',
    status: 'draft',
    tags: [],
    caption: 'Puck on the {side}.',
    layout: { players: [{ id: 'rw', x: { m: 70 }, y: 100 }], puck: 'oc' },
    questions: [
      {
        id: 'sample-pick',
        type: 'pick',
        prompt: 'Tap the carrier.',
        answer: 'oc',
        fb: { right: 'Yes.', partial: '', wrong: 'No.' },
      },
    ],
  })

  it('accepts a minimal situation', () => {
    expect(validateContent([base()])).toEqual([])
  })

  it('catches duplicate ids, unbound bindings and uncovered sides', () => {
    const a = base()
    const b = base()
    b.questions = [{ ...a.questions[0], when: { side: 'right' }, answer: '$F1' } as SituationFile['questions'][0]]
    const errors = validateContent([a, b])
    expect(errors.join('\n')).toMatch(/duplicate situation id/)
    expect(errors.join('\n')).toMatch(/duplicate question id/)
    expect(errors.join('\n')).toMatch(/unknown player in answer/)
    expect(errors.join('\n')).toMatch(/no question applies on the left/)
  })

  it('needs exactly one right option in a choice', () => {
    const s = base()
    s.questions = [
      {
        id: 'sample-choice',
        type: 'choice',
        prompt: '?',
        options: [
          { text: 'a', grade: 2, feedback: '' },
          { text: 'b', grade: 2, feedback: '' },
        ],
      },
    ]
    expect(validateContent([s])).toEqual(['sample: sample-choice: needs exactly one option graded 2'])
  })
})
