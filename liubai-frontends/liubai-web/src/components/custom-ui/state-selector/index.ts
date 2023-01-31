import type { 
  StateSelectorParam,
  SsResolver,
  SsItem,
} from "./tools/types"
import { ref } from "vue"
import { useWorkspaceStore } from "~/hooks/stores/useWorkspaceStore"
import valTool from "~/utils/basic/val-tool"

let _resolve: SsResolver | undefined
const list = ref<SsItem[]>([])
const enable = ref(false)
const show = ref(false)
const hasRemoveBtn = ref(false)
const TRANSITION_DURATION = 300

/**
 * 本组件只涉及 ui，负责给用户 "选择"
 * 至于具体的逻辑处理和存储，都不在本组件内完成
 */
export function initStateSelector() {
  return {
    list,
    enable,
    show,
    hasRemoveBtn,
    onTapItem,
    onTapMask,
    onTapRemove,
  }
}

export async function showStateSelector(param: StateSelectorParam) {
  let tmpList = getList()
  initList(tmpList, param.stateIdSelected)

  await _open()

  const _wait = (a: SsResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
}

// 点击某一项
function onTapItem(index: number) {
  const item = list.value[index]
  if(!item) return
  const stateId = item.id
  _resolve && _resolve({ action: "confirm", stateId })
  _close()
}

// 点击蒙层关闭
function onTapMask() {
  _resolve && _resolve({ action: "mask" })
  _close()
}

// 点击移除
function onTapRemove() {
  _resolve && _resolve({ action: "remove" })
  _close()
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
      color = "var(--liu-state-1)"
      if(v.id === "FINISHED") color = "var(--liu-state-2)"
    }
    return {
      id: v.id,
      text,
      text_key,
      color,
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
      color: "var(--liu-state-1)",
      selected: false,
    },
    {
      id: "FINISHED",
      text_key: "thread_related.finished",
      color: "var(--liu-state-2)",
      selected: false,
    }
  ]
  return tmpList
}

async function _open() {
  if(show.value) return
  enable.value = true
  await valTool.waitMilli(16)
  show.value = true
}

async function _close() {
  if(!show.value) return
  show.value = false
  await valTool.waitMilli(TRANSITION_DURATION)
  enable.value = false
}