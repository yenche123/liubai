
import type { CommentShow } from '~/types/types-content';
import type { MenuItem } from "~/components/common/liu-menu/tools/types"
import type { CcCommonEmits, CommentCardReaction } from '../../tools/types';
import type { CommentOperation } from "~/types/types-atom";

export interface CcToolbarProps {
  cs: CommentShow
  isMouseEnter?: boolean
  ccReaction?: CommentCardReaction
}

export interface CcToolbarEmits extends CcCommonEmits {}

export interface CcToolbarMenuItem extends MenuItem {
  operation: CommentOperation
}