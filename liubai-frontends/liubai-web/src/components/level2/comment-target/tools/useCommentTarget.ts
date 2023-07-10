import { computed, inject, nextTick, reactive, toRef, watch } from "vue";
import type { 
  CommentTargetData,
  CommentTargetCtx,
  CommentTargetEmit, 
  CommentTargetProps,
} from "./types";
import type { LoadByCommentOpt } from "~/utils/controllers/comment-controller/tools/types"
import commentController from "~/utils/controllers/comment-controller/comment-controller";
import usefulTool from "~/utils/basic/useful-tool"
import threadController from "~/utils/controllers/thread-controller/thread-controller";
import { useWindowSize } from "~/hooks/useVueUse";
import valTool from "~/utils/basic/val-tool";
import { svBottomUpKey } from "~/utils/provide-keys";

export function useCommentTarget(
  props: CommentTargetProps,
  emit: CommentTargetEmit
) {

  const { height } = useWindowSize()
  const svBottomUp = inject(svBottomUpKey)

  const ctData = reactive<CommentTargetData>({
    targetId: "",
    state: 0,
    aboveList: [],
    belowList: [],
    hasReachedBottom: false,
    hasReachedTop: false,
    showZeroBox: true,
  })

  const ctx: CommentTargetCtx = {
    ctData,
    svBottomUp,
    emit,
  }

  const virtualHeightPx = computed(() => {
    const h = height.value
    const bLength = ctData.belowList.length
    let tmpH = h - 200 - (bLength * 100)
    if(tmpH < 0) tmpH = 0
    return tmpH
  })

  const cid2 = toRef(props, "targetId")
  watch(cid2, (newV) => {
    ctData.targetId = newV
    loadTargetComment(ctx)
  }, { immediate: true })

  return {
    ctData,
    virtualHeightPx,
  }
}



// 1. 加载【目标评论】
async function loadTargetComment(
  ctx: CommentTargetCtx
) {

  const { ctData, emit } = ctx

  if(ctData.targetComment) {
    ctData.state = 1
  }
  else {
    ctData.state = 0
  }

  const opt: LoadByCommentOpt = {
    commentId: ctData.targetId,
    loadType: "target",
  }
  const res = await commentController.loadByComment(opt)
  const c = res[0]
  if(c?.oState !== "OK") {
    ctData.state = 50
    emit("pagestatechange", 50)
    return
  }

  console.log("加载到目标评论: ")
  console.log(c)
  console.log(" ")

  delete ctData.thread
  ctData.state = -1
  ctData.targetComment = c
  ctData.aboveList = []
  ctData.belowList = []
  ctData.hasReachedBottom = false
  ctData.hasReachedTop = false
  ctData.showZeroBox = true

  await fixCommentTarget(ctx)
  
  loadBelowList(ctx)
}

// 2. 加载【向下评论】
async function loadBelowList(
  ctx: CommentTargetCtx
) {
  const { ctData } = ctx

  const opt: LoadByCommentOpt = {
    commentId: ctData.targetId,
    loadType: "find_children",
  }
  const tmpList = ctData.belowList
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
    usefulTool.filterDuplicated(ctData.belowList, newList)
    commentController.handleRelation(newList, lastComment)
    ctData.belowList.push(...newList)
  }
  else {
    commentController.handleRelation(newList, ctData.targetComment)
    ctData.belowList = newList
  }

  if(newList.length < 5) {
    ctData.hasReachedBottom = true
  }

  // 判断是否要去溯源
  if(ctData.aboveList.length < 1 && !ctData.hasReachedTop) {
    loadAboveList(ctx)
  }
}


// 3. 加载【溯源评论】（向上）
async function loadAboveList(
  ctx: CommentTargetCtx
) {
  const { ctData } = ctx

  let parentWeWant = ""
  let grandparent: string | undefined

  const c = ctData.targetComment
  const tmpList = ctData.aboveList
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
    commentId: ctData.targetId,
    loadType: "find_parent",
    parentWeWant,
    grandparent,
  }
  const newList = await commentController.loadByComment(opt)
  usefulTool.filterDuplicated(ctData.aboveList, newList)

  console.log("loadAboveList 结果: ")
  console.log(newList)
  console.log(" ")

  if(topComment) {
    commentController.handleRelation(newList, undefined, topComment)
    ctData.aboveList.splice(0, 0, ...newList)
  }
  else {
    await fixCommentTarget(ctx, true)
    commentController.handleRelation(newList, undefined, ctData.targetComment)
    ctData.aboveList = newList
  }

  // 判断是否要去加载 thread 了
  const newRe = newList[0]?.replyToComment
  if(!newRe && !ctData.hasReachedTop) {
    loadThread(ctx)
  }
}

// 固定 target 的位置
async function fixCommentTarget(
  ctx: CommentTargetCtx,
  closeZeroBox: boolean = false
) {
  const svBottomUp = ctx.svBottomUp
  if(!svBottomUp) return
  if(!ctx.ctData.showZeroBox) return

  await nextTick()

  svBottomUp.value = { 
    type: "selectors", 
    selectors: ".ct-virtual-zero",
    instant: true
  }

  if(closeZeroBox) {
    await valTool.waitMilli(250)
    ctx.ctData.showZeroBox = false
  }
}


// 4. 加载最顶部的 thread
async function loadThread(
  ctx: CommentTargetCtx,
) {
  const { ctData } = ctx
  const id = ctData.targetComment?.parentThread
  if(!id) return

  const res = await threadController.getData({ id })

  // console.log("loadThread 结果......")
  // console.log(res)
  // console.log(" ")

  ctData.hasReachedTop = true
  ctData.thread = res

  // 当没有 aboveList 时，要固定目标评论，使它在窗口中相对位置不变
  if(ctData.aboveList.length < 1) {
    await fixCommentTarget(ctx, true)
  }
}