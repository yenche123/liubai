import { reactive, watch, inject, toRef } from "vue"
import type {
  CommentAreaProps,
  CommentAreaEmits,
  CommentAreaData,
} from "./types"
import commentController from "~/utils/controllers/comment-controller/comment-controller"
import type { LoadByThreadOpt } from "~/utils/controllers/comment-controller/tools/types"
import { useCommentStore } from "~/hooks/stores/useCommentStore"
import usefulTool from "~/utils/basic/useful-tool"
import { whenCommentUpdated } from "./whenCommentUpdated"
import { scrollViewKey } from "~/utils/provide-keys"
import type { SvProvideInject } from "~/types/components/types-scroll-view"
import type { CommentShow } from "~/types/types-content";
import type { ValueComment } from "~/utils/other/comment-related"
import liuEnv from "~/utils/liu-env"
import type { 
  SyncGet_CheckContents, 
  SyncGet_CommentList_A,
} from "~/types/cloud/sync-get/types"
import { CloudMerger } from "~/utils/cloud/CloudMerger"
import { useNetworkStore } from "~/hooks/stores/useNetworkStore"
import { storeToRefs } from "pinia"
import liuUtil from "~/utils/liu-util"
import { 
  addChildrenIntoValueComments, 
  fetchChildrenComments,
} from "../../utils/tackle-comments"

export function useCommentArea(
  props: CommentAreaProps,
  emit: CommentAreaEmits,
) {
  
  const nStore = useNetworkStore()
  const { level } = storeToRefs(nStore)

  const caData = reactive<CommentAreaData>({
    comments: [],
    threadId: "",
    hasReachedBottom: false,
    networkLevel: level.value,
  })

  watch(level, (newV) => {
    caData.networkLevel = newV
  })

  // 监听 comment store
  // 当有新的评论时，添加在最前面
  const cStore = useCommentStore()
  cStore.$subscribe((mutation, state) => {
    whenCommentUpdated(caData, state)
  })

  // 监听 props 的 threadId 改变
  watch(() => props.threadId, (newV) => {
    let reload = newV !== caData.threadId
    if(reload) caData.comments = []
    // console.log("newV: ", newV)
    // console.log("caData.threadId: ", caData.threadId)
    // console.log(" ")
    caData.threadId = newV
    caData.hasReachedBottom = false
    preloadComments(caData, reload)
  }, { immediate: true })

  // 监听滚动
  listenScoll(props, caData)

  return {
    caData,
  }
}


async function preloadComments(
  caData: CommentAreaData,
  reload?: boolean,
) {

  // 1. if it's reached bottom
  if(!reload && caData.hasReachedBottom) {
    console.log("已经触底........")
    return
  }

  const oldLength = caData.comments.length
  const lastComment = caData.comments[oldLength - 1]
  const isInit = Boolean(reload || oldLength < 1)

  // 2. construct query
  const opt: LoadByThreadOpt = {
    targetThread: caData.threadId,
    lastItemStamp: isInit ? undefined : lastComment.createdStamp,
  }

  // 3. get local comments first
  const currentList = await commentController.loadByThread(opt)

  // 4. check out if get to sync
  const canSync = liuEnv.canISync()
  if(!canSync || caData.networkLevel < 1) {
    toLoadComments(caData, opt, currentList)
    return
  }

  // 5. construct param for sync
  const param5: SyncGet_CommentList_A = {
    taskType: "comment_list",
    loadType: "under_thread",
    targetThread: opt.targetThread,
    lastItemStamp: opt.lastItemStamp,
  }
  const delay5 = liuUtil.check.isJustAppSetup() ? undefined : 0
  const res5 = await CloudMerger.request(param5, { 
    waitMilli: 3000,
    delay: delay5,
  })
  if(!res5) {
    toLoadComments(caData, opt, currentList)
    return
  }

  // 6. get ids
  const ids = CloudMerger.getIdsForCheckingContents(res5, currentList)
  if(ids.length < 1) {
    toLoadComments(caData, opt)
    return
  }

  // 7. check contents out
  const param7: SyncGet_CheckContents = {
    taskType: "check_contents",
    ids,
  }
  await CloudMerger.request(param7, { waitMilli: 3000, delay: 0 })
  toLoadComments(caData, opt)
}


async function toLoadComments(
  caData: CommentAreaData,
  opt: LoadByThreadOpt,
  newList?: CommentShow[],
) {
  if(!newList) {
    newList = await commentController.loadByThread(opt)
  }

  const oldList = caData.comments
  const oldLength = oldList.length
  const lastComment = oldList[oldLength - 1]
  
  if(opt.lastItemStamp) {
    usefulTool.filterDuplicated(oldList, newList)
    commentController.handleRelation(newList, lastComment)
    caData.comments.push(...newList)
  }
  else {
    commentController.handleRelation(newList)
    caData.comments = newList
  }

  if(newList.length < 5) {
    caData.hasReachedBottom = true
  }

  preloadChildren(caData, newList)
}

async function preloadChildren(
  caData: CommentAreaData,
  newList: CommentShow[],
) {
  const valueComments = await fetchChildrenComments(newList, caData.networkLevel)
  if(valueComments.length < 1) return

  toLoadChildren(caData, valueComments)
}


/**
 * 加载一级评论们的子孙评论
 */
async function toLoadChildren(
  caData: CommentAreaData,
  valueComments: ValueComment[],
) {
  const { comments } = caData
  addChildrenIntoValueComments(comments, valueComments)
}


function listenScoll(
  props: CommentAreaProps,
  caData: CommentAreaData,
) {
  const svData = inject(scrollViewKey, { type: "", triggerNum: 0 }) as SvProvideInject
  const svTrigger = toRef(svData, "triggerNum")
  watch(svTrigger, (newV) => {
    const svType = svData.type

    // 触底加载
    if(svType === "to_end") {
      preloadComments(caData)
      return
    }

    // 触顶时，若个数大于 19 （一轮9个，所以至少触底 3 次过）
    // 允许重新加载
    if(svType === "to_start") {
      if(caData.comments.length > 19) {
        caData.hasReachedBottom = false
        preloadComments(caData, true)
        return
      }
    }

  })

}



