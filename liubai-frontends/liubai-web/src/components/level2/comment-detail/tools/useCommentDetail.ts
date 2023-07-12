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

export function useCommentDetail(
  props: CommentDetailProps,
  emit: CommentDetailEmit
) {

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
  })

  const ctx: CommentDetailCtx = {
    cdData,
    svBottomUp,
    emit,
  }

  const virtualHeightPx = computed(() => {
    const h = height.value
    const bLength = cdData.belowList.length
    let tmpH = h - 200 - (bLength * 100)
    if(tmpH < 0) tmpH = 0
    return tmpH
  })

  const cid2 = toRef(props, "targetId")
  watch(cid2, (newV) => {
    cdData.targetId = newV
    loadTargetComment(ctx)
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
  if(c?.oState !== "OK") {
    cdData.state = 50
    emit("pagestatechange", 50)
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

  // 判断是否要去溯源
  if(cdData.aboveList.length < 1 && !cdData.hasReachedTop) {
    loadAboveList(ctx)
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
    selectors: ".ct-virtual-zero",
    instant: true
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