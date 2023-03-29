import type { ThreadShow } from "~/types/types-content";
import type { ThreadOperation } from "~/types/types-atom";

export interface TctProps {
  threadData: ThreadShow
}

export interface TctEmits {
  (event: "newoperate", operation: ThreadOperation): void
}

export const tctEmits = {
  newoperate: (operation: ThreadOperation) => true
}