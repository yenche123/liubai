// 无论是 thread-detail 还是 thread-list 都可以用到的公用方法

import { toCollect, undoCollect } from "./specific-operate/collect"
import {
  setWhen,
  setRemind,
  clearWhen,
  clearRemind,
  undoWhenRemind,
} from "./specific-operate/when-remind"
import {
  deleteThread,
  deleteForever,
  undoDelete,
  restoreThread,
} from "./specific-operate/delete-related"

export default {
  toCollect,
  undoCollect,
  setWhen,
  setRemind,
  clearWhen,
  clearRemind,
  undoWhenRemind,
  deleteThread,
  deleteForever,
  undoDelete,
  restoreThread,
}