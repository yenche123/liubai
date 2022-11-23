import { computed, ref } from "vue"
import valTool from "../../../utils/basic/val-tool"
import liuUtil from "../../../utils/liu-util"

// 使用 element.scrollIntoView 让元素露出来 

interface HashTagEditorParam {
  text?: string
  mode: "search" | "rename"          // 前者不可编辑 emoji，后者则可以
  emoji?: string                     // encodeURIComponent
}

interface HashTagEditorRes {
  confirm: boolean
  text?: string
  isNew?: boolean   // 是否为新创建的 hashtag，在 mode 为 rename 时若此值为 false 代表要合并 hashtag
                    // 值得一提的是， oState 为 REMOVED 的 tag 转为 OK 时，也是 new 的
  emoji?: string    // encodeURIComponent()
}

type HteResolver = (res: HashTagEditorRes) => void

const TRANSITION_DURATION = 150
const enable = ref(false)
const show = ref(false)
const selectedIndex = -1

let _resolve: HteResolver | undefined

export function initDatePicker() {

  return { 
    enable, 
    show,
    TRANSITION_DURATION,
  }
}


