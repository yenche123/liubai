import { reactive, watch, inject, toRef } from "vue"
import type {
  CommentAreaProps,
  CommentAreaEmits,
  CommentAreaData,
} from "./types"
import commentController from "~/utils/controllers/comment-controller/comment-controller"
import type {
  LoadByThreadOpt
} from "~/utils/controllers/comment-controller/tools/types"
import { useCommentStore } from "~/hooks/stores/useCommentStore"
import usefulTool from "~/utils/basic/useful-tool"
import { whenCommentAddOrDelete } from "./whenCommentAddOrDelete"
import { scrollViewKey } from "~/utils/provide-keys"
import type { SvProvideInject } from "~/types/components/types-scroll-view"

export function useCommentArea(
  props: CommentAreaProps,
  emit: CommentAreaEmits,
) {

  const caData = reactive<CommentAreaData>({
    comments: [],
    threadId: "",
    hasReachedBottom: false,
  })

  // 监听 comment store
  // 当有新的评论时，添加在最前面
  const cStore = useCommentStore()
  cStore.$subscribe((mutation, state) => {
    whenCommentAddOrDelete(caData, state)
  })

  // 监听 props 的 threadId 改变
  watch(() => props.threadId, (newV) => {
    let reload = newV !== caData.threadId
    if(reload) caData.comments = []
    caData.threadId = newV
    caData.hasReachedBottom = false
    loadComments(caData, reload)
  }, { immediate: true })

  // 监听滚动
  listenScoll(props, caData)

  return {
    caData,
  }
}

async function loadComments(
  caData: CommentAreaData,
  reload?: boolean,
) {

  if(caData.hasReachedBottom) {
    console.log("已经触底了........")
    return
  }

  let length = caData.comments.length
  const lastComment = caData.comments[length - 1]

  const opt: LoadByThreadOpt = {
    targetThread: caData.threadId,
  }
  if(lastComment && !reload) {
    opt.lastItemStamp = lastComment.createdStamp
  }

  console.log("loadComments: ")
  console.log(opt)
  console.log(" ")

  const newList = await commentController.loadByThread(opt)

  if(reload || length < 1) {
    commentController.handleRelation(newList)
    caData.comments = newList
  }
  else {
    usefulTool.filterDuplicated(caData.comments, newList)
    commentController.handleRelation(newList, lastComment)
    caData.comments.push(...newList)
  }

  // 如果 newList 里的 item 太少，视为已经触底
  if(newList.length < 5) {
    caData.hasReachedBottom = true
  }
  
}


function listenScoll(
  props: CommentAreaProps,
  caData: CommentAreaData,
) {
  

  // 监听触底加载
  const svData = inject(scrollViewKey, { type: "", triggerNum: 0 }) as SvProvideInject
  const svTrigger = toRef(svData, "triggerNum")
  watch(svTrigger, (newV) => {
    const svType = svData.type

    // 触底加载
    if(svType === "to_end") {
      loadComments(caData)
      return
    }

    // 触顶时，若个数大于 19 （一轮9个，所以至少触底 3 次了）
    // 允许重新加载
    if(svType === "to_start") {
      if(caData.comments.length > 19) {
        caData.hasReachedBottom = false
        loadComments(caData, true)
        return
      }
    }

  })

}



