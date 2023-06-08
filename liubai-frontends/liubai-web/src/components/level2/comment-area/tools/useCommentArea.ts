import { reactive, watch } from "vue"
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

export function useCommentArea(
  props: CommentAreaProps,
  emit: CommentAreaEmits,
) {

  const caData = reactive<CommentAreaData>({
    comments: [],
    threadId: "",
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
    caData.threadId = newV
    loadComments(caData, reload)
  }, { immediate: true })

  return {
    caData,
  }
}

async function loadComments(
  caData: CommentAreaData,
  reload?: boolean,
) {

  let length = caData.comments.length
  const lastComment = caData.comments[length - 1]

  const opt: LoadByThreadOpt = {
    targetThread: caData.threadId,
  }
  if(lastComment && !reload) {
    opt.lastItemStamp = lastComment.createdStamp
  }

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
  
}