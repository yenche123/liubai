import { provide, reactive, watch, ref, type WatchStopHandle } from "vue"
import type {
  CommentPopupParam,
  CommentPopupData,
} from "./types"
import { useRouteAndLiuRouter, type RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import valTool from "~/utils/basic/val-tool"
import { turnThreadIntoComment } from "~/utils/transfer-util/thread-comment"
import type { ThreadShow } from "~/types/types-content"
import { useWindowSize } from "~/hooks/useVueUse"
import { 
  toListenEscKeyUp,
  cancelListenEscKeyUp,
} from "../../tools/listen-keyup"
import { editorCanInteractKey } from "~/utils/provide-keys"
import liuUtil from "~/utils/liu-util"

const queryKey = "commentpopup"
const cpData = reactive<CommentPopupData>({
  enable: false,
  show: false,
  transDuration: 400,
  operation: "edit_comment",   // 默认值，起始值不重要
  parentThread: "",
  focusNum: 0,
  rightTopBtn: false,
  canSubmit: false,
  submitNum: 0,
})

let rr: RouteAndLiuRouter | undefined
let watchStopHandle: WatchStopHandle | undefined

export function initCommentPopup() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()

  // 告知 editor 当前浏览态的卡片不可交互
  provide(editorCanInteractKey, ref(false))

  return {
    cpData,
    onTapCancel,
    onFinished,
  }
}


export function showCommentPopup(
  param: CommentPopupParam,
) {
  if(!checkParam(param)) return

  const op = param.operation
  const cs = param.commentShow
  const ts = param.threadShow
  cpData.operation = op
  if(op === "edit_comment") {
    // 编辑评论时
    cpData.parentThread = cs?.parentThread as string
    cpData.commentShow = cs
    delete cpData.threadShow
    delete cpData.csTsPretend
    cpData.parentComment = cs?.parentComment
    cpData.replyToComment = cs?.replyToComment
    cpData.commentId = cs?._id
  }
  else if(op === "reply_comment") {
    // 回复某评论时
    cpData.parentThread = cs?.parentThread as string
    cpData.commentShow = cs
    delete cpData.threadShow
    delete cpData.csTsPretend
    cpData.parentComment = cs?.replyToComment ?? cs?._id
    cpData.replyToComment = cs?._id
    delete cpData.commentId
  }
  else if(op === "reply_thread") {
    // 回复某动态时
    cpData.parentThread = ts?._id as string
    delete cpData.commentShow
    cpData.threadShow = ts
    cpData.csTsPretend = turnThreadIntoComment(ts as ThreadShow)
    delete cpData.parentComment
    delete cpData.replyToComment
    delete cpData.commentId
  }

  openIt(rr, queryKey)
}

function listenWindowWidth() {
  // 监听窗口变化
  const { width } = useWindowSize()
  watchStopHandle = watch(width, (newV) => {
    const showRequired = newV <= 500
    cpData.rightTopBtn = showRequired
  }, { immediate: true })
}

function cancelListenWindowWidth() {
  if(watchStopHandle) {
    watchStopHandle()
  }
}


function onTapCancel() {
  closeIt(rr, queryKey)
}

function onFinished() {
  closeIt(rr, queryKey)
}


// 检查入参
function checkParam(
  param: CommentPopupParam,
) {
  const { 
    operation: op, 
    commentShow: cs,
    threadShow: ts,
  } = param
  
  if(op === "edit_comment") {
    if(!cs) {
      console.warn("operation 为 edit_comment 时，commentShow 参数必填......")
      return false
    }
  }
  if(op === "reply_comment") {
    if(!cs) {
      console.warn("operation 为 reply_comment 时，commentShow 参数必填......")
      return false
    }
  }
  if(op === "reply_thread") {
    if(!ts) {
      console.warn("operation 为 reply_comment threadShow 参数必填......")
      return false
    }
  }

  return true
}



function listenRouteChange() {
  if(!rr) return
  watch(rr.route, (newV) => {
    const { query } = newV
    if(!query) return

    if(query[queryKey] === "01") {
      if(cpData.parentThread) _toOpen()
      else handleCustomUiQueryErr(rr, queryKey)
      return
    }
    _toClose()
  }, { immediate: true })
}

async function _toOpen() {
  if(cpData.show) return

  cancelListenWindowWidth()
  listenWindowWidth()

  cpData.enable = true
  await liuUtil.waitAFrame()
  cpData.show = true
  await valTool.waitMilli(cpData.transDuration)
  cpData.focusNum++

  toListenEscKeyUp(onTapCancel)
}

async function _toClose() {
  if(!cpData.enable) return
  cpData.show = false
  await valTool.waitMilli(cpData.transDuration)
  cpData.enable = false

  cancelListenWindowWidth()
  cancelListenEscKeyUp()
}
