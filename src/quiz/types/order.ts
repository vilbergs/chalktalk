import { isForward, mustFind } from '../../model/players'
import type { BoardState, PlayerId } from '../../model/types'
import type { QuestionLogic } from '../model'

const describeOrder = (board: BoardState, ids: PlayerId[], roles: string[]) =>
  ids.map((id, i) => `${roles[i]} ${mustFind(board, id).label}`).join(', ')

/** Only your three forwards can be tapped, once each. */
export const canPickForOrder = (board: BoardState, id: PlayerId, picked: PlayerId[]) =>
  isForward(mustFind(board, id)) && !picked.includes(id)

export const orderLogic: QuestionLogic<'order'> = {
  grade(q, a, board) {
    const all = a.every((id, i) => id === q.ids[i])
    const g = all ? 2 : a[0] === q.ids[0] ? 1 : 0
    return {
      grade: g,
      chosen: describeOrder(board, a, q.roles),
      feedback: all ? q.fb.right : g === 1 ? q.fb.f1 : q.fb.wrong,
      modelText: describeOrder(board, q.ids, q.roles),
      plan: q.plan,
    }
  },
  marks(q, a) {
    return q.ids.map((id, i) => ({ k: 'tag', id, text: q.roles[i], ok: a[i] === id ? 2 : 0 }))
  },
}
