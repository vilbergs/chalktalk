import { loadFileRepository } from './files'
import type { ContentRepository } from './repository'

/** The app's content source. Swap this line to move to SQLite or a remote API. */
export const content: ContentRepository = loadFileRepository()
