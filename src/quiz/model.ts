import type { AuthoredPlan } from '../playback/plan'
import type { BoardState, Grade, Mark, PlayerId, Point } from '../model/types'

export interface ChoiceOption {
  text: string
  grade: Grade
  feedback: string
  plan: AuthoredPlan | null
}

export interface ChoiceQuestion {
  type: 'choice'
  prompt: string
  options: ChoiceOption[]
}

export interface SpotQuestion {
  type: 'spot'
  prompt: string
  target: Point
  label: string
  fb: { right: string; close: string; wrong: string }
  plan: AuthoredPlan | null
  /** Within r1 ft is right, within r2 ft is close. */
  r1: number
  r2: number
}

export interface OrderQuestion {
  type: 'order'
  prompt: string
  /** Correct order, worked out from real distances after jitter. */
  ids: PlayerId[]
  roles: string[]
  fb: { right: string; f1: string; wrong: string }
  plan: AuthoredPlan | null
}

export interface PickQuestion {
  type: 'pick'
  prompt: string
  answer: PlayerId
  partial: PlayerId[]
  fb: { right: string; partial: string; wrong: string }
  plan: AuthoredPlan | null
}

export type Question = ChoiceQuestion | SpotQuestion | OrderQuestion | PickQuestion
export type QuestionKind = Question['type']

/** What each question type takes as an answer. */
export interface AnswerOf {
  choice: number
  spot: Point
  order: PlayerId[]
  pick: PlayerId
}

export interface GradeResult {
  grade: Grade
  chosen: string
  feedback: string
  modelText: string
  plan: AuthoredPlan | null
}

/** Pure half of a question type: grading and the overlays drawn after answering. */
export interface QuestionLogic<K extends QuestionKind> {
  grade(q: Extract<Question, { type: K }>, answer: AnswerOf[K], board: BoardState): GradeResult
  marks(q: Extract<Question, { type: K }>, answer: AnswerOf[K], board: BoardState): Mark[]
}

/** A tap on the rink in quiz mode: where, and which player (if any) was under the finger. */
export interface RinkTap extends Point {
  id: PlayerId | null
}
