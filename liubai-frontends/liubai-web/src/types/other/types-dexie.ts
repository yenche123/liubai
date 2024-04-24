import { UpdateSpec } from "dexie"

// the atom of bulkUpdate(),
// where T is Table
export interface DexieBulkUpdateAtom<T> {
  key: string
  changes: UpdateSpec<T>
}