import { nameOf } from '../../model/players'
import type { Mark } from '../../model/types'
import type { QuestionLogic } from '../model'

export const pickLogic: QuestionLogic<'pick'> = {
  grade(q, a, board) {
    const g = a === q.answer ? 2 : q.partial.includes(a) ? 1 : 0
    return {
      grade: g,
      chosen: nameOf(board, a),
      feedback: g === 2 ? q.fb.right : g === 1 ? q.fb.partial : q.fb.wrong,
      modelText: nameOf(board, q.answer),
      plan: q.plan,
    }
  },
  marks(q, a) {
    const marks: Mark[] = [{ k: 'ring', id: q.answer, ok: 2 }]
    if (a !== q.answer) marks.push({ k: 'ring', id: a, ok: q.partial.includes(a) ? 1 : 0 })
    return marks
  },
}
