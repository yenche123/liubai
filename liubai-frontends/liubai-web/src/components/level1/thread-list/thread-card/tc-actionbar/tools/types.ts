import type { ThreadOperation } from "~/types/types-atom"

export interface TcaEmit {
  (event: "tapcollect"): void
  (event: "tapcomment"): void
  (event: "tapshare"): void
  (event: "newoperate", operation: ThreadOperation): void
}