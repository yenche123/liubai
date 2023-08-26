import { reactive, watch } from "vue";
import type { HsData, HsParam } from "./types"
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router"
import { 
  toListenEscKeyUp,
  cancelListenEscKeyUp,
} from "../../tools/listen-keyup"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import valTool from "~/utils/basic/val-tool";


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
})
let rr: RouteAndLiuRouter | undefined

export function initHashtagSelector() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  
  return {
    hsData,
    onTapCancel,
    onTapConfirm,
    onTapClear,
  }
}


export function showHashtagSelector(param: HsParam) {
  hsData.nonce = "whatever"
  hsData.list = [...param.tags]
  hsData.originalList = [...param.tags]
  hsData.canSubmit = false
  openIt(rr, queryKey)
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

function onTapConfirm() {
  checkCanSubmit()
  if(!hsData.canSubmit) return

  // 去完成......
}


function onTapCancel() {
  closeIt(rr, queryKey)
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