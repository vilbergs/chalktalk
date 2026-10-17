import type { QuestionLogic } from '../model'

export const choiceLogic: QuestionLogic<'choice'> = {
  grade(q, i) {
    const o = q.options[i]
    const best = q.options.find((x) => x.grade === 2) ?? o
    return { grade: o.grade, chosen: o.text, feedback: o.feedback, modelText: best.text, plan: best.plan }
  },
  // Choice answers are marked in the option list, not on the rink.
  marks: () => [],
}
