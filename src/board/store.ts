import { reactive } from 'vue'
import { baseState } from '../model/players'
import { parseBoard } from '../model/validate'

const KEY = 'wb-state'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return parseBoard(JSON.parse(raw)) ?? baseState()
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }
  return baseState()
}

/** The free board. Persisted so the setup survives app restarts; the quiz has its own board. */
export const board = reactive(load())

export function saveBoard() {
  try {
    localStorage.setItem(KEY, JSON.stringify(board))
  } catch {
    // Storage full or disabled; the board still works for this session.
  }
}
