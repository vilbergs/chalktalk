import { reactive } from 'vue'
import { content } from '../content'
import { buildInstance, type BuiltSituation } from '../content/resolve'
import type { Mark } from '../model/types'
import type { GradeResult } from './model'
import type { AnyAnswer } from './types'

/** Quiz session. Lives outside the view so switching tabs keeps your place and score. */
export const quiz = reactive({
  current: null as BuiltSituation | null,
  /** Bumped per situation; keys the question component so its local state resets. */
  round: 0,
  answer: null as AnyAnswer | null,
  result: null as GradeResult | null,
  marks: [] as Mark[],
  score: { done: 0, right: 0, points: 0 },
})

/** Pick a published situation (never the same one twice in a row) and build an instance of it. */
export async function newSituation() {
  const all = await content.listSituations({ status: 'published' })
  const pool = all.length > 1 ? all.filter((s) => s.id !== quiz.current?.situationId) : all
  const sit = pool[Math.floor(Math.random() * pool.length)]
  const built = buildInstance(sit, await content.listQuestions(sit.id))
  quiz.current = built
  quiz.round++
  quiz.answer = null
  quiz.result = null
  quiz.marks = []
}
