
import type { CommentShow } from '~/types/types-content';
import type { MenuItem } from "~/components/common/liu-menu/tools/types"

export interface CcToolbarProps {
  cs: CommentShow
  isMouseEnter?: boolean
}

export interface CcToolbarMenuItem extends MenuItem {
  operation: "edit" | "delete" | "report"
}