import { computed, inject, nextTick, reactive, toRef, watch } from "vue";
import type { 
  CommentDetailData,
  CommentDetailCtx,
  CommentDetailEmit, 
  CommentDetailProps,
} from "./types";
import type { LoadByCommentOpt } from "~/utils/controllers/comment-controller/tools/types"
import commentController from "~/utils/controllers/comment-controller/comment-controller";
import usefulTool from "~/utils/basic/useful-tool"
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import { useWindowSize } from "~/hooks/useVueUse";
import valTool from "~/utils/basic/val-tool";
import { svBottomUpKey } from "~/utils/provide-keys";
import type { CommentShow } from "~/types/types-content";
import { getValuedComments } from "~/utils/other/comment-related"
import cfg from "~/config"
import { useTemporaryStore } from "~/hooks/stores/useTemporaryStore";
import liuEnv from "~/utils/liu-env";
import type { 
  SyncSet_CommentData,
} from "~/types/cloud/sync-get/types"
import { CloudMerger } from "~/utils/cloud/CloudMerger";

export function useCommentDetail(
  props: CommentDetailProps,
  emit: CommentDetailEmit
) {
  const tmpStore = useTemporaryStore()
  const { height } = useWindowSize()
  const svBottomUp = inject(svBottomUpKey)

  const cdData = reactive<CommentDetailData>({
    targetId: "",
    state: 1,       // 默认展示切换中，因为 scroll-bar 会瞬移，所以不展示 Loading 的状态
    aboveList: [],
    belowList: [],
    hasReachedBottom: false,
    hasReachedTop: false,
    showZeroBox: true,
    focusNum: 0,
  })

  const ctx: CommentDetailCtx = {
    cdData,
    svBottomUp,
    emit,
  }

  const virtualHeightPx = computed(() => {
    const h = height.value
    const bLength = cdData.belowList.length
    let tmpH = h - 300 - (bLength * 100)
    if(tmpH < 0) tmpH = 0
    return tmpH
  })

  const cid2 = toRef(props, "targetId")
  watch(cid2, (newV) => {
    cdData.targetId = newV
    loadTargetComment(ctx)
  }, { immediate: true })

  // 监听 isShowing
  const isShowing = toRef(props, "isShowing")
  watch(isShowing, (newV) => {
    if(!newV) return
    const autoFocus = tmpStore.getFocusCommentEditor()
    if(autoFocus) cdData.focusNum++
  }, { immediate: true })

  return {
    cdData,
    virtualHeightPx,
  }
}



// 1. 加载【目标评论】
async function loadTargetComment(
  ctx: CommentDetailCtx
) {

  const { cdData, emit } = ctx
  cdData.state = 1

  const opt: LoadByCommentOpt = {
    commentId: cdData.targetId,
    loadType: "target",
  }
  const res = await commentController.loadByComment(opt)
  const c = res[0]
  if(!c || c.oState !== "OK") {
    remoteLoadTargetComment(ctx)
    return
  }

  console.log("加载到目标评论: ")
  console.log(c)
  console.log(" ")

  delete cdData.thread
  cdData.state = -1
  cdData.targetComment = c
  cdData.aboveList = []
  cdData.belowList = []
  cdData.hasReachedBottom = false
  cdData.hasReachedTop = false
  cdData.showZeroBox = true

  await fixCommentDetail(ctx)
  
  loadBelowList(ctx)
  remoteLoadTargetComment(ctx)
}

// 1.1 远程加载【目标评论】
async function remoteLoadTargetComment(
  ctx: CommentDetailCtx
) {
  const { cdData, emit } = ctx
  const id = cdData.targetId

  // 1. can I sync
  const canSync = liuEnv.canISync()
  if(!canSync) {
    if(cdData.state !== -1) {
      cdData.state = 50
      emit("pagestatechange", 50)
    }
    return
  }

  // 2. load target comment remotely
  const opt2: SyncSet_CommentData = {
    taskType: "comment_data",
    id: cdData.targetId,
  }
  const res2 = await CloudMerger.request(opt2)
  console.log("remoteLoadTargetComment res2: ")
  console.log(res2)
  console.log(" ")

  // 3. load locally again
  const opt: LoadByCommentOpt = {
    commentId: id,
    loadType: "target",
  }
  const res = await commentController.loadByComment(opt)
  const c = res[0]
  if(!c || c.oState !== "OK") {
    cdData.state = 50
    emit("pagestatechange", 50)
    return
  }

  delete cdData.thread
  cdData.state = -1
  cdData.targetComment = c
}


