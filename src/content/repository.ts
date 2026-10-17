import type { QuestionRecord, SituationRecord } from './schema'

/**
 * Read access to quiz content. The quiz only talks to this interface, so the storage behind it
 * can move from JSON files to SQLite (on device) or an API backed by PostgreSQL without touching
 * the engine or UI. Async on purpose: every backend after files will be.
 */
export interface ContentRepository {
  listSituations(filter?: { status?: SituationRecord['status']; tag?: string }): Promise<SituationRecord[]>
  getSituation(id: string): Promise<SituationRecord | null>
  listQuestions(situationId: string): Promise<QuestionRecord[]>
}

/** In-memory tables, already normalised the way database rows will be. */
export class MemoryContentRepository implements ContentRepository {
  private readonly questionsBySituation = new Map<string, QuestionRecord[]>()

  constructor(
    private readonly situations: SituationRecord[],
    questions: QuestionRecord[],
  ) {
    for (const q of questions) {
      const list = this.questionsBySituation.get(q.situationId) ?? []
      list.push(q)
      this.questionsBySituation.set(q.situationId, list)
    }
  }

  async listSituations(filter: { status?: SituationRecord['status']; tag?: string } = {}) {
    return this.situations.filter(
      (s) => (!filter.status || s.status === filter.status) && (!filter.tag || s.tags.includes(filter.tag)),
    )
  }

  async getSituation(id: string) {
    return this.situations.find((s) => s.id === id) ?? null
  }

  async listQuestions(situationId: string) {
    return this.questionsBySituation.get(situationId) ?? []
  }
}
