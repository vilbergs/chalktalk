import { dist } from '../../model/geometry'
import { spotText } from '../../model/describe'
import type { Grade } from '../../model/types'
import type { QuestionLogic, SpotQuestion } from '../model'

const gradeOf = (q: SpotQuestion, d: number): Grade => (d <= q.r1 ? 2 : d <= q.r2 ? 1 : 0)

export const spotLogic: QuestionLogic<'spot'> = {
  grade(q, a) {
    const d = dist(a, q.target)
    const g = gradeOf(q, d)
    return {
      grade: g,
      chosen: `${spotText(a)} (${Math.round(d)} ft from the spot)`,
      feedback: g === 2 ? q.fb.right : g === 1 ? q.fb.close : q.fb.wrong,
      modelText: `${q.label}: ${spotText(q.target)}`,
      plan: q.plan,
    }
  },
  marks(q, a) {
    return [
      { k: 'target', x: q.target.x, y: q.target.y, r1: q.r1, r2: q.r2 },
      { k: 'dot', x: a.x, y: a.y, ok: gradeOf(q, dist(a, q.target)) },
    ]
  },
}
