import { computed, inject, nextTick, reactive, ref, toRef, watch } from "vue";
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
import { 
  scrollViewKey, 
  svBottomUpKey, 
  svScollingKey,
} from "~/utils/provide-keys";
import type { SvProvideInject } from "~/types/components/types-scroll-view";
import type { CommentShow } from "~/types/types-content";
import { type ValueComment, getValuedComments } from "~/utils/other/comment-related"
import cfg from "~/config"
import { useTemporaryStore } from "~/hooks/stores/useTemporaryStore";
import liuEnv from "~/utils/liu-env";
import type {
  SyncGet_CheckContents,
  SyncGet_CommentList_B,
  SyncSet_CommentData,
} from "~/types/cloud/sync-get/types"
import { CloudMerger } from "~/utils/cloud/CloudMerger";
import time from "~/utils/basic/time";
import { useNetworkStore } from "~/hooks/stores/useNetworkStore";
import { storeToRefs } from "pinia";
import liuUtil from "~/utils/liu-util";
import { 
  addChildrenIntoValueComments, 
  fetchChildrenComments,
} from "../../utils/tackle-comments";

export function useCommentDetail(
  props: CommentDetailProps,
  emit: CommentDetailEmit
) {
  const nStore = useNetworkStore()
  const { level } = storeToRefs(nStore)

  const tmpStore = useTemporaryStore()
  const { height } = useWindowSize()
  const svBottomUp = inject(svBottomUpKey)
  const scrollPosition = inject(svScollingKey, ref(0))

  const cdData = reactive<CommentDetailData>({
    targetId: "",
    state: 1,       // 默认展示切换中，因为 scroll-bar 会瞬移，所以不展示 Loading 的状态
    aboveList: [],
    belowList: [],
    hasReachedBottom: false,
    hasReachedTop: false,
    showZeroBox: true,
    focusNum: 0,
    lastLockStamp: time.getTime(),
    networkLevel: level.value,
  })
  watch(level, (newV) => {
    cdData.networkLevel = newV
  })

  const ctx: CommentDetailCtx = {
    cdData,
    svBottomUp,
    scrollPosition,
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
    cdData.lastLockStamp = time.getTime()
    preloadTargetComment(ctx)
  }, { immediate: true })

  // 监听 isShowing
  const isShowing = toRef(props, "isShowing")
  watch(isShowing, (newV) => {
    if(!newV) return
    const autoFocus = tmpStore.getFocusCommentEditor()
    if(autoFocus) cdData.focusNum++
  }, { immediate: true })

  listenScoll(ctx)

  return {
    cdData,
    virtualHeightPx,
  }
}

/****************************** target comment *************************/
async function preloadTargetComment(
  ctx: CommentDetailCtx,
) {
  const { cdData, emit } = ctx
  cdData.state = 1

  // 1. construct query
  const id = cdData.targetId
  const opt: LoadByCommentOpt = {
    commentId: id,
    loadType: "target",
  }

  // 2. check out if get to sync
  const canSync = liuEnv.canISync()
  if(!canSync || cdData.networkLevel < 1) {
    await toLoadTargetComment(ctx, opt)
    preloadBelowList(ctx, true)
    preloadAboveList(ctx, true)
    return
  }

  // 3. construct param for sync
  const param3: SyncSet_CommentData = {
    taskType: "comment_data",
    id,
  }
  const delay3 = liuUtil.check.isJustAppSetup() ? undefined : 0
  const res3 = await CloudMerger.request(param3, { 
    waitMilli: 2500,
    delay: delay3,
  })

  // 4. load target comment currently
  await toLoadTargetComment(ctx, opt)

  // 5. load below & above list
  preloadBelowList(ctx, true)
  preloadAboveList(ctx, true)
}

async function toLoadTargetComment(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
) {
  const { cdData } = ctx
  let [c] = await commentController.loadByComment(opt)

  const hasData = c && c.oState === "OK"

  // reset some properties
  delete cdData.thread
  cdData.aboveList = []
  cdData.belowList = []
  cdData.hasReachedBottom = false
  cdData.hasReachedTop = false
  cdData.showZeroBox = true
  cdData.targetComment = c
  cdData.state = hasData ? -1 : 50

  // fix position
  fixPosition()
}


/****************************** below comments *************************/
async function preloadBelowList(
  ctx: CommentDetailCtx,
  reload: boolean = false,
) {
  const { cdData } = ctx
  if(!reload && cdData.hasReachedBottom) {
    return
  }

  // 1. get some required data
  const tmpList = cdData.belowList
  const oldLength = tmpList.length
  const lastComment = tmpList[oldLength - 1]
  const isInit = Boolean(reload || oldLength < 1)

  // 2. construct query
  const commentId = cdData.targetId
  const opt: LoadByCommentOpt = {
    commentId,
    loadType: "find_children",
    lastItemStamp: isInit ? undefined : lastComment.createdStamp,
  }

  // 3. get local comments first
  const currentList = await commentController.loadByComment(opt)

  // 4. check out if get to sync
  const canSync = liuEnv.canISync()
  if(!canSync || cdData.networkLevel < 1) {
    toLoadBelowList(ctx, opt, currentList)
    return
  }

  // 5. construct param for sync
  const param5: SyncGet_CommentList_B = {
    taskType: "comment_list",
    loadType: "find_children",
    commentId,
    lastItemStamp: opt.lastItemStamp,
  }
  const res5 = await CloudMerger.request(param5, {
    waitMilli: 3000,
    maxStackNum: 2,
  })
  if(!res5) {
    toLoadBelowList(ctx, opt, currentList)
    return
  }

  // 6. get ids
  const ids = CloudMerger.getIdsForCheckingContents(res5, currentList)
  if(ids.length < 1) {
    toLoadBelowList(ctx, opt)
    return
  }

  // 7. check out contents
  const param7: SyncGet_CheckContents = {
    taskType: "check_contents",
    ids,
  }
  await CloudMerger.request(param7, {
    waitMilli: 2500,
    delay: 0,
  })
  toLoadBelowList(ctx, opt)
}

