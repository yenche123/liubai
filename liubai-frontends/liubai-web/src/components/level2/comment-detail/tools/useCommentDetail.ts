import { computed, inject, reactive, ref, toRef, watch } from "vue";
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
import { 
  scrollViewKey, 
  svBottomUpKey, 
  svScollingKey,
} from "~/utils/provide-keys";
import type { SvProvideInject } from "~/types/components/types-scroll-view";
import type { CommentShow, ThreadShow } from "~/types/types-content";
import { type ValueComment } from "~/utils/other/comment-related"
import { useTemporaryStore } from "~/hooks/stores/useTemporaryStore";
import liuEnv from "~/utils/liu-env";
import type {
  SyncGet_CheckContents,
  SyncGet_CommentList_B,
  SyncGet_CommentList_C,
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
  const res5 = await CloudMerger.request(param5, { 
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

  // fix position
  fixPosition(ctx)

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
    toLoadBelowList(ctx, opt, true, currentList)
    return
  }

  // 5. if init, show currentList in advance
  if(isInit) {
    toLoadBelowList(ctx, opt, false, currentList)
  }

  // 6. construct param for sync
  const param6: SyncGet_CommentList_B = {
    taskType: "comment_list",
    loadType: "find_children",
    commentId,
    lastItemStamp: opt.lastItemStamp,
  }
  const delay = isInit ? 16 : 0
  const res6 = await CloudMerger.request(param6, {
    waitMilli: 3000,
    maxStackNum: 2,
    delay,
  })
  if(!res6) {
    toLoadBelowList(ctx, opt, true, currentList)
    return
  }

  // 7. get ids
  const ids = CloudMerger.getIdsForCheckingContents(res6, currentList)
  if(ids.length < 1) {
    toLoadBelowList(ctx, opt, true)
    return
  }

  // 8. check out contents
  const param8: SyncGet_CheckContents = {
    taskType: "check_contents",
    ids,
  }
  await CloudMerger.request(param8, {
    waitMilli: 2500,
    delay: 0,
  })
  toLoadBelowList(ctx, opt, true)
}

async function toLoadBelowList(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
  loadChildren: boolean,
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
  
  if(loadChildren) {
    preloadChildrenOfBelow(ctx, newList)
  }
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
    grandparent = c.parentComment
  }

  if(!parentWeWant) {
    preloadThread(ctx)
    return
  }

  
  // 2. construct query
  const commentId = cdData.targetId
  const opt: LoadByCommentOpt = {
    commentId,
    loadType: "find_parent",
    parentWeWant,
    grandparent,
  }

  // 3. construct param
  const param: SyncGet_CommentList_C = {
    taskType: "comment_list",
    loadType: "find_parent",
    parentWeWant,
    grandparent,
  }

  // 4. get to sync
  const delay = isInit ? undefined : 0
  const res4 = await CloudMerger.request(param, {
    waitMilli: 3000,
    maxStackNum: 2,
    delay,
  })
  // 5. get res4.length
  const res5 = res4?.length ?? 2
  toLoadAboveList(ctx, opt, isInit, res5)  
}

async function toLoadAboveList(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
  isInit: boolean,
  num: number,
) {
  const { cdData } = ctx
  const { targetComment, aboveList } = cdData
  const firstComment = aboveList[0]
  
  const newList = await commentController.loadByComment(opt)
  usefulTool.filterDuplicated(aboveList, newList)

  fixPosition(ctx)

  if(isInit) {
    commentController.handleRelation(newList, undefined, targetComment)
    cdData.aboveList = newList
  }
  else {
    commentController.handleRelation(newList, undefined,  firstComment)
    cdData.aboveList.push(...newList)
  }
  
  const newLength = newList.length
  const newFirstComment = newList[0]
  const newRe = newFirstComment?.replyToComment

  // load again if the num that we has fetched is greater than
  // the num we query from local db
  if(newLength < num && newRe) {
    // load again
    console.log("toLoadAboveList again......")
    opt.parentWeWant = newRe
    opt.grandparent = newFirstComment.parentComment
    toLoadAboveList(ctx, opt, false, 0)
    return
  }

  if(!newRe) {
    preloadThread(ctx, 0)
  }  
}


/*************************** load thread **********************/
async function preloadThread(
  ctx: CommentDetailCtx,
  delay?: number,
) {
  const { cdData } = ctx
  
  const id = cdData.targetComment?.parentThread
  if(!id) return

  // 1. load locally
  const res = await threadController.getData({ id })

  // 2. show thread if it exists
  // because we fetch is in preloadTargetComment
  if(res) {
    toLoadThread(ctx, false, res)
    return
  }

  // 3. fetch
  const param: SyncGet_CheckContents = {
    taskType: "check_contents",
    ids: [id],
  }
  await CloudMerger.request(param, { 
    waitMilli: 2500,
    maxStackNum: 2,
    delay,
  })

  toLoadThread(ctx, true)
}

async function toLoadThread(
  ctx: CommentDetailCtx,
  loadAgain: boolean,
  res?: ThreadShow,
) {
  const { cdData } = ctx
  if(loadAgain) {
    const id = cdData.targetComment?.parentComment
    if(!id) return
    res = await threadController.getData({ id })
  }

  fixPosition(ctx)

  cdData.hasReachedTop = true
  cdData.thread = res
}



/****************************** OTHER *************************/

function fixPosition(
  ctx: CommentDetailCtx
) {

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
