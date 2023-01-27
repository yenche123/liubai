import type { ThreadShow } from "~/types/types-content";
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import type { ThreadOperation } from "~/types/types-atom"
import type { TlViewType } from "../../../tools/types";

export interface TcbProps {
  threadData: ThreadShow
  viewType: TlViewType
}

export interface TcbEmits {
  (event: "newoperate", operation: ThreadOperation): void
}

export interface TcbMenuItem extends MenuItem {
  operation: ThreadOperation
}

export const tcbEmits = {
  newoperate: (operation: ThreadOperation) => true
}