// 2. 加载【向下评论】
async function loadBelowList(
  ctx: CommentDetailCtx
) {
  const { cdData } = ctx

  const opt: LoadByCommentOpt = {
    commentId: cdData.targetId,
    loadType: "find_children",
  }
  const tmpList = cdData.belowList
  const tmpLength = tmpList.length
  const lastComment = tmpList[tmpLength - 1]
  if(lastComment) {
    opt.lastItemStamp = lastComment.createdStamp
  }

  const newList = await commentController.loadByComment(opt)

  console.log("loadBelowList 结果: ")
  console.log(newList)
  console.log(" ")

  if(lastComment) {
    usefulTool.filterDuplicated(cdData.belowList, newList)
    commentController.handleRelation(newList, lastComment)
    cdData.belowList.push(...newList)
  }
  else {
    commentController.handleRelation(newList)
    cdData.belowList = newList
  }

  if(newList.length < 5) {
    cdData.hasReachedBottom = true
  }

  // 检查有无必要加载新评论里的 "溯深" 评论
  await loadChildrenOfBelow(ctx, newList)

  // 判断是否要去溯源
  if(cdData.aboveList.length < 1 && !cdData.hasReachedTop) {
    loadAboveList(ctx)
  }
}


async function loadChildrenOfBelow(
  ctx: CommentDetailCtx,
  newList: CommentShow[],
) {

  if(newList.length < 1) return

  console.log("去 loadChildrenOfBelow: ")
  console.log("targetId: ", ctx.cdData.targetId)
  console.log(" ")

  // 找出值得加载的评论
  const valueComments = getValuedComments(newList)
  if(valueComments.length < 1) return

  // 已新添加的评论数
  let num = 0

  const _addNewComment = (prevId: string, newComment: CommentShow) => {
    newComment.prevIReplied = true
    const { belowList } = ctx.cdData

    // 过滤: 若已存在，则忽略
    const _tmpList = [newComment]
    usefulTool.filterDuplicated(belowList, _tmpList)
    if(_tmpList.length < 1) return

    for(let i=0; i<belowList.length; i++) {
      const v = belowList[i]
      if(v._id === prevId) {
        v.nextRepliedMe = true
        belowList.splice(i + 1, 0, newComment)
        break
      }
    }
  }

  const _toFind = async (prevId: string) => {
    const opt: LoadByCommentOpt = {
      commentId: prevId,
      loadType: "find_hottest",
    }
    const newComments = await commentController.loadByComment(opt)
    return newComments[0]
  }

  for(let i=0; i<valueComments.length; i++) {
    const v = valueComments[i]
    const p1 = v._id
    const c1 = await _toFind(p1)
    if(!c1) continue
    _addNewComment(p1, c1)
    num++

    if(c1.commentNum > 0) {
      const p2 = c1._id
      const c2 = await _toFind(p2)
      if(!c2) continue
      _addNewComment(p2, c2)
      num++
    }

    if(num >= 4) break
  }
}



// 3. 加载【溯源评论】（向上）
async function loadAboveList(
  ctx: CommentDetailCtx
) {
  const { cdData } = ctx

  let parentWeWant = ""
  let grandparent: string | undefined

  const c = cdData.targetComment
  const tmpList = cdData.aboveList
  const topComment = tmpList[0]
  if(topComment) {
    parentWeWant = topComment.replyToComment ?? ""
    grandparent = topComment.parentComment
  }
  else if(c) {
    parentWeWant = c.replyToComment ?? ""
    grandparent = c.parentComment
  }

  if(!parentWeWant) {
    loadThread(ctx)
    return
  }

  const opt: LoadByCommentOpt = {
    commentId: cdData.targetId,
    loadType: "find_parent",
    parentWeWant,
    grandparent,
  }
  const newList = await commentController.loadByComment(opt)
  usefulTool.filterDuplicated(cdData.aboveList, newList)

  console.log("loadAboveList 结果: ")
  console.log(newList)
  console.log(" ")

  if(topComment) {
    commentController.handleRelation(newList, undefined, topComment)
    cdData.aboveList.splice(0, 0, ...newList)
  }
  else {
    await fixCommentDetail(ctx, true)
    commentController.handleRelation(newList, undefined, cdData.targetComment)
    cdData.aboveList = newList
  }

  // 判断是否要去加载 thread 了
  const newRe = newList[0]?.replyToComment
  if(!newRe && !cdData.hasReachedTop) {
    loadThread(ctx)
  }
}

// 固定 target 的位置
async function fixCommentDetail(
  ctx: CommentDetailCtx,
  closeZeroBox: boolean = false
) {
  const svBottomUp = ctx.svBottomUp
  if(!svBottomUp) return
  if(!ctx.cdData.showZeroBox) return

  await nextTick()

  svBottomUp.value = { 
    type: "selectors", 
    selectors: ".cd-virtual-zero",
    instant: true,
    offset: -(cfg.vice_navi_height + 10),
  }

  if(closeZeroBox) {
    await valTool.waitMilli(250)
    ctx.cdData.showZeroBox = false
  }
}


// 4. 加载最顶部的 thread
async function loadThread(
  ctx: CommentDetailCtx,
) {
  const { cdData } = ctx
  const id = cdData.targetComment?.parentThread
  if(!id) return

  const res = await threadController.getData({ id })

  // console.log("loadThread 结果......")
  // console.log(res)
  // console.log(" ")

  cdData.hasReachedTop = true
  cdData.thread = res

  // 当没有 aboveList 时，要固定目标评论，使它在窗口中相对位置不变
  if(cdData.aboveList.length < 1) {
    await fixCommentDetail(ctx, true)
  }
}