import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import { reactive, watch } from "vue"
import type { 
  ContentPanelData,
  ContentPanelParam,
  ContentPanelResolver,
} from "./types"
import { emojiList } from "~/config/emoji-list"
import valTool from "~/utils/basic/val-tool"
import { i18n } from "~/locales"
import liuApi from "~/utils/liu-api"
import liuUtil from "~/utils/liu-util"
import contentOperate from "~/hooks/content/content-operate"
import type { LiuContentType } from "~/types/types-atom";

let _resolve: ContentPanelResolver | undefined
const TRANSITION_DURATION = 250
const queryKey = "contentpanel"
const cpData = reactive<ContentPanelData>({
  onlyReaction: false,
  enable: false,
  show: false,
  emojiList,
  isMine: false,
  title: "",
})

let rr: RouteAndLiuRouter | undefined

export function initContentPanel() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
  return {
    TRANSITION_DURATION,
    cpData,
    onTapCancel,
    onMouseLeaveBox,
    onMouseEnterEmoji,
    onMouseLeaveEmoji,
    onTapEmoji,
    onTapDetail,
  }
}

export function showContentPanel(param: ContentPanelParam) {
  if(!param.comment && !param.thread) {
    console.warn("showContentPanel 必须指定 comment 或 thread 中的其一")
    return
  }

  if(param.comment && param.thread) {
    console.warn("showContentPanel 只能指定 comment 或 thread 中的其一")
    return
  }

  if(param.comment) {
    delete cpData.thread
    cpData.comment = param.comment
    cpData.onlyReaction = param.onlyReaction ?? false
    cpData.isMine = param.comment.isMine
  }
  if(param.thread) {
    delete cpData.comment
    cpData.thread = param.thread
    cpData.onlyReaction = true
    cpData.isMine = param.thread.isMine
  } 
  cpData.title = i18n.global.t(`common.reaction`)
  
  openIt(rr, queryKey)

  const _wait = (a: ContentPanelResolver): void => {
    _resolve = a
  }
  return new Promise(_wait)
}

function onTapDetail() {
  if(!rr) return
  let opt = { rr, replace: true }
  const { comment, thread } = cpData

  if(comment) {
    const cid2 = comment._id
    liuUtil.open.openComment(cid2, opt)
  }
  else if(thread) {
    const cid = thread._id
    liuUtil.open.openDetail(cid, opt)
  }
}


function onMouseLeaveBox() {
  cpData.title = i18n.global.t(`common.reaction`)
}

function onMouseEnterEmoji(index: number) {
  const item = cpData.emojiList[index]
  item.currentFilter = item.shadow

  const key = item.key
  cpData.title = i18n.global.t(`emoji.${key}`)
}

function onMouseLeaveEmoji(index: number) {
  const item = cpData.emojiList[index]
  delete item.currentFilter
}



async function onTapEmoji(index: number) {
  const item = cpData.emojiList[index]
  const emoji = item.emoji
  if(!emoji) return
  const encodeStr = liuApi.encode_URI_component(emoji)
  
  console.log("encodeStr: ")
  console.log(encodeStr)
  console.log(" ")

  let contentId = ""
  let forType: LiuContentType = "COMMENT"
  const { comment: c, thread: t } = cpData
  if(c) contentId = c._id
  else if(t) {
    contentId = t._id
    forType = "THREAD"
  }

  await contentOperate.toEmoji(contentId, forType, encodeStr, t, c)

  // 去关闭弹窗
  closeIt(rr, queryKey)
}





function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(_resolve) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
      return
    }

    if(_resolve) {
      toResolve()
    }

    _toClose()
  })
}

function onTapCancel() {
  closeIt(rr, queryKey)
}

function toResolve() {
  if(!_resolve) return
  _resolve(true)
  _resolve = undefined
}

async function _toOpen() {
  if(cpData.show) return
  cpData.enable = true
  await valTool.waitMilli(16)
  cpData.show = true
}

async function _toClose() {
  if(!cpData.enable) return
  cpData.show = false
  await valTool.waitMilli(TRANSITION_DURATION)
  cpData.enable = false

}
