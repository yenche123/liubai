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
import { toPin, undoPin } from "./specific-operate/pin"
import { setShowCountdown, setTags } from "./specific-operate/other"
import { 
  selectState, 
  undoState, 
  setNewStateForThread,
} from "./specific-operate/state"

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
  toPin,
  undoPin,
  setShowCountdown,
  setTags,
  selectState,
  undoState,
  setNewStateForThread,
}