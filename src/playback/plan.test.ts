import { describe, expect, it } from 'vitest'
import { baseState, mustFind } from '../model/players'
import { commitPlan, sanitizePlan } from './plan'

describe('sanitizePlan', () => {
  it('clamps to the rink, caps distance and drops unknown ids', () => {
    const state = baseState()
    const { plan, reco } = sanitizePlan(state, {
      move: { x: 500, y: -20, label: 'Far away' },
      seconds: 2,
      moves: [
        { id: 'c', x: 42, y: 199 },
        { id: 'nobody', x: 1, y: 1 },
        { id: 'ld', x: 'NaN', y: 3 },
      ],
      puck: { to: 'zzz', at: 7 },
    })
    expect(reco).toMatchObject({ x: 84, y: 1, label: 'Far away' })
    expect(plan.moves.rw).toEqual({ x: 84, y: 1 })
    const c = mustFind(state, 'c')
    const m = plan.moves.c!
    expect(Math.hypot(m.x - c.x, m.y - c.y)).toBeCloseTo(50)
    expect(plan.moves).not.toHaveProperty('nobody')
    expect(plan.moves).not.toHaveProperty('ld')
    expect(plan.puck).toEqual({ to: state.puck, at: 1 })
  })

  it('commits end positions and hands over the puck', () => {
    const state = baseState()
    const { plan } = sanitizePlan(state, { move: { x: 70, y: 110 }, seconds: 3, moves: [], puck: { to: 'rw', at: 0.5 } })
    commitPlan(state, plan)
    expect(mustFind(state, 'rw')).toMatchObject({ x: 70, y: 110, h: null })
    expect(state.puck).toBe('rw')
  })
})
