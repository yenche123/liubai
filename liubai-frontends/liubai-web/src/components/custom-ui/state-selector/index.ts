import type { 
  StateSelectorParam,
  SsResolver,
  SsItem,
} from "./tools/types"
import { ref, watch } from "vue"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import valTool from "~/utils/basic/val-tool"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../tools/useCuiTool"
import liuUtil from "~/utils/liu-util"
import type { LiuTimeout } from "~/utils/basic/type-tool"

let _resolve: SsResolver | undefined
const list = ref<SsItem[]>([])
const enable = ref(false)
const show = ref(false)
const hasRemoveBtn = ref(false)
const TRANSITION_DURATION = 250
const queryKey = "stateselector"
let rr: RouteAndLiuRouter | undefined

/**
 * 本组件只涉及 ui，负责给用户 "选择"
 * 至于具体的逻辑处理和存储，都不在本组件内完成
 */
export function initStateSelector() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  return {
    list,
    enable,
    show,
    hasRemoveBtn,
    onTapItem,
    onTapMask,
    onTapRemove,
    TRANSITION_DURATION,
  }
}


function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(list.value.length) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
    }
    else {
      _toClose()
    }
  })
}


export async function showStateSelector(param: StateSelectorParam) {
  let tmpList = getList()
  initList(tmpList, param.stateIdSelected)

  openIt(rr, queryKey)

  const _wait = (a: SsResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
}

// 点击某一项
async function onTapItem(index: number) {
  const item = list.value[index]
  if(!item) return
  const stateId = item.id

  // 修改 list
  const _list = list.value
  _list.forEach((v, i) => {
    if(i === index) v.selected = true
    else if(v.selected) v.selected = false
  })

  await valTool.waitMilli(150)
  
  _resolve && _resolve({ action: "confirm", stateId })
  closeIt(rr, queryKey)
}

// 点击蒙层关闭
function onTapMask() {
  _resolve && _resolve({ action: "mask" })
  closeIt(rr, queryKey)
}

// 点击移除
async function onTapRemove() {
  // 修改 list
  const _list = list.value
  _list.forEach((v, i) => {
    if(v.selected) v.selected = false
  })

  await valTool.waitMilli(75)
  _resolve && _resolve({ action: "remove" })
  closeIt(rr, queryKey)
}

// 已存在原始的列表时，判断 selected 放在哪里以及是否需要移除按钮
function initList(tmpList: SsItem[], stateIdSelected?: string) {
  if(!stateIdSelected) {
    list.value = tmpList
    hasRemoveBtn.value = false
    return
  }
  let found = false
  tmpList.forEach(v => {
    if(v.id === stateIdSelected) {
      found = true
      v.selected = true
    }
  })
  list.value = tmpList
  hasRemoveBtn.value = found
}

// 获取列表
function getList() {
  const wStore = useWorkspaceStore()
  const { currentSpace } = wStore
  if(!currentSpace) return getDefaultList()
  const { stateConfig } = currentSpace
  if(!stateConfig) return getDefaultList()
  const { stateList } = stateConfig
  const tmpList: SsItem[] = stateList.map(v => {
    // 处理文字
    let text_key = ""
    let text = v.text
    if(!text) {
      if(v.id === "TODO") text_key = "thread_related.todo"
      else if(v.id === "FINISHED") text_key = "thread_related.finished"
    }

    // 处理颜色
    let color = v.color
    if(!color) {
      color = "--liu-state-1"
      if(v.id === "FINISHED") color = "--liu-state-2"
    }
    let colorShow = liuUtil.colorToShow(color)

    return {
      id: v.id,
      text,
      text_key,
      colorShow,
      selected: false,
    }
  })
  return tmpList
}

function getDefaultList() {
  let tmpList: SsItem[] = [
    {
      id: "TODO",
      text_key: "thread_related.todo",
      colorShow: "var(--liu-state-1)",
      selected: false,
    },
    {
      id: "FINISHED",
      text_key: "thread_related.finished",
      colorShow: "var(--liu-state-2)",
      selected: false,
    }
  ]
  return tmpList
}

let toggleTimeout: LiuTimeout
function _toOpen() {
  if(show.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  enable.value = true

  toggleTimeout = setTimeout(() => {
    show.value = true
  }, 16)
}

function _toClose() {
  if(!enable.value) return
  if(toggleTimeout) {
    clearTimeout(toggleTimeout)
  }
  show.value = false

  toggleTimeout = setTimeout(() => {
    enable.value = false
  }, TRANSITION_DURATION)
}