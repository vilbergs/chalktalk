import { MemoryContentRepository } from './repository'
import type { QuestionRecord, SituationFile, SituationRecord } from './schema'
import { assertValidContent } from './validate'

/** Split situation files into the situation and question rows a database would hold. */
export function normalise(files: SituationFile[]): { situations: SituationRecord[]; questions: QuestionRecord[] } {
  const situations: SituationRecord[] = []
  const questions: QuestionRecord[] = []
  for (const { questions: qs, schema: _schema, ...situation } of files) {
    situations.push(situation)
    for (const q of qs) questions.push({ ...q, situationId: situation.id })
  }
  return { situations, questions }
}

/**
 * File-based store: every content/situations/*.json is bundled into the app at build time, so
 * the quiz works offline. Validated on load; a broken file fails loudly in dev and in tests.
 */
export function loadFileRepository(): MemoryContentRepository {
  const modules = import.meta.glob<SituationFile>('/content/situations/*.json', { eager: true, import: 'default' })
  const files = Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, f]) => f)
  assertValidContent(files)
  const { situations, questions } = normalise(files)
  return new MemoryContentRepository(situations, questions)
}
