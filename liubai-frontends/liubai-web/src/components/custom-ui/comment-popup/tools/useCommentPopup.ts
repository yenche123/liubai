import { reactive, watch } from "vue"
import type {
  CommentPopupParam,
  CommentPopupData,
} from "./types"
import { useRouteAndLiuRouter } from "~/routes/liu-router"
import type { RouteAndLiuRouter } from "~/routes/liu-router"
import { openIt, closeIt, handleCustomUiQueryErr } from "../../tools/useCuiTool"
import valTool from "~/utils/basic/val-tool"
import { turnThreadIntoComment } from "~/utils/transfer-util/thread-comment"
import { ThreadShow } from "~/types/types-content"

const queryKey = "commentpopup"
const cpData = reactive<CommentPopupData>({
  enable: false,
  show: false,
  transDuration: 200,
  operation: "edit_comment",   // 默认值，起始值不重要
  parentThread: "",
})

let rr: RouteAndLiuRouter | undefined

export function initCommentPopup() {
  rr = useRouteAndLiuRouter()
  listenRouteChange()
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
    cpData.parentComment = cs?.replyToComment
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
  cpData.enable = true
  await valTool.waitMilli(16)
  cpData.show = true
}

async function _toClose() {
  if(!cpData.enable) return
  cpData.show = false
  await valTool.waitMilli(cpData.transDuration)
  cpData.enable = false
}
