import type { Grade, Team } from '../model/types'

export const TEAM_FILL: Record<Team, string> = { us: '#1D9E75', them: '#D85A30' }
export const SEL = '#EF9F27'
export const ACCENT = '#185FA5'

export const gradeColor = (ok: Grade | null) =>
  ok === 2 ? '#1D9E75' : ok === 1 ? '#EF9F27' : ok === 0 ? '#D85A30' : ACCENT

/** Player radius and heading-arrow length in SVG units. */
export const R = 36
export const HD = 120