async function toLoadBelowList(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
  newList?: CommentShow[],
) {
  const { cdData } = ctx

  if(!newList) {
    newList = await commentController.loadByComment(opt)
  }

  const oldList = cdData.belowList
  const oldLength = oldList.length
  const lastComment = oldList[oldLength - 1]

  if(opt.lastItemStamp) {
    usefulTool.filterDuplicated(oldList, newList)
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
  
  preloadChildrenOfBelow(ctx, newList)
}


/****************************** children of below *************************/
async function preloadChildrenOfBelow(
  ctx: CommentDetailCtx,
  newList: CommentShow[],
) {
  const { networkLevel } = ctx.cdData
  const valueComments = await fetchChildrenComments(newList, networkLevel)
  if(valueComments.length < 1) return
  
  toLoadChildrenOfBelow(ctx, valueComments)
}

async function toLoadChildrenOfBelow(
  ctx: CommentDetailCtx,
  valueComments: ValueComment[],
) {
  const { belowList } = ctx.cdData
  addChildrenIntoValueComments(belowList, valueComments)
}

/****************************** above comments *************************/
async function preloadAboveList(
  ctx: CommentDetailCtx,
  reload: boolean = false,
) {
  
}

async function toLoadAboveList(
  ctx: CommentDetailCtx,
) {
  
}


/****************************** OTHER *************************/

function fixPosition() {

}



function listenScoll(
  ctx: CommentDetailCtx
) {
  const { cdData } = ctx
  const svData = inject(scrollViewKey, { type: "", triggerNum: 0 }) as SvProvideInject
  const svTrigger = toRef(svData, "triggerNum")
  watch(svTrigger, (newV) => {
    const res1 = time.isWithinMillis(cdData.lastLockStamp, 300)
    if(res1) return
    if(cdData.state !== -1) return

    const svType = svData.type
    console.log("comment detail listenScroll .........")
    console.log(svType)
    console.log(" ")

    if(svType === "to_end") {
      loadBelowList(ctx)
    }
    else if(svType === "to_start") {
      loadAboveList(ctx)
    }

  })
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


  // reset some properties
  delete cdData.thread
  cdData.aboveList = []
  cdData.belowList = []
  cdData.hasReachedBottom = false
  cdData.hasReachedTop = false
  cdData.showZeroBox = true

  if(!c || c.oState !== "OK") {
    remoteLoadTargetComment(ctx)
    return
  }

  cdData.state = -1
  cdData.targetComment = c

  remoteLoadTargetComment(ctx)

  await fixCommentDetail(ctx)
  await loadBelowList(ctx, true)
  await loadAboveList(ctx, true)
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

  cdData.state = -1
  cdData.targetComment = c
  fixCommentDetail(ctx)
}


// 2. 加载【向下评论】
async function loadBelowList(
  ctx: CommentDetailCtx,
  reload: boolean = false,
) {
  const { cdData } = ctx
  if(!reload && cdData.hasReachedBottom) {
    return
  }

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
  ctx: CommentDetailCtx,
  reload: boolean = false,
) {
  const { cdData } = ctx
  if(!reload && cdData.hasReachedTop) {
    return
  }

  let parentWeWant = ""
  let grandparent: string | undefined

  const c = cdData.targetComment
  const tmpList = cdData.aboveList
  const topComment = tmpList[0]
  if(!reload && topComment) {
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

  if(!reload && topComment) {
    commentController.handleRelation(newList, undefined, topComment)
    cdData.aboveList.splice(0, 0, ...newList)
  }
  else {
    commentController.handleRelation(newList, undefined, cdData.targetComment)
    cdData.aboveList = newList
  }
  await fixCommentDetail(ctx, true)

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

  const { cdData } = ctx
  if(!cdData.showZeroBox) return

  await nextTick()
  cdData.lastLockStamp = time.getTime()  

  svBottomUp.value = { 
    type: "selectors", 
    selectors: ".cd-virtual-zero",
    instant: true,
    offset: -(cfg.vice_navi_height + 10),
  }

  if(closeZeroBox) {
    await valTool.waitMilli(250)
    cdData.showZeroBox = false
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

  cdData.hasReachedTop = true
  cdData.thread = res

  // 当没有 aboveList 时，要固定目标评论，使它在窗口中相对位置不变
  if(cdData.aboveList.length < 1) {
    await fixCommentDetail(ctx, true)
  }
}