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
import { 
  scrollViewKey, 
  svScrollingKey,
  svElementKey,
} from "~/utils/provide-keys";
import type { SvProvideInject } from "~/types/components/types-scroll-view";
import type { CommentShow, ThreadShow } from "~/types/types-content";
import type { ValueComment } from "~/utils/other/comment-related"
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
  const scrollPosition = inject(svScrollingKey, ref(0))
  const svEl = inject(svElementKey)

  const cdData = reactive<CommentDetailData>({
    targetId: "",
    state: 0,       // 默认展示切换中，因为 scroll-bar 会瞬移，所以不展示 Loading 的状态
    aboveList: [],
    belowList: [],
    hasReachedBottom: false,
    hasReachedTop: false,
    loadingAbove: false,
    loadingBelow: false,
    loadGeneration: 0,
    aboveLoadGeneration: 0,
    belowLoadGeneration: 0,
    focusNum: 0,
    lastLockStamp: time.getTime(),
    networkLevel: level.value,
  })
  watch(level, (newV) => {
    cdData.networkLevel = newV
  })

  const ctx: CommentDetailCtx = {
    cdData,
    svEl,
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
    cdData.loadGeneration++
    cdData.loadingAbove = false
    cdData.loadingBelow = false
    cdData.aboveLoadGeneration++
    cdData.belowLoadGeneration++
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
  const generation = cdData.loadGeneration
  cdData.state = 0

  // 1. construct query
  const id = cdData.targetId
  const opt: LoadByCommentOpt = {
    commentId: id,
    loadType: "target",
  }

  // 2. load target comment locally for parentThread
  // so that we can fetch parentThread in advance
  const res2 = await commentController.loadByComment(opt)
  if(!isCurrent(ctx, generation)) return
  const c2 = res2[0]

  // 3. check out if get to sync
  const canSync = liuEnv.canISync()
  if(!canSync || cdData.networkLevel < 1) {
    await toLoadTargetComment(ctx, opt, false, c2, generation)
    if(!isCurrent(ctx, generation)) return
    preloadBelowList(ctx, true)
    preloadAboveList(ctx, true)
    return
  }

  // 4. show target comment before fetching if it exists
  if(c2) {
    toLoadTargetComment(ctx, opt, false, c2, generation)
  }

  // 5. construct param for sync
  const ids = [id]
  if(c2?.parentThread) {
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
  if(!isCurrent(ctx, generation)) return

  // 6. load target comment currently
  await toLoadTargetComment(ctx, opt, true, undefined, generation)
  if(!isCurrent(ctx, generation)) return

  // 7. load below & above list
  preloadBelowList(ctx, true)
  preloadAboveList(ctx, true)
}

async function toLoadTargetComment(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
  loadAgain: boolean,
  c?: CommentShow,
  generation = ctx.cdData.loadGeneration,
) {
  const { cdData, emit } = ctx
  if(!isCurrent(ctx, generation)) return
  if(loadAgain) {
    const res = await commentController.loadByComment(opt)
    if(!isCurrent(ctx, generation)) return
    c = res[0]
  }

  const hasData = c && c.oState === "OK"

  // reset some properties
  delete cdData.thread
  cdData.aboveLoadGeneration++
  cdData.belowLoadGeneration++
  cdData.loadingAbove = false
  cdData.loadingBelow = false
  cdData.aboveList = []
  cdData.belowList = []
  cdData.hasReachedBottom = false
  cdData.hasReachedTop = false
  cdData.targetComment = c
  cdData.state = hasData ? -1 : 50

  emit("pagestatechange", cdData.state)
  
}


/****************************** below comments *************************/
async function preloadBelowList(
  ctx: CommentDetailCtx,
  reload = false,
) {
  const { cdData } = ctx
  if(reload) {
    cdData.belowLoadGeneration++
    cdData.loadingBelow = false
  }
  else if(cdData.loadingBelow) return
  if(!reload && cdData.hasReachedBottom) {
    return
  }

  const generation = cdData.belowLoadGeneration
  cdData.loadingBelow = true
  try {
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
    if(!isBelowCurrent(ctx, generation)) return

    // 4. check out if get to sync
    const canSync = liuEnv.canISync()
    if(!canSync || cdData.networkLevel < 1) {
      await toLoadBelowList(ctx, opt, true, currentList, generation)
      return
    }

    // 5. if init, show currentList in advance
    if(isInit) {
      await toLoadBelowList(ctx, opt, false, currentList, generation)
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
    if(!isBelowCurrent(ctx, generation)) return
    if(!res6) {
      await toLoadBelowList(ctx, opt, true, currentList, generation)
      return
    }

    // 7. get ids
    const ids = CloudMerger.getIdsForCheckingContents(res6, currentList)
    if(ids.length < 1) {
      await toLoadBelowList(ctx, opt, true, undefined, generation)
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
    if(!isBelowCurrent(ctx, generation)) return
    await toLoadBelowList(ctx, opt, true, undefined, generation)
  }
  finally {
    if(isBelowCurrent(ctx, generation)) cdData.loadingBelow = false
  }
}

async function toLoadBelowList(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
  loadChildren: boolean,
  newList?: CommentShow[],
  generation = ctx.cdData.belowLoadGeneration,
) {
  const { cdData } = ctx
  if(!isBelowCurrent(ctx, generation)) return

  if(!newList) {
    newList = await commentController.loadByComment(opt)
    if(!isBelowCurrent(ctx, generation)) return
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
    preloadChildrenOfBelow(ctx, newList, generation)
  }
}


/****************************** children of below *************************/
async function preloadChildrenOfBelow(
  ctx: CommentDetailCtx,
  newList: CommentShow[],
  generation = ctx.cdData.belowLoadGeneration,
) {
  if(!isBelowCurrent(ctx, generation)) return
  const { networkLevel } = ctx.cdData
  const valueComments = await fetchChildrenComments(newList, networkLevel)
  if(!isBelowCurrent(ctx, generation)) return
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
  reload = false,
) {
  const { cdData } = ctx
  if(reload) {
    cdData.aboveLoadGeneration++
    cdData.loadingAbove = false
  }
  else if(cdData.loadingAbove) return
  if(!reload && cdData.hasReachedTop) {
    return
  }

  const generation = cdData.aboveLoadGeneration
  cdData.loadingAbove = true
  try {
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
      await preloadThread(ctx, undefined, generation)
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

    // 3. check out if get to sync
    const canSync = liuEnv.canISync()
    if(!canSync || cdData.networkLevel < 1) {
      await toLoadAboveList(ctx, opt, isInit, 0, generation)
      return
    }

    // 4. construct param
    const param: SyncGet_CommentList_C = {
      taskType: "comment_list",
      loadType: "find_parent",
      parentWeWant,
      grandparent,
    }

    // 5. get to sync
    const delay = isInit ? undefined : 0
    const res5 = await CloudMerger.request(param, {
      waitMilli: 3000,
      maxStackNum: 2,
      delay,
    })
    if(!isAboveCurrent(ctx, generation)) return

    // 6. get number where we got from cloud
    const res6 = res5?.length ?? 0
    await toLoadAboveList(ctx, opt, isInit, res6, generation)
  }
  finally {
    if(isAboveCurrent(ctx, generation)) cdData.loadingAbove = false
  }
}

async function toLoadAboveList(
  ctx: CommentDetailCtx,
  opt: LoadByCommentOpt,
  isInit: boolean,
  num: number,
  generation = ctx.cdData.aboveLoadGeneration,
) {
  const { cdData } = ctx
  if(!isAboveCurrent(ctx, generation)) return
  const { targetComment, aboveList } = cdData
  const firstComment = aboveList[0]
  
  const newList = await commentController.loadByComment(opt)
  if(!isAboveCurrent(ctx, generation)) return
  usefulTool.filterDuplicated(aboveList, newList)

  const anchor = captureScrollAnchor(ctx)

  if(isInit) {
    commentController.handleRelation(newList, undefined, targetComment)
    cdData.aboveList = newList
  }
  else {
    commentController.handleRelation(newList, undefined,  firstComment)
    cdData.aboveList.push(...newList)
  }

  await restoreScrollAnchor(ctx, anchor, () => isAboveCurrent(ctx, generation))
  
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
    await toLoadAboveList(ctx, opt, false, 0, generation)
    return
  }

  if(!newRe) {
    await preloadThread(ctx, 0, generation)
  }  
}


/*************************** load thread **********************/
async function preloadThread(
  ctx: CommentDetailCtx,
  delay?: number,
  generation = ctx.cdData.aboveLoadGeneration,
) {
  const { cdData } = ctx
  if(!isAboveCurrent(ctx, generation)) return
  
  const id = cdData.targetComment?.parentThread
  if(!id) return

  // 1. load locally
  const res = await threadController.getData({ id })
  if(!isAboveCurrent(ctx, generation)) return

  // 2. show thread if it exists
  // because we fetch it in preloadTargetComment
  if(res) {
    await toLoadThread(ctx, false, res, generation)
    return
  }

  // 3. check out if get to sync
  const canSync = liuEnv.canISync()
  if(!canSync || cdData.networkLevel < 1) {
    await toLoadThread(ctx, false, res, generation)
    return
  }

  // 4. fetch
  const param: SyncGet_CheckContents = {
    taskType: "check_contents",
    ids: [id],
  }
  await CloudMerger.request(param, { 
    waitMilli: 2500,
    maxStackNum: 2,
    delay,
  })
  if(!isAboveCurrent(ctx, generation)) return

  await toLoadThread(ctx, true, undefined, generation)
}

async function toLoadThread(
  ctx: CommentDetailCtx,
  loadAgain: boolean,
  res?: ThreadShow,
  generation = ctx.cdData.aboveLoadGeneration,
) {
  const { cdData } = ctx
  if(!isAboveCurrent(ctx, generation)) return
  if(loadAgain) {
    const id = cdData.targetComment?.parentThread
    if(!id) return
    res = await threadController.getData({ id })
    if(!isAboveCurrent(ctx, generation)) return
  }

  const anchor = captureScrollAnchor(ctx)
  cdData.hasReachedTop = true
  cdData.thread = res
  await restoreScrollAnchor(ctx, anchor, () => isAboveCurrent(ctx, generation))
}



/****************************** OTHER *************************/
interface ScrollAnchor {
  id: string
  offset: number
}

function isCurrent(
  ctx: CommentDetailCtx,
  generation: number,
) {
  return ctx.cdData.loadGeneration === generation
}

function isAboveCurrent(
  ctx: CommentDetailCtx,
  generation: number,
) {
  return ctx.cdData.aboveLoadGeneration === generation
}

function isBelowCurrent(
  ctx: CommentDetailCtx,
  generation: number,
) {
  return ctx.cdData.belowLoadGeneration === generation
}

function captureScrollAnchor(
  ctx: CommentDetailCtx,
): ScrollAnchor | undefined {
  const sv = ctx.svEl?.value
  if(!sv) return

  const containerRect = sv.getBoundingClientRect()
  const items = sv.querySelectorAll<HTMLElement>("[data-comment-key]")
  let firstVisible: HTMLElement | undefined

  for(const item of Array.from(items)) {
    const rect = item.getBoundingClientRect()
    if(rect.bottom > containerRect.top && rect.top < containerRect.bottom) {
      firstVisible = item
      break
    }
  }

  if(!firstVisible) return
  const id = firstVisible.dataset.commentKey
  if(!id) return

  return {
    id,
    offset: firstVisible.getBoundingClientRect().top - containerRect.top,
  }
}

async function restoreScrollAnchor(
  ctx: CommentDetailCtx,
  anchor: ScrollAnchor | undefined,
  isValid: () => boolean,
) {
  if(!anchor || !isValid()) return
  const sv = ctx.svEl?.value
  if(!sv) return

  await nextTick()
  if(!isValid()) return

  const items = sv.querySelectorAll<HTMLElement>("[data-comment-key]")
  let target: HTMLElement | undefined
  for(const item of Array.from(items)) {
    if(item.dataset.commentKey === anchor.id) {
      target = item
      break
    }
  }
  if(!target) return

  const containerRect = sv.getBoundingClientRect()
  const currentOffset = target.getBoundingClientRect().top - containerRect.top
  const delta = currentOffset - anchor.offset
  if(Math.abs(delta) < 1) return

  ctx.cdData.lastLockStamp = time.getTime()
  const nextPosition = sv.scrollTop + delta
  sv.scrollTo({ top: nextPosition, behavior: "instant" })
  ctx.scrollPosition.value = nextPosition
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
    // console.log("comment detail listenScroll .........")
    // console.log(svType)
    // console.log(" ")

    if(svType === "to_end") {
      preloadBelowList(ctx)
    }
    else if(svType === "to_start") {
      preloadAboveList(ctx)
    }

  })
}
