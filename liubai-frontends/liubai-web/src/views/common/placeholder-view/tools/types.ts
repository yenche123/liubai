import type { PropType } from "vue"
import type { PageState } from "~/types/types-atom"

export interface PvProps {
  pState: PageState
  errTitle: string
  errMsg: string
  zIndex: number
}

export const pvProps = {
  pState: {
    // -1: 不显示 
    // 0: loading
    // 1: 切换中
    // 50: 404   
    // 51: 没有访问权限
    // 52: 当前操作需要联网才能查看
    // 53: 该页面需要后端方可访问
    type: Number as PropType<PageState>,
    default: -1
  },
  errTitle: {
    type: String,
    default: "",
  },
  errMsg: {
    type: String,
    default: "",
  },
  zIndex: {
    type: Number,
    default: 500,
  }
}