import { reactive, watch } from "vue";
import type { HsData, HsParam, HsRes, HtsResolver } from "./types"
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router"
import { 
  toListenEscKeyUp,
  cancelListenEscKeyUp,
} from "../../tools/listen-keyup"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import valTool from "~/utils/basic/val-tool";
import time from "~/utils/basic/time";
import type { 
  TagSearchItem, 
} from "~/utils/system/tag-related/tools/types";
import type { TagShow } from "~/types/types-content";

/**
 * 说明: 
 *   该组件会去 "新增" 标签到 WorkspaceLocalTable 里
 *   但不会对 content 做任何修改
 */

const queryKey = "htselector"
const hsData = reactive<HsData>({
  nonce: "",
  enable: false,
  show: false,
  transDuration: 150,
  list: [],
  originalList: [],
  canSubmit: false,
  lastFocusOrBlurStamp: 0,
})
let rr: RouteAndLiuRouter | undefined
let _resolve: HtsResolver | undefined

export function initHashtagSelector() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  
  return {
    hsData,
    onTapCancel,
    onTapConfirm,
    onTapClear,
    onTapPopup,
    onFocusOrNot,
    onTapItem,
  }
}


export function showHashtagSelector(param: HsParam) {
  hsData.nonce = "whatever"
  hsData.list = [...param.tags]
  hsData.originalList = [...param.tags]
  hsData.canSubmit = false
  openIt(rr, queryKey)

  const _wait = (a: HtsResolver) => {
    _resolve = a
  }
  return new Promise(_wait)
}


function onTapItem(
  item: TagSearchItem,
) {
  const idx = hsData.list.findIndex(v => {
    if(v.tagId && v.tagId === item.tagId) return true
    if(v.text === item.textBlank) return true
    return false
  })
  if(idx >= 0) {
    hsData.list.splice(idx, 1)
    checkCanSubmit()
    return
  }
  const obj: TagShow = {
    tagId: item.tagId,
    text: item.textBlank,
    emoji: item.emoji,
    parentEmoji: item.parentEmoji,
  }
  hsData.list.push(obj)
  checkCanSubmit()
}


function onFocusOrNot(newV: boolean) {
  hsData.lastFocusOrBlurStamp = time.getTime()
}

function onTapPopup() {
  const diff = time.getTime() - hsData.lastFocusOrBlurStamp
  if(diff < 300) return
  onTapCancel()
}

function onTapClear(index: number) {
  const data = hsData.list[index]
  if(!data) return
  hsData.list.splice(index, 1)
}


function listenRouteChange() {
  if(!rr) return
  
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(hsData.nonce) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
      return
    }
    _toClose()
  }, { immediate: true })
}

function checkCanSubmit() {
  const { list, originalList } = hsData
  if(list.length !== originalList.length) {
    hsData.canSubmit = true
    return
  }

  let isTheSame = true
  list.forEach(v1 => {
    const d = originalList.find(v2 => v2.tagId === v1.tagId)
    if(!d) {
      isTheSame = false
    }
  })
  hsData.canSubmit = !isTheSame
}

/**
 * 步骤 hashtag-selector 内部去创建新标签的原因:
 *   创建新标签是异步的，等待标签被创建后再去往下执行其他事
 *   浏览器可能会限制必须由 "用户点击" 所带来操作，比如复制到剪贴板等等
 * 所以，创建新标签的逻辑放到 showHashtagSelector 之外
 */
function onTapConfirm() {
  checkCanSubmit()
  if(!hsData.canSubmit) return

  // 去完成......
  const res: HsRes = {
    confirm: true,
    tags: valTool.copyObject(hsData.list)
  }
  toResolve(res)
  closeIt(rr, queryKey)
}


function onTapCancel() {
  toResolve({ confirm: false })
  closeIt(rr, queryKey)
}

function toResolve(res: HsRes) {
  if(!_resolve) return
  _resolve(res)
  _resolve = undefined
}

async function _toOpen() {
  if(hsData.show) return

  hsData.enable = true
  await valTool.waitMilli(16)
  hsData.show = true
  await valTool.waitMilli(hsData.transDuration)

  toListenEscKeyUp(onTapCancel)
}

async function _toClose() {
  if(!hsData.enable) return
  hsData.show = false
  await valTool.waitMilli(hsData.transDuration)
  hsData.enable = false

  cancelListenEscKeyUp()
}