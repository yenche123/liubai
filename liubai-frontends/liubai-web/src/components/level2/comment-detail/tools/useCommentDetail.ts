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
  const { cdData } = ctx
  cdData.state = 1

  // 1. construct query
  const id = cdData.targetId
  const opt: LoadByCommentOpt = {
    commentId: id,
    loadType: "target",
  }

  // 2. load target comment locally for parentThread
  // so that we can fetch parentThread in advance
  const res2 = await commentController.loadByComment(opt)
  const c2 = res2[0]

  // 3. check out if get to sync
  const canSync = liuEnv.canISync()
  if(!canSync || cdData.networkLevel < 1) {
    await toLoadTargetComment(ctx, opt, false, c2)
    preloadBelowList(ctx, true)
    preloadAboveList(ctx, true)
    return
  }

  // 4. show target comment before fetching if it exists
  if(c2) {
    toLoadTargetComment(ctx, opt, false, c2)
  }

  // 5. construct param for sync
  const ids = [id]
  if(c2.parentThread) {
    ids.push(c2.parentThread)
  }
  const param5: SyncGet_CheckContents = {
    taskType: "check_contents",
    ids,
  }
  const delay5 = liuUtil.check.isJustAppSetup() ? undefined : 0
  await CloudMerger.request(param5, { 
    waitMilli: 2500,
    delay: delay5,
  })

  // 6. load target comment currently
  await toLoadTargetComment(ctx, opt, true)

  // 7. load below & above list
  preloadBelowList(ctx, true)
  preloadAboveList(ctx, true)
}

async function toLoadTargetComment(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
  loadAgain: boolean,
  c?: CommentShow,
) {
  const { cdData, emit } = ctx
  if(loadAgain) {
    let res = await commentController.loadByComment(opt)
    c = res[0]
  }

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

  emit("pagestatechange", cdData.state)

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
  const { cdData } = ctx
  if(!reload && cdData.hasReachedTop) {
    return
  }

  // 1. get some required data
  const c = cdData.targetComment
  const tmpList = cdData.aboveList
  const oldLength = tmpList.length
  const firstComment = tmpList[0]
  const isInit = Boolean(reload || oldLength < 1)

  let parentWeWant = ""
  let grandparent: string | undefined

  if(!isInit) {
    parentWeWant = firstComment.replyToComment ?? ""
    grandparent = firstComment.parentComment
  }
  else if(c) {
    parentWeWant = c.replyToComment ?? ""
    grandparent = c.replyToComment
  }

  if(!parentWeWant) {
    return
  }

  
  // 2. construct query
  const commentId = cdData.targetId
  const opt: LoadByCommentOpt = {
    commentId,
    loadType: "find_parent",

  }

  
  
}

async function toLoadAboveList(
  ctx: CommentDetailCtx,
) {
  
}


/*************************** load thread **********************/




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
      preloadBelowList(ctx)
    }
    else if(svType === "to_start") {
      preloadAboveList(ctx)
    }

  })
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