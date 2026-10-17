import type { BoardState, Mark } from '../../model/types'
import type { AnswerOf, GradeResult, Question, QuestionKind, QuestionLogic } from '../model'
import { choiceLogic } from './choice'
import { orderLogic } from './order'
import { pickLogic } from './pick'
import { spotLogic } from './spot'

/** Registry of question types. Add a type here and a matching component in QuestionBody.vue. */
export const questionLogic: { [K in QuestionKind]: QuestionLogic<K> } = {
  choice: choiceLogic,
  spot: spotLogic,
  order: orderLogic,
  pick: pickLogic,
}

export type AnyAnswer = AnswerOf[QuestionKind]

export function gradeAnswer(q: Question, answer: AnyAnswer, board: BoardState): GradeResult {
  const logic = questionLogic[q.type] as QuestionLogic<QuestionKind>
  return logic.grade(q as never, answer as never, board)
}

export function marksFor(q: Question, answer: AnyAnswer, board: BoardState): Mark[] {
  const logic = questionLogic[q.type] as QuestionLogic<QuestionKind>
  return logic.marks(q as never, answer as never, board)
}
